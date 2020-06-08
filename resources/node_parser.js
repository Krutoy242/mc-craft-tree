/* 

Helper script to prepare several files for fast acces
Lunch with NodeJS

*/


/*=============================================
=                Variables                    =
=============================================*/
// import { readFileSync, writeFileSync } from 'fs';
// import path from "path";
// import { itemStackToString } from '../scripts/parse';

const fs = require('fs');
const path = require("path");
// const parse = require("../scripts/parse");




/*=============================================
=                   Helpers                   =
=============================================*/
function loadText(filename, encoding = 'utf8') {
  return fs.readFileSync(path.resolve(__dirname, filename), encoding);
}

function loadJson(filename) {
  return JSON.parse(loadText(filename));
}

function saveText(txt, filename) {
  fs.writeFileSync(path.resolve(__dirname, filename), txt);
}

function saveObjAsJson(obj, filename) {
  saveText(JSON.stringify(obj, null, 2), filename);
}


/*=============================================
=           Parsing
=============================================*/

/*=====  Spritesheet  ======*/

const spritesheetRaw = loadJson("rawData/sheet/Spritesheet.json");
const parsedData = {
  sheet: {},
  aliases: {}
};
for (let k of Object.keys(spritesheetRaw.frames)) {
  const part = spritesheetRaw.frames[k];
  const nameNnbt = k.replace(/(^.*)\.png$/, "$1");
  const coords = `${part.frame.x} ${part.frame.y} 32 32`;
  parsedData.sheet[nameNnbt] = parsedData.sheet[nameNnbt] || coords;

  // If name have NBT tags create another entry
  // without tags
  if (nameNnbt.match(/.*\{.*/)) {
    const noNbtName = nameNnbt.replace(/(.*)__\{.*/, "$1");
    parsedData.sheet[noNbtName] = parsedData.sheet[noNbtName] || coords;
  }
}

function itemStackToString(item, meta = 0) {
  return `${item.replace(":", "__")}__${meta}`;
}

/*=====  OreDict first items  ======*/

const crLog = loadText("rawData/crafttweaker.log");
const rgx = /^Ore entries for <ore:([\w]+)> :\n-<([^:>]+:[^:>]+):?([^:>]+)?/gm;
for (const match of crLog.matchAll(rgx)) {
  const oreDictName = match[1];
  const definition = match[2];
  const meta = match[3] === "*" ? undefined : match[3];
  const itemName = itemStackToString(definition, meta);

  parsedData.sheet[`ore__${oreDictName}`] = parsedData.sheet[itemName];
  parsedData.aliases[oreDictName] = { item: definition, meta: meta};
}
saveObjAsJson(parsedData, "parsedData.json");



/*=====  OreDict first items  ======*/

const groupsJson = loadText("rawData/groups/groupsE2E-E.json")
  .replace(/(\W\d+)[LBbs](\W)/gi, "$1$2")
  .replace(/("SideCache".*)\[.*\]/gi, '$1"DataRemoved"');

saveText(groupsJson, "groups.json");