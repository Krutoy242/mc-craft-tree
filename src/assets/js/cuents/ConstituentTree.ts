import { Constituent } from './Constituent'
import { NumLimits } from '../utils'
import * as _ from 'lodash'
import { CuentBase } from './ConstituentBase'
import { GlobalPile, GraphPile } from './Pile'

export class ConstituentTree {
  // source -> entry -> meta -> []
  private tree = {} as {
    [key: string]: {
      [key: string]: {
        [key: number]: Constituent[] 
      }
    }
  }

  forEach(cb: (c:Constituent)=>void) {
    for (const source of Object.values(this.tree)) {
      for (const entry of Object.values(source)) {
        for (const meta of Object.values(entry)) {
          for (const c of meta) {
            cb(c)
          }
        }
      }
    }
  }

  private _wholePile?: GraphPile
  
  getWholePile(): GraphPile {
    return this._wholePile ?? (this._wholePile = this.makeFilteredPile())
  }

  makeFilteredPile(filter?: (c:Constituent)=>boolean): GraphPile {
    const pile = new GraphPile()

    this.forEach(c=>{
      if(!filter || filter(c)) {
        c.purchase()
        pile.merge(c)
      }
    })

    return pile
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
    const [s, e, m] = id.split(':') as [string, string, number]
    return _
      .get(this.tree, [s, e, m ?? 0])
      ?.find(n => n.id === id)
  }

  pushBase(base: CuentBase): Constituent {
    const found = this.get(base)
    if (found) return found
  
    const cuent = new Constituent(base)
    this.add(cuent)
    return cuent
  }
  

  public makePileFrom(id: string) { return this.makePile(id, true) }
  public makePileTo  (id: string) { return this.makePile(id, false) }
  public makePile(arg: Constituent, toOutputs: boolean): GraphPile
  public makePile(arg: string, toOutputs: boolean): GraphPile
  public makePile(arg: Constituent | string, toOutputs: boolean): GraphPile {
    let c: Constituent | undefined
    if(typeof arg === 'string') c = this.getById(arg)
    else c = arg

    let pile: GraphPile

    if(!c) {
      pile = this.getWholePile()
    } else {
      pile = new GraphPile()

      c.purchase((c)=>pile.merge(c))
      // c.dive(toOutputs ? 'outputs' : 'requirments', 
      //   (c)=>pile.merge(c)
      // )
    }

    console.log(`tree ${toOutputs?'from':'to'} ${c?.id}:>> `, this.tree)
    return pile.sort()
  }
}

export const globalTree = new ConstituentTree()