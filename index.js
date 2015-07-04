#! /usr/bin/env node

var request = require('request');
var cheerio = require('cheerio');
var opts = require("nomnom").parse();
var chalk = require('chalk');

var alias = {
  'UA': 'UAL',
  'United': 'UAL',
  'UAL': 'UAL',
  'Delta': 'DAL'
};

var airline = opts[0];
var number = opts[1];
if (!number) {
  matches = airline.match(/([a-zA-Z]+)(\d+)/);
  if (matches) {
    airline = matches[1];
    number = matches[2];
  }
}
if (airline in alias) {
  airline = alias[airline];
}

function print(s) {
  s = s || '';
  process.stdout.write(s);
}

function println(s) {
  s = s || '';
  print(s + '\n');
}

var code = airline + number;

request('http://flightaware.com/live/flight/' + code, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    $ = cheerio.load(body);

    var data = {};

    var table = $('.track-panel-data');
    var trs = table.find('tr');
    trs.each(function (i) {
      var header = trs.eq(i).find('th').text().trim().toLowerCase();
      var val = trs.eq(i).find('td').contents().first().text().trim();
      data[header] = val;
    });

    var origin = $('.track-panel-departure .hint').attr('title');
    var destination = $('.track-panel-arrival .hint').attr('title');
    var times = $('.track-panel-actualtime');
    var departure = times.eq(0);
    if (departure.children().first().hasClass('flightStatusGood')) {
      departure = chalk.green(departure.text().trim());
    } else {
      departure = chalk.red(departure.text().trim());
    }
    var arrival = times.eq(1);
    if (arrival.children().first().hasClass('flightStatusGood')) {
      arrival = chalk.green(arrival.text().trim());
    } else {
      arrival = chalk.red(arrival.text().trim());
    }

    println();
    println('Status:    ' + chalk.bold(data.status));
    println('Departure: ' + departure);
    println('           ' + origin);
    println('Arrival:   ' + arrival);
    println('           ' + destination);

    var progress = $('.track-panel-progress');
    if (progress.length) {
      var elapsed = $('.track-panel-progress-fill').text().trim();
      var remaining = $('.track-panel-progress-empty').text().trim();
      var pct = $('.track-panel-progress-fill').css('width');
      pct = parseInt(pct, 10) | 0;
      var cols = process.stdout.columns - 3;
      var wid = (pct / 100) * cols | 0;
      var rem = cols - wid;
      print('\n' + chalk.bold('['));
      print(chalk.cyan(Array(wid+1).join('-'))); // ✈
      print(chalk.bold('✈'));
      print(Array(rem+1).join(' '));
      print(chalk.bold(']') + '\n');
      var time = elapsed + ' elapsed, ' + remaining + ' left';
      var ctr = (process.stdout.columns - time.length) / 2 | 0;
      print(Array(ctr).join(' '));
      print(time + '\n');
    }

    println();

  } else {
    console.error(response.statusCode);
  }
});
