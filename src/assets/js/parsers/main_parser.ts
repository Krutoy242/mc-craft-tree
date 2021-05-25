/* 
Helper script to prepare several files for fast acces
Lunch with NodeJS
*/

/*=============================================
=                Variables                    =
=============================================*/
import fs from 'fs'
import path from 'path'
import glob from 'glob'

import { cleanupAdditionals } from './additionals'
import { parseJECgroups } from './jec_parse'
import { parse_JER } from './jer_parser'
import { parseSpritesheet } from './spritesheet_parse'
import { initCustomRecipes } from './zenscript_custom'
import { parseCrafttweakerLog, parseCrafttweakerLog_raw } from './crafttweakerLog_parse'
import { initAdvRocketryXMLRecipe } from './xml'
import { fileNameFromPath } from './utils_parse'

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
=            Spritesheet
=============================================*/
parseSpritesheet(loadJson('../../raw/spritesheet.json'))


/*=============================================
=            world-gen.json
=============================================*/
const realMCPath = 'D:/mc_client/Instances/Enigmatica2Expert - Extended/'
const worldgenPath = realMCPath + 'config/jeresources/world-gen.json'
parse_JER(loadJson(worldgenPath))

/*=============================================
=            XML files
=============================================*/
glob.sync(realMCPath+'config/advRocketry/*.xml').forEach(filePath=>{
  initAdvRocketryXMLRecipe(fileNameFromPath(filePath), loadText(filePath))
})

/*=============================================
=            crafttweaker.log
=============================================*/
parseCrafttweakerLog_raw(loadText(realMCPath+'/crafttweaker_raw.log'))
parseCrafttweakerLog    (loadText(realMCPath+'/crafttweaker.log'))


/*=============================================
=            Custom
=============================================*/
initCustomRecipes()


/*=====  Save parsed data ======*/
// Remove technical data
saveObjAsJson(cleanupAdditionals(), '../../default_additionals.json')


/*=============================================
=      Prepare JEC groups.json
=============================================*/
saveObjAsJson(parseJECgroups(loadText(realMCPath+'/config/JustEnoughCalculation/data/groups.json')), '../../jec_groups.json')