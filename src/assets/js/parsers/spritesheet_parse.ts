import { SetFieldFn } from './node_parser'

export function parseSpritesheet(spritesheetRaw:Record<string,Record<string,any>>, setField:SetFieldFn) {
    
  function pushViewBox(name:string, viewBox: any) {
    setField(name, 'viewBox', viewBox)
  }

  for (const [k, part] of Object.entries(spritesheetRaw.frames)) {
    const nameNnbt = k
      .replace(/(^.*)\.png$/, '$1') // Remove file extension
      .replace(/\[\w;/g, '[') // Remove list types
      .replace(/((?:__|\[|,)-?\d+(?:\.\d+)?)[ILBbsfd](?=\W)/gi, '$1') // Remove value types
      .replace(/^fluid__(.*)$/, 'fluid:$1') // Remove fluid namespace
      .replace(/^(.+?)__(.+?)__(\d+)(?:__\{(.*)\})?$/, (__, p1, p2, p3, p4) => {
        const unserializedNbt = p4 ? `{${p4
          .replace(/__/g, ':') // Remove underscores in NBT
          .replace(/\b((\w*\.\w*)+?):/g, '"$1":') // Quote compound keys
        }}` : ''
        // if(p4) console.log('unserializedNbt :>> ', unserializedNbt, p4);
        return `${p1}:${p2}:${p3}` + unserializedNbt
      })
    const viewBox = `${part.frame.x} ${part.frame.y}`
    pushViewBox(nameNnbt, viewBox)

    // If name have NBT tags create another entry
    // without tags
    if (nameNnbt.match(/.*\{.*/)) {
      const noNbtName = nameNnbt.replace(/^(.*?)\{.*$/, '$1')
      pushViewBox(noNbtName, viewBox)
    }
  }
}