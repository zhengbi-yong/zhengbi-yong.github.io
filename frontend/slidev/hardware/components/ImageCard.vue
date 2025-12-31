<script setup lang="ts">
const props = defineProps<{
  src: string
  alt: string
  caption?: string
  delay?: number
  width?: string
  height?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center">
    <div
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{
        opacity: 1,
        scale: 1,
        transition: {
          duration: 600,
          delay: delay || 0,
          ease: 'easeOut'
        }
      }"
      :class="['rounded-xl shadow-lg overflow-hidden', width || 'w-80', height || 'h-80']"
    >
      <img :src="src" :alt="alt" class="w-full h-full object-contain" />
    </div>
    <div
      v-if="caption"
      v-motion
      :initial="{ opacity: 0, y: 10 }"
      :enter="{
        opacity: 1,
        y: 0,
        transition: { duration: 500, delay: (delay || 0) + 200, ease: 'easeOut' }
      }"
      class="mt-4 text-lg font-semibold text-center text-gray-700"
    >
      {{ caption }}
    </div>
  </div>
</template>
