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

log(song.tracks[0].length)


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
_.each(notes, note => log([note.time.start, note.time.duration, note.number, note.name].join('\t')));
log(notes.length);
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

const noteExtrema = {
  time:     findExtrema(notes, note=>note.time.start, note=>note.time.end),
  velocity: findExtrema(notes, note=>note.velocity),
  number:   findExtrema(notes, note=>note.number),
};
logJson(noteExtrema);
