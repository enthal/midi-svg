#!/usr/bin/env node

const fs = require('fs');
const _ = require("lodash");
// const got = require("got");
const midiFileParser = require('midi-file-parser');
const MIDIUtils = require('midiutils');

const log = console.log;
const toJsonInd = x => JSON.stringify(x,0,2);
const logJson = x => log(toJsonInd(x));

// const midiSong = (await got("https://s3.amazonaws.com/www.tjames.com/levels_midi.mid")).body
const midiBlob = fs.readFileSync('levels.mid', 'binary');
const song = midiFileParser(midiBlob);

// log(song.tracks[0].length)


const activeNotesByNumber = {};
const notes = [];
let time = 0;
_.each(song.tracks[0], event => {
  if (event.type !== 'channel') return;
  // log(MIDIUtils.noteNumberToName(event.noteNumber))
  time += event.deltaTime;
  if (event.velocity) {
    // assume: not already an active note for that noteNumber
    notes.push( activeNotesByNumber[event.noteNumber] = {
      time: { start: time },
      number: event.noteNumber,
      name: MIDIUtils.noteNumberToName(event.noteNumber),
      velocity: event.velocity,
    } );
  } else {
    let note = activeNotesByNumber[event.noteNumber];
    note.time.end = time;
    note.time.duration = time - note.time.start;
    delete activeNotesByNumber[event.noteNumber];  // needless
  }
});
// logJson(notes);
// _.each(notes, note => log([note.time.start, note.time.duration, note.number, note.name].join('\t')));
// log(notes.length);
// logJson(activeNotesByNumber);
// console.log(JSON.stringify(song,0,2));

const findExtrema = (xs, f1, f2) => {
  f1 = f1 || (x=>x);
  f2 = f2 || f1;
  return _.reduce(xs, (acc,x) => ({
    min: _.min([acc.min,f1(x)]),
    max: _.max([acc.max,f2(x)]),
  }),{
    min: f1(xs[0]),
    max: f2(xs[0]),
  });
}
// log(findExtrema([4,3,5,7,9,61,3]));
// log(findExtrema([4,3,5,7,-9,61,3], x=>-x));
// log(findExtrema([4,3,5,7,-9,61,3], x=>-x, x=>x*x));

const noteExtrema = {
  time:     findExtrema(notes, note=>note.time.start, note=>note.time.end),
  velocity: findExtrema(notes, note=>note.velocity),
  number:   findExtrema(notes, note=>note.number),
};
// logJson(noteExtrema);

const fx = time => time / 10 + 10;
const fy = number => (noteExtrema.number.max - number) * 10 + 10;

log(`<?xml version="1.0"?>
  <!--
  ${toJsonInd(noteExtrema)}
  -->

  <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${  noteExtrema.time   .max / 10 + 20}"
      height="${ noteExtrema.number .max * 10 + 20}"
      style="shape-rendering:crispEdges;"
      >

    <style>
      svg rect {stroke: black; stroke-width: 1}
    </style>

`);

_.each(notes, note=>{
  let hsl = [
    (note.number - MIDIUtils.noteNameToNoteNumber('C-3')) * (360/12),
    "80%",
    127-Math.floor(note.velocity/127*100)+"%"
  ];
  log(`\
      <rect
        x="${note.time.start/10}"
        y="${fy(note.number)}"
        width="${note.time.duration/10}"
        height="9"
        style="fill:hsl(${hsl.join(', ')})"
        data-number="${note.number}"
        data-name="${note.name}"
        data-velocity="${note.velocity}"      />\
  `);
})

log(`
  </svg>
`);
