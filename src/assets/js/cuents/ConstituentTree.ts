import Constituent from './Constituent'
import _ from 'lodash'
import { CuentBase } from './ConstituentBase'
import { GraphPile } from './Pile'

export default class ConstituentTree {
  private tree = {} as {
    [source: string]: {
      [entry: string]: {
        [meta: number]: Constituent[]
      }
    }
  }

  forEach(cb: (c: Constituent) => void) {
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

  /**
   * Calculate every cuent stored in tree
   */
  calculate() {
    this.forEach((c) => {
      this.propagate(c)
    })
  }

  propagate(c: Constituent) {
    c.recipes.getCuentsForWay('outputs')
  }

  private _wholePile?: GraphPile

  getWholePile(): GraphPile {
    return this._wholePile ?? (this._wholePile = this.makeFilteredPile())
  }

  makeFilteredPile(filter?: (c: Constituent) => boolean): GraphPile {
    const pile = new GraphPile()

    this.forEach((c) => {
      if (!filter || filter(c)) {
        c.purchase()
        pile.merge(c)
      }
    })

    return pile
  }

  private get(base: CuentBase): Constituent | undefined {
    return this.tree[base.source]?.[base.entry]?.[base.meta]?.find((b) => b.nbt === base.nbt)
  }

  private add(cuent: Constituent) {
    ;(((this.tree[cuent.base.source] ??= {})[cuent.base.entry] ??= {})[cuent.base.meta] ??= []).push(cuent)
  }

  private getById(id: string): Constituent | undefined {
    const [s, e, m] = id.split(':') as [string, string, number?]
    return _.get(this.tree, [s, e, m ?? 0])?.find((n) => n.id === id)
  }

  pushBase(base: CuentBase): Constituent {
    const found = this.get(base)
    if (found) return found

    const cuent = new Constituent(base)
    this.add(cuent)
    return cuent
  }

  public makePileFrom(id: string) {
    return this.makePile(id, true)
  }
  public makePileTo(id: string) {
    return this.makePile(id, false)
  }
  public makePile(arg: Constituent, toOutputs: boolean, filter?: (c: Constituent) => boolean): GraphPile
  public makePile(arg: string, toOutputs: boolean, filter?: (c: Constituent) => boolean): GraphPile
  public makePile(arg: Constituent | string, toOutputs: boolean, filter?: (c: Constituent) => boolean): GraphPile {
    let cuent: Constituent | undefined
    if (typeof arg === 'string') cuent = this.getById(arg)
    else cuent = arg

    let pile: GraphPile

    if (!cuent) {
      pile = this.getWholePile()
    } else {
      pile = new GraphPile()

      cuent.purchase((c) => {
        if (!filter || filter(c)) {
          pile.merge(c)
        }
      })
      // c.dive(toOutputs ? 'outputs' : 'requirments',
      //   (c)=>pile.merge(c)
      // )
    }

    console.log(`tree ${toOutputs ? 'from' : 'to'} ${cuent?.id}:>> `, this.tree)
    return pile.sort()
  }
}
