<template>
  <div v-if="block.title" class="text-center">
    <h2 class="mt-8 text-4xl font-bold">{{ block.title }}</h2>
  </div>

  <div class="video" :class="block.grid">
    <div v-for="(item, i) in block.elements" :key="i">
      <div class="relative rounded-lg overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all aspect-[16/9]">
        <div v-if="playingVideo === item.src" class="w-full h-full items-end bg-black">
          <iframe :src="item.src" data-testid="embed-iframe" width="100%" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" class="w-full h-full" loading="lazy"></iframe>
        </div>

        <div v-else @click="handleClick(item)" class="w-full h-full relative facade-image bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${item.image})` }">
          <!-- Overlay degradado y título -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-end p-6">
            <h3 class="text-xl font-bold text-white mb-1">{{ item.title }}</h3>
          </div>
          <!-- YouTube logo overlay -->
          <div class="absolute inset-0 flex items-center justify-center facade" :class="item.src.includes('youtube') ? 'youtube-logo' : 'spotify-logo'"></div>
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

<style>
/* YouTube logo overlay centrado */
.youtube-logo {
  background-image: url("data:image/svg+xml,%3Csvg width='159' height='110' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m154 17.5c-1.82-6.73-7.07-12-13.8-13.8-9.04-3.49-96.6-5.2-122 0.1-6.73 1.82-12 7.07-13.8 13.8-4.08 17.9-4.39 56.6 0.1 74.9 1.82 6.73 7.07 12 13.8 13.8 17.9 4.12 103 4.7 122 0 6.73-1.82 12-7.07 13.8-13.8 4.35-19.5 4.66-55.8-0.1-75z' fill='%23f00'/%3E%3Cpath d='m105 55-40.8-23.4v46.8z' fill='%23fff'/%3E%3C/svg%3E%0A");
  background-size: 20%;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s;
}

.spotify-logo {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 168 168'%3E%3Ccircle cx='84' cy='84' r='84' fill='black'/%3E%3Cpath d='M83.7 0C37.5 0 0 37.5 0 83.7c0 46.3 37.5 83.7 83.7 83.7 46.3 0 83.7-37.5 83.7-83.7S130 0 83.7 0zM122 120.8c-1.4 2.5-4.6 3.2-7 1.7-19.8-12-44.5-14.7-73.7-8-2.8.5-5.6-1.2-6.2-4-.2-2.8 1.5-5.6 4-6.2 32-7.3 59.6-4.2 81.6 9.3 2.6 1.5 3.4 4.7 1.8 7.2zM132.5 98c-2 3-6 4-9 2.2-22.5-14-56.8-18-83.4-9.8-3.2 1-7-1-8-4.3s1-7 4.6-8c30.4-9 68.2-4.5 94 11 3 2 4 6 2 9zm1-23.8c-27-16-71.6-17.5-97.4-9.7-4 1.3-8.2-1-9.5-5.2-1.3-4 1-8.5 5.2-9.8 29.6-9 78.8-7.2 109.8 11.2 3.7 2.2 5 7 2.7 10.7-2 3.8-7 5-10.6 2.8z' fill='%2392d500'/%3E%3C/svg%3E");
  background-size: 20%;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s;
}

.vimeo-logo {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 168 168'%3E%3Cpath d='M0 48.3c0-1.6 0.4-2.7 1.2-3.5s1.9-1.2 3.4-1.2h13.2c1.6 0 2.7 0.4 3.4 1.2 0.8 0.8 1.2 1.9 1.2 3.5v71.5c0 1.6-0.4 2.7-1.2 3.5-0.8 0.8-1.9 1.2-3.4 1.2H4.6c-1.6 0-2.7-0.4-3.4-1.2-0.8-0.8-1.2-1.9-1.2-3.5V48.3zM39.7 48.3h16.4c1.6 0 2.7 0.4 3.4 1.2 0.8 0.8 1.2 1.9 1.2 3.5v71.5c0 1.6-0.4 2.7-1.2 3.5-0.8 0.8-1.9 1.2-3.4 1.2H39.7c-1.6 0-2.7-0.4-3.4-1.2-0.8-0.8-1.2-1.9-1.2-3.5V48.3zM72.4 57.2h16.3c1.6 0 2.7 0.4 3.4 1.2 0.8 0.8 1.2 1.9 1.2 3.5v9.3c0 1.6-0.4 2.7-1.2 3.5-0.8 0.8-1.9 1.2-3.4 1.2H72.4c-1.6 0-2.7-0.4-3.4-1.2-0.8-0.8-1.2-1.9-1.2-3.5v-9.3c0-1.6 0.4-2.7 1.2-3.5 0.8-0.8 1.9-1.2 3.4-1.2zM72.4 72.3h16.3v-5.8H72.4v5.8zM118.2 48.3h16.4c1.6 0 2.7 0.4 3.4 1.2 0.8 0.8 1.2 1.9 1.2 3.5v71.5c0 1.6-0.4 2.7-1.2 3.5-0.8 0.8-1.9 1.2-3.4 1.2h-16.4c-1.6 0-2.7-0.4-3.4-1.2-0.8-0.8-1.2-1.9-1.2-3.5V48.3z' fill='%23fff'/%3E%3C/svg%3E");
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
