// var sortobject = require('deep-sort-object')
const objToString = require('./objToString.js')
const _ = require('lodash')
/*=====  OreDict first items  ======*/



function serializeNameMeta(ctName) {
  const match = ctName.split(':')
  const haveMeta = match.length > 2
  var result = ctName
  if (haveMeta) {
    if(ctName.slice(-1) === '*')
      result = ctName.slice(0, -1) + '0'
  } else {
    if(match[0] === 'ore') {
      return match[1]
    }
    else {
      result = ctName + ':0'
    }
  }
  // return result.replace(/:/g, '__')
  return result
}

function serializeNbt(nbt) {
  if (nbt) {
    if(typeof nbt === 'object') nbt = objToString(nbt)
    const parsedNbt = nbt
      // .replace(/ as (\w)\w+/g, '$1')
      .replace(/ as \w+/g, '')
      .replace(/, /g, ',')
      .replace(/: */g, ':')
    // return '__' + parsedNbt
    return parsedNbt
  }
  return ''
}


exports.parseCrafttweakerLog = function(crLog, zs_parseFnc, setField) {
  const oreEntriesRgx = /^Ore entries for <ore:([\w]+)> :[\n\r]+-<([^:>]+:[^:>]+):?([^:>]+)?/gm
  for (const match of crLog.matchAll(oreEntriesRgx)) {
    const oreDictName = match[1]
    const definition = match[2]
    const meta = parseInt(match[3] === '*' ? undefined : match[3])

    // Add alias (first item of OreDict)
    const adds = setField(oreDictName, 'item', definition)
    if(meta) adds.meta = meta
  }

  /*=====  Item names  ======*/
  const ctLogNames = crLog.match(/"REGISTRY_NAME","DISPLAY_NAME"[\n\r]*([\r\s\S]*?)\nA total of/gm)[0]
  const nameAliasRgx = /^"<(?<name>[^>]*?)>(?:.withTag\((?<tag>.*)\))?","(?<display>[^"]*)"/gm
  for (const match of ctLogNames.matchAll(nameAliasRgx)) {
    // Item Display blacklist
    if(/^conarm:(helmet|chestplate|leggins|boots)$/.test(match.groups.name)) continue

    const itemName = serializeNameMeta(match.groups.name)
    var nbt=null
    if(match.groups.tag!=null) {
      nbt = match.groups.tag
        .replace(/""/g, '"')
        .replace(/ as (bool|short|lond|float|double|byte)(\[\])?/g, '')
    }
    const display = match.groups.display
    var fullName = itemName + serializeNbt(nbt)

    setField(itemName, 'display', display)
    setField(fullName, 'display', display)

    // If its openblocks:tank, we can also get fluid name
    // Just lazy to deal with fluid logs
    if (match.groups.name === 'openblocks:tank' && nbt!=null) {
      const fluidName = nbt.match(/FluidName: "(.+)"/)[1]
      const fluidDisplay = display.match(/(.+) Tank/)[1]
      // setField('fluid__' + fluidName, 'display', fluidDisplay)
      setField('fluid:' + fluidName, 'display', fluidDisplay)
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

  // const recipeList = []

  class IIngredient {
    constructor(str) {
      this.name = str
      this.count = 1
      this.update()
    }

    withTag(tag) {
      if(!tag || Object.keys(tag).length === 0) return this

      var n = new IIngredient(this.name)
      n.count = this.count
      n.tag = tag
      n.update()
      return n
    }

    asString() {return serializeNameMeta(this.name) + serializeNbt(this.tag)}
    update() {
      // Blacklist recipes that content this items
      // as inputs or outputs
      if(
        (this.tag && this.tag.ncRadiationResistance)/*  ||
        /^conarm:(helmet|chestplate|leggins|boots)$/.test(this.name) */
      ) {
        this.futile = true
        return
      }

      this.strId = this.asString()
      this.additionals = setField(this.strId)
    }

    /* match(o) {
      if(this.name != o.name) return false    
      if(!(this.fNbt || o.fNbt) && !deepEqual(this.tag, o.tag)) return false
      return true
    } */

    amount(count) {
      this.count = count
      return this
    }

    or() {return this}
  }

  /*=====  EVAL functions ======*/

  // eslint-disable-next-line no-unused-vars
  function BH(str) {
    return new IIngredient(str)
  }

  function itemsToIndexes(arr) {
    if(!arr) return null

    var isFutile = false
    const keys = arr.reduce((acc, i) => {
      if(i.futile || isFutile) {
        isFutile = true
      } else {
        const index = i.additionals.index
        acc[index] = (acc[index] || 0)+1
      }
      return acc
    }, {})
    return {keys, isFutile, length: Object.keys(keys).length}
  }

  function addRecipe(recipName, output, input2d, catalyst) {
    if(output==null || output.futile) return

    const inputsArr = input2d.flat().filter(i=>i!=null)

    var keys_inputs = itemsToIndexes(inputsArr)
    if(keys_inputs?.isFutile) return

    var keys_catals = itemsToIndexes(catalyst)
    if(keys_catals?.isFutile) return

    if(!(keys_inputs?.length > 0 || keys_catals?.length > 0)) return
    
    const ads = output.additionals
    ads.recipes = ads.recipes || []
    ads.recipes.push({
      out: output.count>1 ? output.count : undefined,
      ins: keys_inputs?.keys || undefined,
      ctl: keys_catals?.keys || undefined
    })
  }

  // eslint-disable-next-line no-unused-vars
  const recipes = {
    addShaped: addRecipe,
    addShapeless: (recipName, output, input1d) => addRecipe(recipName, output, [input1d])
  }
  const catalysts = {
    ElvenTrade:               [BH('botania:livingwood:5').amount(8), BH('botania:livingwood').amount(8), BH('botania:pylon:1').amount(2), BH('botania:pool')],
    Apothecary:               [BH('botania:altar')],
    Brew:                     [BH('botania:brewery')],
    PureDaisy:                [BH('botania:specialflower').withTag({type: 'puredaisy'})],
    RuneAltar:                [BH('botania:runealtar')],
    ManaInfusion_Alchemy:     [BH('botania:pool'), BH('botania:alchemycatalyst')],
    ManaInfusion_Conjuration: [BH('botania:pool'), BH('botania:conjurationcatalyst')],
    ManaInfusion_Infusion:    [BH('botania:pool')],
  }
  // eslint-disable-next-line no-unused-vars
  const mods = {
    botania: {
      Apothecary:   {addRecipe: (output, input1d) => addRecipe(null, output, [input1d, BH('minecraft:wheat_seeds')], catalysts.Apothecary)},
      Brew:         {addRecipe: (input1d, brewName) => {[
        [BH('botania:vial:1'), BH('botania:brewflask')],
        [BH('botania:bloodpendant'), BH('botania:bloodpendant')],
        [BH('botania:vial'), BH('botania:brewvial')],
        [BH('botania:incensestick'), BH('botania:incensestick')]]
        .forEach(pair => {
          if(!(['botania:bloodpendant','botania:incensestick'].find(s=>s===pair[1].name)
            && ['healing','absorption','overload','clear','warpWard'].find(s=>s===brewName))
          )
            addRecipe(null, pair[1].withTag({brewKey: brewName}), [pair[0], input1d], catalysts.Brew)
        })
      }},
      ElvenTrade:   {addRecipe: (output1d, input1d) => output1d.forEach(output => addRecipe(null, output, [input1d], catalysts.ElvenTrade))},
      PureDaisy:    {addRecipe: (input, output) => addRecipe(null, output, [[input]], catalysts.PureDaisy)},
      RuneAltar:    {addRecipe: (output, input1d, mana) => {
        const [runes, ingrs] = _.partition(input1d, ii=>ii.name.split(':')[1]==='rune')
        addRecipe(null, output, 
          [[BH('placeholder:Mana').amount(mana)], BH('botania:livingrock'), ...ingrs], 
          [...catalysts.RuneAltar, ...runes])
      }},
      ManaInfusion: {
        addAlchemy:     (output, input, mana) => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts.ManaInfusion_Alchemy),
        addConjuration: (output, input, mana) => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts.ManaInfusion_Conjuration),
        addInfusion:    (output, input, mana) => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts.ManaInfusion_Infusion),
      },
    }
  }
  
  /*=====   ======*/
  const recipesRgx = /^((?:recipes\.addShap|mods\.botania\.).*)/gm
  var k = 0
  for (const match of crLog.matchAll(recipesRgx)) {
    // if(k >= 300) break
    const parseResult = zs_parseFnc(match[0].trim())
    // console.log('parseResult :>> ', parseResult);
    eval(parseResult)
    if(++k % 100 == 0) console.log(`processed ${k} lines`)
  }
}