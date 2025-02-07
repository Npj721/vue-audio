<template>
  <div class="node-param-editor" @click.stop>
    <h3>Node Parameters</h3>
    <form @submit.prevent="updateParameters">
      <div v-if="selectedNode" :key="selectedNode.id">
        {{ selectedNode }}
        <label :for="'param-' + selectedNode.type">{{ selectedNode.label }} Parameters:</label>
        <div v-for="(param, key) in selectedNode.param" :key="key">
          <label :for="'param-input-' + key">{{ key }}:</label>
          <input 
            :id="'param-input-' + key"
            v-model="selectedNode.param[key]"
            :type="param.type || 'number'"
            :step="param.type == 'number' ? '0.01' : ''"
          />
        </div>
        <button type="submit">Update</button>
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