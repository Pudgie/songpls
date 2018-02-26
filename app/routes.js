// app/routes.js

module.exports = function(app, spotifyApi) {
  app.get('/', function(req, res) {
    if (spotifyApi.getAccessToken()) {
      return res.send('You are logged in.');
    }
    return res.send('<a href="/authorize">Authorize</a>');
  });

  app.get('/authorize', function(req, res) {
    var scopes = ['playlist-modify-public', 'playlist-modify-private'];
    var state  = new Date().getTime();
    var authoriseURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authoriseURL);
  });

  app.get('/callback', function(req, res) {
    spotifyApi.authorizationCodeGrant(req.query.code)
      .then(function(data) {
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
        return res.redirect('/');
      }, function(err) {
        return res.send(err);
      });
  });

  app.use('/recommend', function(req, res, next) {
    if (req.body.token !== process.env.SLACK_TOKEN) {
      return slack(res.status(500), 'Error request!');
    }
    next();
  });

  app.post('/recommend', function(req, res) {
    spotifyApi.refreshAccessToken()
      .then(function(data) {
        spotifyApi.setAccessToken(data.body['access_token']);
        if (data.body['refresh_token']) {
          spotifyApi.setRefreshToken(data.body['refresh_token']);
        }

        // retrieve last playlist track
        spotifyApi.getPlaylistTracks(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, {'offset' : 1, 'limit' : 1})
          .then(function(data) {
            var lastItem = data.body.total - 1;
            var track = data.body.items.track[lastItem];
            var song = track.name;
            var artists = ""
            for (var i = 0; i < track.artists.length; i++) {
              artists += track.artists[i].name;
              if (i < track.artists.length - 1) {
                artists += ", "
              }
            }
            var message = "The song of the day is \"" + song + "\" by " + artists;
            return slack(res, message)
          }, function(err) {
            return slack(res, err.message);
          });
      }, function(err) {
        return slack(res, 'Pls re-authorize yourself from your app\'s homepage.');
      });
  });

};
