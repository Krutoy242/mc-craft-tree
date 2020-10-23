
const fs = require('fs')

const {setField} = require('./constituents.js')

/*=====  OreDict first items  ======*/


function addMeta(ctName) {
  // console.log(' ctName.match(/,/g).length:>> ', ctName, ctName.match(/,/g).length);
  return (ctName.match(/:/g) || []).length > 1 ? ctName : ctName + ':0'
}

exports.parseCrafttweakerLog = function(crafttweakerLogPath) {

  const aliases = {}

  const crLog = fs.readFileSync(crafttweakerLogPath, 'utf8')
  const rgx = /^Ore entries for <ore:([\w]+)> :[\n\r]+-<([^:>]+:[^:>]+):?([^:>]+)?/gm
  for (const match of crLog.matchAll(rgx)) {
    const oreDictName = match[1]
    const definition = match[2]
    const meta = match[3] === '*' ? undefined : match[3]

    // Add alias (first item of OreDict)
    aliases[oreDictName] = { item: definition, meta: meta}
  }

  /*=====  Item names  ======*/
  const ctLogNames = crLog.match(/"REGISTRY_NAME","DISPLAY_NAME"[\n\r]*([\r\s\S]*?)\nA total of/gm)[0] 
  const nameAliasRgx = /^"<([^>]*?)>(?:.withTag\((.*)\))?","([^"]*)"/gm
  for (const match of ctLogNames.matchAll(nameAliasRgx)) {
    const itemName = addMeta(match[1]).replace(/:/g, '__')
    const nbt = match[2] ? match[2].replace(/""/g, '"') : undefined
    const display = match[3]

    var fullName = itemName
    if (nbt) {
      const parsedNbt = nbt
        .replace(/ as (\w)\w+/g, '$1')
        .replace(/, /g, ',')
        .replace(/: ?/g, '__')
      fullName += '__' + parsedNbt
    }

    setField(fullName, 'display', display)
    setField(itemName, 'display', display)

    // If its openblocks:tank, we can also get fluid name
    // Just lazy to deal with fluid logs
    if (match[1] === 'openblocks:tank' && nbt) {
      const fluidName = nbt.match(/FluidName: "(.+)"/)[1]
      const fluidDisplay = display.match(/(.+) Tank/)[1]
      setField('fluid__' + fluidName, 'display', fluidDisplay)
    }
  }

  /*=====  Remove all items that have no viewBoxes ======*/
  // Significally reduce parsed file size
  // for (let k of Object.keys(parsedData.sheet)) {
  //   if (!parsedData.sheet[k].viewBox) parsedData.sheet[k] = undefined;
  // }

  return aliases
}