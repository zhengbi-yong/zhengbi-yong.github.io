<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  target: number
  duration?: number
  suffix?: string
  prefix?: string
  decimals?: number
}>()

const current = ref(0)
let animationFrameId: number | undefined

const animate = (start: number, end: number, duration: number) => {
  const startTime = performance.now()

  const update = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Easing function (easeOutQuart)
    const easeProgress = 1 - Math.pow(1 - progress, 4)

    current.value = start + (end - start) * easeProgress

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(update)
    } else {
      current.value = end
    }
  }

  animationFrameId = requestAnimationFrame(update)
}

onMounted(() => {
  animate(0, props.target, props.duration || 2000)
})

watch(() => props.target, (newVal) => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animate(current.value, newVal, props.duration || 2000)
})
</script>

<template>
  <span class="neon-counter">
    {{ props.prefix || '' }}{{ current.toFixed(props.decimals || 0) }}{{ props.suffix || '' }}
  </span>
</template>

<style scoped>
.neon-counter {
  font-family: 'Courier New', monospace;
  font-size: 2.5em;
  font-weight: bold;
  color: #00f0ff;
  text-shadow:
    0 0 10px #00f0ff,
    0 0 20px #00f0ff,
    0 0 40px #00f0ff;
}
</style>
