
import _ from 'lodash'
import convert from 'xml-js'
import { $, BH, IIngredient } from './additionals'

interface RootObject {
  elements: Recipes[];
}

interface Recipes {
  type: string
  name: string
  elements: Recipe[]
}

interface Recipe {
  type: 'element'
  name: 'Recipe'
  elements: Group[]
}

interface Group {
  type: 'element'
  name: 'input'|'output'
  elements: Ingredient[]
}

interface Comment {
  type: 'comment'
  name: never
}

type IngredientType = 'itemStack'|'oreDict'|'fluidStack'

interface Ingredient {
  name: IngredientType
  elements: Text[]
}

interface Text {
  text: string
}

const machinesBlocks:{[fileName:string]:string} = {
  'Centrifuge' : 'advancedrocketry:centrifuge',
  'ChemicalReactor' : 'advancedrocketry:chemicalreactor',
  'Crystallizer' : 'advancedrocketry:crystallizer',
  'CuttingMachine' : 'advancedrocketry:cuttingmachine',
  'ElectricArcFurnace' : 'advancedrocketry:arcfurnace',
  'Electrolyser' : 'advancedrocketry:electrolyser',
  'Lathe' : 'advancedrocketry:lathe',
  'PrecisionAssembler' : 'advancedrocketry:precisionassemblingmachine',
  'PrecisionLaserEtcher' : 'advancedrocketry:precisionlaseretcher',
  'RollingMachine' : 'advancedrocketry:rollingmachine',
  'SmallPlatePress' : 'advancedrocketry:platepress',
}

export function initAdvRocketryXMLRecipe(fileName:string, content:string) {
  const obj = convert.xml2js(content) as RootObject
  
  // Check if this is recipe file
  if(!obj.elements.some(e => e.name === 'Recipes')) return

  obj.elements
    .filter(e => e.name==='Recipes' && !!e.elements)
    .map(recipes => recipes.elements
      .filter(recipe=>recipe.elements)
      .forEach(recipe=>parseRecipe(recipe, fileName))
    )
}

function parseRecipe(recipe:Recipe, fileName:string) {
  $(getGroup(recipe, 'output'), getGroup(recipe, 'input'), machinesBlocks[fileName] ?? 'placeholder:'+fileName)
}

function getGroup(recipe: Recipe, group: string): IIngredient[] {
  return recipe.elements.filter(item=>item.name===group)
    .map(g=>g.elements.map(parseItem)).flat()
}

function parseItemStack(text: string):IIngredient {
  const [id, amount, meta] = text.split(/[; ]/)
  return BH(`${id}:${meta??0}`).amount(amount ? parseInt(amount) : 1)
}

function parseOther(key:string, text: string):IIngredient {
  const [oreName, amount] = text.split(/[; ]/)
  return BH(key + ':' + oreName).amount(parseInt(amount))
}

function parseItem(item:Ingredient):IIngredient {
  const text = item.elements[0].text
  if(item.name==='itemStack')  return parseItemStack(text)
  if(item.name==='oreDict')    return parseOther('ore',   text)
  if(item.name==='fluidStack') return parseOther('fluid', text)
  return BH('unknown:'+text)
}