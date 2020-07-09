<template>
<div>
  <v-card 
    v-if="number > 0"
    class="neon d-inline-block textarea float-right"
    style="font-size: medium;"
    :is="bordered ? 'v-card' : 'div'"
  >
    <v-row no-gutters style="flex-wrap: nowrap;">
      <v-col 
        :class='"flex-grow-1 flex-shrink-0 pl-1" + compClass'
        :data-text="whole"
      >
        {{ whole }}
      </v-col>
      <!-- <span class="gradient"></span> -->
      <!-- <span class="spotlight"></span>  -->
      <v-col 
        class="flex-grow-0 flex-shrink-0 brown--text text--darken-2 pr-1"
      >
        {{ residue }}
      </v-col>
    </v-row>
  </v-card>
  <span v-else>-</span>
</div>
</template>

<script>
import numeral from 'numeral';

var SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

function abbreviateNumber(number){

  // what tier? (determines SI symbol)
  var tier = Math.log10(number) / 3 | 0;

  // if zero, we don't need a suffix
  if(tier == 0) return number;

  // get suffix and determine scale
  var suffix = SI_SYMBOL[tier];
  var scale = Math.pow(10, tier * 3);

  // scale the number
  var scaled = number / scale;

  // format number and add suffix
  return scaled.toFixed(1) + suffix;
}

const tierClasses = [
  "grey--text text--lighten-1",
  "grey--text text--lighten-2",
  "enchanted",
  "glow"
];

function getClass(num) {
}

export default {
  props: {
    number: {},
    bordered: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    compNumber() {
      var num = this.number;
      if (num >= 1000) num = Math.round(num);

      return numeral(num).format('0,0.[000]');
      // return num | numeral("0,0.[000]");
      // return abbreviateNumber(this.number);
    },
    compClass() {
      const tier = Math.log10(this.number + 1) / 3 | 0;
      const clss = tierClasses[tier];
      if (clss)
        return " " + clss;
      else
        return " " + tierClasses[tierClasses.length - 1];
    },
    whole(){
      const num = Math.floor(this.number);
      return numeral(num).format('0,0');
    },
    residue(){
      const num = this.number - Math.floor(this.number);
      return numeral(num).format('.000');
    }
  },
};
</script>

<style scoped>
.textarea {
  font-family:Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace;
}

.glow {
  -webkit-animation: glow 0.4s ease-in-out infinite alternate;
  -moz-animation: glow 0.4s ease-in-out infinite alternate;
  animation: glow 0.4s ease-in-out infinite alternate;
}

@-webkit-keyframes glow {
  from {
    text-shadow: 0 0 3px rgba(255, 255, 255, 0.4), 0 0 8px #e67b0066, 0 0 10px#e67b0066, 0 0 18px#e67b0066;
  }
  to {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.4), 0 0 10px #ffad1566, 0 0 13px #ffad1566, 0 0 20px #ffad1566;
  }
}

@keyframes glow {
  0% {
    text-shadow: 0 0 3px rgba(255, 255, 255, 0.4), 0 0 8px #e67b0066, 0 0 10px#e67b0066, 0 0 18px#e67b0066;
  }
  100% {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.4), 0 0 10px #ffad1566, 0 0 13px #ffad1566, 0 0 20px #ffad1566;
  }
}


.enchanted {
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.2), 0 0 8px #e67b0044;

  /* Fallback: Set a background color. */
  /* background-color: #fff; */
  
  /* Create the gradient. */
  /* background-image: linear-gradient(45deg,rgba(255,255,255,1) 0%, rgba(205,255,245,1) 10%, rgba(203,227,255,1) 20%, rgba(203,216,255,1) 35%, rgba(220,203,255,1) 50%, rgba(239,219,255,1) 70%, rgba(255,229,246,1) 90%, rgba(255,255,255,1) 100%); */
  /* Set the background size and repeat properties. */
  /* background-size: 100%; */
  /* background-repeat: no-repeat;
  background-size: 100%; */

  /* Use the text as a mask for the background. */
  /* This will show the gradient as a text color rather than element bg. */
  /* -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; */

  /* Animate the text when loading the element. */
  /* This animates it on page load and when hovering out. */
  /* animation: rainbow-text-simple-animation-rev 2.75s linear infinite; */
}

/* Move the background and make it smaller. */
/* Animation shown when entering the page and after the hover animation. */
@keyframes rainbow-text-simple-animation-rev {
  0% { background-position: 0 0; }
  80% { background-position: 0 0; }
  100% { background-position: 100% 0; }
}

/* Move the background and make it larger. */
/* Animation shown when hovering over the text. */
@keyframes rainbow-text-simple-animation {
  0% { background-position: 0 0; }
  80% { background-position: 0 0; }
  100% { background-position: 100% 0; }
}
</style>