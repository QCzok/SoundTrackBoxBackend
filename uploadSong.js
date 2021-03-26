var ObjectID = require('mongodb').ObjectID;
const multer = require('multer');
const fs = require('fs');

module.exports = (req, res, next) => {
    try {
        const storage = multer.memoryStorage()
        const upload = multer({ storage: storage, limits: { fields: 4, fileSize: 16000000, files: 1} });
        upload.single('track')(req, res, (err) => {
            var folderPath = '/audio/' + req.user._id + '/' + req.body.playlistID;
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