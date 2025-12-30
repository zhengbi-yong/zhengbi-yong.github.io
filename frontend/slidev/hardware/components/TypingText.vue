<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  text: string
  speed?: number
  delay?: number
  class?: string
}>()

const displayText = ref('')
const showCursor = ref(true)
let currentIndex = 0

onMounted(() => {
  setTimeout(() => {
    const interval = setInterval(() => {
      if (currentIndex < props.text.length) {
        displayText.value += props.text[currentIndex]
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, props.speed || 100)
  }, props.delay || 0)
})
</script>

<template>
  <span :class="props.class">
    {{ displayText }}<span v-if="showCursor" class="cursor">|</span>
  </span>
</template>

<style scoped>
.cursor {
  animation: blink 1s infinite;
  color: #00f0ff;
  text-shadow: 0 0 10px #00f0ff;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
