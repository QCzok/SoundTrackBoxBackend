const mongoose = require('mongoose');

const song = new mongoose.Schema({
    songName:  {
        type: String,
        required: true,
        max: 255,
        min: 1
    },
    songID: {
        type: String,
        required: false
    }
}, { _id : false })

module.exports = mongoose.model('Song', song);