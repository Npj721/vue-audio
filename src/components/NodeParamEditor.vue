<template>
  <div class="node-param-editor">
    <form @submit.prevent="updateParameters">
      <div v-if="selectedNode" :key="selectedNode.id">
        <div v-if="selectedNode.type === 'osc'">
          <h3>Osc</h3>
          <label :for="'param-input-type'">Type</label>
          <select id="param-input-type" v-model="selectedNode.param.type">
            <option :selected="selectedNode.param.type === 'sine'" value="sine">
              Sine
            </option>
            <option :selected="selectedNode.param.type === 'triangle'" value="triangle">
              Triangle
            </option>
            <option :selected="selectedNode.param.type === 'square'" value="square">
              Square
            </option>
            <option :selected="selectedNode.param.type === 'sawtooth'" value="sawtooth">
              Sawtooth
            </option>
          </select>
          <label :for="'param-input-detune'">Detune</label>
          <input id='param-input-detune' type="number" step="0.01"  v-model="selectedNode.param.detune">
        </div>

        <div v-if="selectedNode.type === 'mod'">
          <h3>Mod</h3>
          <label :for="'param-input-type'">Type</label>
          <select id="param-input-type" v-model="selectedNode.param.type">
            <option :selected="selectedNode.param.type === 'sine'" value="sine">
              Sine
            </option>
            <option :selected="selectedNode.param.type === 'triangle'" value="triangle">
              Triangle
            </option>
            <option :selected="selectedNode.param.type === 'square'" value="square">
              Square
            </option>
            <option :selected="selectedNode.param.type === 'sawtooth'" value="sawtooth">
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

        <div v-if="selectedNode.type === 'gain'">
          <h3>Gain</h3>
          <label :for="'param-input-gain'">Gain</label>
          <input id='param-input-gain' type="number" step="0.01"  v-model="selectedNode.param.gain">
        </div>

        <div v-if="selectedNode.type === 'adsr'">
          <h3>ADSR</h3>
          <label :for="'param-input-start'">Start</label>
          <input id='param-input-start' type="number" step="0.01"  v-model="selectedNode.param.start.value">

          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Valeur</th>
                <th>Durée</th>
                <th>Constante</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ATK</td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.attack.value">
                </td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.attack.duration">
                </td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.attack.constant">
                </td>
              </tr>

              <tr>
                <td>DCY</td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.decay.value">
                </td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.decay.duration">
                </td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.decay.constant">
                </td>
              </tr>

              <tr>
                <td>SUS</td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.sustain.value">
                </td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.sustain.duration">
                </td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.sustain.constant">
                </td>
              </tr>

              <tr>
                <td>RLE</td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.release.value">
                </td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.release.duration">
                </td>
                <td>
                  <input type="number" step="0.0001" v-model="selectedNode.param.release.constant">
                </td>
              </tr>
            </tbody>
          </table>
          Total : {{ (selectedNode.param.attack.duration || 0) + (selectedNode.param.decay.duration || 0) + (selectedNode.param.sustain.duration || 0) + (selectedNode.param.release.duration || 0)  }}
        </div>

        <div v-if="selectedNode.type === 'delay'">
          <h3>Gain</h3>
          <label :for="'param-input-delay'">Delay</label>
          <input id='param-input-delay' type="number" step="0.01"  v-model="selectedNode.param.delay">
        </div>

        <div v-if="selectedNode.type === 'superosc'">
          <h3>Super Oscillateur</h3>
          <label :for="'param-input-nombre'">Nombre d'oscillateurs</label>
          <input id='param-input-nombre' type="number" v-model="selectedNode.param.nombre">
          
          <button @click="setSuperOsc('SuperSaw')">Super Saw</button>
          <button  @click="setSuperOsc('OrgueNorm')">Orgue like</button>
          <button  @click="setSuperOsc('OrgueReal')">Orgue Real</button>
          <button  @click="setSuperOsc('OrgueBalanced')">Orgue Balanced</button>
          <button  @click="setSuperOsc('OrgueBalancedRandom')">Orgue Balanced+</button>
          
          
         
          
          <label :for="'param-input-maskDetune'">Mask Detune (séparé par ;)</label>
          <input id='param-input-maskDetune' type="text" v-model="selectedNode.param.maskDetune">
          
          <label :for="'param-input-maskGain'">Mask Gain (séparé par ;)</label>
          <input id='param-input-maskGain' type="text" v-model="selectedNode.param.maskGain">
          
          <label :for="'param-input-maskType'">Mask Type (séparé par ;)</label>
          <input id='param-input-maskType' type="text" v-model="selectedNode.param.maskType">
        </div>

        <div v-if="selectedNode.type === 'filter'">
          <h3>Filtre</h3>
          <label for="param-input-type">Type</label>
          <select id="param-input-type" v-model="selectedNode.param.type">
            <option value="lowpass">Passe-bas</option>
            <option value="highpass">Passe-haut</option>
            <option value="bandpass">Passe-bande</option>
            <option value="lowshelf">Low Shelf</option>
            <option value="highshelf">High Shelf</option>
            <option value="peaking">Peaking</option>
            <option value="notch">Notch</option>
            <option value="allpass">All-pass</option>
          </select>
          
          <label for="param-input-frequency">Fréquence (Hz)</label>
          <input id="param-input-frequency" type="number" min="20" max="20000" step="1" v-model="selectedNode.param.frequency">
          
          <label for="param-input-Q">Q</label>
          <input id="param-input-Q" type="number" min="0.0001" max="1000" step="0.1" v-model="selectedNode.param.Q">
          
          <label for="param-input-gain">Gain (dB)</label>
          <input id="param-input-gain" type="number" min="-40" max="40" step="0.1" v-model="selectedNode.param.gain">
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

const setSuperSaw = (nombre) => {

}

const setSuperOsc = (type) => {
  
  /*selectedNode.param.maskDetune
  selectedNode.param.maskGain
  selectedNode.param.maskType
  */
  let maskDetune = "";
  let maskGain = "";
  let maskType = "";
  console.log({ maskGain, maskDetune, maskType, selectedNode})


  switch(type){
    case "SuperSaw":{
        const tempGain = 1 / Math.sqrt(selectedNode.value.param.nombre)
        const realGain =  tempGain / selectedNode.value.param.nombre

        const detuneDouble = selectedNode.value.param.nombre - 1
        maskDetune = "0;"
        for (let index = 1; index < selectedNode.value.param.nombre / 2; index++) {
          maskDetune = maskDetune + "-" + index * 7 + ";" + + index * 7 + ";"
        }

        for (let index = 0; index < selectedNode.value.param.nombre; index++) {
          maskGain = maskGain + realGain + ";"
          maskType = maskType + "sawtooth;"
        }

        selectedNode.value.param.maskGain = maskGain
        selectedNode.value.param.maskDetune = maskDetune
        selectedNode.value.param.maskType = maskType
        console.log({ maskGain, maskDetune, maskType, selectedNode})
        break;
      }
     
      case "OrgueNorm": {
        const tempGain = 1 / Math.sqrt(selectedNode.value.param.nombre)
        const realGain =  tempGain / selectedNode.value.param.nombre

        const detuneDouble = selectedNode.value.param.nombre - 1
        maskDetune = "0;"
        for (let index = 1; index < selectedNode.value.param.nombre / 2; index++) {
          maskDetune = maskDetune + "-" + index * 600 + ";" + index * 600 + ";"
        }

        for (let index = 0; index < selectedNode.value.param.nombre; index++) {
          maskGain = maskGain + realGain + ";"
          maskType = maskType + "sawtooth;"
        }

        selectedNode.value.param.maskGain = maskGain
        selectedNode.value.param.maskDetune = maskDetune
        selectedNode.value.param.maskType = maskType
        console.log({ maskGain, maskDetune, maskType, selectedNode})
        break;

      }

      case "OrgueReal": {
        const harmonics = []; // Facteurs harmoniques (1x, 2x, 3x, ...)

        for (let index = 0; index < selectedNode.value.param.nombre; index++) {
          harmonics.push(index + 1)
        }
        const numOsc = harmonics.length;
        const tempGain = 1 / Math.sqrt(numOsc);

        for (let i = 0; i < numOsc; i++) {
          const harmonic = harmonics[i];
          const detuneCents = i === 0 ? 0 : (harmonic - 1) * 1200 + (Math.random() * 4 - 2); // Pas de detune aléatoire pour le 1er osc.

          maskDetune += `${detuneCents.toFixed(2)};`;
          maskGain += (tempGain / harmonic).toFixed(4) + ";";
          maskType += "sine;";
        }

        selectedNode.value.param.maskGain = maskGain;
        selectedNode.value.param.maskDetune = maskDetune;
        selectedNode.value.param.maskType = maskType;

        console.log({ maskGain, maskDetune, maskType, selectedNode });
 
        break;
      }

      case "OrgueBalanced": {
        let maskDetune = "";
        let maskGain = "";
        let maskType = "";

        const harmonics = []; // Facteurs harmoniques (1x, 2x, 3x, ...)

        for (let index = 0; index < selectedNode.value.param.nombre; index++) {
          harmonics.push(index + 1)
        }
        const numOsc = selectedNode.value.param.nombre; // Nombre d'oscillateurs
  const tempGain = 1 / Math.sqrt(numOsc);
  const realGain = tempGain / numOsc;

  const detuneMax = (numOsc - 1) / 2 * 1200; // Détune max en cents
  const step = 1200 / ((numOsc - 1) / 2); // Espacement entre chaque osc

  for (let i = 0; i < numOsc; i++) {
    let detuneCents = (i - (numOsc - 1) / 2) * step; // Centrage autour de 0

    maskDetune += `${detuneCents.toFixed(2)};`;
    maskGain += `${realGain.toFixed(4)};`;
    maskType += "sine;";
  }

  selectedNode.value.param.maskGain = maskGain;
  selectedNode.value.param.maskDetune = maskDetune;
  selectedNode.value.param.maskType = maskType;

  console.log({ maskGain, maskDetune, maskType, selectedNode });
  break;

      }


      case "OrgueBalancedRandom": {
        let maskDetune = "";
  let maskGain = "";
  let maskType = "";

  const numOsc = selectedNode.value.param.nombre; // Nombre d'oscillateurs
  const tempGain = 1 / Math.sqrt(numOsc);
  const realGain = tempGain / numOsc;

  const detuneMax = ((numOsc - 1) / 2) * 1200; // Déplacement max en cents
  const step = 1200 / ((numOsc - 1) / 2); // Espacement entre chaque osc

  for (let i = 0; i < numOsc; i++) {
    let detuneCents = (i - (numOsc - 1) / 2) * step; // Centrage autour de 0
    
    // Calcul du gain avec une courbe gaussienne inversée
    let distanceFromCenter = Math.abs(detuneCents / detuneMax); // Normalisé entre 0 et 1
    let adjustedGain = realGain * (1 - distanceFromCenter); // Plus éloigné = moins de gain

    detuneCents += Math.random() > .5 ? Math.random() * 10  : Math.random() * -10
    maskDetune += `${detuneCents.toFixed(2)};`;
    maskGain += `${adjustedGain.toFixed(4)};`;
    maskType += "sine;";
  }

  selectedNode.value.param.maskGain = maskGain;
  selectedNode.value.param.maskDetune = maskDetune;
  selectedNode.value.param.maskType = maskType;

  console.log({ maskGain, maskDetune, maskType, selectedNode });
  break;
      }
      
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