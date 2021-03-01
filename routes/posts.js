var express = require('express');
var router = express.Router();
var verify = require('../verifyToken');
var User = require('../model/User');

router.get('/', verify, async (req, res) => {
    try {
        const user = await User.findOne({_id: req.user._id});
        const userEmail = {email: user.email};
        res.send(userEmail);
    } catch (error) {
        res.status(500).send('error during runtime');
    }
})

module.exports = router;