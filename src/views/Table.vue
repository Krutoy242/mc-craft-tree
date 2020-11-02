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

      <template #item.complexity="{ item }">
        <v-edit-dialog
          :return-value.sync="item.complexity"
          :is="item.steps === 0 ? 'v-edit-dialog' : 'div'"
        >
          <div style="position: relative" class="d-flex justify-end">
                <complexity :node="item" />
                <v-btn absolute dark fab x-small text
                  v-if="item.steps === 0"
                  :style="{left: '90%', top: '-0.4em'}"
                  :color="item.complexity===1 ? 'red' : 'gray'"
                >
                  <v-icon small>mdi-pencil</v-icon>
                </v-btn>
          </div>
          <template #input>
            <v-text-field
              v-model="item.complexity"
              :rules="[isNumber]"
              label="Edit"
              single-line
              counter
            >
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <template #item.usability="{ item }"><big-number :number="item.usability"/></template>
      <template #item.cost="{ item }"><big-number :number="item.cost"/></template>
      <template #item.processing="{ item }"><big-number :number="item.processing"/></template>
      
      <template #item.popularity="{ item }">
        <entry-grid :cuentStackArray="item.popList">
          <popularity :number="item.popularity"/>
        </entry-grid>
      </template>
      
      <template #item.inputsAmount="{ item }">
        <entry-grid :cuentStackArray="item.recipe ? item.recipe.inputs : null" @click.native="showRecipes(item)">
          <hedgehog :number="item.inputsAmount"/>
        </entry-grid>
      </template>
      
      <template #item.outputsAmount="{ item }">
        <entry-grid :cuentStackArray="item.outsList">
          <hedgehog :number="item.outputsAmount" inverted="true"/>
        </entry-grid>
      </template>

      <template #item.steps="{ item }"><processing-steps :number="item.steps"/></template>
      <template #item.recipesLength="{ item }"><popularity :number="item.recipes.length" color="#101404">mdi-buffer</popularity></template>

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
        { align: 'center' ,text: 'Alt. Recipes', value: 'recipesLength' },
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
    showRecipes(cuent) {
      EventBus.$emit('show-recipes-dialog', cuent)
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