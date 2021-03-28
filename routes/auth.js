var express = require('express');
var router = express.Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation');
const bcrypt = require('bcryptjs');
const SecretCode = require('../model/SecretCode');
var nodemailer = require('nodemailer');
var verify = require('../verifyToken');
const fs = require('fs');

router.post('/register', async function (req, res, next) {

    try {
        const { error } = registerValidation(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const userExists = await User.findOne({ email: req.body.email });
        if (userExists) return res.status(400).send('Email already exists')

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({
            email: req.body.email,
            password: hashPassword,
            status: "pending"
        });

        const secretCode = new SecretCode({
            email: req.body.email,
            code: jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET),
        });

        await user.save();
        await secretCode.save();

        const transporter = nodemailer.createTransport({
            host: 'smtp.elasticemail.com',
            port: 2525,
            auth: {
                user: 'jan.czok@outlook.de',
                pass: 'B2F8D3A7D2090543105EE4D92D1409DDDFB8'
            }
        });

        var link = process.env.HOST + '/user/verify/' + user.email + "/" + secretCode.code;

        // send email
        await transporter.sendMail({
            from: 'jan.czok@outlook.de',
            to: req.body.email,
            subject: 'Test Email Subject',
            html: 'Please click <a href="' + link + '"> here </a> to activate your account. If you the link is not working, copy and paster the following to your browser: ' + link,
        });

        res.send({ user: user.id })
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
});

router.post('/login', async (req, res) => {
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    if (!user) return res.status(400).send('Email or password is wrong')

    if (user.status === "pending") return res.status(401).send('Email not confirmed')

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);

    console.log(token);

    res.header('auth-token', token).send(token);
});


router.get('/verify/:mail/:token', async (req, res) => {

    const secret = await SecretCode.findOne({ email: req.params.mail });
    if (req.params.token === secret.code) {
        await User.findOneAndUpdate({ email: req.params.mail },
            {
                status: "approved",
            });
    }

    res.send('<h1>SoundtrackBox<h1> Your account has been approved. You can now loggin with your username and password.');
});

router.post('/deleteUser', verify, async (req, res) => {
    console.log(req.user)
    User.deleteOne({ _id: req.user._id}, function (err) {
        if (err) console.log(err);
    })
    try {
        var folderName = process.env.FOLDER_BASE_PATH + req.user._id;
        fs.rmdirSync(folderName, { recursive: true });
    } catch (error) {
        next(error);
    }
    res.send('User deletet');
});

module.exports = router;