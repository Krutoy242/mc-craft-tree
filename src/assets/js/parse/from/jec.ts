import { JEC_Ingredient, JEC_Recipe, JEC_RootObject } from '../../JEC_Types'
import { cleanupNbt } from '../../utils'
import { additionals } from '../additionalsStore'

// ====================================================
// Organize raw Just Enough Calculation json input
// ====================================================

export function parseJECgroups(jecGroupsRaw_text: string) {
  /*=====  Remove type letters (like 2L or 0b)  ======*/
  const groupsJsonText = jecGroupsRaw_text
    .replace(/\[\w;/g, '[') // Remove list types
    .replace(/([[, ]-?\d+(?:\.\d+)?)[ILBbsfd](?=\W)/gi, '$1') // Remove value types
  // .replace(/("SideCache".*)\[.*\]/gi, '$1"DataRemoved"')

  // ====================================================
  // Organize raw Just Enough Calculation json input
  // ====================================================

  const jec_groups: JEC_RootObject = JSON.parse(groupsJsonText)

  // Replace oredict to itemstacks if needed
  function mutateOreToItemstack(raw: JEC_Ingredient) {
    if (raw.type === 'oreDict') {
      const oreAlias = additionals[raw.content.name as string]
      if (!oreAlias) {
        console.log('Cant find OreDict name for:', raw.content.name)
      } else {
        raw.type = 'itemStack'
        raw.content = {
          ...raw.content,
          name: undefined,
          item: oreAlias.item,
          meta: oreAlias.meta,
        }
      }
    }
  }

  function prepareEntry(raw: JEC_Ingredient, isMutate = false) {
    if (raw.type === 'empty') return false

    cleanupNbt(raw.content.nbt)

    if (isMutate) {
      const nbt = raw.content?.nbt

      // Replace bucket with liquid to actual liquid
      if (raw.content?.item === 'forge:bucketfilled') {
        raw.type = 'fluidStack'
        raw.content = {
          amount: 1000,
          fluid: nbt?.FluidName || '<<Undefined Fluid>>',
        }
      }
    }
    return true
  }

  // Try to remove placeholders that created only to extend ingredient count
  const remIndexes: Array<number> = []
  jec_groups.Default.forEach((jec_recipe, recipe_index) => {
    jec_recipe.input = jec_recipe.input.filter((raw) => prepareEntry(raw, true))

    let wasRemoved = false
    function replaceInList(craft: JEC_Recipe, listName: keyof JEC_Recipe, phRaw: JEC_Ingredient) {
      const pos = craft[listName].map((e) => e.content?.name).indexOf(phRaw.content.name)

      if (pos != -1 && craft[listName][pos].type === 'placeholder') {
        craft[listName].splice(pos, 1)
        craft[listName] = craft[listName].concat(jec_recipe.input)
        wasRemoved = true
      }
    }

    // Special case for placeholder in output:
    // Add its all inputs to recipe where it represent input
    let i = jec_recipe.output.length
    while (i--) {
      const raw = jec_recipe.output[i]
      if (!prepareEntry(raw)) {
        jec_recipe.output.splice(i, 1)
      } else {
        if (raw.type === 'placeholder') {
          jec_groups.Default.forEach((craft) => {
            replaceInList(craft, 'input', raw)
            // replaceInList(craft, 'catalyst', raw);
          })
        } else {
          // Replace oredict to itemstacks if needed
          mutateOreToItemstack(raw)
        }
      }
    }

    jec_recipe.catalyst = jec_recipe.catalyst.filter((raw) => prepareEntry(raw, true))

    if (wasRemoved) {
      remIndexes.push(recipe_index)
    } else {
      jec_recipe.input.forEach((obj_input) => {
        // Replace oredict to itemstacks if needed
        mutateOreToItemstack(obj_input)
      })
    }
  })

  // Make indexes unique and remove
  const uniqRemIndexes = [...new Set(remIndexes)]
  for (let i = uniqRemIndexes.length - 1; i >= 0; i--) jec_groups.Default.splice(uniqRemIndexes[i], 1)

  return jec_groups
}
