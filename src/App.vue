<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-list-item
          v-for="item in items"
          :key="item.title"
          link
          :to="item.route"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-left>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Application</v-toolbar-title>
      <v-spacer />
      <download-lists :graph="graph"/>
    </v-app-bar>

    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-container fluid class="pa-0">
        <!-- If using vue-router -->
        <router-view :graph="graph" :key="$route.path"></router-view>
      </v-container>
    </v-main>

    <!-- <v-footer app> -->
    <v-system-bar>
      <v-spacer></v-spacer>

      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
        <v-btn x-small v-if="noIconLength > 0" v-bind="attrs" v-on="on">
          <v-chip color="brown darken-2" x-small>{{ noIconLength  }}</v-chip>
          <span>cant find icons</span>
        </v-btn>
        </template>
        <v-chip
          color="brown darken-2"
          v-for="name in graph.noIcon"
          :key="name"
          small
          class="ma-1"
        >
          {{name}}
        </v-chip>

      </v-tooltip>

      <v-btn x-small v-if="loopsLength > 0">
        <v-chip color="blue-grey darken-2" x-small>{{ loopsLength }}</v-chip>
        <span>Loops found</span>
      </v-btn>
    </v-system-bar>
    <!-- </v-footer> -->
  </v-app>
</template>

<script>
import { parseRawRecipes } from "./assets/js/parse.js";
import DownloadLists from "./components/DownloadLists.vue";

export default {
  components: {
    DownloadLists,
  },
  data: () => ({
    drawer: null,
    graph: Object,
    items: [
      { title: "Graph", route: "graph", icon: "mdi-graph" },
      { title: "Table", route: "table", icon: "mdi-table" },
    ],
  }),

  created() {
    this.$vuetify.theme.dark = true;
  },

  mounted() {
    Promise.all([d3.json("./groups.json"), d3.json("./parsedData.json")]).then(
      ([groups, parsedData]) => {
        this.graph = parseRawRecipes(groups, parsedData);
        this.$parsedData = parsedData;
      }
    );
  },
  computed: {
    noIconLength() { return this.graph?.noIcon?.length },
    loopsLength() { return this.graph.listLoops ? Object.keys(this.graph.listLoops).length : undefined }
  },
};
</script>
