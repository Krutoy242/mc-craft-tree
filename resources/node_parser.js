/* 

Helper script to prepare several files for fast acces
Lunch with NodeJS

*/

const fs = require('fs');
const path = require("path");
const jsonText = fs.readFileSync(path.resolve(__dirname, "oldDefaultQuests.json"));
var raw_DefaultQuests = JSON.parse(jsonText);


let data = JSON.stringify(raw_DefaultQuests, null, 2);
fs.writeFileSync('DefaultQuests.json', data);