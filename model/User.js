const { required } = require('@hapi/joi');
const mongoose = require('mongoose');
const PlaylistSchema = require('../model/Playlist').schema;

const userSchema = new mongoose.Schema({
email: {
    type: String,
    required: true,
    max: 255,
    min: 6
},
password: {
    type: String,
    required: true,
    max: 1024,
    min: 6
},
date: {
    type: Date,
    default: Date.now
},
musicCollection: [PlaylistSchema]
});

module.exports = mongoose.model('User', userSchema);