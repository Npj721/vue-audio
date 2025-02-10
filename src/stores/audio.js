import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAudioStore = defineStore('audio', () => {
    const _audioContext = ref(null)
    const _nodes = ref([])
    const _selectedNode = ref(null)
    const _synthConfigurations = ref([])
    const _currentConfigId = ref(null)
   
    const audioContext = computed(() => _audioContext.value)
    const nodes = computed(() => _nodes.value)
    const selectedNode = computed(() => _selectedNode.value)
    const synthConfigurations = computed(() => _synthConfigurations.value)
    const currentConfigId = computed(() => _currentConfigId.value)

    const playingNodes = ref({})

    // Initialize IndexedDB
    const DB_NAME = 'synthDB'
    const DB_VERSION = 1
    const STORE_NAME = 'synths'
    let db = null

    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                db = request.result
                resolve(db)
            }

            request.onupgradeneeded = (event) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' })
                }
            }
        })
    }

    async function loadSynthsFromDB() {
        if (!db) await initDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.getAll()

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                console.log('storeAudio.nodes', { res: request.result })
                _synthConfigurations.value = request.result
                resolve(request.result)
            }
        })
    }

    async function saveSynthToDB(synth) {
        if (!db) await initDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.put(synth)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
        })
    }

    async function deleteSynthFromDB(id) {
        if (!db) await initDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.delete(id)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    }

    function uuidV4() {
        const uuid = new Array(36);
        for (let i = 0; i < 36; i++) {
          uuid[i] = Math.floor(Math.random() * 16);
        }
        uuid[14] = 4;
        uuid[19] = uuid[19] &= ~(1 << 2);
        uuid[19] = uuid[19] |= (1 << 3);
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        return uuid.map((x) => x.toString(16)).join('');
    }
    
    function initAudioContext() {
        if(_audioContext.value === null) {  
            _audioContext.value = new AudioContext()
        }
    }

    function addNode(type, param, position) {
      initAudioContext();
      if(_audioContext.value !== null) {
        const id = uuidV4();
        _nodes.value.push({
          id,
          type,
          param,
          connections: [],
          envelope: null,
          position
        })
        return id
      }
      return null
    }

    function selectNodeFromIndex(index) {
      if(index >= 0 && index < _nodes.value.length) {
        _selectedNode.value = _nodes.value[index]
      }
    }

    function selectNodeFromId(id) {
        const s = _nodes.value.find(item => { return item.id === id})
        if(s){
            _selectedNode.value = s
        } else {
            _selectedNode.value = null
        }
    }

    function connectNodes(sourceIndex, destinationIndex) {
        if (
            sourceIndex >= 0 && sourceIndex < _nodes.value.length &&
            destinationIndex >= 0 && destinationIndex < _nodes.value.length
        ) {
            const source = _nodes.value[sourceIndex]
            const destination = _nodes.value[destinationIndex]
            _nodes.value[sourceIndex].connections.push(destination.id)
        }
    }

    function connectGainToEnveloppe(sourceIndex, destinationIndex) {
        if (
            sourceIndex >= 0 && sourceIndex < _nodes.value.length &&
            destinationIndex >= 0 && destinationIndex < _nodes.value.length
        ) {
            const source = _nodes.value[sourceIndex]
            const destination = _nodes.value[destinationIndex]

            if(source.type === 'gain' && destination.type === 'adsr'){
                source.envelope = destination.id
            }
        }
    }

    function connectToDestination(nodeIndex) {
        if (nodeIndex >= 0 && nodeIndex < _nodes.value.length) {
            _nodes.value[nodeIndex].connections.push('destination')
        }
    }

    function removeConnection(fromId, toId) {
        const sourceNode = _nodes.value.find(n => n.id === fromId)
        if (sourceNode) {
            sourceNode.connections = sourceNode.connections.filter(id => id !== toId && id !== 'destination')
            if (sourceNode.type === 'gain' && sourceNode.envelope === toId) {
                sourceNode.envelope = null
            }
        }
    }

    async function saveSynthConfiguration(name) {
        const id = uuidV4()
        const synthConfig = {
            id,
            name,
            nodes: JSON.parse(JSON.stringify(_nodes.value))
        }
        _synthConfigurations.value.push(synthConfig)
        await saveSynthToDB(synthConfig)
        _currentConfigId.value = id
        return id
    }

    async function updateSynthConfiguration(id, name) {
        const synthConfig = {
            id,
            name,
            nodes: JSON.parse(JSON.stringify(_nodes.value))
        }
        
        const index = _synthConfigurations.value.findIndex(c => c.id === id)
        if (index !== -1) {
            _synthConfigurations.value[index] = synthConfig
        }
        
        await saveSynthToDB(synthConfig)
        return id
    }

    async function deleteSynthConfiguration(id) {
        _synthConfigurations.value = _synthConfigurations.value.filter(config => config.id !== id)
        await deleteSynthFromDB(id)
        if (_currentConfigId.value === id) {
            _currentConfigId.value = null
        }
        return true
    }

    function clearCurrentConfiguration() {
        _nodes.value = []
        _currentConfigId.value = null
    }

    function loadSynthConfiguration(id) {
        const config = _synthConfigurations.value.find(c => c.id === id)
        if (config) {
            _nodes.value = JSON.parse(JSON.stringify(config.nodes))
            _currentConfigId.value = id
            return true
        }
        return false
    }

    function removeNode(nodeId) {
        _nodes.value = _nodes.value.filter(node => node.id !== nodeId)
        // Also remove any connections that involve this node
        _nodes.value.forEach(node => {
            node.connections = node.connections.filter(conn => conn !== nodeId)
            if (node.envelope === nodeId) {
                node.envelope = null
            }
        })
    }

    function createAudioNode(nodeInfo) {
        switch (nodeInfo.type) {
            case 'osc':
                const osc = _audioContext.value.createOscillator()
                osc.type = nodeInfo.param.type || 'sine'
                osc.detune.value = nodeInfo.param.detune || 0
                return osc

            case 'mod':
                const oscmod = _audioContext.value.createOscillator()
                oscmod.type = nodeInfo.param.type || 'sine'
                oscmod.detune.value = nodeInfo.param.detune || 0
                oscmod.frequency.value = nodeInfo.param.frequency || 10

                const gainmod = _audioContext.value.createGain()
                gainmod.gain.value = nodeInfo.param.gain || 150; 

                oscmod.connect(gainmod)

                return { type: 'mod', osc: oscmod, gain: gainmod }

            case 'gain':
                const gain = _audioContext.value.createGain()
                // Set initial gain value from the node parameters
                gain.gain.value = nodeInfo.param.gain || 0
                return gain

            case 'adsr':
                return {
                    start: nodeInfo.param.start || { value: 0 },
                    attack: nodeInfo.param.attack || { value: 0.7, duration: .15, constant:.1 },
                    decay: nodeInfo.param.decay || { value: 0.5, duration: .25, constant:.1 },
                    sustain: nodeInfo.param.sustain || { value: 0.45, duration: .5, constant:.1 },
                    release: nodeInfo.param.release || { value: 0.0000001, duration: .5, constant:.1 }
                }
            default:
                throw new Error(`${nodeInfo.type} n'est pas supporté`)
        }
    }

    function press(configId, delay = 0, frequency = 880) {
        if(_audioContext.value !== null) {  
            // Stop any nodes already playing at the same frequency
            stopPlayingNodesAtFrequency(frequency)
            const currentTime = _audioContext.value.currentTime + delay
            const audioNodes = new Map()
            const config = _synthConfigurations.value.find(c => c.id === configId)
            
            if (!config) return

            // Create all nodes first
            config.nodes.forEach(nodeInfo => {
                const node = createAudioNode(nodeInfo)

                if (node.type === 'mod'){
                    
                    audioNodes.set(nodeInfo.id, { node: {gain: node.gain, osc: node.osc }, info: { ...nodeInfo, id: nodeInfo.id} })
                }else{
                    audioNodes.set(nodeInfo.id, { node, info: nodeInfo })
                }
                
            })

            // Make all connections
            audioNodes.forEach(({ node, info }) => {
                console.log('press node', { node })
                info.connections.forEach(destId => {
                    console.log('press node connection', { destId })

                    if (destId === 'destination') {
                        node.connect(_audioContext.value.destination)
                    } else {
                        const destNode = audioNodes.get(destId)
                        if (destNode) {
                            console.log('connection', { node, destNode })
                            if(info.type === 'mod' && destNode.type === 'osc'){
                                node.gain.connect(destNode.node.frequency)
                            }else{
                                node.connect(destNode.node)
                            }
                            
                        }
                    }
                })
            })

            // Set frequencies and start oscillators
            audioNodes.forEach(({ node, info }) => {
                if (info.type === 'osc') {
                    node.frequency.value = frequency
                    node.start()
                } else if (info.type === 'mod') {
                    node.osc.frequency.value = info.param.freq
                    node.osc.start()

                    console.log('Set frequencies and start oscillators', {node, info})
                }
                
                else if (info.type === 'gain') {
                    if (info.envelope) {
                        // If there's an envelope, use it
                        const envelopeInfo = audioNodes.get(info.envelope)
                        if (envelopeInfo) {
                            const env = envelopeInfo.node
                            node.gain.cancelScheduledValues(currentTime)
                            node.gain.setValueAtTime(env.start.value * info.param.gain, currentTime)
                            node.gain.setTargetAtTime(env.attack.value * info.param.gain, currentTime + env.attack.duration, env.attack.constant || .1)
                            node.gain.setTargetAtTime(env.decay.value * info.param.gain, currentTime + env.attack.duration + env.decay.duration, env.decay.constant || .1)
                            node.gain.setTargetAtTime(env.sustain.value * info.param.gain, currentTime + env.attack.duration + env.decay.duration + env.sustain.duration, env.sustain.constant || .1)
                            node.gain.setTargetAtTime(env.release.value * info.param.gain, currentTime + env.attack.duration + env.decay.duration + env.sustain.duration + env.release.duration, env.release.constant || .1)
                        }
                    } else {
                        // If no envelope, simply set the gain value directly
                        node.gain.setValueAtTime(info.param.gain, currentTime)
                    }
                }
            })

            if (!playingNodes.value[frequency]) {
                playingNodes.value[frequency] = []
            }

            playingNodes.value[frequency].push({ configId, audioNodes })
        }
    }

    function stopPlayingNodesAtFrequency(frequency) {
        if (_audioContext.value !== null && playingNodes.value[frequency]) {
            const currentTime = _audioContext.value.currentTime

            playingNodes.value[frequency].forEach(({ audioNodes }) => {
                audioNodes.forEach(({ node, info }) => {
                    if (info.type === 'osc') {
                        node.stop(currentTime + 0.1) // Add a small delay to avoid clicks
                    } else if (info.type === 'gain') {
                        if (info.envelope) {
                            // If there's an envelope, use its release
                            const envelopeInfo = audioNodes.get(info.envelope)
                            if (envelopeInfo) {
                                const env = envelopeInfo.node
                                node.gain.cancelScheduledValues(currentTime)
                                node.gain.setTargetAtTime(0, currentTime, env.release.constant || 0.1)
                            }
                        } else {
                            // If no envelope, simply ramp to zero quickly
                            node.gain.cancelScheduledValues(currentTime)
                            node.gain.setTargetAtTime(0, currentTime, 0.01)
                        }
                    }
                })
            })

            delete playingNodes.value[frequency]
        }
    }

    function release(configId, delay = 0, frequency) {
        if (_audioContext.value !== null && playingNodes.value[frequency]) {
            const currentTime = _audioContext.value.currentTime + delay
            
            const frequencyNodes = playingNodes.value[frequency].filter(n => n.configId === configId)
            
            frequencyNodes.forEach(({ audioNodes }) => {
                audioNodes.forEach(({ node, info }) => {
                    if (info.type === 'gain') {
                        if (info.envelope) {
                            // If there's an envelope, use its release
                            const envelopeInfo = audioNodes.get(info.envelope)
                            if (envelopeInfo) {
                                const env = envelopeInfo.node
                                node.gain.cancelScheduledValues(currentTime)
                                node.gain.setTargetAtTime(0, currentTime, env.release.constant || 0.1)
                            }
                        } else {
                            // If no envelope, ramp to zero quickly
                            node.gain.cancelScheduledValues(currentTime)
                            node.gain.setTargetAtTime(0, currentTime, 0.01)
                        }
                    }
                })

                setTimeout(() => {
                    audioNodes.forEach(({ node, info }) => {
                        if (info.type === 'osc') {
                            console.log('osc stopped ! ', { node, info })
                            node.stop()
                        }
                    })
                }, (delay + 0.1) * 1000) // Shorter delay for cleaner release
            })

            setTimeout(() => {
                if (playingNodes.value[frequency]) {
                    playingNodes.value[frequency] = playingNodes.value[frequency].filter(n => n.configId !== configId)
                    if (playingNodes.value[frequency].length === 0) {
                        delete playingNodes.value[frequency]
                    }
                }
            }, (delay + 0.2) * 1000)
        }
    }

    // Load synths from IndexedDB when the store is initialized
    loadSynthsFromDB().catch(console.error)

    return { 
        audioContext,
        initAudioContext,
        addNode,
        nodes,
        selectNodeFromIndex,
        selectNodeFromId,
        selectedNode,
        connectNodes,
        connectToDestination,
        connectGainToEnveloppe,
        removeConnection,
        press,
        release,
        saveSynthConfiguration,
        updateSynthConfiguration,
        deleteSynthConfiguration,
        clearCurrentConfiguration,
        synthConfigurations,
        loadSynthConfiguration,
        currentConfigId,
        removeNode
    }
})