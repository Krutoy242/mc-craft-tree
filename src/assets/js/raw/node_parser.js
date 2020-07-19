/* 
Helper script to prepare several files for fast acces
Lunch with NodeJS
*/

/*=============================================
=                Variables                    =
=============================================*/
const fs = require('fs');
const path = require("path");

// Path to generated recipes by Just Enough Calculation mod
const GROUPS_PATH = "./groups.json";


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

const spritesheetRaw = loadJson("./Spritesheet.json");
const parsedData = {
  sheet: {},
  aliases: {}
};

var isLogDplicates = true;

function pushParsedSheet(name, key, value){
  // Create object if empty
  parsedData.sheet[name] = parsedData.sheet[name] || {};

  // Check if exist (probably parsing error)
  // if (parsedData.sheet[name][key] && isLogDplicates) console.log('parsedData.sheet (name, key) exist :>> ', name, key);

  // Add value
  parsedData.sheet[name][key] = parsedData.sheet[name][key] || value;
}

function pushViewBox(name, viewBox) { pushParsedSheet(name, "viewBox", viewBox); }
function pushDisplay(name, display) { pushParsedSheet(name, "display", display); }

for (let k of Object.keys(spritesheetRaw.frames)) {
  const part = spritesheetRaw.frames[k];
  const nameNnbt = k.replace(/(^.*)\.png$/, "$1");
  const viewBox = `${part.frame.x} ${part.frame.y}`;
  pushViewBox(nameNnbt, viewBox);

  // If name have NBT tags create another entry
  // without tags
  if (nameNnbt.match(/.*\{.*/)) {
    const noNbtName = nameNnbt.replace(/(.*)__\{.*/, "$1");
    isLogDplicates = false;
    pushViewBox(noNbtName, viewBox);
    isLogDplicates = true;
  }
}

function itemStackToString(item, meta = 0) {
  return `${item.replace(":", "__")}__${meta}`;
}

function addMeta(ctName) {
  // console.log(' ctName.match(/,/g).length:>> ', ctName, ctName.match(/,/g).length);
  return (ctName.match(/:/g) || []).length > 1 ? ctName : ctName + ":0";
}

/*=====  OreDict first items  ======*/

const crLog = loadText("./crafttweaker.log");
const rgx = /^Ore entries for <ore:([\w]+)> :[\n\r]+-<([^:>]+:[^:>]+):?([^:>]+)?/gm;
for (const match of crLog.matchAll(rgx)) {
  const oreDictName = match[1];
  const definition = match[2];
  const meta = match[3] === "*" ? undefined : match[3];
  const itemName = itemStackToString(definition, meta);

  // Add viewBox to oredict entry if this box defined
  // if (parsedData.sheet[itemName]) {
  //   pushViewBox(`ore__${oreDictName}`, parsedData.sheet[itemName].viewBox);
  // }

  // Add alias (first item of OreDict)
  parsedData.aliases[oreDictName] = { item: definition, meta: meta};
}

/*=====  Item names  ======*/
// console.log('object :>> ', crLog.match(/"REGISTRY_NAME","DISPLAY_NAME"[\s\S]/gm));
const ctLogNames = crLog.match(/"REGISTRY_NAME","DISPLAY_NAME"[\n\r]*([\r\s\S]*?)\nA total of/gm)[0]; 
const nameAliasRgx = /^"<([^>]*?)>(?:.withTag\((.*)\))?","([^\"]*)"/gm
for (const match of ctLogNames.matchAll(nameAliasRgx)) {
  const itemName = addMeta(match[1]).replace(/:/g, "__");
  const nbt = match[2] ? match[2].replace(/""/g, '"') : undefined;
  const display = match[3];

  var fullName = itemName;
  if (nbt) {
    const parsedNbt = nbt
      .replace(/ as (\w)\w+/g, '$1')
      .replace(/, /g, ',')
      .replace(/: ?/g, '__');
    fullName += "__" + parsedNbt;
  }

  pushDisplay(fullName, display);
  isLogDplicates = false;
  pushDisplay(itemName, display);
  isLogDplicates = true;

  // If its openblocks:tank, we can also get fluid name
  // Just lazy to deal with fluid logs
  if (match[1] === "openblocks:tank" && nbt) {
    const fluidName = nbt.match(/FluidName: "(.+)"/)[1];
    const fluidDisplay = display.match(/(.+) Tank/)[1];
    pushDisplay("fluid__" + fluidName, fluidDisplay);
  }
}

/*=====  Remove all items that have no viewBoxes ======*/
// Significally reduce parsed file size
// for (let k of Object.keys(parsedData.sheet)) {
//   if (!parsedData.sheet[k].viewBox) parsedData.sheet[k] = undefined;
// }

/*=====  Save parsed data ======*/
saveObjAsJson(parsedData, "../../parsedData.json");



/*=====  Remove type letters (like 2L or 0b)  ======*/

const groupsJson = loadText(GROUPS_PATH)
  .replace(/(\W\d+)[LBbsf](\W)/gi, "$1$2")
  .replace(/("SideCache".*)\[.*\]/gi, '$1"DataRemoved"');

saveText(groupsJson, "../../groups.json");