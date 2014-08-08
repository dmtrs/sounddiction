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
user.promise.then(function(user) {
    client.get('/users/{id}/favorites', function(err, data) {
        if(err) throw err;
        for(var i in data)
        {
            client.get('/tracks/'+data[i].id+'/favoriters', function(err, data) {
                console.log(data.length);
            });
        }
    });
}, function(err) {
    if(err) throw err;
});
