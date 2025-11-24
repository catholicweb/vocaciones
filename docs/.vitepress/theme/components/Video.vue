<template>
  <div v-if="block.title" class="text-center">
    <h2 class="mt-8 text-4xl font-bold">{{ block.title }}</h2>
  </div>

  <div class="video" :class="block.grid">
    <div v-for="(item, i) in block.elements" :key="i">
      <div class="relative rounded-lg overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all aspect-[16/9]">
        <div v-if="playingVideo === item.src" class="w-full h-full bg-black">
          <iframe :src="`https://www.youtube.com/embed/${item.id}?autoplay=1&rel=0`" class="w-full h-full" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>

        <div v-else @click="handleClick(item)" class="w-full h-full relative facade-image bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${item.image})` }">
          <!-- Overlay degradado y título -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-end p-6">
            <h3 class="text-xl font-bold text-white mb-1">{{ item.title }}</h3>
          </div>
          <!-- YouTube logo overlay -->
          <div class="absolute inset-0 flex items-center justify-center facade youtube-logo"></div>
        </div>
      </div>
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

const playingVideo = ref(null);

function handleClick(item) {
  playingVideo.value = item.src;
}
</script>

<style scoped>
/* YouTube logo overlay centrado */
.youtube-logo {
  background-image: url("data:image/svg+xml,%3Csvg width='159' height='110' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m154 17.5c-1.82-6.73-7.07-12-13.8-13.8-9.04-3.49-96.6-5.2-122 0.1-6.73 1.82-12 7.07-13.8 13.8-4.08 17.9-4.39 56.6 0.1 74.9 1.82 6.73 7.07 12 13.8 13.8 17.9 4.12 103 4.7 122 0 6.73-1.82 12-7.07 13.8-13.8 4.35-19.5 4.66-55.8-0.1-75z' fill='%23f00'/%3E%3Cpath d='m105 55-40.8-23.4v46.8z' fill='%23fff'/%3E%3C/svg%3E%0A");
  background-size: 20%;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s;
}

/* efecto hover opcional */
.facade-image:hover .youtube-logo {
  transform: scale(1.1);
}
</style>
