const mongoose = require('mongoose');
const SongSchema = require('../model/Song').schema;

const playlist = new mongoose.Schema({
    name:  {
        type: String,
        required: true,
        max: 255,
        min: 1
    },
    songList: [SongSchema]
}, { _id : false })

module.exports = mongoose.model('Playlist', playlist);