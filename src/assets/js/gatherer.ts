import { RawAdditionalsStore, ConstituentAdditionals } from './cuents/ConstituentBase'
import { mergeDefaultAdditionals } from './recipes/recipes'
import default_additionals from '../default_additionals.json'

export function gatherData() {
  ConstituentAdditionals.setAdditionals(default_additionals as RawAdditionalsStore)
  mergeDefaultAdditionals(default_additionals as RawAdditionalsStore)
}
