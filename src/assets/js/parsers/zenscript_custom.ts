import _ from 'lodash'
import { $, BH, additionals } from './additionals'

export function initCustomRecipes() {

  // Thaumcraft Aspects
  _([
    [
      'Aer',
      'Terra',
      'Ignis',
      'Aqua',
      'Ordo',
      'Perditio',
    ],[
      'Vacuos',
      'Lux',
      'Motus',
      'Gelum',
      'Vitreus',
      'Metallum',
      'Victus',
      'Mortuus',
      'Potentia',
      'Permutatio',
    ],[
      'Bestia',
      'Exanimis',
      'Herba',
      'Instrumentum',
      'Praecantatio',
      'Spiritus',
      'Tenebrae',
      'Vinculum',
      'Volatus',
    ],
  ]).forEach((arr,i)=>arr.forEach(aspect => {
    $('aspect:'+aspect, BH('placeholder:Anything').amount(10**i), 'thaumcraft:crucible')
  }))

  for (const key in additionals) {
    const m = key.match(/mysticalagriculture:(\w+)_essence:0/)
    if(m) {
      $(`mysticalagriculture:${m[1]}_seeds`, BH('placeholder:Ticks').amount(100), `mysticalagriculture:${m[1]}_essence:0`)
    }
  }

  [
    'Aluminium',
    'Aluminum',
    'BoundMetal',
    'Bronze',
    'ChaoticMetal',
    'Constantan',
    'Copper',
    'Dark',
    'Diamond',
    'Dominos',
    'DraconicMetal',
    'Electrum',
    'ElectrumFlux',
    'Emerald',
    'Enderium',
    'Energium',
    'Energized',
    'EssenceMetal',
    'Gold',
    'Invar',
    'Iridium',
    'Iron',
    'IronInfinity',
    'Lead',
    'Lumium',
    'Mithril',
    'Nickel',
    'Platinum',
    'Primordial',
    'Redstone',
    'SentientMetal',
    'Signalum',
    'Silver',
    'Steel',
    'Stone',
    'Tin',
    'Titanium',
    'TitaniumAluminide',
    'TitaniumIridium',
    'UUMatter',
    'Vibrant',
    'Wood',
    'WyvernMetal',
  ].forEach(oreName => {
    const gear = BH('ore:gear'+oreName)
    $(gear, BH('ore:ingot'+oreName).amount(4), ['immersiveengineering:metal_multiblock:13', 'immersiveengineering:mold:1'])
  })

}