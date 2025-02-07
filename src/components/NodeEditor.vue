<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useAudioStore } from '../stores/audio'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import NodeParamEditor from './NodeParamEditor.vue'

const storeAudio = useAudioStore()
const editorContainer = ref(null)
const nodes = ref([])
const draggingNode = ref(null)
const connectingFrom = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const activeNodeId = ref(null)
const router = useRouter()
const connections = ref([])
let tempLine = null
let LeaderLine = null

function handleBackgroundClick(event) {
  if (event.target === editorContainer.value) {
    storeAudio.selectNodeFromId(null)
  }
}

function deleteNode(nodeId) {
  const nodeToDelete = nodes.value.find(n => n.id === nodeId)
  if (!nodeToDelete) return

  connections.value = connections.value.filter(conn => {
    if (conn.fromId === nodeId || conn.toId === nodeId) {
      conn.line.remove()
      return false
    }
    return true
  })

  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  
  if (activeNodeId.value === nodeId) {
    activeNodeId.value = null
    storeAudio.selectNodeFromId(null)
  }

  storeAudio.removeNode(nodeId)
}

function deleteConnection(connection) {
  if (!connection || !connection.line) return
  
  // Remove the connection line
  connection.line.remove()
  
  // Remove from connections array
  connections.value = connections.value.filter(conn => conn !== connection)
  
  // Remove from source node's connections in the store
  const sourceNode = nodes.value.find(n => n.id === connection.fromId)
  if (sourceNode) {
    sourceNode.connections = sourceNode.connections.filter(connId => 
      connId !== connection.toId && connId !== 'destination'
    )
    
    // If it's a gain-to-envelope connection, clear the envelope reference
    if (sourceNode.type === 'gain') {
      const targetNode = nodes.value.find(n => n.id === connection.toId)
      if (targetNode && targetNode.type === 'adsr') {
        sourceNode.envelope = null
      }
    }
  }
  
  // Update the store
  storeAudio.removeConnection(connection.fromId, connection.toId)
}

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
  { type: 'destination', label: 'Sortie Audio', special: true },
  { type: 'mod', label: 'Modulateur', params: { type: 'square', detune: 0, freq: 10, gain: 150 } },

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
    const id = storeAudio.addNode(draggingNode.value.type, draggingNode.value.params, { x, y })
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
  storeAudio.selectNodeFromId(node.id)
  
  const nodeElement = event.target.closest('.node')
  const rect = nodeElement.getBoundingClientRect()
  
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
  
  const node = nodes.value.find(n => n.id === activeNodeId.value)
  if(storeAudio.selectedNode){
    storeAudio.selectedNode.position = { x, y }
  }
  if (node) {
    node.x = Math.max(0, Math.min(rect.width - 200, x))
    node.y = Math.max(0, Math.min(rect.height - 100, y))
    
    updateConnectionLines()
  }
}

function stopNodeDrag() {
  isDragging.value = false
}

function startConnecting(event, node) {
  event.stopPropagation()
  connectingFrom.value = node
  
  if (!LeaderLine) return

  const startElement = document.getElementById(`port-out-${node.id}`)
  if (!startElement) return

  tempLine = new LeaderLine(
    startElement,
    LeaderLine.pointAnchor(document.elementFromPoint(event.clientX, event.clientY)),
    {
      color: '#646cff80',
      size: 3,
      path: 'straight',
      startSocket: 'right',
      endSocket: 'left',
      dash: { animation: true }
    }
  )
}

function updateTempLine(event) {
  if (tempLine && LeaderLine) {
    tempLine.end = LeaderLine.pointAnchor(document.elementFromPoint(event.clientX, event.clientY))
  }
}

function finishConnecting(node, event) {
  event.stopPropagation()
  if (!connectingFrom.value || connectingFrom.value === node) {
    if (tempLine) {
      tempLine.remove()
      tempLine = null
    }
    connectingFrom.value = null
    return
  }
  
  const sourceIndex = storeAudio.nodes.findIndex(n => n.id === connectingFrom.value.id)

  console.log('finishConnection', { connectingFrom, node})
  
  if (node.type === 'destination') {
    storeAudio.connectToDestination(sourceIndex)
    connectingFrom.value.connections.push('destination')
    createConnection(connectingFrom.value, node)
  } else if (node.type === 'adsr' && connectingFrom.value.type === 'gain') {
    const targetIndex = storeAudio.nodes.findIndex(n => n.id === node.id)
    storeAudio.connectGainToEnveloppe(sourceIndex, targetIndex)
    connectingFrom.value.connections.push(node.id)
    createConnection(connectingFrom.value, node)
  } else if (connectingFrom.value.type === 'osc' && node.type === 'gain') {
    const targetIndex = storeAudio.nodes.findIndex(n => n.id === node.id)
    storeAudio.connectNodes(sourceIndex, targetIndex)
    connectingFrom.value.connections.push(node.id)
    createConnection(connectingFrom.value, node)
  } else if (connectingFrom.value.type === 'mod' && node.type === 'osc') {
    console.log('connection mod vers osc', { connectingFrom, node})
    const targetIndex = storeAudio.nodes.findIndex(n => n.id === node.id)
    storeAudio.connectNodes(sourceIndex, targetIndex)
    connectingFrom.value.connections.push(node.id)
    createConnection(connectingFrom.value, node)
  }
  
  if (tempLine) {
    tempLine.remove()
    tempLine = null
  }
  connectingFrom.value = null
}

function createConnection(fromNode, toNode) {
  if (!LeaderLine || !fromNode || !toNode) return

  const startElement = document.getElementById(`port-out-${fromNode.id}`)
  const endElement = document.getElementById(`port-in-${toNode.id}`)
  
  if (!startElement || !endElement) return

  const line = new LeaderLine(
    startElement,
    endElement,
    {
      color: '#646cff',
      size: 3,
      path: 'straight',
      startSocket: 'right',
      endSocket: 'left'
    }
  )

  const connection = {
    line,
    fromId: fromNode.id,
    toId: toNode.id
  }
  
  // Add right-click event listener to the line element
  setTimeout(() => {
    if (line.element) {
      line.element.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        deleteConnection(connection)
      })
    }
  }, 0)
  
  connections.value.push(connection)
}

function updateConnectionLines() {
  connections.value.forEach(connection => {
    if (connection.line) {
      connection.line.position()
    }
  })
}

function clearConnections() {
  connections.value.forEach(connection => {
    if (connection.line) {
      connection.line.remove()
    }
  })
  connections.value = []
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
    const existingConfig = storeAudio.currentConfigId ? 
      storeAudio.synthConfigurations.find(c => c.id === storeAudio.currentConfigId) : null

    if (existingConfig) {
      await storeAudio.updateSynthConfiguration(existingConfig.id, name)
    } else {
      await storeAudio.saveSynthConfiguration(name)
    }

    clearConnections()
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
  clearConnections()
  if (storeAudio.loadSynthConfiguration(configId)) {
    console.log('performLoad', { nodes: storeAudio.nodes })
    nodes.value = storeAudio.nodes.map(node => ({
      ...node,
      label: availableNodes.find(n => n.type === node.type)?.label || node.type,
      x: node.position.x,
      y: node.position.y
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

    setTimeout(() => {
      nodes.value.forEach(node => {
        node.connections.forEach(targetId => {
          const targetNode = nodes.value.find(n => n.id === targetId) ||
            (targetId === 'destination' ? nodes.value.find(n => n.id === 'destination') : null)
          if (targetNode) {
            console.log('targetNode', { targetNode })
            createConnection(node, targetNode)
          }
        })
        if(node.type === 'gain'){
          console.log('type gain', { node })
          
          if(node.envelope !== null){
            const targetNode = nodes.value.find(n => n.id === node.envelope)
            if (targetNode) {
              console.log('targetNode env', { targetNode })
              createConnection(node, targetNode)
            }
          }
        }
      })
    }, 100)

    Swal.fire({
      title: 'Configuration Loaded!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  }
}

const selectedNode = computed(() => storeAudio.selectedNode)

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

onMounted(async () => {
  const leaderLineModule = await import('leader-line-new')
  LeaderLine = leaderLineModule.default

  window.addEventListener('mousemove', (e) => {
    handleNodeDrag(e)
    updateTempLine(e)
  })
  window.addEventListener('mouseup', stopNodeDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleNodeDrag)
  window.removeEventListener('mouseup', stopNodeDrag)
  clearConnections()
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
      @click="handleBackgroundClick"
    >
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
        <div class="node-header">
          {{ node.label }}
          <button 
            v-if="node.type !== 'destination'"
            class="delete-node-btn"
            @click.stop="deleteNode(node.id)"
          >
            ×
          </button>
        </div>
        <div class="node-ports">
          <div
            v-if="node.type !== 'mod'"
            class="port port-in"
            :id="`port-in-${node.id}`"
            @mouseup="(e) => finishConnecting(node, e)"
          ></div>
          <div
            v-if="! ['destination', 'adsr'].includes(node.type)"
            class="port port-out"
            :id="`port-out-${node.id}`"
            @mousedown="(e) => startConnecting(e, node)"
          ></div>
        </div>
      </div>
      <NodeParamEditor 
        v-if="activeNodeId"
        :style="{
          position: 'absolute',
          left: (nodes.find(n => n.id === activeNodeId)?.x || 0) + 220 + 'px',
          top: (nodes.find(n => n.id === activeNodeId)?.y || 0) + 'px'
        }"
      />
    </div>
  </div>
  {{ storeAudio.selectedNode }}
</template>

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
  position: relative;
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

.port-out::before {
  border-color: #53f253;
}

.port-in {
  margin-right: 10px;
}

.port-out {
  margin-left: 10px;
}

.delete-node-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #ff4444;
  font-size: 16px;
  padding: 0 5px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.delete-node-btn:hover {
  opacity: 1;
}

.node-header {
  position: relative;
  padding: 10px;
  background: #4a4a4a;
  border-radius: 4px 4px 0 0;
  font-weight: 500;
}
</style>