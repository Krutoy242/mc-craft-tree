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

      <!-- Columns selector -->
      <!-- <v-sheet elevation="1" class="pa-0 ma-2" rounded>
        <v-chip-group
          active-class="primary--text"
          v-model="selectedHeadersModel"
        >
          <v-chip v-for="tag in trueHeaders" :key="tag.text" small>
            {{ tag.text }}
          </v-chip>
        </v-chip-group>
      </v-sheet> -->
    </v-card-title>

    <v-data-table
      :headers="selectedHeaders"
      :items="pile.list"
      class="elevation-1"
      :search="search"
      :custom-filter="filter"
      dense
      item-key="id"
      single-expand
      :footer-props="{
        showFirstLastPage: true,
        'items-per-page-options': [10, 20, 50, 100, -1]
      }"
    >

      <!-- HEADER -->
      <!-- <template #header.complexity="{ header }">
        {{ header.text.toUpperCase() }}
      </template> -->

      <template #item.display="{ item }"><tree-entry :node="item" class="pa-2" /></template>
      <template #item.complexity="{ item }"><big-number :number="item.complexity" bordered/></template>
      <template #item.usability="{ item }"><big-number :number="item.usability"/></template>
      <template #item.cost="{ item }"><big-number :number="item.cost" :highlited='item.isNatural'/></template>
      <template #item.processing="{ item }"><big-number :number="item.processing"/></template>
      
      <template #item.popularity="{ item }">
        <entry-grid :cuentStackArray="item.popList" @click.native="showAsCatalysts(item)">
          <popularity :number="item.popularity"/>
        </entry-grid>
      </template>
      
      <template #item.inputsAmount="{ item }">
        <v-badge 
          overlap bordered
          color="green darken-4" 
          :value="item.recipes.list.size > 1"
          :content="`${item.recipes.list.size === 2 ? '+' : '+' + item.recipes.list.size}`"
        >
          <entry-grid :cuentStackArray="item.recipes.main ? item.recipes.main.inputs : undefined" @click.native="showInputs(item)">
            <hedgehog :number="item.recipes.main ? item.inputsAmount : '!'"/>
          </entry-grid>
        </v-badge>
      </template>
      
      <template #item.outputsAmount="{ item }">
        <entry-grid :cuentStackArray="item.outsList" @click.native="showAsOutput(item)">
          <hedgehog :number="item.outputsAmount" inverted="true"/>
        </entry-grid>
      </template>

      <template #item.steps="{ item }"><processing-steps :number="item.steps"/></template>
      <!-- <template #item.recipesLength="{ item }"><popularity :number="item.recipes.length" color="#101404">mdi-buffer</popularity></template> -->

      <!-- <template #expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <kbd>More info about {{ item.name }}</kbd>
        </td>
      </template> -->
    </v-data-table>
  </v-card>
</template>

<script>

const _ = require('lodash')
import { EventBus } from '../assets/js/lib/event-bus.js'

function emit(data) {
  EventBus.$emit('show-recipes-dialog', data)
}

function extractFromCSList(csList, filter) {
  return csList.reduce((acc, cs)=>{
    const recipes = cs.cuent.getRecipes()
    const filtered = recipes.filter(filter)
    return acc.concat(filtered.map(r=>({it:r})))
  }, [])
}

export default {
  props: {
    pile: {
      required: true,
    },
  },

  data() {
    return {
      search: '',
      selectedHeadersModel: [],
      selectedHeaders: [],
      headers: [
        {
          text: 'Item Name',
          align: 'start',
          sortable: false,
          value: 'display',
          divider: true
        },
        // { align: 'center' ,text: "", value: "data-table-expand" , divider: true},
        { align: 'center' ,text: 'Complexity', value: 'complexity', divider: true},
        { align: 'center' ,text: 'Cost', value: 'cost' },
        { align: 'center' ,text: 'Processing Cost', value: 'processing' },
        { align: 'center' ,text: 'Usability', value: 'usability' },
        { align: 'center' ,text: 'Popularity', value: 'popularity' },
        { align: 'center' ,text: 'Inputs', value: 'inputsAmount' },
        { align: 'center' ,text: 'Outputs', value: 'outputsAmount' },
        // { align: 'center' ,text: 'Alt. Recipes', value: 'recipesLength' },
        { align: 'center' ,text: 'Steps', value: 'steps' },
      ],
      isNumber: (v) => !isNaN(v) || 'Input should be number!',
    }
  },
  methods: {
    filter (value, search, item) {
      return value != null &&
        search != null &&
        typeof value === 'string' && (
        value.indexOf(search) !== -1 ||
        item.id.indexOf(search) !== -1
      )
    },
    showInputs(cuent) {
      emit(cuent.getRecipes().map(r=>({it:r, selected: r==cuent.recipes.main})))
    },
    showAsCatalysts(cuent) {
      emit(extractFromCSList(cuent.popList, r=>r.catalysts.some(cs=>cs.cuent === cuent)))
    },
    showAsOutput(cuent) {
      emit(extractFromCSList(cuent.outsList, r=>r.inputs.some(cs=>cs.cuent === cuent)))
    }
  },
  computed: {
    trueHeaders(){
      return this.headers.filter(head => head.text !== '' )
    }
  },

  watch: {
    selectedHeadersModel(val) {
      // console.log('val :>> ', val);
      // this.selectedHeaders = val;
    }
  },

  created() {
    this.selectedHeaders = this.headers
  }

}
</script>