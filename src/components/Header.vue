<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'
import { Icon } from '@iconify/vue'
import Skeleton from './Skeleton.vue'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const isDropdownOpen = ref(false)

const logout = async () => {
  await authStore.logout()
  userStore.clearUser()
  await router.push('/login')
  isDropdownOpen.value = false
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-container')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="border-b border-slate-200 bg-white w-full">
    <div class="mx-auto w-full max-w-5xl px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="text-xl font-semibold tracking-tight text-slate-900">ProductSync</div>

        <div class="flex gap-5 items-center">
          <!-- Desktop: Show user name and logout button -->
          <div class="hidden md:flex md:gap-5 md:items-center">
            <div v-if="userStore.loading" class="flex items-center gap-2">
              <Skeleton height="1rem" width="80px" />
              <Skeleton height="1rem" width="60px" />
            </div>
            <div v-else>
              {{ userStore.user?.firstName }} {{ userStore.user?.lastName }}
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              @click="logout"
            >
              <Icon icon="mdi:logout" class="h-4 w-4" />
              Logout
            </button>
          </div>

          <!-- Mobile: Profile icon button -->
          <div class="relative dropdown-container md:hidden">
            <button
              type="button"
              class="inline-flex items-center rounded-md p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              @click="toggleDropdown"
              aria-label="Profile menu"
            >
              <Icon icon="mdi:account-circle" class="h-6 w-6" />
            </button>

            <!-- Dropdown -->
            <div
              v-show="isDropdownOpen"
              class="absolute right-0 mt-2 w-60 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50"
            >
              <div class="px-4 py-2 text-sm text-slate-700 border-b border-slate-200">
                <div v-if="userStore.loading" class="flex items-center gap-2">
                  <Skeleton height="1rem" width="60px" />
                  <Skeleton height="1rem" width="50px" />
                </div>
                <div v-else>
                  {{ userStore.user?.firstName }} {{ userStore.user?.lastName }}
                </div>
              </div>
              <div class="px-4 py-2">
                <button
                  type="button"
                  class="inline-flex w-full justify-center items-center gap-2 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                  @click="logout"
                >
                  <Icon icon="mdi:logout" class="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
