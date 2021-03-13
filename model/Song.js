const mongoose = require('mongoose');

const song = new mongoose.Schema({
    _id: { 
        type: String,
        required: true,
    },
    songName: {
        type: String,
        required: true,
        max: 255,
        min: 1
    },
    songPath: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('Song', song);