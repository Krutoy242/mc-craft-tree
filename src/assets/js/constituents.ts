import { Constituent } from './Constituent'
import { NumLimits } from './utils'
import * as _ from 'lodash'


class ConstituentTree {
  //                       source   ->  entry   ->  name   ->  meta   ->  []
  // private tree = new Map<string, Map<string, Map<string, Map<number, Constituent[]>>>>()

  // source -> entry -> meta -> []
  private tree = {} as {
    [key: string]: {
      [key: string]: {
        [key: number]: Constituent[] 
      }
    }
  }

  get(cuent: Constituent, isForced: boolean = false): Constituent|undefined {
    return _
      .get(this.tree, cuent.name.path())
      ?.find(n => isForced ? cuent.match(n) : n.match(cuent))
  }

  add(cuent: Constituent) {
    (((this.tree
      [cuent.name.source] ??= {})
      [cuent.name.entry]  ??= {})
      [cuent.name.meta]   ??= [])
      .push(cuent)
  }

  getById(id: string): Constituent|undefined {
    let [s, e, m] = id.split(':') as [string, string, number]
    return _
      .get(this.tree, [s, e, m ?? 0])
      ?.find(n => n.id === id)
  }
}


const tree = new ConstituentTree()
let constituentsCount = 0


// Add cuent that represents item
// Return new cuent or old one if item already present
export function pushConstituent(cuent: Constituent, isForced: boolean = false): Constituent {
  // const found = Object.values(constituents).find(n =>
  //   isForced ? cuent.match(n) : n.match(cuent)
  // )
  let found = tree.get(cuent, isForced)
  if (found) return found

  tree.add(cuent)
  
  // constituents[cuent.id] = cuent
  constituentsCount++
  if(constituentsCount % 5000 === 0)
    console.log('constituentsCount=', constituentsCount)
  return cuent
}

export function calculate(topCuentID: string) {
  // ----------------------------
  // calculate complexity and usability
  // ----------------------------

  const pile = {
    list: [] as Constituent[],
    info: {
      listLoops: new Set<Constituent>(),
      cLimits: new NumLimits(),
      uLimits: new NumLimits(),
      noIcon: [] as Constituent[]
    }
  }
  const info = pile.info

  function computeSingle(cuent: Constituent) {
    cuent.calculate({
      
      onLoop: function (c) {
        info.listLoops.add(c)
      },

      onCalculated: function(c) {
        info.cLimits.update(c.complexity)
        info.uLimits.update(c.usability)
        
        if (c.isNoIcon) info.noIcon.push(c)
        pile.list.push(c)
      }
    })
  }

  if(topCuentID) computeSingle(tree.getById(topCuentID) as Constituent)

  // for (const cuent of Object.values(constituents)) {
  //   computeSingle(cuent)
  //   pile.list.push(cuent)
  // }

  console.log('tree :>> ', tree)

  // ----------------------------
  // Sort to most unique items on top
  // Also keep it pretty
  // ----------------------------
  function sort_n(o: Constituent) {
    let diff = 0
    for (const v of Object.values(o)) if (v) diff ++
    return diff - (o.isNoIcon ? 100 : 0)
  }
  pile.list.sort(function(a, b) {
    return sort_n(b) - sort_n(a)
  })

  return pile
}