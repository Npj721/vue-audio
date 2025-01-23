<template>
  <div class="editor">
    <div class="palette">
      <div
        v-for="node in availableNodes"
        :key="node.type"
        class="node-template"
        draggable="true"
        @dragstart="(e) => startDrag(e, node.type)"
      >
        {{ node.label }}
      </div>
      
      <div class="synth-actions">
        <button 
          v-if="nodes.length > 0"
          class="action-button save-button"
          @click="saveConfiguration"
        >
          Save Configuration
        </button>

        <div v-if="storeAudio.synthConfigurations.length > 0" class="load-section">
          <h3>Load Configuration</h3>
          <div 
            v-for="config in storeAudio.synthConfigurations" 
            :key="config.id"
            class="synth-config-item"
          >
            <span>{{ config.name }}</span>
            <button 
              class="action-button load-button"
              @click="loadConfiguration(config.id)"
            >
              Load
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div
      ref="editorContainer"
      class="editor-container"
      @dragover.prevent
      @drop="handleDrop"
    >
      <svg class="connections">
        <path
          v-for="connection in getAllConnections()"
          :key="`${connection.from.id}-${connection.to.id}`"
          :d="getConnectionPath(connection.from, connection.to)"
          class="connection-path"
        />
        <path
          v-if="connectingFrom"
          :d="getTempConnectionPath()"
          class="connection-path connection-temp"
        />
      </svg>
      
      <div
        v-for="node in nodes"
        :key="node.id"
        class="node"
        :class="{
          'node-connecting': connectingFrom === node,
          'node-active': node.id === activeNodeId
        }"
        :style="{
          left: node.x + 'px',
          top: node.y + 'px',
          cursor: isDragging && node.id === activeNodeId ? 'grabbing' : 'grab'
        }"
        :data-node-id="node.id"
        @mousedown="(e) => startNodeDrag(e, node)"
      >
        <div class="node-header">{{ node.label }}</div>
        <div class="node-ports">
          <div
            v-if="node.type !== 'osc'"
            class="port port-in"
            @mouseup="(e) => finishConnecting(node, e)"
          ></div>
          <div
            v-if="node.type !== 'destination'"
            class="port port-out"
            @mousedown="(e) => startConnecting(node, e)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudioStore } from '../stores/audio'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const storeAudio = useAudioStore()
const editorContainer = ref(null)
const nodes = ref([])
const draggingNode = ref(null)
const connectingFrom = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const mousePos = ref({ x: 0, y: 0 })
const activeNodeId = ref(null)
const router = useRouter()

const availableNodes = [
  { type: 'osc', label: 'Oscillateur', params: { type: 'sawtooth', detune: 0 } },
  { type: 'gain', label: 'Gain', params: { gain: 0.25 } },
  { type: 'adsr', label: 'ADSR', params: {
    start: { value: .25 },
    attack: { value: 0.7, duration: .025},
    decay: { value: 0.5, duration: .25},
    sustain: { value: 0.45, duration: .5},
    release: { value: 0, duration: .25, constant: .1},
  }},
  { type: 'destination', label: 'Sortie Audio', special: true }
]

function startDrag(event, nodeType) {
  draggingNode.value = { ...availableNodes.find(n => n.type === nodeType) }
  event.dataTransfer.setData('text/plain', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}

function handleDrop(event) {
  event.preventDefault()
  if (!draggingNode.value) return
  
  const rect = editorContainer.value.getBoundingClientRect()
  const x = event.clientX - rect.left - 100
  const y = event.clientY - rect.top - 30
  
  if (draggingNode.value.special) {
    if (!nodes.value.some(n => n.type === 'destination')) {
      nodes.value.push({
        ...draggingNode.value,
        id: 'destination',
        x,
        y,
        connections: []
      })
    }
  } else {
    const id = storeAudio.addNode(draggingNode.value.type, draggingNode.value.params)
    nodes.value.push({
      ...draggingNode.value,
      id,
      x,
      y,
      connections: []
    })
  }
  
  draggingNode.value = null
}

function startNodeDrag(event, node) {
  if (event.target.classList.contains('port')) return
  
  isDragging.value = true
  activeNodeId.value = node.id
  
  const nodeElement = event.target.closest('.node')
  const rect = nodeElement.getBoundingClientRect()
  
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function handleNodeDrag(event) {
  if (!isDragging.value) {
    if (connectingFrom.value) {
      const rect = editorContainer.value.getBoundingClientRect()
      mousePos.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }
    return
  }
  
  event.preventDefault()
  
  const rect = editorContainer.value.getBoundingClientRect()
  const x = event.clientX - rect.left - dragOffset.value.x
  const y = event.clientY - rect.top - dragOffset.value.y
  
  const node = nodes.value.find(n => n.id === activeNodeId.value)
  if (node) {
    node.x = Math.max(0, Math.min(rect.width - 200, x))
    node.y = Math.max(0, Math.min(rect.height - 100, y))
  }
}

function stopNodeDrag() {
  isDragging.value = false
  activeNodeId.value = null
}

function startConnecting(node, event) {
  event.stopPropagation()
  connectingFrom.value = node
  const rect = editorContainer.value.getBoundingClientRect()
  mousePos.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function finishConnecting(targetNode, event) {
  event.stopPropagation()
  if (!connectingFrom.value || connectingFrom.value === targetNode) {
    connectingFrom.value = null
    return
  }
  
  const sourceIndex = storeAudio.nodes.findIndex(n => n.id === connectingFrom.value.id)
  
  if (targetNode.type === 'destination') {
    storeAudio.connectToDestination(sourceIndex)
    connectingFrom.value.connections.push('destination')
  } else if (targetNode.type === 'adsr' && connectingFrom.value.type === 'gain') {
    const targetIndex = storeAudio.nodes.findIndex(n => n.id === targetNode.id)
    storeAudio.connectGainToEnveloppe(sourceIndex, targetIndex)
    connectingFrom.value.connections.push(targetNode.id)
  } else if (connectingFrom.value.type === 'osc' && targetNode.type === 'gain') {
    const targetIndex = storeAudio.nodes.findIndex(n => n.id === targetNode.id)
    storeAudio.connectNodes(sourceIndex, targetIndex)
    connectingFrom.value.connections.push(targetNode.id)
  }
  
  connectingFrom.value = null
}

function getConnectionPath(fromNode, toNode) {
  const fromRect = editorContainer.value.getBoundingClientRect()
  const startX = fromNode.x + 200
  const startY = fromNode.y + 40
  const endX = toNode.x
  const endY = toNode.y + 40
  
  const distance = Math.abs(endX - startX)
  const controlPoint1X = startX + distance * 0.5
  const controlPoint2X = endX - distance * 0.5
  
  return `M ${startX} ${startY} 
          C ${controlPoint1X} ${startY},
            ${controlPoint2X} ${endY},
            ${endX} ${endY}`
}

function getTempConnectionPath() {
  if (!connectingFrom.value) return ''
  
  const startX = connectingFrom.value.x + 200
  const startY = connectingFrom.value.y + 40
  const endX = mousePos.value.x
  const endY = mousePos.value.y
  
  const distance = Math.abs(endX - startX)
  const controlPoint1X = startX + distance * 0.5
  const controlPoint2X = endX - distance * 0.5
  
  return `M ${startX} ${startY} 
          C ${controlPoint1X} ${startY},
            ${controlPoint2X} ${endY},
            ${endX} ${endY}`
}

function getAllConnections() {
  return nodes.value.flatMap(node => 
    node.connections.map(connectionId => ({
      from: node,
      to: connectionId === 'destination' 
        ? nodes.value.find(n => n.id === 'destination')
        : nodes.value.find(n => n.id === connectionId)
    }))
  ).filter(connection => connection.to)
}

async function saveConfiguration() {
  const { value: name } = await Swal.fire({
    title: 'Save Synth Configuration',
    input: 'text',
    inputLabel: 'Configuration Name',
    inputPlaceholder: 'Enter a name for your synth...',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'You need to provide a name!'
      }
    }
  })

  if (name) {
    await storeAudio.saveSynthConfiguration(name)
    storeAudio.clearCurrentConfiguration()
    nodes.value = []
    
    const { isConfirmed } = await Swal.fire({
      title: 'Configuration Saved!',
      text: 'Would you like to go to the Board to test it?',
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Yes, go to Board',
      cancelButtonText: 'No, continue editing'
    })

    if (isConfirmed) {
      router.push('/board')
    }
  }
}

function loadConfiguration(configId) {
  if (nodes.value.length > 0) {
    Swal.fire({
      title: 'Load Configuration',
      text: 'Loading a new configuration will clear your current work. Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, load it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        performLoad(configId)
      }
    })
  } else {
    performLoad(configId)
  }
}

function performLoad(configId) {
  if (storeAudio.loadSynthConfiguration(configId)) {
    nodes.value = storeAudio.nodes.map(node => ({
      ...node,
      label: availableNodes.find(n => n.type === node.type)?.label || node.type,
      x: Math.random() * (editorContainer.value.clientWidth - 300),
      y: Math.random() * (editorContainer.value.clientHeight - 150)
    }))

    if (!nodes.value.some(n => n.type === 'destination')) {
      nodes.value.push({
        ...availableNodes.find(n => n.type === 'destination'),
        id: 'destination',
        x: editorContainer.value.clientWidth - 250,
        y: editorContainer.value.clientHeight / 2 - 50,
        connections: []
      })
    }

    Swal.fire({
      title: 'Configuration Loaded!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleNodeDrag)
  window.addEventListener('mouseup', stopNodeDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleNodeDrag)
  window.removeEventListener('mouseup', stopNodeDrag)
})
</script>

<style scoped>
.editor {
  color: white;
  display: flex;
  gap: 20px;
  height: 800px;
  margin-bottom: 2rem;
}

.palette {
  width: 200px;
  background: #2a2a2a;
  padding: 10px;
  border-radius: 8px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.node-template {
  background: #3a3a3a;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  cursor: move;
  user-select: none;
  transition: background-color 0.2s;
}

.node-template:hover {
  background: #4a4a4a;
}

.synth-actions {
  margin-top: auto;
  padding-top: 20px;
}

.action-button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button {
  background: #646cff;
}

.save-button:hover {
  background: #535bf2;
}

.load-section {
  margin-top: 20px;
  border-top: 1px solid #3a3a3a;
  padding-top: 20px;
}

.load-section h3 {
  margin: 0 0 10px 0;
  font-size: 1em;
}

.synth-config-item {
  background: #3a3a3a;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.load-button {
  background: #4a4a4a;
  padding: 4px 8px;
  font-size: 0.9em;
}

.load-button:hover {
  background: #5a5a5a;
}

.editor-container {
  flex: 1;
  background: #1a1a1a;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  min-width: 600px;
}

.connections {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.connection-path {
  fill: none;
  stroke: #646cff;
  stroke-width: 3px;
  transition: all 0.2s ease;
}

.connection-temp {
  stroke: #646cff80;
  stroke-dasharray: 5,5;
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

.node {
  position: absolute;
  width: 200px;
  background: #3a3a3a;
  border-radius: 4px;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 2;
}

.node-active {
  z-index: 3;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.node-connecting {
  box-shadow: 0 0 0 2px #646cff;
}

.node-header {
  padding: 10px;
  background: #4a4a4a;
  border-radius: 4px 4px 0 0;
  font-weight: 500;
}

.node-ports {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
}

.port {
  width: 12px;
  height: 12px;
  background: #646cff;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
  position: relative;
}

.port:hover {
  background: #535bf2;
  transform: scale(1.2);
}

.port::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.port:hover::before {
  border-color: #535bf2;
} .port-in {
  margin-right: 10px;
}

.port-out {
  margin-left: 10px;
}
</style>