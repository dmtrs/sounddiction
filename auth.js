var express = require('express');
var app = express();

var config = require('./config');
var SoundCloudAPI = require("soundcloud-node");
var client = new SoundCloudAPI(config.soundcloud.id, config.soundcloud.secret, 'http://localhost:3000/callback');


app.get('/', function(req, res){
    res.redirect(client.getConnectUrl());
});

app.get('/callback', function(req, res) {
    console.log(req.query);
    client.getToken(req.query.code, function(err, tokens) {
        if(err) throw err;
        console.log(tokens);
    });
});

app.listen(3000);

