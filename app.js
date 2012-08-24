var http = require('http');
var url = require('url');
var request = require('request');
var jsdom = require("jsdom");
var fs = require('fs');
var cssom = require('cssom');

var jquery = "jquery-1.8.0.min.js";
var list = ['title', 'description', 'image'];

function process_open_graph(url, callback) {
  var meta = {};

  request({uri: url, encoding: 'utf8'}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      jsdom.env({
        html: body,
        scripts: [jquery],
        done: function(errors, window) {
          var $ = window.$;

          $('meta[property^="og:"]').each(function() {
            for (var element in list) {
              if ($(this).attr('property') == 'og:' + list[element]) {
                meta[list[element]] = $(this).attr('content');
              }
            }
          });

          if (!meta['title']) {
            if ($('title')) {
              meta['title'] = $('title').text();
            }
          }

          if (!meta['description']) {
            if ($('meta[name="description"]')) {
              meta['description'] = $('meta[name="description"]').attr('content');
            }

            if ($('meta[name="DESCRIPTION"]')){
              meta['description'] = $('meta[name="DESCRIPTION"]').attr('content');
            }
          }

          if (!meta['image']) {
            if ($('img[src*=".jpg"]').length > 0) {
              var images = [];

              $('img[src*=".jpg"]').each(function(i) {
                images[i] = $(this).attr('src');
              });

              meta['images'] = images.slice(0, 10);
            }
          }

          callback(null, meta);
        }
      });
    } else {
      callback(error);
    }
  });
}

http.createServer(function (request, response) {
  process_open_graph(url.parse(request.url, true).query['url'], function(error, result) {

    headers = {
      'Content-Type': 'text/json',
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods' : 'GET, POST'
    }

    if (error) {
      // may be should the app log errors ?
      response.writeHead(404, headers);
      response.end(JSON.stringify({ 'error' : 'no data available.' })); 
    } else {     
      response.writeHead(200, headers);
      response.end(JSON.stringify(result));
    }
  });

}).listen(8124);

console.log('Server running at http://0.0.0.0:8124');