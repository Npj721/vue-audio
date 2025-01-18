<script setup>
import NodeEditor from './components/NodeEditor.vue'
</script>

<template>
  <div class="container">
    <h1>Éditeur de Synthé</h1>
    <NodeEditor />
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 2rem;
}
</style>