<script setup>
import { ref, computed } from "vue";
import { data } from "./../../blocks.data.js";
import { useData } from "vitepress";
const { theme, page } = useData();
const config = ref(theme.value.config || {});

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
});

const isDragging = ref(false);
const startX = ref(0);
const currentX = ref(0);
const donate = ref(false);

const cards = computed(() => data.fundraisings.filter((f) => f.lang === page.value.frontmatter.lang));

const currentIndex = ref(cards.value.findIndex((item) => item.name === props.block.name) || 0);

const getCardStyle = (index) => {
  const offset = index - currentIndex.value;
  const absOffset = Math.abs(offset);

  if (absOffset === 0) {
    // Center card - full color, full size
    return {
      transform: "translateX(0%) scale(1) translateZ(0)",
      opacity: 1,
      zIndex: 15,
      filter: "grayscale(0%)",
    };
  } else if (absOffset === 1) {
    // Adjacent cards
    const translateX = offset > 0 ? 35 : -35;
    return {
      transform: `translateX(${translateX}%) scale(0.85) translateZ(-100px)`,
      opacity: 0.6,
      zIndex: 10,
      filter: "grayscale(80%)",
    };
  } else if (absOffset === 2) {
    // Second level cards
    const translateX = offset > 0 ? 60 : -60;
    return {
      transform: `translateX(${translateX}%) scale(0.7) translateZ(-200px)`,
      opacity: 0.3,
      zIndex: 5,
      filter: "grayscale(100%)",
    };
  } else {
    // Hidden cards
    const translateX = offset > 0 ? 80 : -80;
    return {
      transform: `translateX(${translateX}%) scale(0.6) translateZ(-300px)`,
      opacity: 0,
      zIndex: 0,
      filter: "grayscale(100%)",
    };
  }
};

const nextCard = () => {
  if (currentIndex.value < cards.value.length - 1) {
    donate.value = false;
    currentIndex.value++;
  }
};

const prevCard = () => {
  if (currentIndex.value > 0) {
    donate.value = false;
    currentIndex.value--;
  }
};

const handleTouchStart = (e) => {
  startX.value = e.touches[0].clientX;
};

const handleTouchEnd = (e) => {
  const endX = e.changedTouches[0].clientX;
  const diff = startX.value - endX;
  const threshold = 50;

  if (diff > threshold) {
    nextCard();
  } else if (diff < -threshold) {
    prevCard();
  }
};

const goToCard = (index) => {
  donate.value = false;
  currentIndex.value = index;
};
</script>

<template>
  <div class="fundraising max-w-3xl mx-auto p-6 my-6">
    <div v-if="block.title" class="text-center">
      <h2 class="my-2 text-4xl font-bold">{{ block.title }}</h2>
    </div>
    <div class="flex flex-col items-center justify-center px-4 overflow-hidden">
      <!-- 3D Carousel Container -->
      <div class="relative w-full max-w-6xl h-[500px] flex items-center justify-center">
        <!-- Cards -->
        <div class="relative w-full" @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchEnd">
          <div v-for="(card, index) in cards" :key="card.id" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 transition-all duration-700 ease-out cursor-pointer" :style="getCardStyle(index)" @click="goToCard(index)">
            <div class="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
              <!-- Image Section -->
              <div class="relative aspect-16/9 overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center">
                  <img :src="card.image" loading="lazy" :alt="card.title" class="w-full h-full object-cover" />
                </div>
              </div>

              <!-- Content Section -->
              <div class="p-3">
                <h2 class="text-2xl font-bold text-slate-900 mb-1">{{ card.name }}</h2>
                <p class="text-slate-600 mb-4">{{ card.description }}</p>

                <!-- Progress Stats -->
                <div class="mb-4">
                  <div class="flex justify-between items-baseline mb-2">
                    <span class="text-lg font-bold">{{ card.raised }}€</span>
                    <span class="text-slate-500 text-sm"> de {{ card.goal }}€</span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-gray-200 to-accent rounded-full transition-all duration-500 ease-out" :style="{ width: `${Math.min(card.progress, 100)}%` }"></div>
                  </div>

                  <div class="text-sm text-slate-600 mt-2">{{ card.progress }}% finaciado</div>
                </div>
                <!-- Action Buttons -->
                <div class="flex gap-3">
                  <button @click.stop="donate = true" v-if="donate == false || index != currentIndex" class="flex-1 bg-accent text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-101 transition-all duration-200 cursor-pointer">{{ card.action }}</button>

                  <div v-else v-for="bank in config.bank" class="text-accent">
                    <p v-if="bank.account.includes('https://')">
                      <strong>{{ bank.title }}: </strong><a :href="bank.account">{{ card.action }}</a>
                    </p>
                    <p v-else>
                      <strong>{{ bank.title }}: </strong>{{ bank.account }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Arrows -->
        <button v-if="cards.length > 1" @click="prevCard" :disabled="currentIndex === 0" :class="['absolute left-4 top-1/2 -translate-y-1/2 z-25 w-14 h-14 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 hover:bg-black/50 hover:scale-110 cursor-pointer hidden md:flex', currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100']">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button v-if="cards.length > 1" @click="nextCard" :disabled="currentIndex === cards.length - 1" :class="['absolute right-4 top-1/2 -translate-y-1/2 z-25 w-14 h-14 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 hover:bg-black/50 hover:scale-110 cursor-pointer hidden md:flex', currentIndex === cards.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100']">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
    <!-- Dot Indicators -->
    <div v-if="cards.length > 1" class="flex items-center justify-center gap-3 mb-8 mt-2">
      <button v-for="(card, index) in cards" :key="card.id" @click="goToCard(index)" :class="['w-3 h-3 rounded-full transition-all duration-300', currentIndex === index ? 'bg-black w-8' : 'bg-black/30 hover:bg-black/50']" />
    </div>
  </div>
</template>
