<template>
  <v-tooltip right class="ma-0" transition="slide-x-reverse-transition">
    <template v-slot:activator="{ on, attrs }">
      <v-card
        :width="dense ? '': (size|0 + 32*9) + 'px'"
        :class="'d-inline-block text-truncate ' +  isBigSmall('glassed', '')"
        v-bind="attrs"
        v-on="on"
        :to="'graph?q=' + node.id"
      >
        <v-list class="pa-0 transparent">
          <v-list-item class="pa-0">
            <v-list-item-icon class="ma-2">
              <v-badge
                bottom
                overlap
                bordered
                :value="amount>1"
                :content="amount"
              >
                <v-badge dot color="yellow" :value="node.recipes.isLooped">
                  <svg
                    :viewBox="node.viewBox"
                    :width="size + 'px'"
                    :height="size + 'px'"
                    class="justify-center"
                  >
                    <image
                      :xlink:href="require('@/assets/Spritesheet.png')"
                      image-rendering="pixelated"
                    ></image>
                  </svg>
                  <!-- <span width="2em">{{ entryIcon }} </span> -->
                </v-badge>
              </v-badge>
            </v-list-item-icon>
            <v-list-item-content class="pa-0" v-if="!dense">
              <v-card-text class="pa-0 pl-1 text-subtitle-1">
                {{ display }}
                </v-card-text>
              <tree-entry-name :node="node"/>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <div v-if="parseInt(size) > 32">
          <v-container class="pt-3 pb-5">
            <v-row no-gutters>
              <v-col>
                <v-card outlined>
                  <hedgehog :number="node.inputsAmount"/>
                </v-card>
              </v-col>

              <v-col>
                <v-card outlined>
                  <hedgehog :number="node.outputsAmount" inverted="true"/>
                </v-card>
              </v-col>
                
              <v-col>
                <v-card flat class=".align-end">
                  <popularity :number="node.popularity"/>
                </v-card>
              </v-col>

                <v-card flat class="float-right">
                  <processing-steps :number="node.steps" smile/>
                </v-card>
                

            </v-row>
          </v-container>
        
          <div style="position: absolute; bottom:0; right: 0;" class="ma-2">
            <complexity :number="node.complexity" short/>
          </div>
        </div>
      </v-card>
    </template>
    {{ node.id }}
  </v-tooltip>
</template>

<script>
export default {
  props: {
    node: {
      type: Object,
    },
    size: { default: 32},
    amount: { default: 1},
    dense: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      typeIcons: {
        itemStack: '',
        fluidStack: '💧',
        placeholder: '⍰',
      },
    }
  },
  computed: {
    display() {
      return this.node.display
    },
    entryIcon() {
      return this.typeIcons[this.node.type]
    },
  },
  methods: {
    isBigSmall(a, b) {
      if (this.size > 32)
        return a
      else
        return b
    }
  },
}
</script>

<style scoped>
.glassed {
  background-color: rgba(44, 44, 44, 0.637)!important;
}
</style>