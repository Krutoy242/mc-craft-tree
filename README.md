# Craft Tree Visualizer

### Show all your Minecraft craftings in browser!

Usually, in **Expert** modpacks its hard to clearly understand how hard some items are crafted. This project would help to **actually see** how many items and processing steps you need for high-end items.

![CraftTree screenshot](https://i.imgur.com/GeczJQ3.png)

## Getting Started

This repo have predefined icons and crafting recipes for my *under development* modpack [Enigmatica2Expert-Extended](https://github.com/Krutoy242/Enigmatica2Expert-Extended)

### Preview

- Clone repository
- Start live server (i using [LiveServer for VSCode](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer))
- Open [index.html](index.html)

What you can see:
- All the items used in saved recipes
- How many of each item **used**
- How hard of each item to **craft**
- Links between items (ingredients - result)



## Installation

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

-----------

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md)

## Acknowledgments

Inspired by brilliand complicity of **Enigmatica2: Expert**.

Powered by:

* [jQuery](https://jquery.com/)
* [Data-Driven Documents](https://d3js.org/)