var recipesCount = 0

export class Recipe {

  constructor(outputs, inputs, catalysts) {
    Object.assign(this, {outputs, inputs, catalysts})

    recipesCount++

    this.links = outputs.map(output => {
      output.cuent.recipes.push(this)
      
      return {
        inputs: inputs.map(input =>
          new RecipeLink(
            input.cuent, 
            output.cuent, 
            input.amount / output.amount, 
            String(recipesCount)
          )
        ),
        catalysts: catalysts.map(catal =>
          new RecipeLink(
            catal.cuent, 
            output.cuent, 
            catal.amount, 
            String(recipesCount)
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