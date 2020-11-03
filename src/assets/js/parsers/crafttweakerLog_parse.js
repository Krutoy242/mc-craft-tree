// let sortobject = require('deep-sort-object')
const { objToString } = require('../utils')
const _ = require('lodash')
/*=====  OreDict first items  ======*/
const {sqrt, max, ceil, floor} = Math


function serializeNameMeta(ctName) {
  const match = ctName.split(':')
  const haveMeta = match.length > 2
  let result = ctName
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

  /*=====  Item names  ======*/ // {componentASSEMBLY: {ForgeCaps: {"astralsorcery:cap_item_amulet_holder": {}}, id: "psi:cad_assembly", Count: 1, Damage: 0}}
  const ctLogNames = crLog.match(/"REGISTRY_NAME","DISPLAY_NAME"[\n\r]*([\r\s\S]*?)\nA total of/gm)[0]
  const nameAliasRgx = /^"<(?<name>[^>]*?)>(?:.withTag\((?<tag>.*)\))?","(?<display>[^"]*)"/gm
  for (const match of ctLogNames.matchAll(nameAliasRgx)) {
    // Item Display blacklist
    if(/^conarm:(helmet|chestplate|leggins|boots)$/.test(match.groups.name)) continue

    const itemName = serializeNameMeta(match.groups.name)
    let nbt=null
    if(match.groups.tag!=null) {
      nbt = match.groups.tag
        .replace(/""/g, '"') // Remove double quotes
        .replace(/ as (bool|short|lond|float|double|byte)(\[\])?/g, '') // remove types
        .replace(/, \w+: \{\}|\w+: \{\}, |(, )?"[^"]+": \{\}|"[^"]+": \{\}, /g, '') // remove empty tags mekData: {}
        .replace(/, \w+: \{\}|\w+: \{\}, |(, )?"[^"]+": \{\}|"[^"]+": \{\}, /g, '')
        .replace(/, \w+: \{\}|\w+: \{\}, |(, )?"[^"]+": \{\}|"[^"]+": \{\}, /g, '')
      if(nbt.match(/^ *\{ *\} */)) nbt = null
      if(nbt?.match(/^.*\{ *\}.*$/)) console.log('nbt :>> ', nbt)
    }
    const display = match.groups.display
    let fullName = itemName + serializeNbt(nbt)

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

      let n = new IIngredient(this.name)
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

    let isFutile = false
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

    let keys_inputs = itemsToIndexes(inputsArr)
    if(keys_inputs?.isFutile) return

    let keys_catals = itemsToIndexes(catalyst)
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
    addShaped:    (recipName, output, input2d) => addRecipe(recipName, output, input2d, max(input2d.length, input2d.reduce((x,y)=>max(x, y.length), 0)) > 2 ? [BH('minecraft:crafting_table')] : null),
    addShapeless: (recipName, output, input1d) => addRecipe(recipName, output, [input1d], input1d.length>4 ? [BH('minecraft:crafting_table')] : null)
  }
  // eslint-disable-next-line no-unused-vars
  const furnace = {
    addRecipe: (output, input, experience) => addRecipe(null, output, [input], [BH('minecraft:furnace')])
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
    extendedTable: [[BH('extendedcrafting:table_basic')],[BH('extendedcrafting:table_advanced')],[BH('extendedcrafting:table_elite')],[BH('extendedcrafting:table_ultimate')]]
  }

  function EC_TierCalc(level, inputs) {
    if(level>0) return catalysts.extendedTable[level - 1]

    if(Array.isArray(inputs[0])) {
      return catalysts.extendedTable[
        floor(max(inputs.length/2, inputs.reduce((x,y)=>max(x, y.length/2), 0))) - 1
      ]
    } else {
      return catalysts.extendedTable[
        floor(max(0, ceil(sqrt(inputs.length))/2 - 1))
      ]
    }
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
    },
    extendedcrafting: {
      CombinationCrafting: { addRecipe:       (output, rf, rf_t, central, ingrs)    => addRecipe(null, output, [[central, BH('placeholder:RF').amount(rf)], ingrs], [BH('extendedcrafting:crafting_core'), BH('extendedcrafting:pedestal').amount(ingrs.length)])},
      CompressionCrafting: { 
        addRecipe:                                  (catalyst, inp, count, out, rf, rf_t) => addRecipe(null, out, [[inp.amount(count), BH('placeholder:RF').amount(rf)]], [BH('extendedcrafting:compressor'), catalyst]) ,
        remove:                                     (out)                                 => null },
      EnderCrafting: { addShaped:             (out, input2d)                    => addRecipe(null, out, input2d, [BH('extendedcrafting:ender_crafter'), BH('extendedcrafting:ender_alternator').amount(input2d.flat().length)]) },
      TableCrafting: { 
        addShaped:   (level, out, inputs) => addRecipe(null, out, inputs,   EC_TierCalc(level, inputs)),
        addShapeless:(level, out, inputs) => addRecipe(null, out, [inputs], EC_TierCalc(level, inputs))
      }
    },
    astralsorcery: {
      Altar: { 
        addDiscoveryAltarRecipe:                    (name, out, n1, n2, ingr1d)         => addRecipe(name, out, [ingr1d], [BH('astralsorcery:blockaltar'), BH('placeholder:Starlight').amount(n1)]),
        addAttunementAltarRecipe:                   (name, out, n1, n2, ingr1d)         => addRecipe(name, out, [ingr1d], [BH('astralsorcery:blockaltar:1'), BH('placeholder:Starlight').amount(n1)]),
        addConstellationAltarRecipe:                (name, out, n1, n2, ingr1d)         => addRecipe(name, out, [ingr1d], [BH('astralsorcery:blockaltar:2'), BH('placeholder:Starlight').amount(n1)]),
        addTraitAltarRecipe:                        (name, out, n1, n2, ingr1d, name2)  => addRecipe(name, out, [ingr1d], [BH('astralsorcery:blockaltar:3'), BH('placeholder:Starlight').amount(n1)]),
        removeAltarRecipe:                          (name)                                => null },
      Grindstone: { addRecipe:                (input, out, f1)                      => addRecipe(null, out, [[input]], [BH('astralsorcery:blockmachine:1')]) },
      LightTransmutation: { addTransmutation: (inp, out, cost)                      => addRecipe(null, out, [[inp]], [BH('placeholder:Starlight').amount(cost)]) },
      // LiquidInteraction: { addInteraction:    (in1, cost1, in2, cost2, weight, out) => addRecipe(null, out, [[in1.amount(cost1), in2.amount(cost2)]], [BH('astralsorcery:blockchalice')]) },
      StarlightInfusion: { addInfusion:       (input, out, mult, chance, time)      => addRecipe(null, out, [[input, BH('fluid:astralsorcery.liquidstarlight').amount(chance*1000)]], [BH('astralsorcery:blockstarlightinfuser')]) },
    }
  }

  /*=====   ======*/
  // const recipesRgx = /^((?:recipes\.addShap|mods\.botania\.|furnace\.addRecipe).*)/gm
  // const recipesRgx = /(^(\w+\.\w+(?:.\w+)*\(.*)$\n){1,}/gm
  const recipesRgx = /^(\w+\.\w+(?:.\w+)*\(.*)/gm
  let k = 0
  for (const match of crLog.matchAll(recipesRgx)) {
    // if(k >= 300) break
    const parseResult = zs_parseFnc(match[0].trim())
    // console.log('parseResult :>> ', parseResult);
    eval(parseResult)
    if(++k % 100 == 0) console.log(`processed ${k} lines`)
  }
}