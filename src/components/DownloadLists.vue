<template>
  <div>
    <v-menu transition="slide-y-transition" bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on" small>
          Extra
        </v-btn>
      </template>
      <v-list>

        <v-list-item v-for="(item, i) in items" :key="i" @click="item.action(graph)">
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>

      </v-list>
    </v-menu>
  </div>
</template>

<script>
const ic2Factor = 100

// ----------------------------
// Temporary save UU values to file
// ----------------------------

import { listUU } from '../assets/js/listUU.js'

function download(content, fileName, contentType) {
  var a = document.createElement('a')
  var file = new Blob([content], { type: contentType })
  a.href = URL.createObjectURL(file)
  a.download = fileName
  a.click()
}

function prepareRawListUU(graph) {
  const rawListUU = []

  // Prepare list ob object with data
  // Filter only "source" nodes
  // and add display name
  graph.nodes.forEach((node) => {
    if (node.steps === 0 && node.complexity !== 1) {
      var obj = listUU.find(x => (x.name === node.name))
      if (obj) {
        obj.uu = node.complexity
        obj.name = node.name
      } else {
        obj = {uu: node.complexity, name: node.name}
      }
      obj.display = node.display
      rawListUU.push(obj)
    }
  })

  // Push presented but unused nodes
  listUU.forEach((l) => {
    if (!rawListUU.find(x => (x.name === l.name))) {
      var node = graph.nodes.find(x => (x.name === l.name))
      rawListUU.push({uu: l.uu, name: l.name, display: node?.display|| ''})
    }
  })
  
  return rawListUU
}

// Natural sorting
const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'})
function naturalSort(array) {
  return array.sort(collator.compare)
}

function saveListUU(graph) {
  
  const listUU_string = []
  prepareRawListUU(graph).forEach((l) => {
    listUU_string.push(`{uu: ${l.uu.toString().padEnd(9)}, name: "${(l.name + '"').padEnd(43)}},// ${l.display}`)
  })

  naturalSort(listUU_string)

  download(
    `export const listUU = [\n${listUU_string.join('\n')}\n];`,
    'listUU.json',
    'text/plain'
  )
}

// ----------------------------
// Parse and save UU values for ic2.ini
// ----------------------------
function saveIC2ini(graph) {

  // ------------
  // Predefined values
  // ------------
  const listUU_string = []
  const prepared = prepareRawListUU(graph)
  prepared.sort((a, b) => a.uu - b.uu)
  
  prepared.forEach(l => {
    const match = l.name.match(/^(([^:]+):[^:]+)(:([^:]+))?/)
    const definition = match[1]
    const source = match[2]
    const meta = match[4]

    if (source === 'fluid' ||
        source === 'placeholder')
      return

    const icName = definition + (meta ? '@'+meta : '')
    const display = (l.display && l.display !== '') ? '; '+l.display : ''
    const cost = Math.max(1, l.uu | 0)

    listUU_string.push(`${icName.padEnd(49)} = ${cost}${display}`)
  })

  // ------------
  // Computed list
  // ------------
  const listComputed_string = []
  graph.nodes.forEach(n => {
    // Work only with Itemstacks
    // Items without NBT
    // Items that didnt added to defined list yet
    if (n.type !== 'itemStack' || n.nbt || prepared.find(x => x.name === n.name)) return

    const icName = `${n.definition}` + (n.entryMeta ? '@'+n.entryMeta : '')
    const display = (n.display && n.display !== '') ? '; '+n.display : ''
    const cost = Math.max(1, (n.getUUCost(ic2Factor)) | 0)

    if (cost === 1) return

    const addString = `${icName.padEnd(49)} = ${cost}${display}`

    listComputed_string.push(addString)
  })

  listUU_string.sort((a, b) => a.match(/= (.*).*$/)[1] - b.match(/= (.*).*$/)[1])

  listComputed_string.sort(function (a, b) {
    return a.match(/= (.*);.*/)[1] - b.match(/= (.*);.*/)[1]
    // const aa = a.match(/^.* =/)[0];
    // const bb = b.match(/^.* =/)[0];
    // return aa.length - bb.length
    //     || a.match(/= (.*);.*/)[1] - b.match(/= (.*);.*/)[1];
  })

  // ------------
  // Save
  // ------------
  // const listUU_string = predefList;

  download(
    listUU_string.concat(listComputed_string).join('\n'),
    'ic2.ini',
    'text/plain'
  )
}

export default {
  name: 'download-lists',
  props: {
    graph: {
    },
  },
  data: () => ({
    items: [
      {
        title: 'Unmapped UU values',
        action: saveListUU
      },
      {
        title: 'IC2.ini',
        action: saveIC2ini
      },
    ],
  }),
}
</script>
