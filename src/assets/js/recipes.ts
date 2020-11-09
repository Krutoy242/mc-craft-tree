import { Constituent, ConstituentStack } from "./Constituent"
import { CuentArgs, RawAdditionalsStore, RawCollection } from "./ConstituentBase"
import { JEC_RootObject, JEC_Ingredient, JEC_Recipe } from "./JEC_Types"
import { RecipeLink } from './RecipeLink'
import { pushConstituent } from './constituents'
import { cleanupNbt, NumLimits, objToString } from './utils'


function amount_jec(raw: JEC_Ingredient) {
  return (raw.content.amount ?? 1.0) * (raw.content.percent ?? 100.0) / 100.0
}

class RecipesStore {
  map = new Map<string, Recipe>()
  count = 0
  info = {
    outputsAmount: new NumLimits(),
    inputsAmount: new NumLimits(),
    catalystsAmount: new NumLimits(),
  }
}

export const recipesStore = new RecipesStore()

function appendRecipe(recipe: Recipe) {
  recipesStore.map.set(recipe.id, recipe)
  recipesStore.count++
  recipesStore.info.outputsAmount.update(recipe.outputs.length)
  recipesStore.info.inputsAmount.update(recipe.inputs.length)
  recipesStore.info.catalystsAmount.update(recipe.catalysts.length)
}

function fromJEC(raw: JEC_Ingredient): Constituent {
  type Triple = [string, string, number?]
  const [source, entry, meta] = {
    'itemStack':  ():Triple=>[...raw.content?.item?.split(':') as [string, string], raw.content.meta??0],
    'fluidStack': ():Triple=>['fluid',       raw.content.fluid as string],
    'oreDict':    ():Triple=>['ore',         raw.content.name as string],
    'placeholder':():Triple=>['placeholder', raw.content.name as string],
  }[raw.type]()


  return new Constituent({
    source,
    entry,
    meta: raw.content.fMeta ? undefined : meta,
    nbt:  raw.content.fNbt  ? undefined : objToString(cleanupNbt(raw.content.nbt)),
    type: raw.type,
  })
}


function fromId(id: string): Constituent {
  let groups = id.match(
    /^(?<source>[^:{]+)(?::(?<entry>[^:{]+))?(?::(?<meta>[^:{]+))?(?<tag>\{.*\})?$/
  )?.groups ?? {};

  let args: CuentArgs

  if(groups.entry) {
    const switchers: {[key: string]:Function} = {
      'placeholder':()=>'placeholder',
      'fluid'      :()=>'fluidStack',
      'default'    :()=>'itemStack',
    }
    args = {
      source: groups.source,
      entry : groups.entry,
      meta  : +groups.meta ?? 0,
      type  : (switchers[groups.source] ?? switchers['default'])()
    }
  } else {
    // Oredicts
    const oreAlias = Constituent.additionals[groups.source]
    if (!oreAlias?.item) {
      args = {
        type: 'oreDict',
        source: 'ore',
        entry: groups.source,
      }
    } else {
      let [source, entry] = oreAlias.item.split(':')
      args = {
        source,
        entry,
        meta: oreAlias.meta??0,
        type: 'itemStack',
      }
    }
  }

  if(groups.tag) {
    try { args.nbt = objToString(eval(`(${groups.tag})`)) }
    catch (error) { console.error('nbtEvaluationError :>> ', groups.tag, 'Error: ', error.message) }
  }

  return new Constituent(args)
}

export function mergeJECGroups(jec_groups: JEC_RootObject) {
  jec_groups.Default.forEach(jec_recipe => {
    let recipeArrs = ['output', 'input', 'catalyst'] as Array<keyof JEC_Recipe>
    const recipe = new Recipe(
      ...(recipeArrs.map(arrName =>
        jec_recipe[arrName].map(raw => {
          let cuent = pushConstituent(fromJEC(raw))
          return new ConstituentStack(cuent, amount_jec(raw) * cuent.volume)
        })
      ) as ConstructorParameters<typeof Recipe>)
    )
    appendRecipe(recipe)
  })
}

export function mergeDefaultAdditionals(additionals: RawAdditionalsStore) {

  const ids_arr = Object.keys(additionals)
  function keysToArr(collection: RawCollection) {
    return Object.entries(collection).map(([k,v]) => {
      let cuent = pushConstituent(fromId(ids_arr[parseInt(k)]))
      return new ConstituentStack(cuent, v * cuent.volume)
    })
  }
  for (let i = 0; i < ids_arr.length; i++) {
    const keyOut = ids_arr[i]
    const ads = additionals[keyOut]
    
    if(ads.recipes) {
      const mainCuent = pushConstituent(fromId(keyOut))

      for (let j = 0; j < ads.recipes.length; j++) {
        const adsRecipe = ads.recipes[j]

        let outputStacks = (typeof adsRecipe.out === 'object') 
          ? keysToArr(adsRecipe.out)
          : [new ConstituentStack(mainCuent, adsRecipe.out || 1)]

        const inputStacks = keysToArr(adsRecipe.ins)
        const catalStacks = adsRecipe.ctl ? keysToArr(adsRecipe.ctl) : []

        const recipe = new Recipe(outputStacks, inputStacks, catalStacks)
        appendRecipe(recipe)
      }
    }
  }
}


let recipesCount = 0

function nextId(): string {
  recipesCount++
  return String(recipesCount)
}

export interface RecipeHolder {
  outputs: any[]
  inputs: any[]
  catalysts: any[]
}

interface StacksHolder extends RecipeHolder {
  outputs: ConstituentStack[]
  inputs: ConstituentStack[]
  catalysts: ConstituentStack[]
}

export class LinksHolder implements RecipeHolder  {
  outputs: RecipeLink[]
  inputs: RecipeLink[]
  catalysts: RecipeLink[]
  private cost = 0.0
  private processing = 0.0

  constructor(a: RecipeHolder) {
    this.outputs   = a.outputs
    this.inputs    = a.inputs
    this.catalysts = a.catalysts
  }

  public get complexity() : number {
    return this.cost + this.processing
  }

  addCost(n:number) { this.cost += n }
  addProcessing(n:number) { this.processing += n }
  
}

export class Recipe implements StacksHolder {
  requirments: ConstituentStack[]
  id: string
  links = new Map<ConstituentStack,LinksHolder>()

  constructor(
    public outputs: ConstituentStack[], 
    public inputs: ConstituentStack[], 
    public catalysts: ConstituentStack[]
  ) {
    this.requirments = [...inputs, ...catalysts]

    this.id = nextId()

    outputs.forEach(outputStack => {
      const inputLinks = inputs.map(inputStack =>
        new RecipeLink(
          inputStack.cuent, 
          outputStack.cuent, 
          inputStack.amount / outputStack.amount, 
          this.id
        )
      )

      const catalLinks = catalysts.map(catalStack =>
        new RecipeLink(
          catalStack.cuent, 
          outputStack.cuent, 
          catalStack.amount, 
          this.id
        )
      )

      const linksHolder = new LinksHolder({
        outputs  : inputLinks.map(inp => inp.flip()),
        inputs   : inputLinks,
        catalysts: catalLinks
      })

      this.links.set(outputStack, linksHolder)
    })

    outputs.forEach(outputStack => {
      outputStack.cuent.recipes.pushIfUnique(this, this.links.get(outputStack) as LinksHolder)
    })

      
  }

  match(recipe: Recipe) {
    if(this === recipe) return true

    for (const name of (['outputs', 'inputs', 'catalysts'] as Array<keyof StacksHolder>)) {
      const arr1 = this[name]
      const arr2 = recipe[name]
      if(arr1.length != arr2.length) return false
      
      const arr1_s = arr1.slice().sort(ConstituentStack.sort)
      const arr2_s = arr2.slice().sort(ConstituentStack.sort)

      if(!arr1_s.every((a,i) => a.match(arr2_s[i]))) {
        return false
      }
    }
    return true
  }

  hasRequirment(cuent: Constituent) {
    return this.inputs.some(cs=>cs.cuent === cuent) || this.catalysts.some(cs=>cs.cuent === cuent)
  }

  hasOutput(cuent: Constituent) {
    return this.outputs.some(cs=>cs.cuent === cuent)
  }

  haveAlternatives() {
    return this.outputs.every(o=>!o.cuent.noAlternatives)
  }

  display() {
    return `[${this.inputs[0].cuent.display}]` 
    + (this.catalysts[0] && `->[${this.catalysts[0].cuent.display}]`)
    + `->[${this.outputs[0].cuent.display}]`
  }
}