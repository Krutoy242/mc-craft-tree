import { RawAdditionalsStore, ConstituentAdditionals } from './cuents/ConstituentBase'
import { JEC_RootObject } from './JEC_Types'
import { mergeDefaultAdditionals, mergeJECGroups } from './recipes/recipes'


export function gatherData() {
  const default_additionals:RawAdditionalsStore = require('../default_additionals.json')
  const jec_groups:JEC_RootObject = require('../jec_groups.json')
  ConstituentAdditionals.setAdditionals(default_additionals)
  mergeDefaultAdditionals(default_additionals)
  mergeJECGroups(jec_groups)
}