import {readFileSync} from 'fs'
import { Constituent } from './constituent.js'
import { NumLimits } from './utils.js'
const _ = require('lodash')


export const constituents = {}


export const options = {
  additionals: {}
}

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
  const loadedCuons = JSON.parse(readFileSync(filePath, 'utf8'))
  for (const [key, value] of Object.entries(loadedCuons)) {
    constituents[key] = value
  }
}

const cuentsTree = {}
var constituentsCount = 0


function pushTree(cuent) {

  var cursor = (cuentsTree[cuent.entrySource] = cuentsTree[cuent.entrySource] || {})
  if(cursor) {
    cursor = (cursor[cuent.entryName] = cursor[cuent.entryName] || {})
    if(cursor) {
      const meta = cuent.entryMeta
      cursor = (cursor[meta] = cursor[meta] || [])
      cursor.push(cuent)
    }
  }
}

// Add cuent that represents item
// Return new cuent or old one if item already present
export function pushConstituent(rawOrId, isForced) {
  const cuent = new Constituent(rawOrId)
  // const found = Object.values(constituents).find(n =>
  //   isForced ? cuent.match(n) : n.match(cuent)
  // )
  var found
  var cursor = cuentsTree[cuent.entrySource]
  if(cursor) {
    cursor = cursor[cuent.entryName]
    if(cursor) {
      cursor = cursor[cuent.entryMeta]
      if(cursor) {
        found = cursor.find(n =>
          isForced ? cuent.match(n) : n.match(cuent)
        )
      }
    }
  }

  // constituentsChecks++
  // if(constituentsChecks%1000==0) console.log('constituentsChecks=', constituentsChecks)

  if (found) {
    return found
  } else {
    pushTree(cuent)
    
    constituents[cuent.id] = cuent
    constituentsCount++
    if(constituentsCount % 5000 === 0)
      console.log('constituentsCount=', constituentsCount)
    return cuent
  }
}

export function calculate(topCuentID) {
  // ----------------------------
  // calculate complexity and usability
  // ----------------------------

  const pile = {
    list: [],
    info: {
      listLoops: [],
      cLimits: new NumLimits(),
      uLimits: new NumLimits(),
      noIcon: []
    }
  }
  const info = pile.info

  function computeSingle(cuent) {
    cuent.calculate({
      onLoop: function () {
        if (info.listLoops.indexOf(this) === -1)
          info.listLoops.push(this)
      },
      onCalculated: function() {
        info.cLimits.update(this.complexity)
        info.uLimits.update(this.usability)
        // List of items without icons
        if (this.isNoIcon) info.noIcon.push(this)
        pile.list.push(this)
      }
    })
  }

  if(topCuentID) computeSingle(constituents[topCuentID])

  // for (const cuent of Object.values(constituents)) {
  //   computeSingle(cuent)
  //   pile.list.push(cuent)
  // }

  console.log('cuentsTree :>> ', cuentsTree);

  // ----------------------------
  // Sort to most unique items on top
  // Also keep it pretty
  // ----------------------------
  const importancyOfKeys = {}
  function sort_n(o) {
    var diff = 0
    for (const [key, value] of Object.entries(o))
      if (value !== (Constituent[key] || 0)) diff += importancyOfKeys[key] || 1
    return diff - (o.isNoIcon ? 100 : 0)
  }
  pile.list.sort(function(a, b) {
    return sort_n(b) - sort_n(a)
  })

  // ----------------------------
  // return
  // ----------------------------
  // return graph
  return pile
}