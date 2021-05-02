import _ from 'lodash'
import { IndexedRawAdditionals, SetFieldFn } from './main_parser'
const {min, max, round} = Math


interface JER_Entry {
  block: string;
  distrib: string;
  silktouch: boolean;
  dim: string;
  dropsList?: DropsEntry[];
}

interface DropsEntry {
  itemStack: string;
  fortunes: Fortunes;
}

interface Fortunes {
  '0'?: number;
  '1'?: number;
  '2'?: number;
  '3'?: number;
}

// type DimensionDisplay = `${string & ''} (${number})`
type DimensionDisplay = string
const worldDifficulty:Record<DimensionDisplay, number> = {
  'Overworld (0)'      : 1.0,
  'Nether (-1)'        : 1.0,
  'The End (1)'        : 1.0,
  'Twilight Forest (7)': 1.0,
  'Ratlantis (-8)'     : 1.0,
  'Deep Dark (-11325)' : 1.0,
  'Luna (100)'         : 1.0,
  'Mercury (101)'      : 1.0,
  'Venus (102)'        : 1.0,
  'Mars (103)'         : 1.0,
  'Io (105)'           : 1.0,
  'Europa (106)'       : 1.0,
  'Titan (108)'        : 1.0,
  'Uranus (109)'       : 1.0,
  'Neptune (110)'      : 1.0,
  'Proxima B (111)'    : 1.0,
  'Terra Nova (112)'   : 1.0,
  'Novus (113)'        : 1.0,
  'Stella (114)'       : 1.0,
  'KELT-2ab (118)'     : 1.0,
  'KELT-3 (119)'       : 1.0,
  'KELT-4ab (120)'     : 1.0,
  'KELT-6a (121)'      : 1.0,
  'Kepler 0118 (122)'  : 1.0,
  'Kepler 0119 (123)'  : 1.0,
}

const EXPLORATION_MAX_COST = 10000

let initialized = false
let ph_exploration:IndexedRawAdditionals
let ph_pick:IndexedRawAdditionals
const dimensionPHs:Record<keyof typeof worldDifficulty, IndexedRawAdditionals> = {}
function dimJERFieldToID(key: string) {
  const [_, name, id] = key.match(/(.*) \((-?\d+)\)/) as RegExpMatchArray
  return {id:'placeholder:Dim ' + id + ':0', display: name}
}


function initDims(setField: SetFieldFn) {
  if(initialized) return
  initialized = true

  ph_exploration = setField('placeholder:Exploration:0')
  ph_pick        = setField('minecraft:iron_pickaxe:0')

  Object.entries(worldDifficulty).forEach(
    ([key, value]) => {
      const parsed = dimJERFieldToID(key)
      dimensionPHs[key] = setField(parsed.id, 'display', parsed.display)
    }
  )
}


// Get maximim difficulty when mining
const H = 255
const MID = 70
function difficulty_from_level(x:number) {
  // return 1
  const b = 7.13
  const c = 44
  const r = (2**(b-x/(MID/b)) + x**2/c**2) / (MID*2) - 0.025
  return 1 - Math.min(Math.max(0, r), 1)
}
const maxHeightDiff = _(new Array(H))
  .map((_,i)=>difficulty_from_level(i))
  .sum()

const probFactor = 4

function getJERProbability(rawStrData:string) {
  return _(rawStrData)
    .split(';')
    .map(s=>s.split(',').map(parseFloat))
    .filter(o=>!isNaN(o[0]))
    .map(([lvl, prob])=>difficulty_from_level(lvl) * prob**probFactor/* **(1/2) */)
    .sum() / maxHeightDiff
}

export function parse_JER(jer:JER_Entry[], setField: SetFieldFn) {
  initDims(setField)
  for (const jer_entry of jer) {
    handleJerEntry(jer_entry, setField)
  }
}

function handleJerEntry(jer_entry:JER_Entry, setField: SetFieldFn) {
  const ads = setField(jer_entry.block)

  // 0 .. 1
  const probability = getJERProbability(jer_entry.distrib) ** (1/(0.05*probFactor * EXPLORATION_MAX_COST))

  const worldMultiplier = (worldDifficulty as any)[jer_entry.dim] ?? 1.0
  const exploreComplexity = Math.max(1,
    worldMultiplier * (1 - probability) * EXPLORATION_MAX_COST
  )

  const dimAddit = dimensionPHs[jer_entry.dim] 
    ?? setField(dimJERFieldToID(jer_entry.dim).id)

  ;(ads.recipes??=[]).push({
    ins: {[ph_exploration.index]: exploreComplexity | 0},
    ctl: {[dimAddit.index]: 1},
  })

  if(jer_entry.dropsList) jer_entry.dropsList.forEach(drop=>handleDrops(ads, drop, setField))
}


function handleDrops(block: IndexedRawAdditionals, drop:DropsEntry, setField: SetFieldFn) {
  const ads = setField(drop.itemStack)

  const fortunes = _(drop.fortunes).values().mean()
  const inp_amount = fortunes < 1 ? 1 / fortunes : 1
  const out_amount = max(1, round(fortunes))

  ;(ads.recipes??=[]).push({
    out: out_amount>1 ? out_amount : undefined,
    ins: {[block.index]:   max(1, round(inp_amount))},
    ctl: {[ph_pick.index]: 1},
  })
}