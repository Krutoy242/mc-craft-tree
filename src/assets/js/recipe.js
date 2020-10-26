var recipesCount = 0

function nextId() {
  recipesCount++
  return String(recipesCount)
}

export class Recipe {

  constructor(outputs, inputs, catalysts) {
    Object.assign(this, {outputs, inputs, catalysts})

    const id = nextId()
    this.id = id

    this.links = outputs.map(outputStack => {
      outputStack.cuent.recipes.push(this)

      const inputLinks = inputs.map(inputStack =>
        new RecipeLink(
          inputStack.cuent, 
          outputStack.cuent, 
          inputStack.amount / outputStack.amount, 
          id
        )
      )
      
      return {
        outputStack,
        outputs: inputLinks.map(inp => inp.flip()),
        inputs: inputLinks,
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

  flip(){
    const newLink = new RecipeLink(this.to,this. from, 1/this.weight, this.id)
    newLink.flipped = this
    this.flipped = newLink
    return newLink
  }
}