/* 
Helper script to prepare several files for fast acces
Lunch with NodeJS
*/

/*=============================================
=                Variables                    =
=============================================*/
import fs from 'fs'
import path from 'path'

import { exportAdditionals } from './additionalsStore'
import { parseJECgroups } from './from/jec'
import { parse_JER } from './from/jer'
import { parseSpritesheet } from './from/spritesheet'
import { parseCrafttweakerLog_raw } from './from/crafttweaker_raw_log'
import { applyOreDictionary } from './from/crafttweaker_log'

/*=============================================
=                   Helpers                   =
=============================================*/
function loadText(filename: string): string {
  return fs.readFileSync(path.resolve(__dirname, filename), 'utf8')
}

function loadJson(filename: string) {
  return JSON.parse(loadText(filename))
}

function saveText(txt: string, filename: string) {
  fs.writeFileSync(path.resolve(__dirname, filename), txt)
}

function saveObjAsJson(obj: any, filename: string) {
  saveText(JSON.stringify(obj, null, 2), filename)
}

/*=============================================
=            Spritesheet
=============================================*/
parseSpritesheet(loadJson('../../raw/spritesheet.json'))

/*=============================================
=            world-gen.json
=============================================*/
const realMCPath = 'D:/mc_client/Instances/Enigmatica2Expert - Extended/'
parse_JER(loadJson(realMCPath + 'config/jeresources/world-gen.json'))

/*=============================================
=            crafttweaker.log
=============================================*/
const crafttweakerLogTxt = loadText(realMCPath + '/crafttweaker.log')
applyOreDictionary(crafttweakerLogTxt)
parseCrafttweakerLog_raw(loadText(realMCPath + '/crafttweaker_raw.log'))

/*=====  Save parsed data ======*/
// Remove technical data
saveObjAsJson(exportAdditionals(), '../../default_additionals.json')

/*=============================================
=      Prepare JEC groups.json
=============================================*/
saveObjAsJson(
  parseJECgroups(loadText(realMCPath + '/config/JustEnoughCalculation/data/groups.json')),
  '../../jec_groups.json'
)
