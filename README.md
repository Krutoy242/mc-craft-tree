# Craft Tree Visualizer

### Show all your Minecraft craftings in browser!

Usually, in **Expert** modpacks its hard to clearly understand how hard some items are crafted. This project would help to **actually see** how many items and processing steps you need for high-end items.

![CraftTree screenshot](https://i.imgur.com/pqedJiw.png)

![CraftTree screenshot](https://i.imgur.com/RHDqm0Y.png)

## Getting Started

This repo have predefined icons and crafting recipes for my *under development* modpack [Enigmatica2Expert-Extended](https://github.com/Krutoy242/Enigmatica2Expert-Extended)

## Preview

## https://krutoy242.github.io

What you can see:
- All the items used in saved recipes
- How many of each item **used**
- How hard of each item to **craft**
- Links between items (ingredients - result)



## Installation

> ❗ Since this project in actively developing process, guids could be outdated.

How to reacreate all needed files for this to work:

1. Run **Minecraft** with mods:
    * [Just Enough Calculation](https://www.curseforge.com/minecraft/mc-mods/just-enough-calculation)
    * [CraftTweaker](https://www.curseforge.com/minecraft/mc-mods/crafttweaker)
    * [Icon Exporter](https://www.curseforge.com/minecraft/mc-mods/iconexporter)
2. Create some recipes ingame with **Crafting Calculator**
    * Export recipes. They appear in MC folder `[MC_FOLDER]/config/JustEnoughCalculation/data/groups.json`
    * Open [resources/node_parser.js](resources/node_parser.js) and set path variable `GROUPS_PATH` to this file
3. Create list of **OreDictionary** entries:
    * In game run command `/ct oredict`
    * Open `[MC_FOLDER]/crafttweaker.log`
    * Scroll to end of file and save all lines starts from `Ore entries for [...]` to file [resources/rawData/crafttweaker.log](resources/rawData/crafttweaker.log)
4. Create **Spritesheet** with all icons
    * In game run command `/iconexporter export` (works only in single player)
    * Download and run [Texture Packer](https://www.codeandweb.com/texturepacker). It can be used for free.
    * Drag and drop folder `[MC_FOLDER]/icon-exports-x32` in program, adjust `Max Size` and chose `Framework` to `JSON (Array)`
    * Publish Spritesheet. Put `json` to [resources/rawData/sheet/Spritesheet.json](resources/rawData/sheet/Spritesheet.json) and `.png` to [resources/Spritesheet.png](resources/Spritesheet.png)
5. Run `node_parser.js` with **Node.js**. This would update [parsedData.json](resources/parsedData.json) and [groups.json](resources/groups.json)

**Hint:**
You dont need to do steps `3` and `4` if you play [Enigmatica 2: Expert](https://www.curseforge.com/minecraft/modpacks/enigmatica2expert), because icons and OreDict entries are basicly same as predefined in repo.

<details>
<summary>Recipe making recomendations</summary>

* Use most **common** ingredients. For example better to craft pistons from copper plates
      <img src="https://i.imgur.com/Cezj7Vo.png" width=300>
* Add second+ variand of crafting, avaliable in **progression**. For example, wood planks should be processd in simpliest x6 machine instead of x2 table, metal plates should be made from 1 ingot, not 2
  <img src="https://i.imgur.com/TAwwU24.png" width=300>
* Move press molds and other not actually comsumed items to **catalysts** section
  <img src="https://i.imgur.com/lLBtFah.png" width=300>
* It would be cool if you add additional **catalysts** that actualy used in recipe. For example pedestals or energy for charged draconium
  <img src="https://i.imgur.com/T2ykYBP.png" width=300>
* Use **Placeholders** when recipe require more slots than avaliable. TreeVisualizer will automatically replace all placeholders with its ingredients
  <img src="https://i.imgur.com/TRafahV.png" width=300>
* Some recipes have no other inputs except time. Make Placeholder for **Ticks**. Also output can be chanced
  <img src="https://i.imgur.com/dsI8jwA.png" width=300>

</details>

-----------

## Acknowledgments

Inspired by brilliant complicity of **Enigmatica2: Expert**.

Powered by:

* Vue
* [Data-Driven Documents](https://d3js.org/)
