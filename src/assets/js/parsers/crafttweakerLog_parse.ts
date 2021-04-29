// let sortobject = require('deep-sort-object')
import _ from 'lodash'
import { SetFieldFn } from './node_parser'
const {BH, mods, IIngredient, recipes, furnace} = require('./zenscript_emul')
const { parseZenscriptLine } = require('./zenscript_parser')


type CrlogRawType = { [mod:string]: [display:string, stack:string, snbt?:string][] }

export function parseCrafttweakerLog_raw(crLog:string, setField:SetFieldFn) {
  let modMap_txt = crLog.match(/~~ All items list\n([\s\S\n\r]*)\n~~ End of All items list/m)?.[1]
  if(!modMap_txt) return console.log('something wrong with parseCrafttweakerLog_raw')
  
  modMap_txt = modMap_txt.replace(/\["(.*?)","(.*?)"(?:,'(.*)')?\]/g, (...m)=>
    `[${m.slice(1,4).filter(o=>o).map(s=>'"'+s.replace(/"/g, '\\"')+'"').join(',')}]`
  ).replace('],\n}',']}')

  let modMap:CrlogRawType={}
  try {
    modMap = JSON.parse(modMap_txt)
  } catch (e) {
    console.log(e.message)
    console.log(modMap_txt.substring(7171780, 7171980))
    return
  }

  _(modMap).values().flatten().forEach(([display, stack, snbt]) => {
    const [mod, id, meta] = stack.split(':')
    const fullId = `${mod}:${id}:${meta||'0'}`
    if(snbt) setField(fullId+snbt, 'display', display)
    setField(fullId, 'display', display)

    if (fullId === 'openblocks:tank:0' && snbt) {
      addFluid(display, snbt, setField)
    }
  })
}

function addFluid(display:string, snbt:string, setField:SetFieldFn) {
  // If its openblocks:tank, we can also get fluid name
  // Just lazy to deal with fluid logs
  const fluidName = snbt.match(/FluidName:"(.+)"/)?.[1]
  const fluidDisplay = display.match(/(.+) Tank/)?.[1]
  setField('fluid:' + fluidName, 'display', fluidDisplay)
}

function applyOreDictionary(crLog:string, setField:SetFieldFn) {
  const oreEntriesRgx = /^Ore entries for <ore:([\w]+)> :[\n\r]+-<([^:>]+:[^:>]+):?([^:>]+)?/gm
  for (const match of crLog.matchAll(oreEntriesRgx)) {
    const [_m, oreDictName, definition, meta] = match

    // Add alias (first item of OreDict)
    const adds = setField(oreDictName, 'item', definition)
    if(meta && meta !== '*') adds.meta = parseInt(meta)
  }
}

export function parseCrafttweakerLog(crLog:string, setField:SetFieldFn) {
  IIngredient.setField = setField
  
  applyOreDictionary(crLog, setField)


  /*=====   ======*/
  const recipesRgx = /^(?:\[INITIALIZATION\]\[CLIENT\]\[INFO\] Recipe wrapped: )?(\w+\.\w+(?:.\w+)*\(.*)$/gm
  let k = 0
  for (const match of crLog.matchAll(recipesRgx)) {
    // if(k >= 300) break
    const parseResult = parseZenscriptLine(match[1].trim())
    try {
      eval(parseResult)
    } catch (error) {
      console.log(' Parsing Error! Source >>\n'+parseResult+'\n<<')
      throw error
    }
    
    if(++k % 100 == 0) console.log(`processed ${k} lines`)
  }
}

