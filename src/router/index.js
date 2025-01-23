import { createRouter, createWebHistory } from 'vue-router'
import NodeEditor from '../components/NodeEditor.vue'
import BoardSynth from '../components/BoardSynth.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: NodeEditor
    },
    {
      path: '/board',
      name: 'board',
      component: BoardSynth
    }
  ]
})

export default router