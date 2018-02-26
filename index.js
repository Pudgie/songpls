// index.js is starting point

var express       = require('express');
var bodyParser    = require('body-parser');
var request       = require('request');
var dotenv        = require('dotenv');
var SpotifyWebApi = require('spotify-web-api-node');

dotenv.load();

var spotifyApi = new SpotifyWebApi({
  clientId     : process.env.SPOTIFY_KEY,
  clientSecret : process.env.SPOTIFY_SECRET,
  redirectUri  : process.env.SPOTIFY_REDIRECT_URI
});

var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
}));

// routes ========================================
require('./app/routes.js')(app, spotifyApi);

// start application
app.listen(3000);
console.log('App running on port 3000');
