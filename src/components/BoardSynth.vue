<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudioStore } from '../stores/audio'
import Swal from 'sweetalert2'

const keysPressed = ref([])
const selectedSynth = ref(null)
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

function handleKeyDown(event) {
  if(typeof keysKeyboard[event.key] === 'undefined' || !selectedSynth.value) return
  if(!keysPressed.value.includes(event.key)){
    keysPressed.value.push(event.key)
    storeAudio.press(selectedSynth.value, 0, keysKeyboard[event.key])
  }
}

function handleKeyUp(event) {
  if(typeof keysKeyboard[event.key] === 'undefined' || !selectedSynth.value) return
  keysPressed.value = keysPressed.value.filter(key => key !== event.key)
  storeAudio.release(selectedSynth.value, 0, keysKeyboard[event.key])
}

function selectSynth(synthId) {
  selectedSynth.value = synthId
}

function deleteSynth(synthId) {
  if (selectedSynth.value === synthId) {
    selectedSynth.value = null
  }
  storeAudio.deleteSynthConfiguration(synthId)
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  if(storeAudio.audioContext === null){
    Swal.fire("Init").then( () => {
      storeAudio.initAudioContext()
    })
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});
</script>

<template>
  <div class="board-synth">
    <div v-if="storeAudio.synthConfigurations.length === 0" class="no-synths">
      No synths available. Create one in the Node Editor!
    </div>
    
    <div v-else class="synth-list">
      <div
        v-for="synth in storeAudio.synthConfigurations"
        :key="synth.id"
        class="synth-item"
        :class="{ active: selectedSynth === synth.id }"
        @click="selectSynth(synth.id)"
      >
        <span class="synth-name">{{ synth.name }}</span>
        <button 
          class="delete-button"
          @click.stop="deleteSynth(synth.id)"
        >
          ×
        </button>
      </div>
    </div>

    <div v-if="selectedSynth" class="keyboard-info">
      <h3>Keyboard Controls</h3>
      <div class="keys-pressed">
        Active keys:
        <span v-for="key in keysPressed" :key="key" class="key-badge">
          {{ key }}
        </span>
      </div>
      <div class="key-map">
        <div v-for="(freq, key) in keysKeyboard" :key="key" class="key-item">
          {{ key }}: {{ freq.toFixed(2) }}Hz
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-synth {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  color: white;
}

.no-synths {
  text-align: center;
  padding: 40px;
  color: #666;
}

.synth-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.synth-item {
  background: #3a3a3a;
  padding: 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.synth-item:hover {
  background: #4a4a4a;
}

.synth-item.active {
  background: #646cff;
}

.synth-name {
  font-weight: 500;
}

.delete-button {
  background: none;
  border: none;
  color: #ff4444;
  font-size: 20px;
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
}

.delete-button:hover {
  color: #ff6666;
}

.keyboard-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #3a3a3a;
}

.keys-pressed {
  margin: 10px 0;
}

.key-badge {
  background: #646cff;
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 4px;
  font-family: monospace;
}

.key-map {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.key-item {
  background: #3a3a3a;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
}
</style>