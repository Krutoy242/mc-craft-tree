<template>
  <v-app id="inspire">
    <v-app-bar app clipped-left>
      <v-tabs>

        <v-tab
          link
          v-for="([name,icon], i) in tabs"
          :key="i"
          :to="name.toLowerCase()"
        >
          <v-icon>{{icon}}</v-icon>
          <span class="ma-3">{{name}}</span>
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

        <debug-view :debugInfo="pile ? pile.info : null"/>

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
      Recipes Registered: {{ recipesStoreCount }}
      <v-spacer></v-spacer>
      <!-- <v-btn class="mx-1" x-small color="info" @click="isMoreInfo=!isMoreInfo">Show more info</v-btn> -->
      <v-spacer></v-spacer>
      <v-btn class="mx-1" x-small color="secondary" href="https://github.com/Krutoy242/CraftTreeVisualizer">GutHub</v-btn>
      <v-btn class="mx-1" x-small color="secondary" href="https://github.com/Krutoy242/Enigmatica2Expert-Extended">Recipes from E2:E - Extended</v-btn>
    </v-system-bar>
    <!-- </v-footer> -->

    <!-- OVERLAYS -->
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

    <v-overlay :value="showLoadOverlay">
      <div style="min-height: 4px; width: 400px;">
        {{ progressText }}
        <v-progress-linear
          v-model="progressValue"
          :indeterminate="progressIndeterminate"
          :active="true"
          :query="false"
        ></v-progress-linear>
      </div>
    </v-overlay>
  </v-app>
</template>

<script lang='ts'>
import Vue from 'vue'
import { globalTree } from './assets/js/cuents/ConstituentTree'
import { recipesStore, Recipe } from './assets/js/recipes/recipes'

import { EventBus } from './assets/js/lib/event-bus'
import { GlobalPile } from './assets/js/cuents/Pile'
import { gatherData } from './assets/js/gatherer'

export default Vue.extend({
  data: () => (new class {
    drawer = null
    isMoreInfo = false
    pile?: GlobalPile = {} as GlobalPile

    recipeInfoList?: Recipe[] = undefined
    showRecipesDialog = false
    recipesStoreCount = 0

    // Progress bar
    progressText = 'Loading...'
    showLoadOverlay = true
    progressIndeterminate = true
    progressValue = 0

    tabs = [
      ['Graph', 'mdi-graph'],
      ['Table', 'mdi-table'],
      ['History', 'mdi-graph'],
    ]
  }),
  computed: {
    listLoops() {return this.pile?.listLoops ?? new Set()},
    noIcons() {return this.pile?.noIcon ?? []},
    uniqueItems() {return this.pile?.list?.length},
  },

  created() {
    (this as any).$vuetify.theme.dark = true
  },

  mounted() {
    EventBus.$off('show-recipes-dialog')
    EventBus.$on('show-recipes-dialog', (recipeInfoList: Recipe[]) => {
      this.recipeInfoList = recipeInfoList
      this.showRecipesDialog = true
    })

    setTimeout(() => {
      gatherData()
      setTimeout(()=>{
        this.showLoadOverlay = false

        const pile = globalTree.makePileTo('storagedrawers:upgrade_creative:1')
        for (const key in pile) { (Vue as any).nonreactive((pile as any)[key]) }
        this.pile = pile as GlobalPile
        this.recipesStoreCount = recipesStore.count
      }, 1)
    }, 1)
  },
})
</script>
