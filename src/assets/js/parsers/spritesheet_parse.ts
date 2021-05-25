import _ from 'lodash'
import { setField } from './additionals'

export function parseSpritesheet(spritesheetRaw:{[itemID:string]: string[][]}) {

  _(spritesheetRaw).entries().forEach(([def, list])=>{
    list.forEach(([viewBox, sNbt])=>{
      setField(def, 'viewBox', viewBox)
      if(sNbt) setField(def + sNbt, 'viewBox', viewBox)
    })
  })
}