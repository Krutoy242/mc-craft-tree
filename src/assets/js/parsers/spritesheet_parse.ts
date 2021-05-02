import _ from 'lodash'
import { SetFieldFn } from './main_parser'

export function parseSpritesheet(spritesheetRaw:{[itemID:string]: string[][]}, setField:SetFieldFn) {

  _(spritesheetRaw).entries().forEach(([def, list])=>{
    list.forEach(([viewBox, sNbt])=>{
      setField(def, 'viewBox', viewBox)
      if(sNbt) setField(def + sNbt, 'viewBox', viewBox)
    })
  })
}