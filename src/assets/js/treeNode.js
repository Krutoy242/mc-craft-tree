
function itemStackToString(item, meta = 0) {
  return item ? `${item.replace(":", "__")}__${meta}` : undefined;
}

function definition(raw) {
  if (raw.content.item)
    return itemStackToString(raw.content.item, raw.content.meta);
  else
    return null;
}

var STACK_CALLS = 0;

export class TreeNode {

  static serializeIEntry(raw) {
    switch (raw.type) {
      case "itemStack":
        var nbtStr = "";
        if (raw.content.nbt && Object.keys(raw.content.nbt).length !== 0) {
          nbtStr = "__" + JSON.stringify(raw.content.nbt)
            .replace(/\"([^:]+)\":([^{},]+)/g, "$1__$2.?");
        }
        return definition(raw) + nbtStr;
      case "fluidStack":
        return `fluid__${raw.content.fluid}`;
      case "placeholder":
        return `placeholder__${raw.content.name}`;
      case "oreDict":
        return `ore__${raw.content.name}`;
      case "empty":
        return;
      default:
        console.log("Unable to find item type", raw.type);
    }
  }


  // Find item field entry in parsed data
  descent(parsedData, field) {
    // Regular icon
    var o = parsedData.sheet[this.id];

    // Icon without nbt
    if (!o || !o[field]) o = parsedData.sheet[this.definitionId];

    // And without meta
    if (!o || !o[field]) o = parsedData.sheet[this.definitionIdNoMeta];

    return o ? o[field] : undefined;
  }

  // Default values for nodes
  static cost           = 1.0;
  static complexity     = 1.0;
  static usability      = 0.0;
  static popularity     = 0.0;
  static processing     = 0.0;
  static CRAFTING_TABLE_COST = 50.0;

  constructor(id, raw, parsedData) {

    // Identificator (serialized)
    // "actuallyadditions__battery_bauble__1__{Energy__0}"
    this.id             = id;

    // Identificator without NBT (serialized)
    // "actuallyadditions__battery_bauble__1"
    this.definitionId   = definition(raw);

    // Identificator without NBT and meta = 0 (serialized)
    // "actuallyadditions__battery_bauble__0"
    this.definitionIdNoMeta = itemStackToString(raw.content.item, 0);

    // Reference of JEC groups.js
    this.raw            = raw;

    this.type           = raw.type;

    switch (this.type) {
      case "itemStack":
        const parts = raw.content.item.split(':');

        // Mod or type
        // "minecraft", "fluid"
        this.entrySource = parts[0];

        // Name of entry
        // "cobblestone", "water"
        this.entryName = parts[1];

        // Meta. Only for itemStacks
        this.entryMeta = raw.content.meta;
        break;
      case "fluidStack":
        this.entrySource = "fluid";
        this.entryName = raw.content.fluid;
        break;
      case "oreDict":
        this.entrySource = "ore";
        this.entryName = raw.content.name;
        break;
      case "placeholder":
        this.entrySource = "placeholder";
        this.entryName = raw.content.name;
        break;
      case "empty":
        this.entrySource = "_empty_";
        this.entryName = "_empty_";
        break;
      default:
        this.entrySource = "NO_SOURCE";
        this.entryName = "NO_NAME";
    }

    // Item full name
    // "minecraft:stone:2", "ore:stone"
    this.name           = 
      this.entrySource +
      ":" + this.entryName   + 
      (this.entryMeta ?  ":" + this.entryMeta : "")
    
    this.nbt = raw.content.nbt;

    this.volume         = (this.type == "fluidStack") ? 1000.0 : 1.0;
    this.popularity     = TreeNode.popularity;
    // this.steps          = 0; // Count of processing cteps

    this.outputs        = [];
    this.inputs         = [];
    this.catalysts      = [];
    // this.calculating    = {}; // Map of values that calculated


    // Display localized name
    // "Andesite"
    this.display = this.descent(parsedData, "display") || `[${this.name}]`;


    // View Box on texture sheet
    // "672 1344 32 32"
    var viewBox = this.descent(parsedData, "viewBox");

    if (!viewBox) {
      if (this.type === "placeholder") {
        viewBox = parsedData.sheet["fluid__betterquesting.placeholder"]?.viewBox || "672 1344";
      } else if (this.name === "forge:bucketfilled") {
        viewBox = parsedData.sheet["minecraft__bucket__0"]?.viewBox || "4000 2816";
      } else {
        viewBox = parsedData.sheet["openblocks__dev_null__0"]?.viewBox || "576 3136";
        this.isNoIcon = true;
      }
    }

    this.viewBox = viewBox + " 32 32";
  }

  getComplexity(count) {
    return (this.cost * count) + this.processing;
  }

  forEachCatalyst(fnc, antiloop){
    for (var i = 0; i < this.catalysts.length; i++) {
      fnc(this.catalysts[i]);
    }
    antiloop = (antiloop || {});
    antiloop[this.id] = true;
    for (var i = 0; i < this.inputs.length; i++) {
      if (!antiloop[this.inputs[i].it.id]) {
        this.inputs[i].it.forEachCatalyst(fnc, antiloop);
      }
    }
    antiloop[this.id] = undefined;
  }

  // Recursively iterate through all items in list
  // usually "inputs" or "outputs"
  safeDive(fnc, listName, onLoop, deph = 999999999, antiloop) {
    if (deph>0){
      antiloop = antiloop || {};
      antiloop[this.id] = true;

      const list = this[listName];

      for (var i = 0; i < list.length; i++) {
        const link = list[i];
        if (!antiloop[link.it.id]) {
          fnc(link, this, deph);
          link.it.safeDive(fnc, listName, onLoop, deph - 1, antiloop);
        } else if(onLoop) {
          onLoop(this, listName, link);
        }
      }

      antiloop[this.id] = undefined;
    }
  }

  // forEachInput(fnc, antiloop){
  //   antiloop = (antiloop || {});
  //   antiloop[this.id] = true;
  //   for (var i = 0; i < this.inputs.length; i++) {
  //     if (!antiloop[this.inputs[i].it.id]) {
  //       fnc(this.inputs[i].it);
  //       this.inputs[i].it.forEachInput(fnc, antiloop);
  //     }
  //   }
  //   antiloop[this.id] = undefined;
  // }

  
  calculateEx(listName, field, defl = 0, fnc) {
    if (this[field] !== undefined) {
      // if (this[field] === TreeNode[field])
      //   console.log('trying to calculate already calculating node :>> ', field, this.id);
      return this[field];
    }
    // if(this.name === "thermalfoundation:material:16"){
    //   console.log('this :>> ', this);
    // }
    
    // Default value if no lists
    this[field] = this[listName].length === 0 ? TreeNode[field] : 0;
    const obj = this; // Oh my what a hack!

    // Summ vs of all [listName]
    this[listName].forEach(link => {
      obj[field] += (link.it.calculateEx(listName, field, defl, fnc) + defl) * link.weight;
      
      if (fnc) fnc(link);
    });
    return this[field];
  }

  // Calculate complexity and other values after all links are created
  calculate(onLoop) {

    // This node already have all values
    if (this.calculated) return this;
    this.calculated = true;
    
    // // This node already in process, return default values
    // if (this.calculating) {
    //   console.log('trying to calculate already calculating node :>> ', this);
    //   return this;
    // }

    // // Mark that this to prevent loops
    // this.calculating = true;

    // Calculate steps
    const allStepIndexes = [];
    this.safeDive(link => {
      // if(link.it.steps > 0)
      if (allStepIndexes.indexOf(link.recipeIndex) === -1)
        allStepIndexes.push(link.recipeIndex)
    }, "inputs", onLoop);
    this.steps = allStepIndexes.length;

    // Cost
    this.calculateEx("inputs", "cost");

    // Usability
    this.calculateEx("outputs", "usability", 1.0);

    // Processing cost
    // this.calculateEx("inputs", "processing", link => {
    //   link.it.popularity += link.weight;
    //   return (link.it.calculate().complexity || TreeNode.CRAFTING_TABLE_COST) * link.weight
    // });

    // Collect all catalyst machines in array
    // if (this.name === "rftools:powercell_creative"){
    //   console.log('this :>> ', this);
    // }
    const allCatalysts = {};
    // const pushCatalysts = node => node.catalysts.forEach(link => {
    //   const catl = allCatalysts[link.it.id] || { node: link.it };
    //   catl.num = Math.max((catl.num || 0), link.weight);
    //   link.it.popularity += link.weight;
    //   allCatalysts[link.it.id] = catl;
    // });

    // pushCatalysts(this);
    // for (var i = 0; i < this.inputs.length; i++) {
    //   pushCatalysts(this.inputs[i].it.calculate());
    // }
    // const allPopularityIndexes = [];
    this.forEachCatalyst(link => {
      const catl = allCatalysts[link.it.id] || { node: link.it };
      catl.num = Math.max((catl.num || 0), link.weight);

      // link.it.popularity += link.weight;
      allCatalysts[link.it.id] = catl;

      // if (allPopularityIndexes.indexOf(link.index) === -1) allPopularityIndexes.push(link.index)
    });
    // this.popularity = allPopularityIndexes.length;

    this.processing = TreeNode.processing;

    // Summ costs of all catalysts machines
    for (const catl of Object.values(allCatalysts)) {
      if (catl.node.name === "minecraft:crafting_table") {
        this.processing += TreeNode.CRAFTING_TABLE_COST;
      } else {
        catl.node.calculate();
        this.processing += catl.node.getComplexity(catl.num);
      }
    }

    // const link0 = this.catalysts[0];
    // if (this.catalysts.length === 1 && link0.it.name === "minecraft:crafting_table" && link0.weight === 1) {
    //   // Special case for crafting table
    //   link0.it.popularity += 1;
    //   this.processing += TreeNode.CRAFTING_TABLE_COST;
    // } else {
    //   for (var i = 0; i < this.catalysts.length; i++) {
    //     const link = this.catalysts[i];
    //     link.it.popularity += link.weight;
    //     this.processing += (link.it.calculate().complexity || TreeNode.CRAFTING_TABLE_COST) * link.weight;
    //   }
    // }

    // Resulting value
    this.complexity = this.cost + this.processing;

    // this.calculating = undefined;
    // this.calculated.done = true;

    return this;
  }
}