<template>
  <div class="max-w-3xl mx-auto space-y-3 px-4 mb-12">
    <div v-for="(item, i) in block.elements" :key="i" class="rounded-md shadow-md overflow-hidden">
      <button @click="toggleAccordion(i)" class="w-full px-6 py-4 flex items-center justify-between text-left">
        <div class="text-md font-bold text-center text-gray-900 pr-4">{{ item.title }}</div>
        <svg class="w-5 h-5 text-accent transition-transform flex-shrink-0" :class="{ 'rotate-180': accordionOpen[i] }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div v-show="accordionOpen[i]" class="p-6 text-gray-600 prose" v-html="item.html"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
});

// Accordion state management
const accordionOpen = ref({});

const toggleAccordion = (index) => {
  accordionOpen.value[index] = !accordionOpen.value[index];
};
</script>
