import type { Stack } from './Stack'
import type { BaseRecipe } from 'E:/dev/mc-gatherer/src/api'

export class Recipe {
  index: number
  source: string

  outputs: Stack[]
  inputs?: Stack[]
  catalysts?: Stack[]

  constructor(base: BaseRecipe) {
    this.index = base.index
    this.source = base.source

    this.outputs = base.outputs
    this.inputs = base.inputs
    this.catalysts = base.catalysts
  }
}
