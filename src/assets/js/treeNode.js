
const CRAFTING_TABLE_COST = 50.0;

  
Array.prototype.remove = function() {
  var what, a = arguments, L = a.length, ax;
  while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
          this.splice(ax, 1);
      }
  }
  return this;
};

function itemStackToString(item, meta = 0) {
  return item ? `${item.replace(":", "__")}__${meta}` : undefined;
}

function getMeta(raw) {
  if (raw.content.fMeta === 1)
    return undefined;
  else
    return raw.content.meta;
}

function definition(raw) {
  if (raw.content.item)
    return itemStackToString(raw.content.item, getMeta(raw));
  else
    return undefined;
}

function trueNbt(raw){
  if (raw.content.nbt && Object.keys(raw.content.nbt).length !== 0 && !raw.content.fNbt)
    return raw.content.nbt
  else
    return undefined
}

var STACK_CALLS = 0;

export class TreeNode {

  static serializeIEntry(raw) {
    switch (raw.type) {
      case "itemStack":
        var nbtStr = "";
        const tNbt = trueNbt(raw);
        if (tNbt)
          nbtStr = "__" + JSON.stringify(tNbt).replace(/\"([^:]+)\":([^{},]+)/g, "$1__$2.?");
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
    var o = parsedData.sheet[this.idPure];

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

  constructor(raw, parsedData) {
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
        this.entryMeta = getMeta(raw);
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


    this.definition = `${this.entrySource}:${this.entryName}`;

    // Item full name
    // "minecraft:stone:2", "ore:stone"
    this.name           = this.definition + 
      (this.entryMeta ?  ":" + this.entryMeta : "")
    
    this.nbt = trueNbt(raw);
    this.nbtStr = this.nbt ? (JSON.stringify(raw.content.nbt)) : undefined;

    // Identificator (serialized)
    // "actuallyadditions__battery_bauble__1__{Energy__0.?}"
    this.id             = TreeNode.serializeIEntry(raw);

    // Identificator (serialized, pretty)
    // "actuallyadditions__battery_bauble__1__{Energy__0}"
    this.idPure         = this.id.replace("\.\?", "");


    this.volume         = (this.type == "fluidStack") ? 1000.0 : 1.0;
    this.popularity     = TreeNode.popularity;

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

  match(o) {

    if(this.definition != o.definition) return false;

    if(!(this.raw.content.fMeta || o.raw.content.fMeta) && this.entryMeta != o.entryMeta) return false;
    
    if(!(this.raw.content.fNbt || o.raw.content.fNbt) && this.nbtStr != o.nbtStr) return false;

    return true;
  }

  getComplexity(count) {
    return (this.cost * count) + this.processing;
  }

  getUUCost(factor) {
    return this.cost + this.processing / (factor + Math.sqrt(this.usability || 1));
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
  safeDive(listName, fnc, onLoop, deph = 999999999, antiloop) {
    if (deph>0){
      antiloop = antiloop || {};
      antiloop[this.id] = true;

      const list = this[listName];

      for (var i = 0; i < list.length; i++) {
        const link = list[i];
        if (!antiloop[link.it.id]) {
          fnc(link, this, deph);
          link.it.safeDive(listName, fnc, onLoop, deph - 1, antiloop);
        } else if(onLoop) {
          onLoop(this, listName, link);
        }
      }

      antiloop[this.id] = undefined;
    }
  }

  
  calculateEx(listName, field, defl = 0, fnc) {
    if (this[field] !== undefined) {
      return this[field];
    }
    
    // Default value if no lists
    if (this[listName].length === 0) {
      if (this.popularity > 0 && field === 'cost')
        this[field] = CRAFTING_TABLE_COST;
      else
        this[field] = TreeNode[field];
    } else {
      this[field] = 0;
    }
    const obj = this; // Oh my what a hack!

    // Summ vs of all [listName]
    this[listName].forEach(link => {
      obj[field] += (link.it.calculateEx(listName, field, defl, fnc) + defl) * link.weight;
      
      if (fnc) fnc(link);
    });
    return this[field];
  }

  recalculateField(field) {
    this[field] = undefined;
    this.calculated = undefined;
    this.calculate();
  }

  // Calculate complexity and other values after all links are created
  calculate(onLoop) {

    // This node already have all values
    if (this.calculated) return this;
    this.calculated = true;

    // Calculate steps
    if (!this.steps) {
      const allStepIndexes = [];
      this.safeDive("inputs", link => {
        // if(link.it.steps > 0)
        if (allStepIndexes.indexOf(link.recipeIndex) === -1)
          allStepIndexes.push(link.recipeIndex)
      }, onLoop);
      this.steps = allStepIndexes.length;
    }

    // Cost
    this.calculateEx("inputs", "cost");

    // Usability
    this.calculateEx("outputs", "usability", 1.0);

    // Find processing cost
    if (!this.processing) {
      // Collect all catalyst machines in array
      const allCatalysts = {};
      this.forEachCatalyst(link => {
        const catl = allCatalysts[link.it.id] || { node: link.it };
        catl.num = Math.max((catl.num || 0), link.weight);

        allCatalysts[link.it.id] = catl;
      });


      // Summ costs of all catalysts machines
      this.processing = TreeNode.processing;
      for (const catl of Object.values(allCatalysts)) {
        if (catl.node.name === "minecraft:crafting_table") {
          this.processing += CRAFTING_TABLE_COST;
        } else {
          catl.node.calculate();
          this.processing += catl.node.getComplexity(catl.num);
        }
      }
    }

    // Resulting value
    this.complexity = this.cost + this.processing;

    return this;
  }


}