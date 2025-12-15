<script setup lang="ts">
import { RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import Header from './components/Header.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <Header v-if="isAuthenticated" />
    <div class="mx-auto w-full px-4 py-10" :class="isAuthenticated ? 'max-w-5xl' : 'max-w-md'">
      <RouterView />
    </div>
  </main>
</template>
