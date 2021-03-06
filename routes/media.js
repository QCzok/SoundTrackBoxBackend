var express = require('express');
var router = express.Router();
var verify = require('../verifyToken');
var uploadSong = require('../uploadSong');
const User = require('../model/User');
const Playlist = require('../model/Playlist');
const Song = require('../model/Song');
const { isValidObjectId } = require('mongoose');
const multer = require('multer');
const { Readable } = require('stream');
const mongodb = require('mongodb');
var mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;


router.get('/loadMusicCollection', verify, async function (req, res, next) {
    try {
        const musicCollection = await User.findOne({ _id: req.user }, { musicCollection: 1, _id: 0 })
            .then((musicCollection) => res.send(musicCollection));
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
});

router.post('/addPlaylist', verify, async function (req, res, next) {
    try {
        const playlist = new Playlist({
            name: req.body.name,
            songList: []
        });


        var result = await User.findOneAndUpdate(
            { _id: req.user },
            {
                $addToSet:
                {
                    musicCollection: playlist
                }
            },
            { returnOriginal: false }
        ).then((documents) => res.send({ affected: documents }));

    } catch (error) {
        console.log(error);
        next(error);
    }
})

router.post('/addSong', verify, uploadSong, async function (req, res, next) {

    try {
        const song = new Song({
            songName: req.body.songName,
            songID: req.songID
        });

        var result = await User.findOneAndUpdate(
            {
                _id: req.user,
                "musicCollection.name": req.playlistName
            },
            {
                $addToSet:
                {
                    "musicCollection.$.songList": song
                }
            },
            { returnOriginal: false }
        ).then((documents) => res.send({ affected: documents }));

    } catch (error) {
        console.log(error);
        next(error);
    }
})

router.post('/deleteSong', verify, async function (req, res, next) {
    try {
        let bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'tracks'
        });
        bucket.delete(ObjectID(req.body.songID));

        var result = await User.findOneAndUpdate(
            {
                _id: req.user,
                "musicCollection.name": req.body.playlistName
            },
            {
                $pull:
                {
                    "musicCollection.$.songList": { songName: req.body.songName }
                }
            },
            { returnOriginal: false })
            .then((documents) => res.send({ affected: documents }));
    } catch (error) {
        console.log(error);
        next(error);
    }
});

router.post('/deletePlaylist', verify, async function (req, res, next) {
    try {
        let bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'tracks'
        });

        req.body.songList.forEach(element => {
            bucket.delete(ObjectID(element.songID));
        });

        var result = await User.findOneAndUpdate(
            {
                _id: req.user
            },
            {
                $pull:
                {
                    musicCollection: { name: req.body.playlistName }
                }
            },
            { returnOriginal: false })
            .then((documents) => res.send({ affected: documents }));
    } catch (error) {
        console.log(error);
        next(error);
    }
});


router.get('/getSongFile', verify, (req, res, next) => {

    console.log(req.body.songID)
    var trackID = ObjectID(req.body.songID);

    console.log(trackID);

    res.set('content-type', 'audio/mp3');
    res.set('accept-ranges', 'bytes');

    let bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'tracks'
    });

    let downloadStream = bucket.openDownloadStream(trackID);

    downloadStream.on('data', (chunk) => {
        res.write(chunk);
    });

    downloadStream.on('error', () => {
        res.sendStatus(404);
        console.log('an error occured');
    });

    downloadStream.on('end', () => {
        res.end();
    });
})

module.exports = router;