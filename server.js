var express = require('express');
var path = require('path');
var app = express();
var notModifiedValue = "notmodified";
var cachedForAYearValue;

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/client.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/client.js'));
});

app.get('/last-modified', function (req, res) {
    res.setHeader('Last-Modified', 'Sun, 25 Sep 2016y 06:18:46 GMT');
    console.log("if modified since: " + req.get("If-Modified-Since"));
    if(req.get("If-Modified-Since")) {
        res.send(req.get("If-Modified-Since"));
    } else {
        res.send("failed to deliver if modified since header");
    }
});

app.get('/if-modified-since', function (req, res) {
    res.send(req.get("If-Modified-Since"));
});

app.get('/request-only-if-cached', function (req, res) {
    var identifierForClient = new Date();
    res.send(identifierForClient.getTime().toString());
});

app.get('/cached-for-two-second', function (req, res) {
    var identifierForClient = new Date();
    console.log(res.getHeader("if-none-match"));
    res.setHeader('Cache-Control', 'max-age=2');
    res.send(identifierForClient.getTime().toString());
});

app.get('/cached-for-one-year', function (req, res) {
    var identifierForClient = new Date();
    res.setHeader('Cache-Control', 'max-age=31536000');
    console.log("here");
    if(!cachedForAYearValue) {
        console.log("there");
        cachedForAYearValue = identifierForClient.getTime().toString();
    }
    res.send(identifierForClient.getTime().toString());
});

app.get('/cached-for-one-year-first-call-value', function (req, res) {
    console.log("cached for one year value expected on client: " + cachedForAYearValue);
    res.send(cachedForAYearValue);
});

app.get('/nocache-nostore-mustrevalidate', function (req, res) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname + '/vtt.vtt'));
});

app.listen(3000, function () {
  console.log('cache control check listening on port 3000!');
});
