var express = require('express');
var router = express.Router();
var verify = require('../verifyToken');

const { register, sendMail, login, verifyToken, deleteUser } = require('../controller/authController');

router.post('/register', register, sendMail);

router.post('/login', login);

router.get('/verify/:mail/:token', verifyToken);

router.delete('/deleteUser', verify, deleteUser);

module.exports = router;