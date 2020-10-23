/* 
Helper script to prepare several files for fast acces
Lunch with NodeJS
*/

/*=============================================
=                Variables                    =
=============================================*/
const fs = require('fs')
const path = require('path')
const { constituents, setField } = require('../constituents.js')
const { parseCrafttweakerLog } = require('../crafttweakerLog_parse.js')

/*=============================================
=                   Helpers                   =
=============================================*/
function loadText(filename, encoding = 'utf8') {
  return fs.readFileSync(path.resolve(__dirname, filename), encoding)
}

function loadJson(filename) {
  return JSON.parse(loadText(filename))
}

function saveText(txt, filename) {
  fs.writeFileSync(path.resolve(__dirname, filename), txt)
}

function saveObjAsJson(obj, filename) {
  saveText(JSON.stringify(obj, null, 2), filename)
}


/*=============================================
=           Parsing
=============================================*/

/*=====  Spritesheet  ======*/

const spritesheetRaw = loadJson('./Spritesheet.json')

function pushViewBox(name, viewBox) { setField(name, 'viewBox', viewBox) }

for (let k of Object.keys(spritesheetRaw.frames)) {
  const part = spritesheetRaw.frames[k]
  const nameNnbt = k.replace(/(^.*)\.png$/, '$1')
  const viewBox = `${part.frame.x} ${part.frame.y}`
  pushViewBox(nameNnbt, viewBox)

  // If name have NBT tags create another entry
  // without tags
  if (nameNnbt.match(/.*\{.*/)) {
    const noNbtName = nameNnbt.replace(/(.*)__\{.*/, '$1')
    pushViewBox(noNbtName, viewBox)
  }
}

/*=============================================
=
=============================================*/
const aliases = parseCrafttweakerLog(path.resolve(__dirname, './crafttweaker.log'))
saveObjAsJson(aliases, '../../default_aliases.json')

/*=====  Save parsed data ======*/
saveObjAsJson(constituents, '../../default_additionals.json')