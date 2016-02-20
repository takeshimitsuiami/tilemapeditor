var express = require('express');
var fs = require('fs');
var app = express();
var port = 8080;
var multiparty = require('multiparty');
var bodyParser = require('body-parser');
var util = require('util');
var mongo = require('mongodb');
var db = require('monk')('localhost:27017/tilemapeditor');
var ejslocals = require('ejs-locals');

app.use(express.static('public'));
app.use(bodyParser.json());
app.engine('ejs', ejslocals);
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
	res.redirect('/maps');
});

app.get('/maps', function(req, res) {
	var maps = db.get('maps');
	maps.find({},{},function(e, docs) {
		res.render('maplist', {maps: docs});
	});
});

app.get('/map/new', function(req, res) {
	res.render('new');
});

app.get('/map/delete/:id', function(req, res) {
	var maps = db.get('maps');
	maps.findById(req.params.id, function(err, doc) {
		maps.remove(doc);
		res.redirect('/maps');
	});
});

app.post('/map/save', function(req, res) {
	var maps = db.get('maps');
	console.log(req.body);
	maps.insert({name: req.body.name, map: req.body.map, tools: req.body.tools}, function(err, doc) {
		res.send("ok");
	});
});

app.get('/map/:id', function(req, res) {
	var maps = db.get('maps');
	maps.findById(req.params.id, function(err, doc) {
		console.log(doc);
		res.render('map', {map: doc});
	});
});

app.get('/addtempmap', function(req, res) {
	var maps = db.get('map');
	maps.insert({name: "hello world", data: "asdfaqwerdfsa"}, function(err, doc) {
		res.json(doc);
	});
});

app.post('/addtool', function(req, res) {
	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		fs.readFile(files.file[0].path, function(ferr, fdata) {
			var base64 = new Buffer(fdata).toString('base64');
			res.send("data:image/png;base64," + base64);
		});
	});
});

app.post('/loadjson', function(req, res) {
	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		fs.readFile(files.file[0].path, function(ferr, fdata) {
			res.json(JSON.parse(fdata));
		});
	});
});

app.listen(port, function() {
	console.log("go to http://localhost:" + port);
});
