const config = require('../config/default');
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation');
const bcrypt = require('bcryptjs');
const SecretCode = require('../model/SecretCode');
var nodemailer = require('nodemailer');
const fs = require('fs');
var pug = require('pug');
var path = require('path');

exports.register = async (req, res, next) => {
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

        req.user = user;
        req.secretCode = secretCode;
        next();
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
}

exports.login = async (req, res, next) => {
    try {
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
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.verifyToken = async (req, res, next) => {
    try {
        const secret = await SecretCode.findOne({ email: req.params.mail });
        if (req.params.token === secret.code) {
            await User.findOneAndUpdate({ email: req.params.mail },
                {
                    status: "approved",
                });
            res.render('verify', {
                title: "Sound Track Box",
                isVerified: true,
            })
        } else {
            console.log('token does not match');
            res.render('verify', {
                title: "Sound Track Box",
                isVerified: false,
            })
        }
    } catch (error) {
        console.log(error);
        res.render('verify', {
            title: "Sound Track Box",
            isVerified: false,
        })
    }
}

exports.deleteUser = async (req, res, next) => {
    try {
        User.deleteOne({ _id: req.user._id }, function (err) {
            if (err) console.log(err);
        })
        try {
            var folderName = process.env.FOLDER_BASE_PATH + req.user._id;
            fs.rmdirSync(folderName, { recursive: true });
        } catch (error) {
            next(error);
        }
        res.send('User deleted');
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.sendMail = async (req, res, next) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.elasticemail.com',
            port: 2525,
            auth: {
                user: 'jan.czok@outlook.de',
                pass: 'B2F8D3A7D2090543105EE4D92D1409DDDFB8'
            }
        });

        var verificationLink = config.app.host + '/user/verify/' + req.user.email + "/" + req.secretCode.code;

        console.log(verificationLink);

        var template = pug.compileFile(path.join(__dirname, "../views/mail.pug"));
        output = template({
            title: "Sound Track Box",
            link: verificationLink,
        });

        // send email
        await transporter.sendMail({
            from: 'jan.czok@outlook.de',
            to: req.body.email,
            subject: 'SoundTrackBox account verification',
            html: output,
            /*
            html: render('mail', {
                title: "Sound Track Box",
                link: link,
            })
            */
        });
        console.log('outgoing mail');
        res.send({ user: req.user.id })
    } catch (error) {
        console.log(error);
        next(error);
    }
}