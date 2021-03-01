var express = require('express');
var router = express.Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const {registerValidation, loginValidation} = require('../validation');
const bcrypt = require('bcryptjs');

router.post('/register', async function (req, res, next) {

    try {
        const {error} = registerValidation(req.body);
        if(error) return res.status(400).send(error.details[0].message);

        const userExists = await User.findOne({email: req.body.email});
        if(userExists) return res.status(400).send('Email already exists')

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({
            email: req.body.email,
            password: hashPassword
        });

        await user.save();
        res.send({user: user.id})
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
});

router.post('/login', async (req, res) => {
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('Email or password is wrong')

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Invalid password');

    const token = jwt.sign({_id : user._id}, process.env.TOKEN_SECRET);

    res.header('auth-token', token).send(token);
});



module.exports = router;