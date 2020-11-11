<template>
  <v-app id="inspire">
    <v-app-bar app clipped-left>
      <v-tabs>

        <v-tab link to="graph">
          <v-icon>mdi-graph</v-icon>
          <span class="ma-3">Graph</span>
        </v-tab>
        
        <v-tab link to="table">
          <v-icon>mdi-table</v-icon>
          <span class="ma-3">Table</span>
        </v-tab>
        
      </v-tabs>
      <v-spacer />

      <!-- Debug Button -->
      <v-dialog scrollable width="auto " :fullscreen="$vuetify.breakpoint.xsOnly">
        
        <template v-slot:activator="{ on, attrs }">
          <v-badge
            :value="listLoops"
            :content="'💫'+listLoops.size"
            type="info"
            left
          >
            <v-badge
              :value="noIcons"
              :content="'🔲'+noIcons.length"
              type="info"
              left bottom
            >
              <v-btn small
                v-bind="attrs"
                v-on="on"
              >
                Debug info
              </v-btn>
            </v-badge>
          </v-badge>
        </template>

        <debug-view :debugInfo="pile.info"/>

      </v-dialog>


      <!-- Download button -->
      <download-lists :pile="pile"/>
    </v-app-bar>

    <!-- Sizes your content based upon application components -->
    <v-main>
        <!-- If using vue-router -->
        <router-view :pile="pile" :key="$route.path"></router-view>
    </v-main>

    <!-- <v-footer app> -->

    <template>
      <div class="text-center">
        <v-bottom-sheet v-model="isMoreInfo">
          <v-sheet
            class="text-center"
            height="300px"
          >
            <div class="py-3">
              This is a bottom sheet using the controlled by v-model instead of activator
            </div>
          </v-sheet>
        </v-bottom-sheet>
      </div>
    </template>

    <v-system-bar>
      Unique Items: {{ uniqueItems }}
      Recipes Registered: {{ recipesStore.count }}
      <v-spacer></v-spacer>
      <!-- <v-btn class="mx-1" x-small color="info" @click="isMoreInfo=!isMoreInfo">Show more info</v-btn> -->
      <v-spacer></v-spacer>
      <v-btn class="mx-1" x-small color="secondary" href="https://github.com/Krutoy242/CraftTreeVisualizer">GutHub</v-btn>
      <v-btn class="mx-1" x-small color="secondary" href="https://github.com/Krutoy242/Enigmatica2Expert-Extended">Recipes from E2:E - Extended</v-btn>
    </v-system-bar>
    <!-- </v-footer> -->

    <!-- <v-row justify="center"> -->
      <v-dialog 
        v-model="showRecipesDialog"  
        width="auto " 
        :fullscreen="$vuetify.breakpoint.xsOnly"
      >
        <recipes 
          :recipeInfoList="recipeInfoList"
          style="overflow-x: hidden;"
        />
      </v-dialog>
    <!-- </v-row> -->
  </v-app>
</template>

<script>
import Vue from 'vue'
import { tree } from './assets/js/constituents.ts'
import { ConstituentAdditionals } from './assets/js/ConstituentBase.ts'
import { recipesStore, mergeJECGroups, mergeDefaultAdditionals } from './assets/js/recipes.ts'

import default_additionals from './assets/default_additionals.json'
import { EventBus } from './assets/js/lib/event-bus.js'
// import default_jecGroups from './assets/jec_groups.json'


export default {
  data: () => ({
    drawer: null,
    isMoreInfo: false,
    pile: Object,
    recipesStore:  Object,

    recipeInfoList: Object,
    showRecipesDialog: false,
  }),
  computed: {
    listLoops() {return this.pile?.info?.listLoops ?? new Set()},
    noIcons() {return this.pile?.info?.noIcon ?? []},
    uniqueItems() {return this.pile?.list?.length},
  },

  created() {
    this.$vuetify.theme.dark = true
  },

  mounted() {
    // Listen for the i-got-clicked event and its payload.
    EventBus.$off('show-recipes-dialog')
    EventBus.$on('show-recipes-dialog', recipeInfoList => {
      this.recipeInfoList = recipeInfoList
      this.showRecipesDialog = true
    })

    ConstituentAdditionals.setAdditionals(default_additionals)
    // let jec_groups = parseJECgroups(default_jecGroups, default_additionals)
    // let jec_groups = parseJECgroups(require('./assets/jec_groups.json'), default_additionals)
    let jec_groups = require('./assets/jec_groups.json')
    mergeDefaultAdditionals(default_additionals)
    mergeJECGroups(jec_groups)

    const pile = tree.makePileTo('storagedrawers:upgrade_creative:1')
    // const pile = calculate('minecraft:coal:1')
    for (const key in pile) { Vue.nonreactive(pile[key]) }
    console.log('pile :>> ', pile)
    // pile.list = []

    // Object.freeze(pile)
    this.pile = pile

    Vue.nonreactive(recipesStore.map)
    this.recipesStore = recipesStore
  },
}
</script>
