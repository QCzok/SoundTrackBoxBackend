var express = require('express');
var router = express.Router();
var verify = require('../verifyToken');
var uploadSong = require('../uploadSong');
const User = require('../model/User');
const Playlist = require('../model/Playlist');
const Song = require('../model/Song');
const fs = require('fs');


router.get('/loadMusicCollection', verify, async function (req, res, next) {
    try {
        await User.findOne({ _id: req.user }, { musicCollection: 1, _id: 0 })
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


        await User.findOneAndUpdate(
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

    console.log(req.body.playlistName)

    try {
        const song = new Song({
            _id: req.songID,
            songName: req.body.songName,
            songPath: req.filePath,
        });
        console.log(song);
        await User.findOneAndUpdate(
            {
                _id: req.user,
                "musicCollection.name": req.body.playlistName
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
        var entry;
        var songPath;
        await User.findOne({
            "musicCollection.songList._id": req.body.songID
        }, { "musicCollection.songList.$": 1, _id: 0 })
            .then((result) => entry = result);
        entry.musicCollection.map((playlist) => {
            playlist.songList.map((song) => {
                if (song._id === req.body.songID) {
                    songPath = song.songPath;
                }
            })
        })
        fs.unlinkSync(songPath)

        await User.findOneAndUpdate(
            {
                _id: req.user,
                "musicCollection._id": req.body.playlistID
            },
            {
                $pull:
                {
                    "musicCollection.$.songList": { _id: req.body.songID }
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
        var folderName = process.env.FOLDER_BASE_PATH + req.user._id + '/' + req.body.playlistID
        fs.rmdirSync(folderName, { recursive: true });

        await User.findOneAndUpdate(
            {
                _id: req.user
            },
            {
                $pull:
                {
                    musicCollection: { _id: req.body.playlistID }
                }
            },
            { returnOriginal: false })
            .then((documents) => res.send({ affected: documents }));
    } catch (error) {
        console.log(error);
        next(error);
    }
});


router.get('/getSongFile', async (req, res, next) => {

    try {
        var entry;
        var songPath;
        await User.findOne({
            "musicCollection.songList._id": req.query.songID
        }, { "musicCollection.songList.$": 1, _id: 0 })
            .then((result) => entry = result);
        if (entry) {
            entry.musicCollection.map((playlist) => {
                playlist.songList.map((song) => {
                    if (song._id === req.query.songID) {
                        songPath = song.songPath;
                    }
                })
            })

            res.set('content-type', 'audio/mp3');
            res.set('accept-ranges', 'bytes');

            let downloadStream = fs.createReadStream(songPath);

            downloadStream.pipe(res);
        } else {
        res.send('no song to play');
        }

    } catch (error) {
        console.log(error);
        next(error);
    }
})

module.exports = router;