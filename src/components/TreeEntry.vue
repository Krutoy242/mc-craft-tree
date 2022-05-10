<template>
  <div>
    <v-tooltip right class="ma-0" transition="slide-x-reverse-transition">
      <template #activator="{ on, attrs }">
        <v-card
          :width="getWidth"
          :height="design.resized ? height : undefined"
          :class="
            'd-inline-block text-truncate ' + design.resized ? '' : 'glassed'
          "
          v-bind="attrs"
          :to="'graph?q=' + node.id"
          style="overflow: hidden"
          v-on="on"
        >
          <!-- Wide and shortened -->
          <v-list class="pa-0 transparent">
            <v-list-item class="pa-0">
              <!-- Icon -->
              <v-list-item-icon class="ma-2">
                <v-badge
                  bottom
                  overlap
                  bordered
                  :value="amount > 1"
                  :content="amount"
                >
                  <v-badge dot color="yellow" :value="node.recipes.isLooped">
                    <svg
                      :viewBox="node.viewBox"
                      :width="iconSize"
                      :height="iconSize"
                    >
                      <image
                        :xlink:href="require('@/assets/spritesheet.png')"
                        image-rendering="pixelated"
                      ></image>
                    </svg>
                  </v-badge>
                </v-badge>
              </v-list-item-icon>

              <!-- Name and ID -->
              <v-list-item-content v-if="design.name" class="pa-0">
                <v-card-text class="pa-0 pl-1 text-subtitle-1">
                  {{ display }}
                </v-card-text>
                <tree-entry-name :node="node" />
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <!-- Big Description -->
          <div v-if="design.big">
            <v-container class="pt-3 pb-5">
              <v-row no-gutters>
                <v-col>
                  <v-card outlined>
                    <hedgehog :number="node.inputsAmount" />
                  </v-card>
                </v-col>

                <v-col>
                  <v-card outlined>
                    <hedgehog :number="node.outputsAmount" inverted="true" />
                  </v-card>
                </v-col>

                <v-col>
                  <v-card flat class=".align-end">
                    <popularity :number="node.popularity" />
                  </v-card>
                </v-col>

                <v-card flat class="float-right">
                  <processing-steps :number="node.steps" smile />
                </v-card>
              </v-row>
            </v-container>

            <div style="position: absolute; bottom: 0; right: 0" class="ma-2">
              <complexity :number="node.complexity" short />
            </div>
          </div>
        </v-card>
      </template>
      {{ node.display }}
      <big-number :number="node.complexity" />
    </v-tooltip>
  </div>
</template>

<script>
export default {
  props: {
    node: {
      type: Object,
    },
    amount: { default: 1 },
    width: { default: 32 },
    height: { default: 32 },
    details: { default: '' },
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
    getWidth() {
      return this.design.resized
        ? this.width
        : this.design.wide
        ? this.size + 32 * 9
        : undefined
    },
    getStyleSize() {
      const w = this.getWidth
      const h = this.design.resized ? this.height : undefined
      return (w ? 'width:' + w + 'px;' : '') + (h ? 'height:' + h + 'px;' : '')
    },
    design() {
      const des = this.details
        .split(' ')
        .reduce((r, v) => ((r[v] = true), r), {})

      if (des.big) des.wide = true
      if (des.wide) des.name = true
      return des
    },
    size() {
      return Math.min(this.width, this.height) | 0
    },
    iconSize() {
      return this.design.resized
        ? Math.max(this.width, this.height) | 0
        : this.size
    },
    display() {
      return this.node.display
    },
    entryIcon() {
      return this.typeIcons[this.node.type]
    },
  },
  methods: {},
}
</script>

<style scoped>
.glassed {
  background-color: rgba(44, 44, 44, 0.637) !important;
}

.absolute {
  position: absolute;
}
</style>
