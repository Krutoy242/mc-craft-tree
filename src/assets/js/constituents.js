
const fs = require('fs')
import { Constituent } from './constituent.js'


const constituents = {}
exports.constituents = constituents

const pile = {}

const options = {
  additionals: {}
}
exports.options = options

export function setAdditionals(new_additionals) { 
  options.additionals = new_additionals
  Constituent.additionals = new_additionals
}


export function setField(id, field, value) { 
  // Create object if empty
  constituents[id] = constituents[id] ?? {}

  // Add value
  constituents[id][field] = constituents[id][field] ?? value
}

export function mergeWith(filePath) {
  const loadedCuons = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  for (const [key, value] of Object.entries(loadedCuons)) {
    constituents[key] = value
  }
}


// Add cuent that represents item
// Return new cuent or old one if item already present
export function pushJECRaw(raw, isForced) {
  const cuent = new Constituent(raw)
  const found = Object.values(constituents).find(n =>
    isForced ? cuent.match(n) : n.match(cuent)
  )

  if (found) {
    return found
  } else {
    constituents.push(cuent)
    return cuent
  }
}

class NumLimits {
  constructor() {
    this.min = 999999999999
    this.max = 0
  }

  update(num) {
    this.min = Math.min(this.min, num)
    this.max = Math.max(this.max, num)
  }
}


export function calculate(topCuentID) {

  // ----------------------------
  // Convert Map into Array
  // ----------------------------
  // const graph = {
  //   nodes: []
  // }

  // ----------------------------
  // calculate complexity and usability
  // ----------------------------
  const info = {
    listLoops: [],
    cLimits: new NumLimits(),
    uLimits: new NumLimits(),
    noIcon: []
  }

  function computeSingle(cuent) {
    cuent.calculate({
      onLoop: loopNode => {
        if (info.listLoops.indexOf(loopNode) === -1)
          info.listLoops.push(loopNode)
      },
      onCalculated: function() {
        info.cLimits.update(this.complexity)
        info.uLimits.update(this.usability)
        // List of items without icons
        if (this.isNoIcon) info.noIcon.push(this)
      }
    })
  }

  if(topCuentID) computeSingle(constituents[topCuentID])

  pile.list = []
  pile.info = info
  for (const cuent of Object.values(constituents)) {
    // computeSingle(cuent)
    pile.list.push(cuent)
  }

  // ----------------------------
  // Sort to most unique items on top
  // Also keep it pretty
  // ----------------------------
  // const importancyOfKeys = {}
  // function sort_n(o) {
  //   var diff = 0
  //   for (const [key, value] of Object.entries(o))
  //     if (value !== (Constituent[key] || 0)) diff += importancyOfKeys[key] || 1
  //   return diff - (o.isNoIcon ? 100 : 0)
  // }
  // graph.nodes.sort(function(a, b) {
  //   return sort_n(b) - sort_n(a)
  // })

  // ----------------------------
  // return
  // ----------------------------
  // return graph
  return pile
}