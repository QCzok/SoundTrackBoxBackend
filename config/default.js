// config.js
const env = process.env.NODE_ENV; // 'dev' or 'production'

const dev = {
  app: {
    host: "http://localhost:3001"
   }
};

const production = {
 app: {
  host: "https://soundtrackbox.herokuapp.com"
 }
};

const config = {
 dev,
 production
};

module.exports = config[env];