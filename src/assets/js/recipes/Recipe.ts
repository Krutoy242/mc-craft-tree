import Constituent from '../cuents/Constituent'
import ConstituentStack from '../cuents/ConstituentStack'

import LinksHolder from './LinksHolder'
import RecipeLink from './RecipeLink'

let recipesCount = 0
export function nextId(): string {
  recipesCount++
  return String(recipesCount)
}

export default class Recipe {
  static match(r1: Recipe, r2: Recipe) {
    if (r1 === r2) return true

    for (const name of ['outputs', 'inputs', 'catalysts'] as const) {
      const arr1 = r1[name]
      const arr2 = r2[name]
      if (arr1.length !== arr2.length) return false

      const arr1_s = arr1.slice().sort(ConstituentStack.sort)
      const arr2_s = arr2.slice().sort(ConstituentStack.sort)

      if (!arr1_s.every((a, i) => a.match(arr2_s[i]))) {
        return false
      }
    }
    return true
  }

  requirments: ConstituentStack[]
  id: string
  links = new Map<ConstituentStack, LinksHolder>()

  constructor(
    public outputs: ConstituentStack[],
    public inputs: ConstituentStack[],
    public catalysts: ConstituentStack[]
  ) {
    this.requirments = [...inputs, ...catalysts]

    this.id = nextId()

    outputs.forEach((outputStack) => {
      const inputLinks = inputs.map(
        (inputStack) =>
          new RecipeLink(
            inputStack.cuent,
            outputStack.cuent,
            inputStack.amount / outputStack.amount,
            this.id
          )
      )

      const catalLinks = catalysts.map(
        (catalStack) =>
          new RecipeLink(
            catalStack.cuent,
            outputStack.cuent,
            catalStack.amount,
            this.id
          )
      )

      const linksHolder = new LinksHolder(
        outputStack,
        inputLinks,
        catalLinks,
        this
      )

      this.links.set(outputStack, linksHolder)
      outputStack.cuent.recipes.pushIfUnique(this, linksHolder)
    })
  }

  getCuentStackCost(cs: ConstituentStack) {
    return this.links.get(cs)?.complexity // / cs.amount
  }

  getLinksHolderFor(cs: ConstituentStack) {
    return this.links.get(cs)
  }

  hasRequirment(cuent: Constituent) {
    return (
      this.inputs.some((cs) => cs.cuent === cuent) ||
      this.catalysts.some((cs) => cs.cuent === cuent)
    )
  }

  hasOutput(cuent: Constituent) {
    return this.outputs.some((cs) => cs.cuent === cuent)
  }

  display() {
    return (
      `[${this.inputs.map((cs) => cs.cuent.asString()).join(', ')}]` +
      `->[${this.catalysts.map((cs) => cs.cuent.asString()).join(', ')}]` +
      `->[${this.outputs.map((cs) => cs.cuent.asString()).join(', ')}]`
    )
  }

  console() {
    const cls = (['inputs', 'catalysts', 'outputs'] as const).map((s) =>
      this[s].map((cs) => cs.cuent.console())
    )

    const head = cls
      .map((group) => group.map((cuent) => cuent[0]).join('+'))
      .join('] %c➧%c [')
    const tail = cls
      .map((group, i) =>
        (i ? ['color: #2f1', ''] : []).concat(
          group.map((cuent) => cuent.slice(1)).flat()
        )
      )
      .flat(2)

    return ['[' + head + ']', ...tail]
  }
}
