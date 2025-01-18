<script setup>
import { ref, onMounted } from 'vue'
import { useAudioStore } from '../stores/audio'

const storeAudio = useAudioStore()
const editorContainer = ref(null)
const nodes = ref([])
const draggingNode = ref(null)
const connectingFrom = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

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
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
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
  event.stopPropagation()
  isDragging.value = true
  const rect = event.target.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function handleNodeDrag(event) {
  if (!isDragging.value) return
  event.preventDefault()
  
  const rect = editorContainer.value.getBoundingClientRect()
  const x = event.clientX - rect.left - dragOffset.value.x
  const y = event.clientY - rect.top - dragOffset.value.y
  
  const node = nodes.value.find(n => n.id === event.target.dataset.nodeId)
  if (node) {
    node.x = Math.max(0, Math.min(rect.width - 200, x))
    node.y = Math.max(0, Math.min(rect.height - 100, y))
  }
}

function stopNodeDrag() {
  isDragging.value = false
}

function startConnecting(node) {
  connectingFrom.value = node
}

function finishConnecting(targetNode) {
  if (!connectingFrom.value || connectingFrom.value === targetNode) return
  
  const sourceIndex = storeAudio.nodes.findIndex(n => n.id === connectingFrom.value.id)
  
  if (targetNode.type === 'destination') {
    storeAudio.connectToDestination(sourceIndex)
  } else if (targetNode.type === 'adsr' && connectingFrom.value.type === 'gain') {
    const targetIndex = storeAudio.nodes.findIndex(n => n.id === targetNode.id)
    storeAudio.connectGainToEnveloppe(sourceIndex, targetIndex)
  } else {
    const targetIndex = storeAudio.nodes.findIndex(n => n.id === targetNode.id)
    storeAudio.connectNodes(sourceIndex, targetIndex)
  }
  
  connectingFrom.value.connections.push(targetNode.id)
  connectingFrom.value = null
}

function getConnectionPath(fromNode, toNode) {
  const startX = fromNode.x + 100
  const startY = fromNode.y + 25
  const endX = toNode.x
  const endY = toNode.y + 25
  const controlX = (startX + endX) / 2
  
  return `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`
}

function getAllConnections() {
  return nodes.value.flatMap(node => 
    node.connections.map(connectionId => ({
      from: node,
      to: nodes.value.find(n => n.id === connectionId)
    }))
  ).filter(connection => connection.to)
}

onMounted(() => {
  window.addEventListener('mousemove', handleNodeDrag)
  window.addEventListener('mouseup', stopNodeDrag)
})
</script>

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
      </svg>
      
      <div
        v-for="node in nodes"
        :key="node.id"
        class="node"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        :data-node-id="node.id"
        @mousedown="(e) => startNodeDrag(e, node)"
      >
        <div class="node-header">{{ node.label }}</div>
        <div class="node-ports">
          <div
            class="port port-out"
            @mousedown.stop="startConnecting(node)"
            @mouseup.stop="finishConnecting(node)"
          ></div>
          <div
            v-if="node.type !== 'destination'"
            class="port port-in"
            @mouseup.stop="finishConnecting(node)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor {
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
}

.node-template {
  background: #3a3a3a;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  cursor: move;
  user-select: none;
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
}

.connection-path {
  fill: none;
  stroke: #646cff;
  stroke-width: 2px;
}

.node {
  position: absolute;
  width: 200px;
  background: #3a3a3a;
  border-radius: 4px;
  cursor: move;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.node-header {
  padding: 10px;
  background: #4a4a4a;
  border-radius: 4px 4px 0 0;
}

.node-ports {
  padding: 10px;
  display: flex;
  justify-content: space-between;
}

.port {
  width: 12px;
  height: 12px;
  background: #646cff;
  border-radius: 50%;
  cursor: pointer;
}

.port:hover {
  background: #535bf2;
  transform: scale(1.2);
  transition: all 0.2s ease;
}

.port-in {
  margin-right: 10px;
}

.port-out {
  margin-left: 10px;
}
</style>