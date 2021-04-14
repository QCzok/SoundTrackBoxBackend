var express = require('express');
var router = express.Router();
var verify = require('../verifyToken');

const { loadMusicCollection, addSong, addSongTrackFile, deleteSong, addPlaylist, deletePlaylist, getSongTrackFile} = require('../controller/mediaController');


router.get('/loadMusicCollection', verify, loadMusicCollection);

router.get('/getSongFile', getSongTrackFile);

router.post('/addPlaylist', verify, addPlaylist);

router.post('/addSong', verify, addSongTrackFile, addSong);

router.delete('/deleteSong', verify, deleteSong);

router.delete('/deletePlaylist', verify, deletePlaylist);

module.exports = router;