var recipesCount = 0

export class Recipe {

  constructor(outputs, inputs, catalysts) {
    Object.assign(this, {outputs, inputs, catalysts})

    recipesCount++
    const id = String(recipesCount)
    this.id = id

    this.links = outputs.map(outputStack => {
      outputStack.cuent.recipes.push(this)
      
      return {
        outputStack,
        inputs: inputs.map(inputStack =>
          new RecipeLink(
            inputStack.cuent, 
            outputStack.cuent, 
            inputStack.amount / outputStack.amount, 
            id
          )
        ),
        catalysts: catalysts.map(catalStack =>
          new RecipeLink(
            catalStack.cuent, 
            outputStack.cuent, 
            catalStack.amount, 
            id
          )
        )
      }
    })
  }
}

export class RecipeLink {
  constructor(from, to, weight, id) {
    Object.assign(this, {from, to, weight, id})
  }
}