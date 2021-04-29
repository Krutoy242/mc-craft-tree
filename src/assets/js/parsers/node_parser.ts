/* 
Helper script to prepare several files for fast acces
Lunch with NodeJS
*/

import { RawAdditionals } from '../cuents/ConstituentBase'

/*=============================================
=                Variables                    =
=============================================*/
import fs from 'fs'
import path from 'path'
import { parseJECgroups } from './jec_parse'
import { parse_JER } from './jer_parser'
import { parseSpritesheet } from './spritesheet_parse'

import { parseCrafttweakerLog, parseCrafttweakerLog_raw } from './crafttweakerLog_parse'

/*=============================================
=                   Helpers                   =
=============================================*/
function loadText(filename:string): string {
  return fs.readFileSync(path.resolve(__dirname, filename), 'utf8')
}

function loadJson(filename:string) {
  return JSON.parse(loadText(filename))
}

function saveText(txt:string, filename:string) {
  fs.writeFileSync(path.resolve(__dirname, filename), txt)
}

function saveObjAsJson(obj:any, filename:string) {
  saveText(JSON.stringify(obj, null, 2), filename)
}


/*=============================================
=           Parsing
=============================================*/

export interface IndexedRawAdditionals extends RawAdditionals {
  index: number
}
export type IndexedRawAdditionalsStore = {[key: string]: IndexedRawAdditionals}

type AdditID = string|number
type ValueOf<T> = T[keyof T];

const additionals:IndexedRawAdditionalsStore = {}
let additionalsLength = 0

export type SetFieldFn = typeof setField

function setField(
  id:AdditID,
  field?: keyof IndexedRawAdditionals,
  value?: ValueOf<IndexedRawAdditionals>
) { 
  const found = isNaN(Number(id))
    ? additionals[id]
    : Object.values(additionals)[id as number]

  let picked = found
  if(!picked) {
    picked = {
      index: additionalsLength++
    }
    additionals[id] = picked
  }

  if(field) (picked[field] as any) ||= value

  return picked
}


/*=============================================
=            Spritesheet
=============================================*/
parseSpritesheet(loadJson('../../raw/Spritesheet.json'), setField)


/*=============================================
=            world-gen.json
=============================================*/
const realMCPath = 'D:/mc_client/Instances/Enigmatica2Expert - Extended/'
const worldgenPath = realMCPath + 'config/jeresources/world-gen.json'
parse_JER(loadJson(worldgenPath), setField)


/*=============================================
=            crafttweaker.log
=============================================*/
parseCrafttweakerLog_raw(loadText(realMCPath+'/crafttweaker_raw.log'), setField)
parseCrafttweakerLog    (loadText(realMCPath+'/crafttweaker.log'), setField)


/*=====  Save parsed data ======*/
// Remove technical data
for (const key in additionals) {
  delete (additionals[key] as any).index
}
saveObjAsJson(additionals, '../../default_additionals.json')


/*=============================================
=      Prepare JEC groups.json
=============================================*/
const parsedJEC_obj = parseJECgroups(loadText('../../raw/groups.json'), additionals)
saveObjAsJson(parsedJEC_obj, '../../jec_groups.json')