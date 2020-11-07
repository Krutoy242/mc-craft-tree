

export class RecipeLink {
  flipped!: RecipeLink

  constructor(
    public from: any, 
    public to: any, 
    public weight: number, 
    public id: string
  ) {

  }

  flip(){
    const newLink = new RecipeLink(this.to, this.from, 1/this.weight, this.id)
    newLink.flipped = this
    this.flipped = newLink
    return newLink
  }
}