var recipesCount = 0

export class Recipe {

  constructor(outputs, inputs, catalysts) {
    Object.assign(this, {outputs, inputs, catalysts})

    recipesCount++
    const recipeId = String(recipesCount)
    this.recipeId = recipeId

    this.links = outputs.map(outputStack => {
      outputStack.cuent.recipes.push(this)
      
      return {
        outputStack,
        inputs: inputs.map(inputStack =>
          new RecipeLink(
            inputStack.cuent, 
            outputStack.cuent, 
            inputStack.amount / outputStack.amount, 
            recipeId
          )
        ),
        catalysts: catalysts.map(catalStack =>
          new RecipeLink(
            catalStack.cuent, 
            outputStack.cuent, 
            catalStack.amount, 
            recipeId
          )
        )
      }
    })
  }
}

export class RecipeLink {
  constructor(from, to, weight, recipeId) {
    Object.assign(this, {from, to, weight, recipeId})
  }
}