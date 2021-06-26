import _ from 'lodash'
import { addRecipe, BH, IIngredient, $} from './additionals'
const {sqrt, max, ceil, floor} = Math

function ⵢ(n: number) { if(n) return BH('placeholder:RF').amount(n) }
function t(n: any) { if(n) return BH('placeholder:Time').amount(n) }



/*=====  EVAL functions ======*/
// eslint-disable-next-line no-unused-vars
export const recipes = {
  addShaped:    (recipName: any, output: any, input2d: any[]) => addRecipe(recipName, output, input2d, max(input2d.length, input2d.reduce((x: number,y: string | any[])=>max(x, y.length), 0)) > 2 ? [BH('minecraft:crafting_table')] : undefined),
  addShapeless: (recipName: any, output: any, input1d: string | any[]) => addRecipe(recipName, output, [input1d], input1d.length>4 ? [BH('minecraft:crafting_table')] : undefined)
}
// eslint-disable-next-line no-unused-vars
export const furnace = {
  addRecipe: (output: any, input: any, _experience: any) => addRecipe(null, output, [input], [BH('minecraft:furnace')])
}

const catalysts = (name:string):IIngredient[] => (({
  ElvenTrade               () { return[BH('botania:livingwood:5').amount(8), BH('botania:livingwood').amount(8), BH('botania:pylon:1').amount(2), BH('botania:pool')]},
  Apothecary               () { return[BH('botania:altar')]},
  Brew                     () { return[BH('botania:brewery')]},
  PureDaisy                () { return[BH('botania:specialflower').withTag({type: 'puredaisy'})]},
  RuneAltar                () { return[BH('botania:runealtar')]},
  ManaInfusion_Alchemy     () { return[BH('botania:pool'), BH('botania:alchemycatalyst')]},
  ManaInfusion_Conjuration () { return[BH('botania:pool'), BH('botania:conjurationcatalyst')]},
  ManaInfusion_Infusion    () { return[BH('botania:pool')]},
} as any)[name])()

function EC_TierCalc(level: number, inputs: any[]) {
  const t = ['basic','advanced','elite','ultimate'].map(s=>BH('extendedcrafting:table_'+s))
  
  if(level>0) return t[level - 1]

  if(Array.isArray(inputs[0])) 
    return t[floor(max(inputs.length/2, inputs.reduce((x: number,y: string | any[])=>max(x, y.length/2), 0))) - 1]
  
  return t[floor(max(0, ceil(sqrt(inputs.length))/2 - 1))]
}



const functionList = {
  'botania.Apothecary.addRecipe'                     : (output: any, input1d: any)                      => addRecipe(null, output, [input1d, 'minecraft:wheat_seeds'], catalysts('Apothecary')),
  'botania.Brew.addRecipe'                           : (input1d: any, brewName: string)                    => {[['botania:vial:1', 'botania:brewflask'],['botania:bloodpendant', 'botania:bloodpendant'],['botania:vial', 'botania:brewvial'],['botania:incensestick', 'botania:incensestick']].forEach(pair=> {if(!(['botania:bloodpendant','botania:incensestick'].find(s=>s===pair[1])&& ['healing','absorption','overload','clear','warpWard'].find(s=>s===brewName))) addRecipe(null, BH(pair[1]).withTag({brewKey: brewName}), [pair[0], input1d], catalysts('Brew'))})},
  'botania.ElvenTrade.addRecipe'                     : (output1d: any[], input1d: any)                    => output1d.forEach((output: any)=> addRecipe(null, output, [input1d], catalysts('ElvenTrade'))),
  'botania.PureDaisy.addRecipe'                      : (blockInput: any,blockOutput: any, _time: any)        => $(blockOutput, blockInput, BH('botania:specialflower').withTag({type: 'puredaisy'})),
  'botania.RuneAltar.addRecipe'                      : (output: any, input1d: any, mana: any)                => {const [runes, ingrs] = _.partition(input1d, ii=>ii.name.split(':')[1]==='rune'); addRecipe(null, output, [[BH('placeholder:Mana').amount(mana)], 'botania:livingrock', ...ingrs], [...catalysts('RuneAltar'), ...runes])},
  'botania.ManaInfusion.addAlchemy'                  : (output: any, input: any, mana: any)                  => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts('ManaInfusion_Alchemy')),
  'botania.ManaInfusion.addConjuration'              : (output: any, input: any, mana: any)                  => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts('ManaInfusion_Conjuration')),
  'botania.ManaInfusion.addInfusion'                 : (output: any, input: any, mana: any)                  => addRecipe(null, output, [[input, BH('placeholder:Mana').amount(mana)]], catalysts('ManaInfusion_Infusion')),
  'extendedcrafting.CombinationCrafting.addRecipe'   : (output: any, rf: any, rf_t: any, central: any, ingrs: string | any[])     => addRecipe(null, output, [[central, BH('placeholder:RF').amount(rf)], ingrs], ['extendedcrafting:crafting_core', BH('extendedcrafting:pedestal').amount(ingrs.length)]),
  'extendedcrafting.CompressionCrafting.addRecipe'   : (out: any, inp: { amount: (arg0: any) => any }, count: any, catalyst: any, rf: any, _rf_t: any) => addRecipe(null, out, [[inp?.amount(count), BH('placeholder:RF').amount(rf)]], ['extendedcrafting:compressor', catalyst]),
  'extendedcrafting.EnderCrafting.addShaped'         : (out: any, input2d: any)                         => addRecipe(null, out, input2d, ['extendedcrafting:ender_crafter', BH('extendedcrafting:ender_alternator').amount(input2d.flat().length)]) ,
  'extendedcrafting.TableCrafting.addShaped'         : (...args: any[])                   => addRecipe(null, args[args.length-2], args[args.length-1],   EC_TierCalc(args[args.length-3], args[args.length-1])),
  'extendedcrafting.TableCrafting.addShapeless'      : (...args: any[])                   => addRecipe(null, args[args.length-2], [args[args.length-1]], EC_TierCalc(args[args.length-3], args[args.length-1])),
  'astralsorcery.Altar.addDiscoveryAltarRecipe'      : (name: any, out: any, n1: any, n2: any, ingr1d: any)            => addRecipe(name, out, [ingr1d], ['astralsorcery:blockaltar', BH('placeholder:Starlight').amount(n1)]),
  'astralsorcery.Altar.addAttunementAltarRecipe'     : (name: any, out: any, n1: any, n2: any, ingr1d: any)            => addRecipe(name, out, [ingr1d], ['astralsorcery:blockaltar:1', BH('placeholder:Starlight').amount(n1)]),
  'astralsorcery.Altar.addConstellationAltarRecipe'  : (name: any, out: any, n1: any, n2: any, ingr1d: any)            => addRecipe(name, out, [ingr1d], ['astralsorcery:blockaltar:2', BH('placeholder:Starlight').amount(n1)]),
  'astralsorcery.Altar.addTraitAltarRecipe'          : (name: any, out: any, n1: any, n2: any, ingr1d: any, _name2: any)    => addRecipe(name, out, [ingr1d], ['astralsorcery:blockaltar:3', BH('placeholder:Starlight').amount(n1)]),
  'astralsorcery.Grindstone.addRecipe'               : (input: any, out: any, _f1: any)                      => addRecipe(null, out, [[input]], ['astralsorcery:blockmachine:1']) ,
  'astralsorcery.LightTransmutation.addTransmutation': (inp: any, out: any, cost: any)                       => addRecipe(null, out, [[inp]], [BH('placeholder:Starlight').amount(cost)]) ,
  'astralsorcery.StarlightInfusion.addInfusion'      : (input: any, out: any, mult: any, chance: number, _time: any)      => addRecipe(null, out, [[input, BH('fluid:astralsorcery.liquidstarlight').amount(chance*1000)]], ['astralsorcery:blockstarlightinfuser']) ,
  'actuallyadditions.AtomicReconstructor.addRecipe'    : (output: any, input: any, energyUsed: any) => $(output, [input, ⵢ(energyUsed)], 'actuallyadditions:block_atomic_reconstructor'),
  'actuallyadditions.Crusher.addRecipe'                : (output: any, input: any, outputSecondary: { weight: (arg0: number) => any }, outputSecondaryChance: number) => $([output, outputSecondary?.weight(outputSecondaryChance/100)], input, 'actuallyadditions:block_grinder'),
  'actuallyadditions.Empowerer.addRecipe'              : (output: any, input: any, modifier1: any, modifier2: any, modifier3: any, modifier4: any, energyPerStand: number, time: any) => $(output, [input, modifier1, modifier2, modifier3, modifier4, ⵢ(energyPerStand*4), t(time)], ['actuallyadditions:block_empowerer', BH('actuallyadditions:block_display_stand').amount(4)]),
  'actuallyadditions.Compost.addRecipe'                : (output: IIngredient, _1:any, input: IIngredient, _2:any) => $(output,input,'actuallyadditions:block_compost'),
  'appliedenergistics2.Grinder.addRecipe'              : (output: any,input: any,turns: any, secondary1Output: { weight: (arg0: any) => any }, secondary1Chance: any, secondary2Output: { weight: (arg0: any) => any }, secondary2Chance: any) => $([output, secondary1Output?.weight(secondary1Chance), secondary2Output?.weight(secondary2Chance)], [input, t(turns)], 'appliedenergistics2:grindstone'),
  'bloodmagic.AlchemyArray.addRecipe'                  : (output: any,input: any,catalyst: any, _textureLocation: any)                 => $(output,input,catalyst),
  'bloodmagic.AlchemyTable.addRecipe'                  : (output: any,inputs: any,syphon: number,ticks: number,minTier: any)                      => $(output, [inputs, BH('fluid:lifeessence').amount(syphon * ticks)], ['bloodmagic:alchemy_table', BH('bloodmagic:blood_orb').withTag({orb: 'bloodmagic:' + ['weak', 'apprentice', 'magician', 'master', 'archmage'][(minTier||0)]})]),
  'bloodmagic.BloodAltar.addRecipe'                    : (output: any,input: any,minimumTier: any,syphon: any,_consumeRate: any,_drainRate: any) => $(output,[input, BH('fluid:lifeessence').amount(syphon)], BH('placeholder:' + ['Blood Altar I', 'Blood Altar II', 'Blood Altar III', 'Blood Altar IV', 'Blood Altar V'][minimumTier||0])),
  'bloodmagic.TartaricForge.addRecipe'                 : (output: any,inputs: any,minSouls: any,soulDrain: any)                        => $(output, [inputs, BH('placeholder:Demonic Will').amount(soulDrain)], 'bloodmagic:soul_forge'),
  'enderio.AlloySmelter.addRecipe'                     : (output: any,input: any, energyCost: any, _xp: any)                            => $(output, [input, ⵢ(energyCost)], 'enderio:block_simple_alloy_smelter'),
  'enderio.SagMill.addRecipe'                          : (output: any[],chances: { [x: string]: any },input: any, bonusType: any, energyCost: any, _xp: any)         => $(output.map((o: { weight: (arg0: any) => any },i: string | number)=>o?.weight(chances[i])), [input, ⵢ(energyCost)], 'enderio:block_simple_sag_mill'),
  'extrautils2.Crusher.add'                            : (output: any,input: any, secondaryOutput: { weight: (arg0: any) => any }, secondaryChance: any) => $([output, secondaryOutput?.weight(secondaryChance)], input, BH('extrautils2:machine').withTag({Type: 'extrautils2:crusher'})),
  'extrautils2.Resonator.add'                          : (output: any,input: any,energy: any, _addOwnerTag: any)               => $(output, input, ['extrautils2:resonator', BH('placeholder:Grid Power').amount(energy)]),
  'forestry.Carpenter.addRecipe'                       : (output: any,ingredients: any,packagingTime: any, fluidInput: any, box: any)                     => $(output, [ingredients, fluidInput, box, t(packagingTime)], 'forestry:carpenter'),
  'forestry.Centrifuge.addRecipe'                      : (output: any,ingredients: any,packagingTime: any)                                      => $(output, [ingredients, t(packagingTime)], 'forestry:centrifuge'),
  'forestry.Fermenter.addRecipe'                       : (fluidOutput: { weight: (arg0: any) => any },resource: any,fluidInput: { amount: (arg0: any) => any },fermentationValue: any,fluidOutputModifier: any) => $(fluidOutput?.weight(fluidOutputModifier), [resource, fluidInput?.amount(fermentationValue)], 'forestry:fermenter'),
  'forestry.Squeezer.addRecipe'                        : (fluidOutput: any,ingredients: any,timePerItem: any, itemOutput: any)                       => $([itemOutput, fluidOutput], ingredients, 'forestry:squeezer'),
  'forestry.ThermionicFabricator.addCast'              : (output: any,ingredients: any,liquidStack: any, _plan: any)                                  => $(output, [ingredients, liquidStack], 'forestry:fabricator'),
  'ic2.BlockCutter.addRecipe'                          : (output: any, input: any, hardness: any) => $(output, input, ['ic2:te:51', ['ic2:block_cutting_blade','ic2:block_cutting_blade:1','ic2:block_cutting_blade:2'][hardness||0]]),
  'ic2.Canner.addEnrichRecipe'                         : (output: any, input: any, additive: any) => $(output, [input, additive], 'ic2:te:42'),
  'ic2.Compressor.addRecipe'                           : (output: any, input: any)           => $(output, input, 'ic2:te:43'),
  'ic2.Extractor.addRecipe'                            : (output: any, input: any)           => $(output, input, 'ic2:te:45'),
  'ic2.Macerator.addRecipe'                            : (output: any, input: any)           => $(output, input, 'ic2:te:47'),
  'ic2.MetalFormer.addRollingRecipe'                   : (output: any, input: any)           => $(output, input, 'ic2:te:55'),
  'ic2.ThermalCentrifuge.addRecipe'                    : (outputs: any,input: any, _minHeat: any) => $(outputs,input, 'ic2:te:52'),
  'immersiveengineering.AlloySmelter.addRecipe'        : (output: any,first: any,second: any,time: any)                                           => $(output, [first, second, t(time)], BH('immersiveengineering:stone_decoration:10').amount(8)),
  'immersiveengineering.ArcFurnace.addRecipe'          : (output: any,input: any,slag: any,time: number,energyPerTick: number, additives: any, _specialRecipeType: any) => $([output, slag], [input, additives, ⵢ(time * energyPerTick)], 'immersiveengineering:metal_multiblock:13'),
  'immersiveengineering.Crusher.addRecipe'             : (output: any,input: any,energy: any, secondaryOutput: { weight: (arg0: any) => any }, secondaryChance: any)              => $([output, secondaryOutput?.weight(secondaryChance)], [input, ⵢ(energy)], 'immersiveengineering:metal_multiblock:1'),
  'immersiveengineering.Fermenter.addRecipe'           : (output: any,fluid: any,input: any,energy: any)                                          => $([output, fluid], [input, ⵢ(energy)], 'immersiveengineering:metal_multiblock:8'),
  'immersiveengineering.MetalPress.addRecipe'          : (output: any,input: { amount: (arg0: any) => any },mold: any,energy: any, inputSize: any)                                => $(output, [input.amount(inputSize), ⵢ(energy)], ['immersiveengineering:metal_multiblock', mold]),
  'immersiveengineering.Mixer.addRecipe'               : (output: any,fluidInput: any,itemInputs: any,energy: any)                                => $(output, [fluidInput, itemInputs, ⵢ(energy)], 'immersiveengineering:metal_multiblock:15'),
  'immersiveengineering.Squeezer.addRecipe'            : (output: any,fluid: any,input: any,energy: any)                                          => $(output, [fluid, input, ⵢ(energy)], 'immersiveengineering:metal_multiblock:7'),
  'immersivepetroleum.Distillation.addRecipe'          : (fluidOutputs: any,itemOutputs: any[],fluidInput: any,energy: any,time: any,chance: any)             => $([fluidOutputs, itemOutputs.map((it: { weight: (arg0: any) => any })=>it?.weight(chance))], [fluidInput, ⵢ(energy), t(time)], 'placeholder:Distiller'),
  'industrialforegoing.Extractor.add'                  : (input: any,fluid: any) => $(fluid, input, 'industrialforegoing:tree_fluid_extractor'),
  'industrialforegoing.SludgeRefiner.add'              : (output: any, _ItemWeight: any) => $(output, 'fluid:sludge', 'industrialforegoing:sludge_refiner'),
  'integrateddynamics.DryingBasin.addRecipe'           : (inputStack: any, inputFluid: any, outputStack: any, outputFluid: any, _duration: any)           => $([outputStack, outputFluid], [inputStack, inputFluid], 'integrateddynamics:drying_basin'),
  'integrateddynamics.MechanicalDryingBasin.addRecipe' : (inputStack: any, inputFluid: any, outputStack: any, outputFluid: any, _duration: any)           => $([outputStack, outputFluid], [inputStack, inputFluid], 'integrateddynamics:mechanical_drying_basin'),
  'integrateddynamics.MechanicalSqueezer.addRecipe'    : (IItemStack1: any, i1: { weight: (arg0: any) => any },f1: any, i2: { weight: (arg0: any) => any },f2: any, i3: { weight: (arg0: any) => any },f3: any , ILiquidStack1: any)     => $([i1?.weight(f1), i2?.weight(f2), i3?.weight(f3), ILiquidStack1], IItemStack1, 'integrateddynamics:mechanical_squeezer'),
  'integrateddynamics.Squeezer.addRecipe'              : (IItemStack1: any, i1: { weight: (arg0: any) => any },f1: any, i2: { weight: (arg0: any) => any },f2: any, i3: { weight: (arg0: any) => any },f3: any , ILiquidStack1: any)     => $([i1?.weight(f1), i2?.weight(f2), i3?.weight(f3), ILiquidStack1], IItemStack1, 'integrateddynamics:squeezer'),
  'mekanism.chemical.dissolution.addRecipe'            : (inputStack: any,outputGas: any)                                 => $(outputGas, inputStack, 'mekanism:machineblock2:6'),
  'mekanism.chemical.injection.addRecipe'              : (inputStack: any,inputGas: any,outputStack: any)                      => $(outputStack, [inputStack, inputGas], BH('mekanism:machineblock:5').withTag({recipeType: 6})),
  'mekanism.compressor.addRecipe'                      : (inputStack: any, /* inputGas,  */outputStack: any)              => $(outputStack, inputStack, 'mekanism:machineblock:1'),
  'mekanism.crusher.addRecipe'                         : (inputStack: any,outputStack: any)                               => $(outputStack, inputStack, 'mekanism:machineblock:3'),
  'mekanism.enrichment.addRecipe'                      : (inputStack: any,outputStack: any)                               => $(outputStack, inputStack, 'mekanism:machineblock'),
  'mekanism.infuser.addRecipe'                         : (infusionType: string,infusionConsumed: number,inputStack: any,outputStack: any) => $(outputStack, [BH('ore:'+ infusionType.toLocaleLowerCase()).amount(infusionConsumed/100), inputStack], BH('mekanism:machineblock:5').withTag({recipeType: 7})),
  'mekanism.purification.addRecipe'                    : (itemInput: any, /* gasInput,  */itemOutput: any)                => $(itemOutput, itemInput, BH('mekanism:machineblock:5').withTag({recipeType: 5})),
  'mekanism.sawmill.addRecipe'                         : (inputStack: any,outputStack: any, bonusOutput: { weight: (arg0: any) => any }, bonusChance: any)     => $([outputStack, bonusOutput?.weight(bonusChance)], inputStack, BH('mekanism:machineblock:5').withTag({recipeType: 8})),
  'mekanism.smelter.addRecipe'                         : (inputStack: any,outputStack: any)                               => $(outputStack, inputStack, BH('mekanism:machineblock:5').withTag({recipeType: 0})),
  'tconstruct.Alloy.addRecipe'                         : (output: any,inputs: any)                               => $(output, inputs, 'tconstruct:smeltery_controller'),
  'tconstruct.Casting.addBasinRecipe'                  : (output: any,cast: any,fluid: { amount: (arg0: any) => any },amount: any, consumeCast: any, _time: any) => $(output, [fluid?.amount(amount), consumeCast ? cast : null], ['tconstruct:smeltery_controller', !consumeCast ? cast : null]),
  'tconstruct.Casting.addTableRecipe'                  : (output: any,cast: any,fluid: { amount: (arg0: any) => any },amount: any, consumeCast: any, _time: any) => $(output, [fluid?.amount(amount), consumeCast ? cast : null], ['tconstruct:smeltery_controller', !consumeCast ? cast : null]),
  'tconstruct.Melting.addRecipe'                       : (output: any,input: any, temp: any)                          => $(output, input, ['tconstruct:smeltery_controller', BH('placeholder:Temperature').amount(temp)]),
  'thaumcraft.Crucible.registerRecipe'                 : (name: any,researchKey: any,output: any,input: any,aspects: any) => $(output, [input, aspects], 'thaumcraft:crucible'),
  'thaumcraft.Infusion.registerRecipe'                 : (name: any,research: any,output: any,instability: any,aspects: any,centralItem: any,recipe: any) => $(output, [centralItem, aspects, recipe], 'thaumcraft:infusion_matrix'),
  'thaumcraft.SmeltingBonus.addSmeltingBonus'          : (input: any,stack: any) => $(stack, input, 'thaumcraft:infernal_furnace'),
  'thermalexpansion.Centrifuge.addRecipe'              : (output: any,input: any,fluid: any,energy: any)     => $([output, fluid], [input, ⵢ(energy)], 'thermalexpansion:machine:10'),
  'thermalexpansion.Compactor.addMintRecipe'           : (output: any,input: any,energy: any)           => $(output, [input, ⵢ(energy)], 'thermalexpansion:machine:5'),
  'thermalexpansion.Compactor.addGearRecipe'           : (output: any,input: any,energy: any)           => $(output, [input, ⵢ(energy)], ['thermalexpansion:machine:5', 'thermalexpansion:augment:337']),
  'thermalexpansion.Compactor.addPressRecipe'          : (output: any,input: any,energy: any)           => $(output, [input, ⵢ(energy)], ['thermalexpansion:machine:5', 'thermalexpansion:augment:336']),
  'thermalexpansion.Crucible.addRecipe'                : (output: any,input: any,energy: any)           => $(output, [input, ⵢ(energy)], 'thermalexpansion:machine:6'),
  'thermalexpansion.Infuser.addRecipe'                 : (output: any,input: any,energy: any)           => $(output, [input, ⵢ(energy)], 'thermalexpansion:machine:9'),
  'thermalexpansion.RedstoneFurnace.addPyrolysisRecipe': (output: any,input: any,energy: any,creosote: any)  => $([output, BH('fluid:creosote').amount(creosote)], [input, ⵢ(energy)], 'thermalexpansion:machine'),
  'thermalexpansion.Transposer.addFillRecipe'          : (output: any,input: any,fluid: any,energy: any)     => $(output, [input, fluid, ⵢ(energy)], 'thermalexpansion:machine:8'),
  'thermalexpansion.Pulverizer.addRecipe'              : (output: any,input: any,energy: any, secondaryOutput: { weight: (arg0: any) => any }, secondaryChance: any) => $([output, secondaryOutput?.weight(secondaryChance)], [input, ⵢ(energy)], 'thermalexpansion:machine:1'),
  'thermalexpansion.Sawmill.addRecipe'                 : (output: any,input: any,energy: any, secondaryOutput: { weight: (arg0: any) => any }, secondaryChance: any) => $([output, secondaryOutput?.weight(secondaryChance)], [input, ⵢ(energy)], 'thermalexpansion:machine:2'),
  'thermalexpansion.InductionSmelter.addRecipe'        : (primaryOutput: any,primaryInput: any,secondaryInput: any,energy: any, secondaryOutput: { weight: (arg0: any) => any }, secondaryChance: any) => $([primaryOutput, secondaryOutput?.weight(secondaryChance)], [primaryInput, secondaryInput, ⵢ(energy)], 'thermalexpansion:machine:3'),
  'thermalexpansion.Insolator.addRecipe'               : (primaryOutput: any,primaryInput: any,secondaryInput: any,energy: any, secondaryOutput: { weight: (arg0: any) => any }, secondaryChance: any) => $([primaryOutput, secondaryOutput?.weight(secondaryChance)], [primaryInput, secondaryInput, ⵢ(energy)], 'thermalexpansion:machine:4'),
  'thermalexpansion.Enchanter.addRecipe'               : (output: IIngredient, input: IIngredient, secondInput: IIngredient, energy: number, experience: number, empowered: boolean) => $([input, secondInput], [output], 'thermalexpansion:machine:13'),
  'inworldcrafting.FluidToItem.transform'                : (output: IIngredient, inputFluid: IIngredient, inputItems: IIngredient[], consume?: boolean) => $(output, [inputItems, consume ? inputFluid : undefined], [consume ? undefined : inputFluid]),
  'inworldcrafting.FluidToFluid.transform'               : (output: IIngredient, inputFluid: IIngredient, inputItems: IIngredient[], consume?: boolean) => $(output, [inputItems, consume ? inputFluid : undefined], [consume ? undefined : inputFluid]),
  'inworldcrafting.FireCrafting.addRecipe'               : (output: IIngredient, inputItem: IIngredient,  ticks?: number) =>           $(output, inputItem),
  'inworldcrafting.ExplosionCrafting.explodeItemRecipe'  : (output: IIngredient, inputItem: IIngredient,  survicechance?: number) =>   $(output, inputItem, 'minecraft:tnt'),
  'inworldcrafting.ExplosionCrafting.explodeBlockRecipe' : (output: IIngredient, blockStack: IIngredient, itemSpawnChance?: number) => $(output, blockStack, 'minecraft:tnt'),
  'iceandfire.recipes.addFireDragonForgeRecipe'          : (input: IIngredient, bloodInput: IIngredient,  output: IIngredient) => $(output, [input, bloodInput], 'iceandfire:dragonforge_fire_core_disabled'),
  'iceandfire.recipes.addIceDragonForgeRecipe'           : (input: IIngredient, bloodInput: IIngredient,  output: IIngredient) => $(output, [input, bloodInput], 'iceandfire:dragonforge_ice_core_disabled'),
  'actuallyadditions.BallOfFur.addReturn'                : (output: IIngredient, weight:number) => $(output.amount(weight), BH('actuallyadditions:item_hairy_ball').amount(900)),
  'botaniatweaks.Agglomeration.addRecipe'                : (input: IIngredient[], output: IIngredient[], catalyst: IIngredient[]) => $(output, input, catalyst),
}

export const mods = {}
Object.entries(functionList).forEach(([methodPath, fnc])=>
  _.set(mods, methodPath, fnc)
)