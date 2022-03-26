import { setField } from '../additionalsStore'

type CrlogRawType = { [mod:string]: [display:string, definition:string, snbt:string, burntime:number][] }

export function parseCrafttweakerLog_raw(crLog:string) {

  let modMap:CrlogRawType={}
  try {
    modMap = JSON.parse(crLog).all_items
  } catch (e:any) {
    console.log('something wrong with parseCrafttweakerLog_raw: ')
    console.log(e.message)
    return
  }

  Object.values(modMap).flat().forEach(([display, definition, snbt]) => {
    const [mod, id, meta] = definition.split(':')
    const fullId = `${mod}:${id}:${meta||'0'}`
    const hasNBT = snbt && snbt !== '{}'
    if(hasNBT) setField(fullId+snbt, 'display', display)
    setField(fullId, 'display', display)

    if (fullId === 'openblocks:tank:0' && hasNBT) {
      addFluid(display, snbt)
    }
  })
}

function addFluid(display:string, snbt:string) {
  // If its openblocks:tank, we can also get fluid name
  // Just lazy to deal with fluid logs
  const fluidName = snbt.match(/FluidName:"(.+)"/)?.[1]
  const fluidDisplay = display.match(/(.+) Tank/)?.[1]
  setField(`fluid:${fluidName}`, 'display', fluidDisplay)
}
