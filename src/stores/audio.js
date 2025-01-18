import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAudioStore = defineStore('audio', () => {
    const _audioContext = ref(null)
    const _nodes = ref([])
    const _selectedNode = ref(null)
   
    const audioContext = computed(() => _audioContext.value)
    const nodes = computed(() => _nodes.value)
    const selectedNode = computed(() => _selectedNode.value)

    const playingNodes = ref([])

    function uuidV4() {
        const uuid = new Array(36);
        for (let i = 0; i < 36; i++) {
          uuid[i] = Math.floor(Math.random() * 16);
        }
        uuid[14] = 4; // set bits 12-15 of time-high-and-version to 0100
        uuid[19] = uuid[19] &= ~(1 << 2); // set bit 6 of clock-seq-and-reserved to zero
        uuid[19] = uuid[19] |= (1 << 3); // set bit 7 of clock-seq-and-reserved to one
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        return uuid.map((x) => x.toString(16)).join('');
      }

    
    function initAudioContext() {
      _audioContext.value = new AudioContext()
    }

    function addNode(type, param){
      if(_audioContext.value !== null){
        const id = uuidV4();
        switch (type) {
          case 'osc':
              addOscillator(param, id)
            break;

          case 'gain':
              addGain(param, id)
            break;
        
           case 'adsr':
              addADSR(param, id)
            break;

          default:
              throw new Error(`${type} n'est pas supporté`)
        }
        return id
      }
      return null
    }

    function addOscillator(param, id){
      const osc = _audioContext.value.createOscillator()
      osc.type = param.type || 'sine'
      osc.detune.value = param.detune || 0
      osc.start()

      _nodes.value.push({
        id,
        type: 'osc',
        node: osc,
        connections: [],
        param
      })
    }

    function addGain(param, id) {
        const gain = _audioContext.value.createGain()
        gain.gain.value = 0; //param.gain || 1
        _nodes.value.push({
            id,
            type: 'gain',
            node: gain,
            connections: [],
            envelope: null,
            param
        })
    }
    // setTargetAtTime
    function addADSR(param, id) {
        const envelope = {
            start: param.start || { value: 0 },
            attack: param.attack || { value: 0.7, duration: .15},
            decay: param.decay || { value: 0.5, duration: .25},
            sustain: param.sustain || { value: 0.45, duration: .5},
            release: param.release || { value: 0.0000001, duration: .5}
        }
        _nodes.value.push({
            id,
            type: 'adsr',
            node: envelope,
            connections: []
        })
    }



    function selectNodeFromIndex(index){
      if(index >= 0 && index < _nodes.value.length){
        _selectedNode.value = _nodes.value[index]
      }
    }

    function connectNodes(sourceIndex, destinationIndex) {
        if (
            sourceIndex >= 0 && sourceIndex < _nodes.value.length &&
            destinationIndex >= 0 && destinationIndex < _nodes.value.length
        ) {
            const source = _nodes.value[sourceIndex]
            const destination = _nodes.value[destinationIndex]

            if (source.node.connect && destination.node) {
                source.node.connect(destination.node)
                _nodes.value[sourceIndex].connections.push(destination.id)
            }
        }
    }

    function connectGainToEnveloppe(sourceIndex, destinationIndex) {
        console.log('connectGainToEnveloppe', { sourceIndex, destinationIndex })
        if (
            sourceIndex >= 0 && sourceIndex < _nodes.value.length &&
            destinationIndex >= 0 && destinationIndex < _nodes.value.length
        ) {
            const source = _nodes.value[sourceIndex]
            const destination = _nodes.value[destinationIndex]
            console.log('connectGainToEnveloppe', { source, destination })

            if(source.type === 'gain' && destination.type === 'adsr'){
                source.envelope = destination.id
            }
        }
    }

    function connectToDestination(nodeIndex) {
        if (nodeIndex >= 0 && nodeIndex < _nodes.value.length) {
            const node = _nodes.value[nodeIndex].node
            if (node.connect && _audioContext.value.destination) {
                node.connect(_audioContext.value.destination)
                _nodes.value[nodeIndex].connections.push('destination')
            }
        }
    }


    function press(delay = 0, frequency = 880){
        if(_audioContext.value !== null){
          const currentTime = _audioContext.value.currentTime + delay
        
          _nodes.value.filter(nodeOsc => nodeOsc.type === 'osc').forEach(oscNode => {
            console.log(oscNode)
            oscNode.node.frequency.value = frequency
            // search after gain for the osc and search after env attached to gain 
            const gains = _nodes.value.filter( nodeAdsr => nodeAdsr.id.includes(oscNode.connections))
            gains.forEach(gain => {
                console.log('start - gain ', { gain })
                if(gain.envelope !== null ){
                    const time = 1
                    const envelope = _nodes.value.find(env => env.id === gain.envelope) 
                    const envelopeNode = envelope !== null ? envelope.node : null
                    
                    console.log('gain - env', { envelope, attack: envelopeNode.attack, c: envelopeNode.release.constant})
                    gain.node.gain.cancelScheduledValues(currentTime)
                    gain.node.gain.setValueAtTime(envelopeNode.start.value * gain.param.gain, currentTime)
                    gain.node.gain.setTargetAtTime(envelopeNode.attack.value * gain.param.gain, currentTime + envelopeNode.attack.duration, envelopeNode.attack.constant || .1)
                    gain.node.gain.setTargetAtTime(envelopeNode.decay.value * gain.param.gain, currentTime + envelopeNode.attack.duration + envelopeNode.decay.duration, envelopeNode.attack.decay || .1)
                    gain.node.gain.setTargetAtTime(envelopeNode.sustain.value * gain.param.gain, currentTime + envelopeNode.attack.duration + envelopeNode.decay.duration + envelopeNode.sustain.duration, envelopeNode.attack.sustain || .1)
                    gain.node.gain.setTargetAtTime(envelopeNode.release.value * gain.param.gain, currentTime + envelopeNode.attack.duration + envelopeNode.decay.duration + envelopeNode.sustain.duration + envelopeNode.release.duration, envelopeNode.release.constant || .1)
                }
            });
            // oscNode.node.start(currentTime)
          })
        }
      }
  
      function release(delay = 0){
        if(_audioContext.value !== null){
          const currentTime = _audioContext.value.currentTime + delay
        
          _nodes.value.filter(nodeOsc => nodeOsc.type === 'osc').forEach(oscNode => {
            console.log(oscNode)
           
            const gains = _nodes.value.filter( nodeAdsr => nodeAdsr.id.includes(oscNode.connections))
            gains.forEach(gain => {
                console.log('start - gain ', { gain })
                if(gain.envelope !== null ){
                    const time = 1
                    const envelope = _nodes.value.find(env => env.id === gain.envelope) 
                    const envelopeNode = envelope !== null ? envelope.node : null
                    
                    console.log('gain - env - release', { envelope, attack: envelopeNode.attack})
                    gain.node.gain.cancelScheduledValues(currentTime)
                    gain.node.gain.setTargetAtTime(0, currentTime + .2, envelopeNode.release.constant || .1)
                }
            });
            // oscNode.node.start(currentTime)
          })
        }
      }

    return { 
        audioContext,
        initAudioContext,
        addNode,
        nodes,
        selectNodeFromIndex,
        selectedNode,
        connectNodes,
        connectToDestination,
        connectGainToEnveloppe,
        press,
        release
    }
  })