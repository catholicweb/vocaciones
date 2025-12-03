<template>
	<div class="gospel max-w-3xl mx-auto p-6 my-6">
		<div v-if="block.title" class="text-center">
			<h2 class="my-4 text-4xl font-bold">{{ block.title }}</h2>
		</div>
		<h3 class="text-xl font-bold text-center mb-6">
			{{ readings?.day_title || "Lecturas del día" }}
		</h3>

		<template v-for="(reading, key) in displayedReadings" :key="key">
			<div v-if="block.images" class="relative w-full sm:w-1/2 mx-auto rounded-lg overflow-hidden my-4 mt-8">
				<img :src="`${imageBaseUrl}/${reading.tag}.png`" :alt="`${reading.title} icon`" class="w-full aspect-square object-cover" />

				<div class="absolute inset-0 w-full p-4 bg-black/40 text-white flex flex-col items-end text-center font-bold">
					<h2 class="text-xl text-white!">{{ reading.title }}</h2>
					<p class="text-sm">{{ reading.resum }}</p>
					<p class="text-xs italic">({{ reading.cita }})</p>
				</div>
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

// función auxiliar para recargar lecturas de otro día si se desea
async function getReading() {
	try {
		const res = await fetch(gospelUrl);
		let data = await res.json();
		readings.value = data;
	} catch (err) {
		console.error("❌ Error al cargar las lecturas:", err);
	}
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
