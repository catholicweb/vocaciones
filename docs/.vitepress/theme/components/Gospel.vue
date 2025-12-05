<template>
	<div class="gospel max-w-3xl mx-auto p-6 my-6">
		<div v-if="block.title" class="text-center">
			<h2 class="my-4 text-4xl font-bold">{{ block.title }} {{ cleanTitle(readings?.day_title) }}</h2>
		</div>
		<template v-for="(reading, key) in displayedReadings" :key="key">
			<div v-if="block.images" class="relative w-full sm:w-1/2 mx-auto rounded-lg overflow-hidden my-4 mt-8">
				<img :src="`${imageBaseUrl}/${reading.tag}.png`" :alt="`${reading.title} icon`" class="w-full aspect-square object-cover" />

				<div class="absolute inset-0 w-full h-full p-4 bg-gradient-to-b from-black/60 via-black/10 text-white flex flex-col items-end text-center font-bold">
					<h2 class="text-xl text-white! text-center w-full">
						{{ reading.title }}<span class="">: {{ reading.cita }}</span>
					</h2>
					<p class="text-sm text-center w-full">{{ reading.resum || getResponse(reading.text) }}</p>
				</div>
				<div class="absolute bottom-2 right-2 text-xs text-white">&copy; <a href="https://igles-ia.es/">Igles-IA.es</a></div>
			</div>
			<div v-else>
				<h2 class="text-lg text-center font-semibold mb-1 mt-6">{{ reading.title }} - {{ reading.cita }}</h2>
				<p class="text-sm mb-2 italic" style="color: #b30838">{{ reading.resum }}</p>
			</div>
			<div class="prose max-w-none mb-2" v-html="clean(reading.text)"></div>
		</template>
	</div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
	block: {
		type: Object,
		required: true,
	},
});

// los datos ya vienen desde fuera (pre-fechados)
const readings = ref(props.block.gospel || props.block);

const d = new Date();
d.setDate(d.getDate());
let dateStr = d.toISOString().split("T")[0];
let imageBaseUrl = ref(`https://mawaorwmhgyeqbvnewfy.supabase.co/storage/v1/object/public/reading-images/${dateStr}`);
let gospelUrl = `https://gxvchjojub.execute-api.eu-west-1.amazonaws.com/production/getmissafreecontent?lang=es&day=${dateStr}`;

// reading is pre-fetched when config is generated. this function is for user to manually fetch other dates
async function getReading() {
	try {
		const res = await fetch(gospelUrl);
		let data = await res.json();
		readings.value = data;
	} catch (err) {
		console.error("❌ Error al cargar las lecturas:", err);
	}
}

function getResponse(str = "") {
	let match = str.match(/R\.<\/span><\/strong>([^<]+)/);
	if (!match) match = str.match(/R\.<\/span>([^<]+)/);
	if (!match) return "";
	return new DOMParser().parseFromString(match[1], "text/html").body.textContent || "";
}

function cleanTitle(str = "") {
	return str.replace("de la ", "").replace("semana de", "de");
}

function clean(str = "") {
	str = str.replace(/<strong>Lectura de.+?<\/strong>/g, "").replace(/<(span|p)><\/\1>/g, "");

	return str.replaceAll('<span style="color: #b30838;">R.</span>', '<span style="color: #b30838; font-style: italic; font-weight: normal">&#8479;</span>');
}

const displayedReadings = computed(() => {
	if (!readings.value) return [];

	if (props.block.readings) {
		return [readings.value["lectura#0"], readings.value["salm"], readings.value["lectura#1"], readings.value["evangeli"]].filter(Boolean);
	} else {
		return [readings.value["evangeli"]].filter(Boolean);
	}
});
</script>

<style>
.gospel .prose p {
	margin-bottom: 0.5rem;
}
.gospel .prose strong {
	color: #b30838;
}
</style>
