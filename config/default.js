// config.js
const env = process.env.NODE_ENV || production; // 'dev' or 'production'

const dev = {
  app: {
    host: "http://localhost:3001",
    folderPath: '/home/dci/Documents/SoundTrackBox/audio/',
    db_connect_link: process.env.DB_CONNECT
   }
};

const production = {
 app: {
  host: "https://soundtrackbox.herokuapp.com",
  folderPath: '/app/audio/',
  db_connect_link: process.env.PROD_DB_CONNECT
 }
};

const config = {
 dev,
 production
};

module.exports = config[env];