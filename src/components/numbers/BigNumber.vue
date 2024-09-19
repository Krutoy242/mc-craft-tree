<script setup lang="ts">
import numeral from 'numeral'

const props = defineProps({
  number: { type: Number },
  bordered: { type: Boolean, default: false },
  highlited: { type: Boolean, default: false },
  short: { type: Boolean, default: false },
})

const SI_SYMBOL = ['', 'k', 'M', 'G', 'T', 'P', 'E']

function abbreviateNumber(num: number) {
  num = Math.round(num * 1000) / 1000.0

  if (num <= 1)
    return num

  // what tier? (determines SI symbol)
  const tier = (Math.log10(num) / 3) | 0

  // if zero, we don't need a suffix
  if (tier === 0)
    return num

  // get suffix and determine scale
  const suffix = SI_SYMBOL[tier]
  const scale = 10 ** (tier * 3)

  // scale the num
  const scaled = num / scale

  // format num and add suffix
  return scaled.toFixed(1) + suffix
}

const tierClasses = [
  'grey-1',
  'grey-2',
  'enchanted',
  'glow',
  'glow animated-rainbow',
  'rainbow-shadow animated-rainbow',
  'glitched',
]

const compNumber = computed(() => {
  let num = props.number ?? 0

  if (!props.short) {
    if (num >= 1000)
      num = Math.round(num)

    return numeral(num).format('0,0.[000]')
  }
  else {
    return abbreviateNumber(num)
  }
})

const compClass = computed(() => {
  const tier = (Math.log10((props.number ?? 0) + 1) / 3) | 0
  return tierClasses[Math.min(tier, tierClasses.length - 1)]
})

const whole = computed(() => {
  const num = Math.floor((props.number ?? 0))
  const output = numeral(num).format('0,0')
  return output === 'NaN' ? num : output
})

const residueIsZero = computed(() => {
  return (props.number ?? 0) - Math.floor((props.number ?? 0)) === 0
})

const residue = computed(() => {
  const num = (props.number ?? 0) - Math.floor((props.number ?? 0))
  return numeral(num).format('.000')
})

const main = computed(() => String(props.short ? compNumber.value : whole.value))
</script>

<template>
  <div>
    <div
      v-if="number && number > 0"
      class="monospace relative"
      :class="{ bordered }"
    >
      <div
        class="flex flex-nowrap"
        :class="{
          highlited,
          'justify-content-center': short,
          'justify-content-end': !short,
        }"
      >
        <div
          :class="compClass"
          :title="compClass?.includes('glitched') ? main : undefined"
        >
          <div v-if="compClass?.includes('animated-rainbow')">
            <span
              v-for="(c, i) in main"
              :key="i"
              class="char"
              :style="`--char-percent: ${i / (main.length - 1)};`"
            >
              {{ c }}
            </span>
          </div>
          <span v-else>{{ main }}</span>
        </div>
        <div
          v-if="!short"
          :class="residueIsZero ? 'brownzeroes' : 'browntext'"
        >
          {{ residue }}
        </div>
      </div>
    </div>
    <a v-else>-</a>
  </div>
</template>

<style scoped>
.browntext {
  color: rgb(100, 64, 42);
}

.brownzeroes {
  color: rgba(100, 64, 42, 0);
}

.grey-1 {
  color: rgb(92, 82, 79);
}
.grey-2 {
  color: rgb(182, 182, 182);
}

.highlited {
  background-color: rgba(27, 94, 32, 0.1);
}

.glow {
  -webkit-animation: glow 0.4s ease-in-out infinite alternate;
  -moz-animation: glow 0.4s ease-in-out infinite alternate;
  animation: glow 0.4s ease-in-out infinite alternate;
}

@-webkit-keyframes glow {
  from {
    text-shadow: 0 0 3px rgba(255, 255, 255, 0.4), 0 0 8px #e67b0066,
      0 0 10px#e67b0066, 0 0 18px#e67b0066;
  }
  to {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.4), 0 0 10px #ffad1566,
      0 0 13px #ffad1566, 0 0 20px #ffad1566;
  }
}

@keyframes glow {
  0% {
    text-shadow: 0 0 3px rgba(255, 255, 255, 0.4), 0 0 8px #e67b0066,
      0 0 10px#e67b0066, 0 0 18px#e67b0066;
  }
  100% {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.4), 0 0 10px #ffad1566,
      0 0 13px #ffad1566, 0 0 20px #ffad1566;
  }
}

.enchanted {
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.2), 0 0 8px #e67b0044;
}

.bordered {
  outline: 1px solid rgba(0, 119, 255, 0.192);
  border-radius: 6px;
  background-color: #00e1ff05;
}

.animated-rainbow .char {
  color: hsl(calc(360deg * var(--char-percent)),90%,65%);
  animation: rainbow-colors 1s linear infinite;
  animation-delay: calc(-1s * var(--char-percent));
}

@keyframes rainbow-colors {
  0% { color: hsl(0turn, 90%, 65%); }
  25% { color: hsl(.25turn, 90%, 65%); }
  50% { color: hsl(.5turn, 90%, 65%); }
  75% { color: hsl(.75turn, 90%, 65%); }
  100% { color: hsl(1turn, 90%, 65%); }
}

/* https://codepen.io/nullset2/pen/reORKj */
@keyframes rainbowdropshadow {
  0% { text-shadow: 1px 1px 0 #FF0000;}
  8% { text-shadow: 1px 1px 0 #FF7F00;}
  16% { text-shadow: 1px 1px 0 #FFFF00;}
  25% { text-shadow: 1px 1px 0 #7FFF00;}
  33% { text-shadow: 1px 1px 0 #00FF00;}
  41% { text-shadow: 1px 1px 0 #00FF7F;}
  50% { text-shadow: 1px 1px 0 #00FFFF;}
  58% { text-shadow: 1px 1px 0 #007FFF;}
  66% { text-shadow: 1px 1px 0 #0000FF;}
  75% { text-shadow: 1px 1px 0 #7F00FF;}
  83% { text-shadow: 1px 1px 0 #FF00FF;}
  91% { text-shadow: 1px 1px 0 #FF007F;}
  100% { text-shadow: 1px 1px 0 #FF0000;}
}

.rainbow-shadow {
  text-shadow: 1px 1px 0 #000000;
  -webkit-animation: rainbowdropshadow .5s infinite;
  animation: rainbowdropshadow .5s infinite;
}

/*
 ██████╗ ██╗     ██╗████████╗ ██████╗██╗  ██╗
██╔════╝ ██║     ██║╚══██╔══╝██╔════╝██║  ██║
██║  ███╗██║     ██║   ██║   ██║     ███████║
██║   ██║██║     ██║   ██║   ██║     ██╔══██║
╚██████╔╝███████╗██║   ██║   ╚██████╗██║  ██║
 ╚═════╝ ╚══════╝╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
*/

.glitched {
  color: rgb(0, 216, 216);
  animation: glitch 1s linear infinite;
}

@keyframes glitch{
  2%,64%{transform: translate(2px,0) skew(0deg);}
  4%,60%{transform: translate(-2px,0) skew(0deg);}
     62%{transform: translate(0,0) skew(5deg);}
}

.glitched:before, .glitched:after {
  content: attr(title);
  position: absolute;
  left: 0;
}

.glitched:before{
  animation: glitchTop 1s linear infinite;
  clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
  -webkit-clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
}

@keyframes glitchTop{
  2%,64%{transform: translate(2px,-2px);}
  4%,60%{transform: translate(-2px,2px);}
     62%{transform: translate(13px,-1px) skew(-13deg);}
}

.glitched:after{
  animation: glitchBotom 1.5s linear infinite;
  clip-path: polygon(0 67%, 100% 67%, 100% 100%, 0 100%);
  -webkit-clip-path: polygon(0 67%, 100% 67%, 100% 100%, 0 100%);
}

@keyframes glitchBotom{
  2%,64%{transform: translate(-2px,0);}
  4%,60%{transform: translate(-2px,0);}
     62%{transform: translate(-22px,5px) skew(21deg);}
}
</style>
