<template>
  <v-card>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        hide-details
      ></v-text-field>

      <v-spacer/>

      <v-sheet elevation="5" class="py-2 px-1">
        <v-chip-group
          mandatory
          multiple
          active-class="primary--text"
        >
          <v-chip v-for="tag in trueHeaders" :key="tag.text">
            {{ tag.text }}
          </v-chip>
        </v-chip-group>
      </v-sheet>
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="graph.nodes"
      class="elevation-1"
      :search="search"
      :footer-props="{ 'items-per-page-options': [10, 20, 50, 100, -1] }"
      dense
      item-key="id"
      show-expand
      single-expand
    >
      <template v-slot:item.display="{ item }">
        <tree-entry :node="item" class="pa-2" />
      </template>

      <template v-slot:item.complexity="{ item }">
        <v-edit-dialog
          :return-value.sync="item.complexity"
          :is="item.steps === 0 ? 'v-edit-dialog' : 'span'"
        >
          <big-number :number="item.complexity"/>
          <v-icon small class="ma-2" style="display: inline-block;" v-if="item.steps === 0">mdi-pencil</v-icon>
          <template v-slot:input>
            <v-text-field
              v-model="item.complexity"
              :rules="[isNumber]"
              label="Edit"
              single-line
              counter
            ></v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <!-- <template #item.usability="{ item }">{{ item.usability | numFormat("0,0.[000]") }}</template> -->
      <template #item.usability="{ item }"><big-number :number="item.usability"/></template>
      <template #item.cost="{ item }"><big-number :number="item.cost"/></template>
      <template #item.processing="{ item }"><big-number :number="item.processing"/></template>
      
      <template #item.popularity="{ item }">
        <v-container  style="position: relative;" class="pa-0 text-center">
          <v-container
            fill-height
            class="pa-0"
            style="position: absolute; z-index: 1; top: 0; left: 0; bottom: 0; right: 0;"
          >
            <v-flex class="border-2px">
              {{ item.popularity || "-" }}
            </v-flex>
          </v-container>
          <v-icon v-if="item.popularity > 0"
            large
            color="#BF360C"
            style="position: relative;"
          >
            mdi-cog
          </v-icon>
        </v-container>
      </template>
      
      <!-- <template #item.inputs.length="{ item }">
        <v-container  style="position: relative;" class="pa-0 text-center">
          <v-container
            fill-height
            class="pa-0"
            style="position: absolute; z-index: 1; top: 3px; left: 0; bottom: 0; right: 0;"
          >
            <v-flex >
              {{ item.inputs.length || "-" }}
            </v-flex>
          </v-container>
          <curve-text
            :width="55"
            :height="50"
            :r="35"
            color="green"
            style="transform: scale(0.60); position: absolute;"
          >
            {{ getArrows(item.inputs.length, 0) }}
          </curve-text>
          <curve-text
            :width="55"
            :height="50"
            :r="35"
            color="green"
            offset="50%"
            style="transform: scale(0.8);"
          >
            {{ getArrows(item.inputs.length, 10) }}
          </curve-text>
        </v-container>
      </template> -->

      <template #item.inputs.length="{ item }"><hedgehog :number="item.inputs.length"/></template>
      
      <template #item.outputs.length="{ item }"><hedgehog :number="item.outputs.length" inverted="true"/></template>

      <template #item.steps="{ item }"><processing-steps :number="item.steps"/></template>

      <template #expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <kbd>More info about {{ item.name }}</kbd>
        </td>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
const arrows = ["🠇","🠯","🠳","🡇","🡻"];

export default {
  props: {
    graph: {
      required: true,
    },
  },

  data() {
    return {
      search: "",
      headers: [
        {
          text: "Item Name",
          align: "start",
          sortable: false,
          value: "display",
        },
        { text: "", value: "data-table-expand" },
        { text: "Complexity", value: "complexity" },
        { text: "Cost", value: "cost" },
        { text: "Processing Cost", value: "processing" },
        { text: "Usability", value: "usability" },
        { text: "Popularity", value: "popularity" },
        { text: "Inputs", value: "inputs.length" },
        { text: "Outputs", value: "outputs.length" },
        { text: "Steps", value: "steps" },
      ],
      isNumber: (v) => !isNaN(v) || "Input should be number!",
    };
  },
  methods: {
    getArrows(n, offset){
      var arr = [];


      if ((n > 9 + offset) && (offset===0))arr.unshift(arrows[4]);
      if ( n > 8 + offset) arr.push   (arrows[4]);
      if ( n > 7 + offset) arr.unshift(arrows[3]);
      if ( n > 6 + offset) arr.push   (arrows[3]);
      if ( n > 5 + offset) arr.unshift(arrows[2]);
      if ( n > 4 + offset) arr.push   (arrows[2]);
      if ( n > 3 + offset) arr.unshift(arrows[1]);
      if ( n > 2 + offset) arr.push   (arrows[1]);
      if ( n > 1 + offset) arr.unshift(arrows[0]);
      if ( n > 0 + offset) arr.push   (arrows[0]);
        
      return arr.join('');
    }
  },
  computed: {
    trueHeaders(){
      return this.headers.filter(head => head.text !== "" );
    }
  },
};
</script>

<style scoped>

.border-2px {
  text-shadow: 1px 1px 0 #1E1E1E,
    -1px 1px 0 #1E1E1E,
    1px -1px 0 #1E1E1E,
    -1px -1px 0 #1E1E1E,
    0px 1px 0 #1E1E1E,
    0px -1px 0 #1E1E1E,
    -1px 0px 0 #1E1E1E,
    1px 0px 0 #1E1E1E,
    2px 2px 0 #1E1E1E,
    -2px 2px 0 #1E1E1E,
    2px -2px 0 #1E1E1E,
    -2px -2px 0 #1E1E1E,
    0px 2px 0 #1E1E1E,
    0px -2px 0 #1E1E1E,
    -2px 0px 0 #1E1E1E,
    2px 0px 0 #1E1E1E,
    1px 2px 0 #1E1E1E,
    -1px 2px 0 #1E1E1E,
    1px -2px 0 #1E1E1E,
    -1px -2px 0 #1E1E1E,
    2px 1px 0 #1E1E1E,
    -2px 1px 0 #1E1E1E,
    2px -1px 0 #1E1E1E,
    -2px -1px 0 #1E1E1E;
}

</style>