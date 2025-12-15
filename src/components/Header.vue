<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)

const logout = async () => {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <header class="border-b border-slate-200 bg-white w-full">
    <div class="mx-auto w-full max-w-5xl px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold tracking-tight text-slate-900">FYB Technologies</div>

        <button
          type="button"
          class="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          :disabled="loading"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
