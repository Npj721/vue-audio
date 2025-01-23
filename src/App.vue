<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="container">
    <header>
      <h1>Éditeur de Synthé</h1>
      <nav>
        <button 
          class="nav-button" 
          @click="router.push('/')"
          :class="{ active: $route.path === '/' }"
        >
          Editor
        </button>
        <button 
          class="nav-button" 
          @click="router.push('/board')"
          :class="{ active: $route.path === '/board' }"
        >
          Board
        </button>
      </nav>
    </header>
    <router-view></router-view>
  </div>
</template>

<style>
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 0;
}

h1 {
  margin: 0;
}

nav {
  display: flex;
  gap: 1rem;
}

.nav-button {
  background: #3a3a3a;
  border: none;
  padding: 0.5rem 1rem;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-button:hover {
  background: #4a4a4a;
}

.nav-button.active {
  background: #646cff;
}

.nav-button.active:hover {
  background: #535bf2;
}
</style>