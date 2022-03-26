
import { objToString } from '../utils'

export function serializeNameMeta(ctName:string) {
  const match = ctName.split(':')
  const haveMeta = match.length > 2
  if (!haveMeta) 
    if     ([  'ore'].includes(match[0])) return match[1]
    else if(['fluid','liquid'].includes(match[0])) return ctName
    else return ctName + ':0'
  else
  if(ctName.slice(-1) === '*') return ctName.slice(0, -1) + '0'

  return ctName
}

export function serializeNbt(nbt?: string|object) {
  if(!nbt) return ''
  if(typeof nbt === 'object') return objToString(nbt)
  return nbt
    .replace(/ as \w+/g, '')
    .replace(/, /g, ',')
    .replace(/: */g, ':')
}