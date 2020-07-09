<template>
  <v-tooltip right class="ma-0">
    <template v-slot:activator="{ on, attrs }">
      <v-card
        width="20rem"
        class="d-inline-block text-truncate"
        v-bind="attrs"
        v-on="on"
      >
        <v-list class="pa-0">
          <v-list-item class="pa-0">
            <v-list-item-icon class="ma-2">
              <v-badge dot color="green" :value="node.inputs.length == 0">
                <svg
                  :viewBox="node.viewBox"
                  width="2rem"
                  height="2rem"
                  class="justify-center"
                >
                  <image
                    :xlink:href="require('@/assets/Spritesheet.png')"
                  ></image>
                </svg>
                <!-- <span width="2em">{{ entryIcon }} </span> -->
              </v-badge>
            </v-list-item-icon>
            <v-list-item-content class="pa-0">
              <v-card-text class="pa-0 pl-1 text-subtitle-1">{{ display }}</v-card-text>
              <tree-entry-name :node="node"/>
            </v-list-item-content>
          </v-list-item>
        </v-list>
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
    width: {
      type: Number,
      default: 24,
    },
    height: {
      type: Number,
      default: 24,
    },
  },
  data() {
    return {
      typeIcons: {
        itemStack: "",
        fluidStack: "💧",
        placeholder: "⍰",
      },
    };
  },
  computed: {
    display() {
      return this.node.display;
    },
    entryIcon() {
      return this.typeIcons[this.node.raw.type];
    },
    bgPosition() {
      const s = this.node.viewBox.split(" ");
      return `${s[0]}px ${s[1]}px`;
    },
  },
};
</script>
