import { setField } from '../additionalsStore'

/**
 * Write viewboxes into additionals from spritesheet.json
 * @param spritesheetRaw Parsed JSON obj
 */
export function parseSpritesheet(spritesheetRaw: { [itemID: string]: string[][] }) {
  Object.entries(spritesheetRaw).forEach(([def, list]) => {
    list.forEach(([viewBox, sNbt]) => {
      setField(def, 'viewBox', viewBox)
      if (sNbt) setField(def + sNbt, 'viewBox', viewBox)
    })
  })
}
