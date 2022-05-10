<template>
  <v-app id="inspire">
    <v-app-bar app clipped-left>
      <v-tabs>
        <v-tab
          v-for="([name, icon], i) in tabs"
          :key="i"
          link
          :to="name.toLowerCase()"
        >
          <v-icon>{{ icon }}</v-icon>
          <span class="ma-3">{{ name }}</span>
        </v-tab>
      </v-tabs>
      <v-spacer />

      <!-- Debug Button -->
      <v-dialog
        scrollable
        width="auto "
        :fullscreen="$vuetify.breakpoint.xsOnly"
      >
        <template #activator="{ on, attrs }">
          <v-badge
            :value="listLoops"
            :content="'💫' + listLoops.size"
            type="info"
            left
          >
            <v-badge
              :value="noIcons"
              :content="'🔲' + noIcons.length"
              type="info"
              left
              bottom
            >
              <v-btn small v-bind="attrs" v-on="on">Debug info</v-btn>
            </v-badge>
          </v-badge>
        </template>

        <debug-view :debug-info="pile ? pile.info : null" />
      </v-dialog>

      <!-- Download button -->
      <download-lists :pile="pile" />
    </v-app-bar>

    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- If using vue-router -->
      <router-view :key="$route.path" :pile="pile"></router-view>
    </v-main>

    <!-- <v-footer app> -->

    <div class="text-center">
      <v-bottom-sheet v-model="isMoreInfo">
        <v-sheet class="text-center" height="300px">
          <div class="py-3">
            This is a bottom sheet using the controlled by v-model instead of
            activator
          </div>
        </v-sheet>
      </v-bottom-sheet>
    </div>

    <v-system-bar>
      Unique Items: {{ uniqueItems }} Recipes Registered:
      {{ recipesStoreCount }}
      <v-spacer></v-spacer>
      <!-- <v-btn class="mx-1" x-small color="info" @click="isMoreInfo=!isMoreInfo">Show more info</v-btn> -->
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        x-small
        color="secondary"
        href="https://github.com/Krutoy242/CraftTreeVisualizer"
      >
        GutHub
      </v-btn>
      <v-btn
        class="mx-1"
        x-small
        color="secondary"
        href="https://github.com/Krutoy242/Enigmatica2Expert-Extended"
      >
        Recipes from E2:E - Extended
      </v-btn>
    </v-system-bar>
    <!-- </v-footer> -->

    <!-- OVERLAYS -->
    <v-dialog
      v-model="showRecipesDialog"
      width="auto "
      :fullscreen="$vuetify.breakpoint.xsOnly"
    >
      <recipes :recipe-info-list="recipeInfoList" style="overflow-x: hidden" />
    </v-dialog>

    <v-overlay :value="showLoadOverlay">
      <div style="min-height: 4px; width: 400px">
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

<script lang="ts">
import Vue from 'vue'
import { EventBus } from './assets/js/lib/event-bus'
import { GraphPile } from './assets/js/cuents/Pile'
import Recipe from './assets/js/recipes/Recipe'
import ConstituentTree from './assets/js/cuents/ConstituentTree'
import RecipesStore from './assets/js/recipes/recipes'
import { RawAdditionalsStore } from 'mc-gatherer'
import { ConstituentAdditionals } from './assets/js/cuents/ConstituentBase'

export default Vue.extend({
  data: () =>
    new (class {
      drawer = null
      isMoreInfo = false
      pile?: GraphPile
      globalTree?: ConstituentTree

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
        ['History', 'mdi-segment'],
      ]
    })(),
  computed: {
    listLoops() {
      return (this.pile as any)?.listLoops ?? new Set()
    },
    noIcons() {
      return (this.pile as any)?.noIcon ?? []
    },
    uniqueItems() {
      return this.pile?.list?.length
    },
  },

  created() {
    ;(this as any).$vuetify.theme.dark = true
  },

  mounted() {
    EventBus.$off('show-recipes-dialog')
    EventBus.$on('show-recipes-dialog', (recipeInfoList: Recipe[]) => {
      this.recipeInfoList = recipeInfoList
      this.showRecipesDialog = true
    })

    void (
      import('./assets/data.json') as unknown as Promise<RawAdditionalsStore>
    )
      .then((data) => {
        ConstituentAdditionals.additionals = data

        this.globalTree = new ConstituentTree()
        const recipesStore = new RecipesStore(this.globalTree)
        return recipesStore.appendAdditionals(data)
      })
      .then((recipesStore) => {
        const pile = this.globalTree!.makePileTo(
          'storagedrawers:upgrade_creative:1'
        )
        for (const key in pile) {
          ;(Vue as any).nonreactive((pile as any)[key])
        }
        this.pile = pile

        this.recipesStoreCount = recipesStore.count
        this.showLoadOverlay = false
      })
  },
})
</script>
