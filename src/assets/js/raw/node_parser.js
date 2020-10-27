/* 
Helper script to prepare several files for fast acces
Lunch with NodeJS
*/

/*=============================================
=                Variables                    =
=============================================*/
const fs = require('fs')
const path = require('path')
// const { constituents, setField } = require('../constituents.js')
const { parseCrafttweakerLog } = require('../crafttweakerLog_parse.js')

const {initZenscriptGrammar, parseZenscriptLine} = require('../zenscript_parser.js')

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

const additionals = {}
var additionalsLength = 0

function setField(id, field, value) { 
  const found = isNaN(id)
    ? additionals[id]
    : Object.values(additionals)[id]

  var picked = found
  if(!found) {
    picked = {
      index: additionalsLength++
    }
    additionals[id] = picked
  }

  if(field) picked[field] = picked[field] || value

  return picked
}


/*=============================================
=            Spritesheet
=============================================*/
const spritesheetRaw = loadJson('./Spritesheet.json')

function pushViewBox(name, viewBox) { setField(name, 'viewBox', viewBox) }

for (let k of Object.keys(spritesheetRaw.frames)) {
  const part = spritesheetRaw.frames[k]
  const nameNnbt = k
    .replace(/(^.*)\.png$/, '$1')
    .replace(/(__\d+)[LBbsf](\W)/gi, '$1$2')
    .replace(/^(.+?)(?=__)__(.+?)(?=__)__(\d+)(?:__\{(.*)\})?$/, (match, p1, p2, p3, p4) => {
      return `${p1}:${p2}:${p3}` + ((p4) ? `{${p4.replace(/(\w+)__(?=\w)/, '$1:')}}` : '')
    }) // Unserialize underscores+
  const viewBox = `${part.frame.x} ${part.frame.y}`
  pushViewBox(nameNnbt, viewBox)

  // If name have NBT tags create another entry
  // without tags
  if (nameNnbt.match(/.*\{.*/)) {
    const noNbtName = nameNnbt.replace(/^(.*?)\{.*$/, '$1')
    pushViewBox(noNbtName, viewBox)
  }
}

/*=============================================
=            crafttweaker.log
=============================================*/
initZenscriptGrammar(loadText('../../zenscript.ohm'))
parseCrafttweakerLog(
  loadText('./crafttweaker.log'), 
  parseZenscriptLine,
  setField
)

/*=====  Save parsed data ======*/
// Remove technical data
for (const key in additionals) {
  additionals[key].index = undefined
}
saveObjAsJson(additionals, '../../default_additionals.json')