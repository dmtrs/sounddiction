var config = require('./config');
var when   = require('when');
var guard  = require('when/guard');
var SoundCloudAPI = require("soundcloud-node");
var client = new SoundCloudAPI(config.soundcloud.id, config.soundcloud.secret, 'http://localhost:3000/callback');

var me = function(token) {
    var user = when.defer();
    client.setToken(token);
    client.getMe(function(err, data) {
        (err) ? user.reject(err) : user.resolve(data);
    });
    return user.promise;
};

var user_favorites = function(id) {
    return when.promise(function(resolve, reject) {
        client.get('/users/'+id+'/favorites', function(err, data) {
            if(err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

var track_favoriters = function(id) {
    return when.promise(function(resolve, reject) {
        client.get('/tracks/'+id+'/favoriters', function(err, data) {
            if(err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

var result_set = me('1-56332-48830-d09c9efa96c76587d0').then(function(user) {
    return when.promise(function(resolve, reject) {
        user_favorites(user.id)
            .then(function(tracks) {
                when.map(tracks, guard(guard.n(100), function(track, i) { return track_favoriters(track.id); }))
                    .then(function(users) {
                        var result_user_set = [];
                        [].concat.apply([], users).forEach(function(user) {
                            if(result_user_set.indexOf(user.id)==-1) {
                                result_user_set.push(user.id);
                            }
                            resolve(result_user_set);
                        });
                    });
            });
    });
});


result_set.then(function(users) {
    console.log(users.length);
});
