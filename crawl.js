var config = require('./config');

var when   = require('when');
var guard  = require('when/guard');
var nodefn = require('when/node');

var SoundCloudAPI = require("soundcloud-node");
var client = new SoundCloudAPI(config.soundcloud.id, config.soundcloud.secret, 'http://localhost:3000/callback');

var prediction   = require('predictionio')(config.predictionio);

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
    create_action(user, 2);
});

var users  = [];
var tracks = [];
var create_action = function(user, level) {
    var action = when.defer();
    if(users.indexOf(user.id) > -1) {
        action.resolve({ 'message': 'Processed already' });
        return action.promise;
    }
    var puser = when.defer();
    prediction.users.create({ pio_uid: user.id }, nodefn.createCallback(puser.resolver)).then(function(resolved) {
        level = level || 1;
        console.log('level', level);
        console.log('user', user.id);
        users.push(user.id);
        when.map(user_favorites(user.id), guard(guard.n(10), function(track, i) {
            var ptrack = when.defer();
            if(tracks.indexOf(track.id) == -1) {
                tracks.push(track.id);
                var ptrack = when.defer();
                prediction.items.create({ pio_iid: track.id, pio_itypes: 'track' }, nodefn.createCallback(ptrack.resolver));

                ptrack.promise.then(function(resolve) {
                    prediction.users.createAction({
                        pio_uid: user.id,
                        pio_iid: track.id,
                        pio_action: 'like',
                    },  function(err, res) { //Do something
                    });
                    var more = level - 1;
                    if(more > 0) {
                        when.map(track_favoriters(track.id), function(favoriter, i) {
                            create_action(favoriter, more).then(function(resolved) {
                                ptrack.resolve(resolved);
                            }, function(rejected) {
                                ptrack.reject(rejected);
                            });
                        });
                    } else {
                        ptrack.resolve();
                    }
                });
            }
            return ptrack.promise;
        })).then(function(resolved) { action.resolve(resolved); }, function(rejected) { action.reject(rejected) });
    }, function(rejected) {
        action.reject(rejected);
    });
    return action.promise;
};
