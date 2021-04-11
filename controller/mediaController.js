const express = require('express');
const User = require('../model/User');
const Song = require('../model/Song');
const Playlist = require('../model/Playlist');

var ObjectID = require('mongodb').ObjectID;
const multer = require('multer');
const fs = require('fs');

exports.loadMusicCollection = async (req, res) => {
    try {
        await User.findOne({ _id: req.user }, { musicCollection: 1, _id: 0 })
            .then((musicCollection) => res.send(musicCollection));
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
}

exports.getSongTrackFile = async (req, res) => {
    try {
        var songPath;
        await User.findOne({
            "musicCollection.songList._id": req.query.songID
        }, { "musicCollection.songList.$": 1, _id: 0 })
            .then((result) => result.musicCollection.map((playlist) => {
                playlist.songList.map((song) => {
                    if (song._id === req.query.songID) {
                        songPath = song.songPath;
                    }
                })
            }));

        if (fs.existsSync(songPath)) {
            res.set('content-type', 'audio/mp3');
            res.set('accept-ranges', 'bytes');
            let downloadStream = fs.createReadStream(songPath);
            downloadStream.pipe(res);
        } else {
            res.send('song does not exist');
        }
    } catch (error) {
        console.log(error);
        res.send('error during song stream');
    }
}

exports.addSong = async (req, res, next) => {
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
}

exports.addSongTrackFile = async (req, res, next) => {
    try {
        const storage = multer.memoryStorage()
        const upload = multer({ storage: storage, limits: { fields: 4, fileSize: 16000000, files: 1} });
        upload.single('track')(req, res, (err) => {
            var folderPath = '/app/audio/' + req.user._id + '/' + req.body.playlistID;
            req.songID = new ObjectID();
            req.filePath = folderPath + '/' + req.songID + '.mp3';
            try {
                try {
                    if (!fs.existsSync(folderPath)) {
                      fs.mkdirSync(folderPath, { recursive: true })
                    }
                  } catch (err) {
                    console.error(err)
                  }
                fs.writeFile(req.filePath, req.file.buffer, err => {
                    console.log('written');
                });
            } catch (error) {
                console.log(error);
                next(error);
            }
            next();
        });

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.deleteSong = async (req, res, next) => {
    try {
        var songPath;
        await User.findOne({
            "musicCollection.songList._id": req.body.songID
        }, { "musicCollection.songList.$": 1, _id: 0 })
            .then((result) => result.musicCollection.map((playlist) => {
                playlist.songList.map((song) => {
                    if (song._id === req.body.songID) {
                        songPath = song.songPath;
                    }
                })
            }));
        if (fs.existsSync(songPath)) {
            fs.unlinkSync(songPath);
        }

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
}

exports.addPlaylist = async (req, res, next) => {
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
}

exports.deletePlaylist = async (req, res, next) => {
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
}