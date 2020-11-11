import { Constituent } from "./Constituent"
import { NumLimits } from "./utils"

function sort_n(o: Constituent) {
  let diff = 0
  for (const v of Object.values(o)) if (v) diff ++
  return diff - (o.isNoIcon ? 100 : 0)
}

export class GraphPile {
  list = [] as Constituent[]
  info = {
    cLimits: new NumLimits(),
    uLimits: new NumLimits()
  }
  
  merge(c: Constituent) {
    this.info.cLimits.update(c.complexity)
    this.info.uLimits.update(c.usability)
    this.list.push(c)
  }

  sort() {
    this.list.sort((a, b) => sort_n(b) - sort_n(a))
    return this
  }
}

export class GlobalPile extends GraphPile {
  info = {
    cLimits: new NumLimits(),
    uLimits: new NumLimits(),
    listLoops: new Set<Constituent>(),
    noIcon: [] as Constituent[]
  }

  merge(c: Constituent) {
    super.merge(c)
    
    if (c.recipes.isLooped) this.info.listLoops.add(c)
    if (c.isNoIcon) this.info.noIcon.push(c)
  }
}