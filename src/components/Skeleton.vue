<template>
  <div
    :class="[
      'animate-pulse bg-slate-200',
      rounded ? 'rounded-md' : '',
      customClass
    ]"
    :style="{ width, height }"
  />
</template>

<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  rounded?: boolean
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  rounded: false,
  customClass: '',
})
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.animate-pulse {
  animation: shimmer 1.5s ease-in-out infinite;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200px 100%;
}
</style>
