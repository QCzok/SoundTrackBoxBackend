var mongoose = require('mongoose');
const multer = require('multer');
const { Readable } = require('stream');

module.exports = (req, res, next) => {

    try {
        const storage = multer.memoryStorage()
        const upload = multer({ storage: storage, limits: { fields: 2, fileSize: 16000000, files: 1, parts: 3 } });
        upload.single('track')(req, res, (err) => {
            if (err) {
                console.log(err);
                return res.status(400).json({ message: "Upload Request Validation Failed" });
            } else if (!req.body.songName) {
                console.log('no name added')
                return res.status(400).json({ message: "No track name in request body" });
            }
            let trackName = req.body.songName;

            // Convert buffer to Readable Stream
            const readableTrackStream = new Readable();
            readableTrackStream.push(req.file.buffer);
            readableTrackStream.push(null);

            let bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                bucketName: 'tracks'
            });

            let uploadStream = bucket.openUploadStream(trackName);
            let id = uploadStream.id;
            readableTrackStream.pipe(uploadStream);

            uploadStream.on('error', () => {
                return res.status(500).json({ message: "Error uploading file" });
            });

            uploadStream.on('finish', () => {
                req.songID = id;
                req.playlistName = req.body.playlistName;
                console.log('this worked');
                next();
            });
        });

    } catch (error) {
        console.log(error);
        next(error);
    }
}