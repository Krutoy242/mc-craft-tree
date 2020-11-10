import { Constituent } from './Constituent'
import { NumLimits } from './utils'
import * as _ from 'lodash'
import { CuentBase } from './ConstituentBase'


class ConstituentTree {
  // source -> entry -> meta -> []
  private tree = {} as {
    [key: string]: {
      [key: string]: {
        [key: number]: Constituent[] 
      }
    }
  }

  private get(base: CuentBase): Constituent|undefined {
    return this.tree[base.source]?.[base.entry]?.[base.meta]?.find(b=>b.nbt===base.nbt)
  }

  private add(cuent: Constituent) {
    (((this.tree
      [cuent.base.source] ??= {})
      [cuent.base.entry]  ??= {})
      [cuent.base.meta]   ??= [])
      .push(cuent)
  }

  private getById(id: string): Constituent|undefined {
    let [s, e, m] = id.split(':') as [string, string, number]
    return _
      .get(this.tree, [s, e, m ?? 0])
      ?.find(n => n.id === id)
  }

  // pushConstituent(cuent: Constituent): Constituent {
  //   return this.push(cuent.base)
  // }

  pushBase(base: CuentBase): Constituent {
    const found = this.get(base)
    if (found) return found
  
    const cuent = new Constituent(base)
    this.add(cuent)
    
    constituentsCount++
    if(constituentsCount % 5000 === 0)
      console.log('constituentsCount=', constituentsCount)
    return cuent
  }
  
  calculate(topCuentID: string) {
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
    // const tmpSet = new Set<Constituent>()
  
    if(topCuentID) {
      let top = tree.getById(topCuentID) as Constituent
      top.calculate()
      top.safeDive(['catalysts', 'inputs'], {
        once(c){
          info.cLimits.update(c.complexity)
          info.uLimits.update(c.usability)
          
          if (c.recipes.isLooped) info.listLoops.add(c)
          if (c.isNoIcon) info.noIcon.push(c)
          pile.list.push(c)
        }
      })
    }
  
    // pile.list = [...tmpSet]
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
}


export const tree = new ConstituentTree()
let constituentsCount = 0