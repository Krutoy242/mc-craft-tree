// let sortobject = require('deep-sort-object')
import _, { constant } from 'lodash'
import { parseZenscriptLine } from './zenscript_parser'
const { IIngredient, setField, BH, $ } = require('./additionals')
const { mods, recipes, furnace} = require('./zenscript_emul')


type CrlogRawType = { [mod:string]: [display:string, stack:string, snbt?:string][] }

export function parseCrafttweakerLog_raw(crLog:string) {

  let modMap:CrlogRawType={}
  try {
    modMap = JSON.parse(crLog).all_items
  } catch (e) {
    console.log('something wrong with parseCrafttweakerLog_raw: ')
    console.log(e.message)
    return
  }

  _(modMap).values().flatten().forEach(([display, stack, snbt]) => {
    const [mod, id, meta] = stack.split(':')
    const fullId = `${mod}:${id}:${meta||'0'}`
    if(snbt) setField(fullId+snbt, 'display', display)
    setField(fullId, 'display', display)

    if (fullId === 'openblocks:tank:0' && snbt) {
      addFluid(display, snbt)
    }
  })
}

function addFluid(display:string, snbt:string) {
  // If its openblocks:tank, we can also get fluid name
  // Just lazy to deal with fluid logs
  const fluidName = snbt.match(/FluidName:"(.+)"/)?.[1]
  const fluidDisplay = display.match(/(.+) Tank/)?.[1]
  setField('fluid:' + fluidName, 'display', fluidDisplay)
}

function applyOreDictionary(crLog:string) {
  const oreEntriesRgx = /^Ore entries for <ore:([\w]+)> :[\n\r]+-<([^:>]+:[^:>]+):?([^:>]+)?/gm
  for (const match of crLog.matchAll(oreEntriesRgx)) {
    const [_m, oreDictName, definition, meta] = match

    // Add alias (first item of OreDict)
    const adds = setField(oreDictName, 'item', definition)
    if(meta && meta !== '*') adds.meta = parseInt(meta)
  }
}

export function parseCrafttweakerLog(crLog:string) {
  applyOreDictionary(crLog)


  /*=====   ======*/
  const recipesRgx = /^(?:\[INITIALIZATION\]\[CLIENT\]\[INFO\] Recipe wrapped: )?(\w+\.\w+(?:.\w+)*\(.*)$/gm
  let k = 0
  for (const match of [...crLog.matchAll(recipesRgx)].reverse()) {
    // if(k >= 300) break
    const zsLine = match[1].trim()
    const parseResult = tryMatchRgx(zsLine) || parseZenscriptLine(zsLine)
    try {
      eval(parseResult)
    } catch (error) {
      console.log(' Parsing Error! Source >>\n'+parseResult+'\n<<')
      throw error
    }
    
    if(++k % 1000 == 0) console.log(`processed ${k} lines`)
  }
}

const itemRegex = /<(?<item>[^:]+?:[^:]+?(:(\d+|\*))?)>|(?<null>null)/

function tryMatchRgx(zsLine:string) {
  const mainMatch = zsLine.match(/recipes.addShape(d|less)\("[^"]+?", (<(?<output>[^:]+?:[^:]+?(:\d+)?)>( \* (?<amount>\d+))?|null), \[(?<input_array>.*)\]\);/)?.groups
  if(!mainMatch) return

  const {output, amount, input_array} = mainMatch
  if(!input_array || !output) return

  const parsedArr = (input_array.startsWith('[')
    ? parse2dArr
    : parse1dArr
  )(input_array)
  if(!parsedArr) return

  return `$(BH('${output}').amount(${amount||1}), [${parsedArr}])`
}

function parse2dArr(text:string) {
  const acc:string[] = []
  for (const m of text.matchAll(/\[([^\]]+)\]/g)) {
    const arr1 = parse1dArr(m[1])
    if(arr1) acc.push(arr1)
  }
  if(!acc.length) return
  
  return acc
    .map(s=>`[${s}]`)
    .join(', ')
}

function parse1dArr(text:string) {
  const acc:string[] = []
  for (const m of text.matchAll(/<(?<item>[^:]+?:[^:]+?(:(\d+|\*))?)>|(?<null>null)/g)) {
    if(!m?.groups) return
    if(m.groups.null) continue
    acc.push(m.groups.item)
  }
  if(!acc.length) return

  return acc
    .map(s=>`BH('${s}')`)
    .join(', ')
}