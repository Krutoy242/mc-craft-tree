/* import { ConstituentAdditionals, RawAdditionalsStore } from './cuents/ConstituentBase'
import { globalTree } from './cuents/ConstituentTree'
import { mergeDefaultAdditionals, mergeJECGroups } from './recipes/recipes'

const ctx: Worker = self as any

// Respond to message from parent thread
ctx.addEventListener('message', (event:any) => {
  console.log(event)
  if(event.data == 'init') init()
})

function init() {
  ctx.postMessage({indeterminate:'default_additionals.json'})
  const default_additionals:RawAdditionalsStore = require('../default_additionals.json')

  ctx.postMessage({indeterminate:'setAdditionals'})
  ConstituentAdditionals.setAdditionals(default_additionals)

  ctx.postMessage({indeterminate:'mergeDefaultAdditionals'})
  mergeDefaultAdditionals(default_additionals, (curr,total)=>
    ctx.postMessage({progress: {curr,total}})
  )

  ctx.postMessage({indeterminate:'mergeJECGroups'})
  mergeJECGroups(jec_groups)

  // ctx.postMessage({finish: globalTree})
}
 */
