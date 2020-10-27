
// const {setField} = require('./constituents.js')
var deepEqual = require('deep-equal')
var sortobject = require('deep-sort-object');

/*=====  OreDict first items  ======*/


function serializeNameMeta(ctName) {
  // console.log(' ctName.match(/,/g).length:>> ', ctName, ctName.match(/,/g).length);
  return ((ctName.match(/:/g) || []).length > 1 ? ctName : ctName + ':0').replace(/:/g, '__')
}

function serializeMergeNbt(itemName, nbt) {
  var fullName = itemName
  if (nbt) {
    const parsedNbt = nbt
      .replace(/ as (\w)\w+/g, '$1')
      .replace(/, /g, ',')
      .replace(/: ?/g, '__')
    fullName += '__' + parsedNbt
  }
  return fullName
}


exports.parseCrafttweakerLog = function(crLog, zs_parseFnc) {

  const result = {
    aliases: {},
    additionals: {}
  }

  function setField(id, field, value) { 
    result.additionals[id] = result.additionals[id] || {}
    result.additionals[id][field] = result.additionals[id][field] || value
  }

  // const crLog = readFileSync(crafttweakerLogPath, 'utf8')
  const oreEntriesRgx = /^Ore entries for <ore:([\w]+)> :[\n\r]+-<([^:>]+:[^:>]+):?([^:>]+)?/gm
  for (const match of crLog.matchAll(oreEntriesRgx)) {
    const oreDictName = match[1]
    const definition = match[2]
    const meta = match[3] === '*' ? undefined : match[3]

    // Add alias (first item of OreDict)
    result.aliases[oreDictName] = { item: definition, meta: meta}
  }

  /*=====  Item names  ======*/
  const ctLogNames = crLog.match(/"REGISTRY_NAME","DISPLAY_NAME"[\n\r]*([\r\s\S]*?)\nA total of/gm)[0]
  const nameAliasRgx = /^"<([^>]*?)>(?:.withTag\((.*)\))?","([^"]*)"/gm
  for (const match of ctLogNames.matchAll(nameAliasRgx)) {
    const itemName = serializeNameMeta(match[1])
    const nbt = match[2] ? match[2].replace(/""/g, '"') : undefined
    const display = match[3]
    var fullName = serializeMergeNbt(itemName, nbt)

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


  // ====================================================
  // Find Crafting table recipes
  // ====================================================
  /*=====  functions ======*/

  function BH(str) {
    return IIngredient.fromStr(str)
  }

  const recipeList = []

  function addRecipe(recipName, output, input2d) {
    if(output==null){
      // console.log('recipName, output, input2d :>> ', recipName, output, input2d);
      return
    }
    recipeList.push({
      ots: [output.id],
      ins: input2d
        .flat()
        .filter(i=>i!=null)
        .reduce((acc, i) => {acc[i.id] = (acc[i.id] || 0)+1; return acc}, {})
    })
  }

  const recipes = {
    addShaped: addRecipe,
    addShapeless: (recipName, output, input1d) => addRecipe(recipName, output, [input1d])
  }
  
  /*=====   ======*/
  const recipesRgx = /^(recipes\.addShap.*)/gm
  var k = 0
  // const recipesRgx = /^recipes\.addShap(?:ed|eless)\("[^"]+", (.*)\);/gm
  // for (const match of crLog.matchAll(recipesRgx)) {
  //   const parseResult = zs_parseFnc(match[1].trim())
  //   // console.log('parseResult :>> ', parseResult)
  //   eval(`addRecipe(null, ${parseResult})`)
  //   // eval(parseResult)
  //   if(++k % 100 == 0) console.log(`processed ${k} lines, ingredients: ${ing_list.length}`)
  // }
  for (const match of crLog.matchAll(recipesRgx)) {
    const parseResult = zs_parseFnc(match[0].trim())
    eval(parseResult)
    if(++k % 100 == 0) console.log(`processed ${k} lines, ingredients: ${ing_list.length}`)
  }

  // console.log('ing_list.length :>> ', ing_list.length)
  console.log('recipeList.length :>> ', recipeList.length)


  return result
}

const ing_list = []
const existKeys = {}

function pushIngr(newbie) {
  const found = existKeys[newbie.strId]
  // const found = ing_list.find(ingr => ingr.match(newbie))
  if(!found) {
    newbie.id = ing_list.length
    ing_list.push(newbie)
    existKeys[newbie.strId] = newbie
    // console.log('new II :>> ', newbie.asString())
    return newbie
  } else {
    return found
  }
}

class IIngredient {
  static fromStr(str) {
    var n = new IIngredient()
    n.name = str
    n.count = 1
    n.update()
    return pushIngr(n)
  }

  constructor() {
  }


  asString() {
    return `${this.name}${this.tag ? JSON.stringify(this.tag) : ''}`
  }

  update() {
    this.strId = this.asString()
  }

  match(o) {
    if(this.name != o.name) return false    
    if(!(this.fNbt || o.fNbt) && !deepEqual(this.tag, o.tag)) return false
    return true
  }

  amount(count) {
    this.count = count
    return this
  }

  or() {
    return this
  }

  withTag(tag) {
    var n = new IIngredient()
    Object.assign(n, this)
    n.tag = sortobject(tag)
    n.update()
    return pushIngr(n)
  }
}