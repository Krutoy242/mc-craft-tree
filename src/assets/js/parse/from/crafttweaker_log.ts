import { setField } from '../additionalsStore'

export function applyOreDictionary(crafttweakerLogTxt: string) {
  const oreEntriesRgx = /^Ore entries for <ore:([\w]+)> :[\n\r]+-<([^:>]+:[^:>]+):?([^:>]+)?/gm
  for (const match of crafttweakerLogTxt.matchAll(oreEntriesRgx)) {
    const [_m, oreDictName, definition, meta] = match

    // Add alias (first item of OreDict)
    const adds = setField(oreDictName, 'item', definition)
    if (meta && meta !== '*') adds.meta = parseInt(meta)
  }
}
