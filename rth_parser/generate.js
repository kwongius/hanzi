#!/usr/bin/env node

// MOE-Dict: http://kcwu.csie.org/~kcwu/moedict/

var knex = require('knex')({
  client: 'sqlite3',
  // debug: true,
  connection: {
    filename: "./dict-revised.sqlite3"
  }
});


var fs = require('fs');
var readline = require('readline');

var rd = readline.createInterface({
    input: fs.createReadStream('./Untitled.txt'),
    output: process.stdout,
    terminal: false
});

var data = [];

var getCharacterData = function(hanzi) {
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    if (d.hanzi == hanzi) {
      return d;
    }
  }

  return null;
}

rd.on('line', function(line) {
    var elements = line.split('\t');
    data.push({
      index: elements[0],
      keyword: elements[1],
      partofspeech: elements[2],
      hanzi: elements[3],
    });
});

rd.on('close', function(line) {
  knex('entries').whereRaw('LENGTH(entries.title) = ?', [1]).innerJoin('heteronyms', 'entries.id', 'heteronyms.entry_id').orderBy('entry_id').orderBy('idx').then(function(entries) {
    for (var i in entries) {
      var entry = entries[i];
      var d = getCharacterData(entry.title);
      if (d != null) {
        if (entry.bopomofo == null || d['bopomofo'] != null) {
          continue;
        }
        if (entry.bopomofo.indexOf('讀音') > 0) {
          continue;
        }

        // d['bopomofo'] = entry.bopomofo.replace('（語音）', '');
        d['bopomofo'] = entry.bopomofo.replace(/\（.*?\）/, '');
        d['pinyin'] = entry.pinyin;
        d['stroke_count'] = entry.stroke_count;
        d['radical'] = entry.radical;
        // console.log(d);
      }
    }
  }).catch(function(err) {
    console.log(err);
    process.exit(1);
  }).finally(function() {
    fs.writeFile('rth.json', JSON.stringify(data), function(err) {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      else {
        console.log('DONE!');
        process.exit(0);
      }
    });
  });
});
