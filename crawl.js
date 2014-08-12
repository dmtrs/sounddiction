var config = require('./config');
var when   = require('when');
var SoundCloudAPI = require("soundcloud-node");
var client = new SoundCloudAPI(config.soundcloud.id, config.soundcloud.secret, 'http://localhost:3000/callback');

var user = when.defer();

client.setToken('1-56332-48830-d09c9efa96c76587d0');
client.getMe(function(err, res) {
    if(err) {
        user.reject(err);
    } else {
        client.setUser(res.id);
        user.resolve(res);
    }
});

var user_favorites = function(id, cb) {
    client.get('/users/{id}/favorites', function(err, data) {
        (err) ? cb(err) : cb(null, data);
    });
};
var track_favoriters = function(id, cb) {
    client.get('/tracks/'+id+'/favoriters', function(err, data) {
        (err) ? cb(err) : cb(null, data);
    });
};

user.promise.then(function(user) {
    users.push(user.id);
    user_favorites(user.id, function(err, data) {
        if(err) throw err;
        data.forEach(function(track) {
            track_favoriters(track.id, function(err, data) {
                if(err) throw err;
                data.forEach(function(favoriter) { users.push(favoriter.id); });
            });
        });
    });
}, function(err) {
    if(err) throw err;
});
