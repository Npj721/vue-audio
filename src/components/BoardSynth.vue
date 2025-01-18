<script setup>
import { ref, onMounted, onUnmounted  } from 'vue'
import { useAudioStore } from '../stores/audio'

const keysPressed = ref([])
const keysKeyboard = []

keysKeyboard["q"] = 261.63
keysKeyboard["s"] = 293.66
keysKeyboard["d"] = 329.63
keysKeyboard["f"] = 349.23
keysKeyboard["g"] = 392.00
keysKeyboard["h"] = 440;
keysKeyboard["j"] = 493.88
keysKeyboard["k"] = 523.25
keysKeyboard["l"] = 587.33
keysKeyboard["m"] = 659.26

const storeAudio = useAudioStore()

const constructSimpleSynth = () => {
    storeAudio.addNode('osc', { type: 'sawtooth', detune: 0 })
    storeAudio.addNode('osc', { type: 'sawtooth', detune: 12 * 100 })
    storeAudio.addNode('osc', { type: 'sawtooth', detune: 24 * 100 })
    storeAudio.addNode('gain', { gain: 0.25 })
    storeAudio.addNode('adsr', {     
        start: { value: .25 },
        attack: { value: 0.7, duration: .025},
        decay: { value: 0.5, duration: .25},
        sustain: { value: 0.45, duration: .5},
        release: { value: 0, duration: .25, constant: .1},
    })

    storeAudio.connectNodes(0, 3)
    storeAudio.connectNodes(1, 3)
    storeAudio.connectNodes(2, 3)

    storeAudio.connectGainToEnveloppe(3, 4)
    storeAudio.connectToDestination(3)
}

function handleKeyDown(event) {
  console.log("Touche pressée:", event.key, {transpo: keysKeyboard[event.key]});
  if(typeof keysKeyboard[event.key] === 'undefined') return
  if(!keysPressed.value.includes(event.key)){
    console.log('ajout')
    keysPressed.value.push(event.key)
    storeAudio.press(0, keysKeyboard[event.key] )
  }
}

function handleKeyUp(event) {
  console.log("Touche relâchée:", event.key);
  if(typeof keysKeyboard[event.key] === 'undefined') return
  keysPressed.value = keysPressed.value.filter(key => key !== event.key)
  storeAudio.release(0, keysKeyboard[event.key])
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});

</script>

<template>

  <div class="card">
    <span v-for="key in keysPressed" :key="key" style="margin-right:4px">
      {{ key }} - {{ keysKeyboard[key] }}
    </span>
  </div>

  <div class="card">
    <button type="button" @click="storeAudio.initAudioContext()" :disabled="storeAudio.audioContext !== null">Init</button>
    <button type="button" @click="constructSimpleSynth()" :disabled="storeAudio.audioContext === null">constructSimpleSynth</button>
    
    <div>
      Nodes
      <div v-for="node in storeAudio.nodes" :key="node">
        {{ node.id }}<br>
        {{ node.type }}<br>
        {{ node.param }}<br>
        {{ node }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
