import { RawAdditionalsStore, ConstituentAdditionals } from './cuents/ConstituentBase'
import { JEC_RootObject } from './JEC_Types'
import { mergeDefaultAdditionals, mergeJECGroups } from './recipes/recipes'
import default_additionals from '../default_additionals.json'
import jec_groups from '../jec_groups.json'

export function gatherData() {
  ConstituentAdditionals.setAdditionals(default_additionals as RawAdditionalsStore)
  mergeDefaultAdditionals(default_additionals as RawAdditionalsStore)
  mergeJECGroups(jec_groups as JEC_RootObject)
}
