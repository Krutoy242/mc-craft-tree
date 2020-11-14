import { Constituent } from './Constituent'
import { NumLimits } from './utils'
import * as _ from 'lodash'
import { CuentBase } from './ConstituentBase'
import { GlobalPile, GraphPile } from './Types'

let constituentsCount = 0

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
    if(!this._wholePile) {
      const pile = new GraphPile()

      this.forEach(c=>{
        c.calculate()
        pile.merge(c)
      })
      
      this._wholePile = pile
    }
    return this._wholePile
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

      // c.calculate()
      c.calc()
      c.safeDive(toOutputs ? ['outputs'] : ['catalysts', 'inputs'], {
        once(c){
          pile.merge(c)
        }
      })

    }

    console.log(`tree ${toOutputs?'from':'to'} ${c?.id}:>> `, this.tree)
    return pile.sort()
  }

  makeFilteredPile(filter: (c:Constituent)=>boolean): GraphPile {
    const pile = new GraphPile()

    this.forEach(c=>{
      if(filter(c)) {
        c.calculate()
        pile.merge(c)
      }
    })

    return pile
  }
}

export const globalTree = new ConstituentTree()