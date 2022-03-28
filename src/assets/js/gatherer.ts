import { ConstituentAdditionals } from './cuents/ConstituentBase'
import { mergeDefaultAdditionals } from './recipes/recipes'
import { RawAdditionalsStore } from 'mc-gatherer'
import _data from '../data.json'
const data = _data as unknown as RawAdditionalsStore

export function gatherData() {
  ConstituentAdditionals.setAdditionals(data)
  mergeDefaultAdditionals(data)
}
