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
            :content="'💫'+listLoops.length"
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
      <v-btn class="mx-1" x-small color="info" @click="isMoreInfo=!isMoreInfo">Show more info</v-btn>
      <v-spacer></v-spacer>
      <v-btn class="mx-1" x-small color="secondary" href="https://github.com/Krutoy242/CraftTreeVisualizer">GutHub</v-btn>
      <v-btn class="mx-1" x-small color="secondary" href="https://github.com/Krutoy242/Enigmatica2Expert-Extended">Recipes from E2:E - Extended</v-btn>
    </v-system-bar>
    <!-- </v-footer> -->
  </v-app>
</template>

<script>
import { parseJECgroups } from './assets/js/parsers/jec_parse.js'
import { setAdditionals, calculate } from './assets/js/constituents.js'
import { recipesStore, mergeJECGroups, mergeDefaultAdditionals } from './assets/js/recipes.js'

import default_additionals from './assets/default_additionals.json'
// import default_jecGroups from './assets/jec_groups.json'

export default {
  data: () => ({
    drawer: null,
    isMoreInfo: false
  }),
  static: () => ({
    pile: Object,
    recipesStore
  }),
  computed: {
    listLoops() {return this.pile?.info?.listLoops ?? []},
    noIcons() {return this.pile?.info?.noIcon ?? []},
    uniqueItems() {return this.pile?.list?.length},
  },

  created() {
    this.$vuetify.theme.dark = true
  },

  mounted() {
    setAdditionals(default_additionals)
    // var jec_groups = parseJECgroups(default_jecGroups, default_additionals)
    var jec_groups = parseJECgroups(require('./assets/jec_groups.json'), default_additionals)
    mergeDefaultAdditionals(default_additionals)
    mergeJECGroups(jec_groups)

    const pile = calculate('storagedrawers:upgrade_creative:1')
    // for (const key in pile) {
    //   Object.defineProperty(pile, key, { configurable: false })
    // }
    console.log('pile :>> ', pile)
    // pile.list = []

    // Object.freeze(pile)
    this.pile = pile
  },
}
</script>
