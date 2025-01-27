<template>
    <div class="node-param-editor">
      <h3>Node Parameters</h3>
      <form @submit.prevent="updateParameters">
        <div v-if="selectedNode" :key="selectedNode.id">
          ok
          <label :for="'param-' + selectedNode.type">{{ selectedNode.label }} Parameters:</label>
          <div v-for="(param, key) in selectedNode.param" :key="key">
            <label :for="'param-input-' + key">{{ key }}:</label>
            <input 
              :id="'param-input-' + key"
              v-model="selectedNode.param[key]"
              :type="param.type || 'number'"
            />
          </div>
          <button @click="updateParameters">ok</button>
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
    background: #3a3a3a;
    border-radius: 8px;
    width: 250px;
    color:white;

  }
  
  .node-param-editor h3 {
    margin-top: 0;
  }
  
  .node-param-editor label{
    display: block;
    margin-bottom: 10px;
    color:white;
  }

  .node-param-editor input {
    display: block;
    margin-bottom: 10px;
    color:black;
  }
  </style>