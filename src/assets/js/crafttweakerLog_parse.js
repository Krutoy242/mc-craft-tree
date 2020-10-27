// var sortobject = require('deep-sort-object')

/*=====  OreDict first items  ======*/

function objToString(obj, ndeep) {
  switch (typeof obj) {
  case 'string':
    return '"' + obj + '"'
  case 'function':
    return obj.name || obj.toString()
  case 'object':
    var indent = Array(ndeep || 1).join('\t'),
      isArray = Array.isArray(obj)
    return (
      '{['[+isArray] + Object.keys(obj)
        .map(function (key) {
          const quoted = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(key) ? key : `"${key}"`
          return '\n\t' + indent + (isArray ? '' : quoted + ': ') + objToString(obj[key], (ndeep || 1) + 1)
        })
        .join(',') + '\n' + indent + '}]'[+isArray]
    )
      .replace(/[\s\t\n]+(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g, '')
  default:
    return obj!=null ? obj.toString() : ''
  }
}


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
  const nameAliasRgx = /^"<([^>]*?)>(?:.withTag\((.*)\))?","([^"]*)"/gm
  for (const match of ctLogNames.matchAll(nameAliasRgx)) {
    // Item Display blacklist
    if(/^conarm:(helmet|chestplate|leggins|boots)$/.test(match[1])) continue

    const itemName = serializeNameMeta(match[1])
    const nbt = match[2] ? match[2].replace(/""/g, '"') : undefined
    const display = match[3]
    var fullName = itemName + serializeNbt(nbt)

    setField(itemName, 'display', display)
    setField(fullName, 'display', display)

    // If its openblocks:tank, we can also get fluid name
    // Just lazy to deal with fluid logs
    if (match[1] === 'openblocks:tank' && nbt) {
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

  function addRecipe(recipName, output, input2d) {
    if(output==null) return

    var isFutile = output.futile
    if(isFutile) return

    const inputsArr = input2d.flat().filter(i=>i!=null)
    if(inputsArr.length <= 0) return

    const inputs = inputsArr
      .reduce((acc, i) => {
        if(i.futile || isFutile) {
          isFutile = true
        } else {
          const index = i.additionals.index
          acc[index] = (acc[index] || 0)+1
        }
        return acc
      }, {})

    if(isFutile) return
    
    const ads = output.additionals
    ads.recipes = ads.recipes || []
    ads.recipes.push({
      out: output.count>1 ? output.count : undefined,
      ins: inputs
    })
  }

  // eslint-disable-next-line no-unused-vars
  const recipes = {
    addShaped: addRecipe,
    addShapeless: (recipName, output, input1d) => addRecipe(recipName, output, [input1d])
  }
  
  /*=====   ======*/
  const recipesRgx = /^(recipes\.addShap.*)/gm
  var k = 0
  for (const match of crLog.matchAll(recipesRgx)) {
    // if(k >= 1000) break
    const parseResult = zs_parseFnc(match[0].trim())
    eval(parseResult)
    if(++k % 100 == 0) console.log(`processed ${k} lines`)
  }
}