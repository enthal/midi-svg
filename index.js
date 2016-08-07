#!/usr/bin/env node

const fs = require('fs');
const _ = require("lodash");
// const got = require("got");
const midiFileParser = require('midi-file-parser');
const MIDIUtils = require('midiutils');

const log = console.log;
const toJsonInd = x => JSON.stringify(x,0,2);
const logJson = x => log(toJsonInd(x));

log(MIDIUtils.noteNameToNoteNumber('A-4'));
log(MIDIUtils.noteNumberToName( 21 ));
log(MIDIUtils.noteNumberToName( 22 ));
log(MIDIUtils.noteNumberToName( 23 ));


// const midiSong = (await got("https://s3.amazonaws.com/www.tjames.com/levels_midi.mid")).body
const midiBlob = fs.readFileSync('levels.mid', 'binary');
// const song = midiConverter.midiToJson(midiBlob);  // not json
const song = midiFileParser(midiBlob);

log(song.tracks[0].length)

let t = 0;
_(song.tracks[0])
  .filter(x => x.type == 'channel')
  // .each(x => (x.t = t += x.deltaTime))
  .map(x => [t += x.deltaTime, MIDIUtils.noteNumberToName(x.noteNumber), x.velocity || null ])
  .each(x => log(x.join('\t')))
  // .each()

let activeNotesByNumber = {};
let notes = [];
let time = 0;
_.each(song.tracks[0], event=>{
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
logJson(notes);
_.each(notes, note => log([note.time.start, note.time.duration, note.number, note.name].join('\t')));
logJson(notes.length);
// logJson(activeNotesByNumber);
// console.log(JSON.stringify(song,0,2));
