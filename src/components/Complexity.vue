<template>
  <div>
    <!-- <div style="position: absolute; left: 2em; bottom: 1.4em">
      <v-icon small style="transform: rotate(90deg); position: absolute; ">mdi-subdirectory-arrow-right</v-icon>
      <big-number :number="node.cost" :dim="true"/>
    </div> -->

    <big-number :number="node.complexity" bordered :short='short'/>
    
    <!-- <big-number :number="node.processing" style="position: absolute; left: 2em; top: 1.4em"/> -->
  </div>
</template>

<script>

export default {

  props: {
    node: {
      type: Object,
    },
    short: {
      type: Boolean,
      default: false,
    }
  },
}
</script>