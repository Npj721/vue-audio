<template>
  <div v-if="selectedNode" :key="selectedNode.id">
    {{  selectedNode.type }}
    <pre>
      {{  selectedNode.param }}
    </pre>
  </div>
  <div class="node-param-editor" @click.stop>
    <form @submit.prevent="updateParameters">
      <div v-if="selectedNode" :key="selectedNode.id">
        <div v-if="selectedNode.type === 'osc'">
          <h3>Osc</h3>
          <label :for="'param-input-type'">Type</label>
          <select id="param-input-type">
            <option :selected="selectedNode.param.type === 'sine'">
              Sine
            </option>
            <option :selected="selectedNode.param.type === 'triangle'">
              Triangle
            </option>
            <option :selected="selectedNode.param.type === 'square'">
              Square
            </option>
            <option :selected="selectedNode.param.type === 'sawtooth'">
              Sawtooth
            </option>

          </select>
          <label :for="'param-input-detune'">Detune</label>
          <input id='param-input-detune' type="number" step="0.01"  v-model="selectedNode.param.detune">
        </div>

        <div v-if="selectedNode.type === 'mod'">
          <h3>Osc</h3>
          <label :for="'param-input-type'">Type</label>
          <select id="param-input-type">
            <option :selected="selectedNode.param.type === 'sine'">
              Sine
            </option>
            <option :selected="selectedNode.param.type === 'triangle'">
              Triangle
            </option>
            <option :selected="selectedNode.param.type === 'square'">
              Square
            </option>
            <option :selected="selectedNode.param.type === 'sawtooth'">
              Sawtooth
            </option>

          </select>
          <label :for="'param-input-detune'">Detune</label>
          <input id='param-input-detune' type="number" step="0.01"  v-model="selectedNode.param.detune">
          <label :for="'param-input-freq'">Freq</label>
          <input id='param-input-freq' type="number" step="0.01"  v-model="selectedNode.param.freq">
          <label :for="'param-input-gain'">Gain</label>
          <input id='param-input-gain' type="number" step="0.01"  v-model="selectedNode.param.gain">

        </div>



        <!--<label :for="'param-' + selectedNode.type">{{ selectedNode.label }} Parameters:</label>
        <div v-for="(param, key) in selectedNode.param" :key="key">
          
          <div v-if="typeof param.value === 'undefined'">

            <div v-if="selectedNode.type === 'osc'">
              
            </div>
            <div v-else>
              <label :for="'param-input-' + key">{{ key }}:</label>
              <input 
                :id="'param-input-' + key"
                v-model="selectedNode.param[key]"
                
              />
            </div>
            
          </div>
          <div v-else>
            {{ key }}
            <table>
              <thead>
                <tr>
                  <th>Gain</th>
                  <th>Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input 
                      :id="'param-input-' + key + '-value'"
                      v-model="selectedNode.param[key].value"
                      
                    />
                  </td>
                  <td>
                    <input 
                      :id="'param-input-' + key + '-duration'"
                      v-model="selectedNode.param[key].duration"
                      
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
        </div>
        -->
        <button type="submit">🆗</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAudioStore } from '../stores/audio'

const storeAudio = useAudioStore()
const selectedNode = ref(null)

watch(
  () => storeAudio.selectedNode,
  (newNode) => {
      if (newNode && newNode !== null) {
      selectedNode.value = JSON.parse(JSON.stringify(newNode))
      } else {
      selectedNode.value = null
      }
  },
  { immediate: true }
)

const updateParameters = () => {
  console.log('updateParameters updatedNode')

  const updatedNode = storeAudio.nodes.find(n => n.id === selectedNode.value.id)
  if (updatedNode) {
    console.log('updatedNode', { updatedNode })
    Object.assign(updatedNode, selectedNode.value)
    storeAudio.selectedNode.value = selectedNode.value
  }
}
</script>

<style scoped>
.node-param-editor {
  padding: 10px;
  background: #2a2a2a;
  border-radius: 8px;
  width: 250px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.node-param-editor h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.node-param-editor label {
  display: block;
  margin-bottom: 5px;
  color: white;
}

.node-param-editor input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #4a4a4a;
  background: #3a3a3a;
  color: white;
}

.node-param-editor button {
  width: 100%;
  margin-top: 10px;
  background: #646cff;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.node-param-editor button:hover {
  background: #535bf2;
}
</style>