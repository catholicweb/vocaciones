<template>
  <div v-if="block.title" class="text-center">
    <h2 class="mt-8 text-4xl font-bold">{{ block.title }}</h2>
  </div>
  <div class="map py-8 max-w-3xl mx-auto md:px-4">
    <div class="w-full h-96 overflow-hidden md:shadow-md">
      <div ref="mapContainer" class="w-full h-full z-0"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { data } from "./../../blocks.data.js";

const props = defineProps({
  block: { type: Object, required: true },
});

const mapContainer = ref(null);
let map = null;
let markersLayer = null;

onMounted(async () => {
  if (!mapContainer.value) return;

  var supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

  // Carga dinámica de Leaflet solo cuando el componente se monta

  const L = await import("leaflet");
  await import("leaflet/dist/leaflet.css"); // carga el CSS dinámicamente

  //await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  //await import("https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css");
  //await import("https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js");

  const map = L.map(mapContainer.value, { fullscreenControl: true, zoomControl: !supportsTouch }).setView(props.block.geo?.split(",").map((s) => Number(s.trim())) || [0, 0], props.block.zoom || 13);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: "Voyager",
    maxZoom: 16,
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  var redIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [20, 32],
  });

  let blueIcon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [20, 32],
  });

  if (!data.maps.length) {
    data.maps.push(props.block);
  }

  data.maps.forEach((m) => {
    const g = m.geo.split(",").map((s) => Number(s.trim()));
    let config = { icon: redIcon };
    const html = `<a href="${m.link}">
                    <h3 style="text-transform: capitalize; color: black;text-align: center;">
                                            ${m.name}
                                        </h3>
                                <div style="margin: 0;background: white;">
                                        <img width="100%" style="width:100%; aspect-ratio: 16/9; object-fit: cover;" loading="lazy" src="${m.image} " alt="">
                                </div>
                        </a>`;
    const marker = L.marker(g, config).addTo(markersLayer).bindPopup(html);
    if (m.geo != props.block.geo) {
      marker._icon.style.opacity = "0.4";
      //marker._icon.style.filter = "grayscale(1)";
      //marker._icon.style.transform += ' scale(0.5)'
    }
  });
});
</script>

<style scoped>
/* para que los iconos de leaflet se vean correctamente en Vite */
.leaflet-container {
  width: 100%;
  height: 100%;
}

.bounce {
  animation: bounce 0.6s infinite alternate ease-in-out;
}

.leaflet-popup-content {
  margin: 10px;
  max-width: 250px !important;
}

.leaflet-container a.leaflet-popup-close-button {
  font-size: 25px;
  font-weight: bold;
  top: 3px;
  right: 3px;
  color: #009c46;
}

@keyframes bounce {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(-10px);
  }
}

.leaflet-pane > svg path.leaflet-interactive {
  stroke: none;
  fill: red;
}
</style>
