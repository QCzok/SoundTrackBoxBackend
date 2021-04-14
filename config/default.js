// config.js
const env = process.env.NODE_ENV || production; // 'dev' or 'production'

const dev = {
  app: {
    host: "http://localhost:3001",
    folderPath: '/home/dci/Documents/SoundTrackBox/audio/',
   }
};

const production = {
 app: {
  host: "https://soundtrackbox.herokuapp.com",
  folderPath: '/app/audio/',
 }
};

const config = {
 dev,
 production
};

module.exports = config[env];