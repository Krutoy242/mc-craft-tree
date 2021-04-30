// let sortobject = require('deep-sort-object')
const { objToString } = require('../utils')
const _ = require('lodash')
/*=====  OreDict first items  ======*/
const {sqrt, max, ceil, floor} = Math


function serializeNameMeta(ctName) {
  const match = ctName.split(':')
  const haveMeta = match.length > 2
  if (!haveMeta) 
    if(match[0] === 'ore') return match[1]
    else return ctName + ':0'
  else
  if(ctName.slice(-1) === '*') return ctName.slice(0, -1) + '0'

  return ctName
}

function serializeNbt(nbt) {
  if(!nbt) return ''
  if(typeof nbt === 'object') return objToString(nbt)
  return nbt
    .replace(/ as \w+/g, '')
    .replace(/, /g, ',')
    .replace(/: */g, ':')
}


function applyOreDictionary(crLog, setField) {
  const oreEntriesRgx = /^Ore entries for <ore:([\w]+)> :[\n\r]+-<([^:>]+:[^:>]+):?([^:>]+)?/gm
  for (const match of crLog.matchAll(oreEntriesRgx)) {
    const oreDictName = match[1]
    const definition = match[2]
    const meta = parseInt(match[3] === '*' ? undefined : match[3])

    // Add alias (first item of OreDict)
    const adds = setField(oreDictName, 'item', definition)
    if(meta) adds.meta = meta
  }
}

function applyDisplayNames(crLog, setField) {

  /*=====  Item names  ======*/
  const ctLogNames = crLog.match(/"REGISTRY_NAME","DISPLAY_NAME"[\n\r]*([\r\s\S]*?)\nA total of/gm)[0]
  const nameAliasRgx = /^"<(?<name>[^>]*?)>(?:.withTag\((?<tag>.*)\))?","(?<display>[^"]*)"/gm
  for (const match of ctLogNames.matchAll(nameAliasRgx)) {
    // Item Display blacklist
    if(/^conarm:(helmet|chestplate|leggins|boots)$/.test(match.groups.name)) continue

    const itemName = serializeNameMeta(match.groups.name)
    let nbt=null
    if(match.groups.tag!=null) {
      nbt = match.groups.tag
        .replace(/""/g, '"') // Remove double quotes
        .replace(/ as (bool|short|lond|float|double|byte)(\[\])?/g, '') // remove types
        .replace(/, \w+: \{\}|\w+: \{\}, |(, )?"[^"]+": \{\}|"[^"]+": \{\}, /g, '') // remove empty tags mekData: {}
        .replace(/, \w+: \{\}|\w+: \{\}, |(, )?"[^"]+": \{\}|"[^"]+": \{\}, /g, '')
        .replace(/, \w+: \{\}|\w+: \{\}, |(, )?"[^"]+": \{\}|"[^"]+": \{\}, /g, '')
      if(nbt.match(/^ *\{ *\} */)) nbt = null
      if(nbt?.match(/^.*\{ *\}.*$/)) console.log('nbt :>> ', nbt)
    }
    const display = match.groups.display
    let fullName = itemName + serializeNbt(nbt)

    setField(itemName, 'display', display)
    setField(fullName, 'display', display)

    // If its openblocks:tank, we can also get fluid name
    // Just lazy to deal with fluid logs
    if (match.groups.name === 'openblocks:tank' && nbt!=null) {
      const fluidName = nbt.match(/FluidName: "(.+)"/)[1]
      const fluidDisplay = display.match(/(.+) Tank/)[1]
      // setField('fluid__' + fluidName, 'display', fluidDisplay)
      setField('fluid:' + fluidName, 'display', fluidDisplay)
    }
  }
}

class IIngredient {
  static setField

  constructor(str) {
    this.name = str
    this.count = 1
    this._weight = 1.0
    this.update()
  }

  withTag(tag) {
    if(!tag || Object.keys(tag).length === 0) return this

    let n = new IIngredient(this.name)
    n.count = this.count
    n.tag = tag
    n.update()
    return n
  }

  quantity() {
    return this.count * this._weight
  }

  weight(n) {
    if(isNaN(n)) return this
    this._weight = n || 1
    return this
  }

  amount(n) {
    if(isNaN(n)) return this
    this.count = n
    return this
  }

  asString() {return serializeNameMeta(this.name) + serializeNbt(this.tag)}
  update() {
    // Blacklist recipes that content this items
    // as inputs or outputs
    if(
      (this.tag && this.tag.ncRadiationResistance)/*  ||
      /^conarm:(helmet|chestplate|leggins|boots)$/.test(this.name) */
    ) {
      this.futile = true
      return
    }

    this.strId = this.asString()
    this.additionals = IIngredient.setField(this.strId)
  }

  or() {return this}
}

class IngredientList {
  main//:   IIngredient;
  list//:   Array<IIngredient>;
  keys//:   Object;
  futile//: Boolean;
  count//:  Number;

  constructor(arg) {   
    this.list = _.flattenDeep([arg])
      .map(g=> _.isString(g) ? ߛ(g) : g)
      .filter(i=>i!=null && !i.futile)

    this.futile = !this.list.length

    this.keys = this.list.reduce((acc, i) => {
      const index = i.additionals.index
      acc[index] = (acc[index] || 0) + i.quantity()
      if(!acc[index]) throw new Error()
      return acc
    }, {})

    this.main = this.list[0]
    this.count = Object.keys(this.keys).length
  }

  toObj() {
    return this.count>0 ? this.keys : undefined
  }
}

// eslint-disable-next-line no-unused-vars
function BH(str) { return new IIngredient(str) }
let ߛ = BH

function ⵢ(n) { if(n) return BH('placeholder:RF').amount(n) }
function t(n) { if(n) return BH('placeholder:Time').amount(n) }


function addRecipe(recipName, outputs, inputs, catalysts) {
  [outputs, inputs, catalysts] = [outputs, inputs, catalysts].map(o=> new IngredientList(o))
  
  if([outputs, inputs].some(il=>il.futile)) return

  const ads = outputs.main.additionals
  ads.recipes = ads.recipes || []
  ads.recipes.push({
    out: outputs.count>1
      ? outputs.keys
      : outputs.main.quantity()!==1 
        ? outputs.main.quantity() 
        : undefined,
    ins: inputs.toObj(),
    ctl: catalysts.toObj()
  })
}
let $ = (outputs, inputs, catalysts) => addRecipe(null, outputs, inputs, catalysts)


exports.parseCrafttweakerLog = function(crLog, zs_parseFnc, setField) {

  IIngredient.setField = setField
  
  applyOreDictionary(crLog, setField)

  applyDisplayNames(crLog, setField)

  /*=====  EVAL functions ======*/
  // eslint-disable-next-line no-unused-vars
  const recipes = {
    addShaped:    (recipName, output, input2d) => addRecipe(recipName, output, input2d, max(input2d.length, input2d.reduce((x,y)=>max(x, y.length), 0)) > 2 ? [BH('minecraft:crafting_table')] : null),
    addShapeless: (recipName, output, input1d) => addRecipe(recipName, output, [input1d], input1d.length>4 ? [BH('minecraft:crafting_table')] : null)
  }
  // eslint-disable-next-line no-unused-vars
  const furnace = {
    addRecipe: (output, input, _experience) => addRecipe(null, output, [input], [BH('minecraft:furnace')])
  }
  const catalysts = {
    ElvenTrade:               [BH('botania:livingwood:5').amount(8), BH('botania:livingwood').amount(8), BH('botania:pylon:1').amount(2), BH('botania:pool')],
    Apothecary:               [BH('botania:altar')],
    Brew:                     [BH('botania:brewery')],
    PureDaisy:                [BH('botania:specialflower').withTag({type: 'puredaisy'})],
    RuneAltar:                [BH('botania:runealtar')],
    ManaInfusion_Alchemy:     [BH('botania:pool'), BH('botania:alchemycatalyst')],
    ManaInfusion_Conjuration: [BH('botania:pool'), BH('botania:conjurationcatalyst')],
    ManaInfusion_Infusion:    [BH('botania:pool')],
  }

  function EC_TierCalc(level, inputs) {
    let t = ['basic','advanced','elite','ultimate'].map(s=>BH('extendedcrafting:table_'+s))
    
    if(level>0) return t[level - 1]

    if(Array.isArray(inputs[0])) 
      return t[floor(max(inputs.length/2, inputs.reduce((x,y)=>max(x, y.length/2), 0))) - 1]
    
    return t[floor(max(0, ceil(sqrt(inputs.length))/2 - 1))]
  }

  const functionList = {
    'botania.Apothecary.addRecipe'                     : (output, input1d)                      => addRecipe(null, output, [input1d, BH('minecraft:wheat_seeds')], catalysts.Apothecary),
    'botania.Brew.addRecipe'                           : (input1d, brewName)                    => {[[BH('botania:vial:1'), BH('botania:brewflask')],[BH('botania:bloodpendant'), BH('botania:bloodpendant')],[BH('botania:vial'), BH('botania:brewvial')],[BH('botania:incensestick'), BH('botania:incensestick')]].forEach(pair=> {if(!(['botania:bloodpendant','botania:incensestick'].find(s=>s===pair[1].name)&& ['healing','absorption','overload','clear','warpWard'].find(s=>s===brewName))); addRecipe(null, pair[1].withTag({brewKey: brewName}), [pair[0], input1d], catalysts.Brew)})},
    'botania.ElvenTrade.addRecipe'                     : (output1d, input1d)                    => output1d.forEach(output=> addRecipe(null, output, [input1d], catalysts.ElvenTrade)),
    'botania.PureDaisy.addRecipe'                      : (blockInput,blockOutput, _time)        => $(blockOutput, blockInput, BH('botania:specialflower').withTag({type: 'puredaisy'})),
    'botania.RuneAltar.addRecipe'                      : (output, input1d, mana)                => {const [runes, ingrs] = _.partition(input1d, ii=>ii.name.split(':')[1]==='rune'); addRecipe(null, output, [[BH('placeholder:Mana').amount(mana)], BH('botania:livingrock'), ...ingrs], [...catalysts.RuneAltar, ...runes])},
    'botania.ManaInfusion.addAlchemy'                  : (output, input, mana)                  => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts.ManaInfusion_Alchemy),
    'botania.ManaInfusion.addConjuration'              : (output, input, mana)                  => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts.ManaInfusion_Conjuration),
    'botania.ManaInfusion.addInfusion'                 : (output, input, mana)                  => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts.ManaInfusion_Infusion),
    'extendedcrafting.CombinationCrafting.addRecipe'   : (output, rf, rf_t, central, ingrs)     => addRecipe(null, output, [[central, BH('placeholder:RF').amount(rf)], ingrs], [BH('extendedcrafting:crafting_core'), BH('extendedcrafting:pedestal').amount(ingrs.length)]),
    'extendedcrafting.CompressionCrafting.addRecipe'   : (out, inp, count, catalyst, rf, _rf_t) => addRecipe(null, out, [[inp?.amount(count), BH('placeholder:RF').amount(rf)]], [BH('extendedcrafting:compressor'), catalyst]),
    'extendedcrafting.EnderCrafting.addShaped'         : (out, input2d)                         => addRecipe(null, out, input2d, [BH('extendedcrafting:ender_crafter'), BH('extendedcrafting:ender_alternator').amount(input2d.flat().length)]) ,
    'extendedcrafting.TableCrafting.addShaped'         : (...args)                   => addRecipe(null, args[args.length-2], args[args.length-1],   EC_TierCalc(args[args.length-3], args[args.length-1])),
    'extendedcrafting.TableCrafting.addShapeless'      : (...args)                   => addRecipe(null, args[args.length-2], [args[args.length-1]], EC_TierCalc(args[args.length-3], args[args.length-1])),
    'astralsorcery.Altar.addDiscoveryAltarRecipe'      : (name, out, n1, n2, ingr1d)            => addRecipe(name, out, [ingr1d], [BH('astralsorcery:blockaltar'), BH('placeholder:Starlight').amount(n1)]),
    'astralsorcery.Altar.addAttunementAltarRecipe'     : (name, out, n1, n2, ingr1d)            => addRecipe(name, out, [ingr1d], [BH('astralsorcery:blockaltar:1'), BH('placeholder:Starlight').amount(n1)]),
    'astralsorcery.Altar.addConstellationAltarRecipe'  : (name, out, n1, n2, ingr1d)            => addRecipe(name, out, [ingr1d], [BH('astralsorcery:blockaltar:2'), BH('placeholder:Starlight').amount(n1)]),
    'astralsorcery.Altar.addTraitAltarRecipe'          : (name, out, n1, n2, ingr1d, _name2)    => addRecipe(name, out, [ingr1d], [BH('astralsorcery:blockaltar:3'), BH('placeholder:Starlight').amount(n1)]),
    'astralsorcery.Grindstone.addRecipe'               : (input, out, _f1)                      => addRecipe(null, out, [[input]], [BH('astralsorcery:blockmachine:1')]) ,
    'astralsorcery.LightTransmutation.addTransmutation': (inp, out, cost)                       => addRecipe(null, out, [[inp]], [BH('placeholder:Starlight').amount(cost)]) ,
    'astralsorcery.StarlightInfusion.addInfusion'      : (input, out, mult, chance, _time)      => addRecipe(null, out, [[input, BH('fluid:astralsorcery.liquidstarlight').amount(chance*1000)]], [BH('astralsorcery:blockstarlightinfuser')]) ,
    'actuallyadditions.AtomicReconstructor.addRecipe'    : (output, input, energyUsed) => $(output, [input, ⵢ(energyUsed)], 'actuallyadditions:block_atomic_reconstructor'),
    'actuallyadditions.Crusher.addRecipe'                : (output, input, outputSecondary, outputSecondaryChance) => $([output, outputSecondary?.weight(outputSecondaryChance/100)], input, 'actuallyadditions:block_grinder'),
    'actuallyadditions.Empowerer.addRecipe'              : (output, input, modifier1, modifier2, modifier3, modifier4, energyPerStand, time) => $(output, [input, modifier1, modifier2, modifier3, modifier4, ⵢ(energyPerStand*4), t(time)], ['actuallyadditions:block_empowerer', BH('actuallyadditions:block_display_stand').amount(4)]),
    'appliedenergistics2.Grinder.addRecipe'              : (output,input,turns, secondary1Output, secondary1Chance, secondary2Output, secondary2Chance) => $([output, secondary1Output?.weight(secondary1Chance), secondary2Output?.weight(secondary2Chance)], [input, t(turns)], 'appliedenergistics2:grindstone'),
    'bloodmagic.AlchemyArray.addRecipe'                  : (output,input,catalyst, _textureLocation)                 => $(output,input,catalyst),
    'bloodmagic.AlchemyTable.addRecipe'                  : (output,inputs,syphon,ticks,minTier)                      => $(output, [inputs, BH('placeholder:Life Essence').amount(syphon * ticks)], [BH('bloodmagic:alchemy_table'), BH('bloodmagic:blood_orb').withTag({orb: 'bloodmagic:' + ['weak', 'apprentice', 'magician', 'master', 'archmage'][(minTier||0)]})]),
    'bloodmagic.BloodAltar.addRecipe'                    : (output,input,minimumTier,syphon,_consumeRate,_drainRate) => $(output,[input, BH('placeholder:Life Essence').amount(syphon)], BH('placeholder:' + ['Blood Altar I', 'Blood Altar II', 'Blood Altar III', 'Blood Altar IV', 'Blood Altar V'][minimumTier||0])),
    'bloodmagic.TartaricForge.addRecipe'                 : (output,inputs,minSouls,soulDrain)                        => $(output, [inputs, BH('placeholder:Demonic Will').amount(soulDrain)], 'bloodmagic:soul_forge'),
    'enderio.AlloySmelter.addRecipe'                     : (output,input, energyCost, _xp)                            => $(output, [input, ⵢ(energyCost)], 'enderio:block_simple_alloy_smelter'),
    'enderio.SagMill.addRecipe'                          : (output,chances,input, bonusType, energyCost, _xp)         => $(output.map((o,i)=>o?.weight(chances[i])), [input, ⵢ(energyCost)], 'enderio:block_simple_sag_mill'),
    'extrautils2.Crusher.add'                            : (output,input, secondaryOutput, secondaryChance) => $([output, secondaryOutput?.weight(secondaryChance)], input, BH('extrautils2:machine').withTag({Type: 'extrautils2:crusher'})),
    'extrautils2.Resonator.add'                          : (output,input,energy, _addOwnerTag)               => $(output, input, ['extrautils2:resonator', BH('placeholder:Grid Power').amount(energy)]),
    'forestry.Carpenter.addRecipe'                       : (output,ingredients,packagingTime, fluidInput, box)                     => $(output, [ingredients, fluidInput, box, t(packagingTime)], 'forestry:carpenter'),
    'forestry.Centrifuge.addRecipe'                      : (output,ingredients,packagingTime)                                      => $(output, [ingredients, t(packagingTime)], 'forestry:centrifuge'),
    'forestry.Fermenter.addRecipe'                       : (fluidOutput,resource,fluidInput,fermentationValue,fluidOutputModifier) => $(fluidOutput?.weight(fluidOutputModifier), [resource, fluidInput?.amount(fermentationValue)], 'forestry:fermenter'),
    'forestry.Squeezer.addRecipe'                        : (fluidOutput,ingredients,timePerItem, itemOutput)                       => $([itemOutput, fluidOutput], ingredients, 'forestry:squeezer'),
    'forestry.ThermionicFabricator.addCast'              : (output,ingredients,liquidStack, _plan)                                  => $(output, [ingredients, liquidStack], 'forestry:fabricator'),
    'ic2.BlockCutter.addRecipe'                          : (output, input, hardness) => $(output, input, ['ic2:te:51', ['ic2:block_cutting_blade','ic2:block_cutting_blade:1','ic2:block_cutting_blade:2'][hardness||0]]),
    'ic2.Canner.addEnrichRecipe'                         : (output, input, additive) => $(output, [input, additive], 'ic2:te:42'),
    'ic2.Compressor.addRecipe'                           : (output, input)           => $(output, input, 'ic2:te:43'),
    'ic2.Extractor.addRecipe'                            : (output, input)           => $(output, input, 'ic2:te:45'),
    'ic2.Macerator.addRecipe'                            : (output, input)           => $(output, input, 'ic2:te:47'),
    'ic2.ThermalCentrifuge.addRecipe'                    : (outputs,input, _minHeat) => $(outputs,input, 'ic2:te:52'),
    'immersiveengineering.AlloySmelter.addRecipe'        : (output,first,second,time)                                           => $(output, [first, second, t(time)], BH('immersiveengineering:stone_decoration:10').amount(8)),
    'immersiveengineering.ArcFurnace.addRecipe'          : (output,input,slag,time,energyPerTick, additives, _specialRecipeType) => $([output, slag], [input, additives, ⵢ(time * energyPerTick)], 'immersiveengineering:metal_multiblock:13'),
    'immersiveengineering.Crusher.addRecipe'             : (output,input,energy, secondaryOutput, secondaryChance)              => $([output, secondaryOutput?.weight(secondaryChance)], [input, ⵢ(energy)], 'immersiveengineering:metal_multiblock:1'),
    'immersiveengineering.Fermenter.addRecipe'           : (output,fluid,input,energy)                                          => $([output, fluid], [input, ⵢ(energy)], 'immersiveengineering:metal_multiblock:8'),
    'immersiveengineering.MetalPress.addRecipe'          : (output,input,mold,energy, inputSize)                                => $(output, [input.amount(inputSize), ⵢ(energy)], ['immersiveengineering:metal_multiblock', mold]),
    'immersiveengineering.Mixer.addRecipe'               : (output,fluidInput,itemInputs,energy)                                => $(output, [fluidInput, itemInputs, ⵢ(energy)], 'immersiveengineering:metal_multiblock:15'),
    'immersiveengineering.Squeezer.addRecipe'            : (output,fluid,input,energy)                                          => $(output, [fluid, input, ⵢ(energy)], 'immersiveengineering:metal_multiblock:7'),
    'immersivepetroleum.Distillation.addRecipe'          : (fluidOutputs,itemOutputs,fluidInput,energy,time,chance)             => $([fluidOutputs, itemOutputs.map(it=>it?.weight(chance))], [fluidInput, ⵢ(energy), t(time)], 'placeholder:Distiller'),
    'industrialforegoing.Extractor.add'                  : (input,fluid) => $(fluid, input, 'industrialforegoing:tree_fluid_extractor'),
    'industrialforegoing.SludgeRefiner.add'              : (output, _ItemWeight) => $(output, 'fluid:sludge', 'industrialforegoing:sludge_refiner'),
    'integrateddynamics.DryingBasin.addRecipe'           : (inputStack, inputFluid, outputStack, outputFluid, _duration)           => $([outputStack, outputFluid], [inputStack, inputFluid], 'integrateddynamics:drying_basin'),
    'integrateddynamics.MechanicalDryingBasin.addRecipe' : (inputStack, inputFluid, outputStack, outputFluid, _duration)           => $([outputStack, outputFluid], [inputStack, inputFluid], 'integrateddynamics:mechanical_drying_basin'),
    'integrateddynamics.MechanicalSqueezer.addRecipe'    : (IItemStack1, i1,f1, i2,f2, i3,f3 , ILiquidStack1)     => $([i1?.weight(f1), i2?.weight(f2), i3?.weight(f3), ILiquidStack1], IItemStack1, 'integrateddynamics:mechanical_squeezer'),
    'integrateddynamics.Squeezer.addRecipe'              : (IItemStack1, i1,f1, i2,f2, i3,f3 , ILiquidStack1)     => $([i1?.weight(f1), i2?.weight(f2), i3?.weight(f3), ILiquidStack1], IItemStack1, 'integrateddynamics:squeezer'),
    'mekanism.chemical.dissolution.addRecipe'            : (inputStack,outputGas)                                 => $(outputGas, inputStack, BH('mekanism:machineblock2:6')),
    'mekanism.chemical.injection.addRecipe'              : (inputStack,inputGas,outputStack)                      => $(outputStack, [inputStack, inputGas], BH('mekanism:machineblock:5').withTag({recipeType: 6})),
    'mekanism.compressor.addRecipe'                      : (inputStack, /* inputGas,  */outputStack)              => $(outputStack, inputStack, BH('mekanism:machineblock:1')),
    'mekanism.crusher.addRecipe'                         : (inputStack,outputStack)                               => $(outputStack, inputStack, BH('mekanism:machineblock:3')),
    'mekanism.enrichment.addRecipe'                      : (inputStack,outputStack)                               => $(outputStack, inputStack, BH('mekanism:machineblock')),
    'mekanism.infuser.addRecipe'                         : (infusionType,infusionConsumed,inputStack,outputStack) => $(outputStack, [BH('ore:'+ infusionType[0].toUpperCase() + infusionType.slice(1).toLowerCase()).amount(infusionConsumed/100), inputStack], BH('mekanism:machineblock:5').withTag({recipeType: 7})),
    'mekanism.purification.addRecipe'                    : (itemInput, /* gasInput,  */itemOutput)                => $(itemOutput, itemInput, BH('mekanism:machineblock:5').withTag({recipeType: 5})),
    'mekanism.sawmill.addRecipe'                         : (inputStack,outputStack, bonusOutput, bonusChance)     => $([outputStack, bonusOutput?.weight(bonusChance)], inputStack, BH('mekanism:machineblock:5').withTag({recipeType: 8})),
    'mekanism.smelter.addRecipe'                         : (inputStack,outputStack)                               => $(outputStack, inputStack, BH('mekanism:machineblock:5').withTag({recipeType: 0})),
    'tconstruct.Alloy.addRecipe'                         : (output,inputs)                               => $(output, inputs, 'tconstruct:smeltery_controller'),
    'tconstruct.Casting.addBasinRecipe'                  : (output,cast,fluid,amount, consumeCast, _time) => $(output, [fluid?.amount(amount), consumeCast ? cast : null], ['tconstruct:smeltery_controller', !consumeCast ? cast : null]),
    'tconstruct.Casting.addTableRecipe'                  : (output,cast,fluid,amount, consumeCast, _time) => $(output, [fluid?.amount(amount), consumeCast ? cast : null], ['tconstruct:smeltery_controller', !consumeCast ? cast : null]),
    'tconstruct.Melting.addRecipe'                       : (output,input, temp)                          => $(output, input, ['tconstruct:smeltery_controller', BH('placeholder:Temperature').amount(temp)]),
    'thaumcraft.Crucible.registerRecipe'                 : (name,researchKey,output,input,aspects) => $(output, [input, aspects], 'thaumcraft:crucible'),
    'thaumcraft.Infusion.registerRecipe'                 : (name,research,output,instability,aspects,centralItem,recipe) => $(output, [centralItem, aspects, recipe], 'thaumcraft:infusion_matrix'),
    'thaumcraft.SmeltingBonus.addSmeltingBonus'          : (input,stack) => $(stack, input, 'thaumcraft:infernal_furnace'),
    'thermalexpansion.Centrifuge.addRecipe'              : (output,input,fluid,energy)     => $([output, fluid], [input, ⵢ(energy)], 'thermalexpansion:machine:10'),
    'thermalexpansion.Compactor.addMintRecipe'           : (output,input,energy)           => $(output, [input, ⵢ(energy)], 'thermalexpansion:machine:5'),
    'thermalexpansion.Compactor.addGearRecipe'           : (output,input,energy)           => $(output, [input, ⵢ(energy)], ['thermalexpansion:machine:5', 'thermalexpansion:augment:337']),
    'thermalexpansion.Compactor.addPressRecipe'          : (output,input,energy)           => $(output, [input, ⵢ(energy)], ['thermalexpansion:machine:5', 'thermalexpansion:augment:336']),
    'thermalexpansion.Crucible.addRecipe'                : (output,input,energy)           => $(output, [input, ⵢ(energy)], 'thermalexpansion:machine:6'),
    'thermalexpansion.Infuser.addRecipe'                 : (output,input,energy)           => $(output, [input, ⵢ(energy)], 'thermalexpansion:machine:9'),
    'thermalexpansion.RedstoneFurnace.addPyrolysisRecipe': (output,input,energy,creosote)  => $([output, BH('fluid:creosote').amount(creosote)], [input, ⵢ(energy)], 'thermalexpansion:machine'),
    'thermalexpansion.Transposer.addFillRecipe'          : (output,input,fluid,energy)     => $(output, [input, fluid, ⵢ(energy)], 'thermalexpansion:machine:8'),
    'thermalexpansion.Pulverizer.addRecipe'              : (output,input,energy, secondaryOutput, secondaryChance) => $([output, secondaryOutput?.weight(secondaryChance)], [input, ⵢ(energy)], 'thermalexpansion:machine:1'),
    'thermalexpansion.Sawmill.addRecipe'                 : (output,input,energy, secondaryOutput, secondaryChance) => $([output, secondaryOutput?.weight(secondaryChance)], [input, ⵢ(energy)], 'thermalexpansion:machine:2'),
    'thermalexpansion.InductionSmelter.addRecipe'        : (primaryOutput,primaryInput,secondaryInput,energy, secondaryOutput, secondaryChance) => $([primaryOutput, secondaryOutput?.weight(secondaryChance)], [primaryInput, secondaryInput, ⵢ(energy)], 'thermalexpansion:machine:3'),
    'thermalexpansion.Insolator.addRecipe'               : (primaryOutput,primaryInput,secondaryInput,energy, secondaryOutput, secondaryChance) => $([primaryOutput, secondaryOutput?.weight(secondaryChance)], [primaryInput, secondaryInput, ⵢ(energy)], 'thermalexpansion:machine:4'),
  }
  
  const mods = {}
  for (const [methodPath, fnc] of Object.entries(functionList)) {
    _.set(mods, methodPath, fnc)
  }

  /*=====   ======*/
  const recipesRgx = /^(\w+\.\w+(?:.\w+)*\(.*)/gm
  let k = 0
  for (const match of crLog.matchAll(recipesRgx)) {
    // if(k >= 300) break
    const parseResult = zs_parseFnc(match[0].trim())
    try {
      eval(parseResult)
    } catch (error) {
      console.log(' Parsing Error! Source >>\n'+parseResult+'\n<<')
      throw error
    }
    
    if(++k % 100 == 0) console.log(`processed ${k} lines`)
  }
}

