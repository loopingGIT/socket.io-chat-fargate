var _ = require('lodash');
var express = require('express');
var http = require('http')
var socket = require('socket.io');
var bodyParser = require('body-parser');
var redis = require('socket.io-redis');
var compression = require('compression');
var path = require('path');
var enforce = require('express-sslify');

var app = express();
var server = http.Server(app);
var io = socket(server);

var port = process.env.PORT || 3000;

io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: 6379 }));

// GZIP compress resources served
app.use(compression());
app.use(bodyParser.json());

// Force redirect to HTTPS if the protocol was HTTP
if (!process.env.LOCAL) {
	app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

// Lower the heartbeat timeout (helps us expire disconnected people faster)
io.set('heartbeat timeout', 8000);
io.set('heartbeat interval', 4000);

// Routing
app.use(express.static(path.join(__dirname, 'public')));	
app.post('/match_update', function(req, res) {
	io.emit('match_update', req.body);
	res.send("done");
});

io.on('connection', function(socket) {
	socket.on('disconnect', function() {
	});
});

server.listen(port, function() {
	console.log('listening on *:' + port);
});

