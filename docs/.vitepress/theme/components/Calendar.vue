<script setup>
import { data } from "./../../calendar.data.js";
import { formatDate, slugify } from "./../../utils.js";

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
});

function toArray(value) {
  if (Array.isArray(value)) {
    if (value.length) return value;
    return [];
  }
  if (typeof value === "string") return [value];
  return [];
}

function accessMultikey(obj, multikey) {
  let result = [];
  const groups = multikey.split("+");
  for (const group of groups) {
    const fallbacks = group.split("/");
    for (const key of fallbacks) {
      const value = toArray(obj[key]);
      result = result.concat(value);
      if (value.length) break;
    }
  }
  if (!result.length) return [""];
  return result;
}

function groupEvents(events, fields) {
  if (fields.length === 0) return events;
  const field = fields[0];
  const grouped = events.reduce((acc, event) => {
    const key_array = accessMultikey(event, field);
    for (const key of key_array) {
      if (!acc[key]) acc[key] = [];
      if (fields.length > 1) acc[key].push(event);
    }
    return acc;
  }, {});
  // Se aplica recursivamente con el resto de funciones
  Object.keys(grouped).forEach((key) => {
    grouped[key] = groupEvents(grouped[key], fields.slice(1));
  });
  return grouped;
}

function groupData(data) {
  const filtered = data.filter((obj) =>
    JSON.stringify(obj)
      .toLowerCase()
      .includes((props.block.filter || "").toLowerCase()),
  );
  const grouped = groupEvents(filtered, ["", "title/freq", "dates/byday", "", "times", "locations", "exceptions+byday+title"]);
  return grouped;
}

function getSubKeys(table) {
  const keys = new Set();
  for (const row in table) {
    for (const subKey in table[row]) keys.add(subKey);
  }
  return Array.from(keys);
}
</script>

<template>
  <h2 class="text-4xl text-center font-bold py-6">{{ block.title }}</h2>
  <div class="container mx-auto px-4 pb-8 flex flex-wrap gap-4">
    <div v-for="(group, groupKey) in groupData(data.events)" class="w-full mb-2" :class="groupKey">
      <h2 :id="slugify(groupKey)" class="text-4xl text-center mx-auto font-bold mb-3 pb-1 w-1">
        {{ formatDate(groupKey, $frontmatter.lang) }}
      </h2>
      <!-- Primer grupo dividir en headers -->
      <div class="flex flex-row flex-wrap justify-center">
        <div v-for="(table, tableKey) in group" class="md:w-1/2 lg:w-1/3 mb-2 px-4" :class="tableKey">
          <h3 :id="slugify(tableKey)" class="text-xl font-semibold text-gray-800 mb-3 border-b-3 border-accent pb-1">
            {{ formatDate(tableKey, $frontmatter.lang) }}
          </h3>

          <div class="overflow-x-auto bg-white">
            <table class="min-w-full text-sm text-gray-700 border-collapse [border-style:hidden]">
              <!-- Añadir cabezera a la tabla (solo si hay hay subfields)-->
              <thead v-if="getSubKeys(table)[0] != ''" class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th class="px-4 py-2 text-left w-36">&nbsp;</th>
                  <th v-for="subKey in getSubKeys(table)" class="px-4 py-2 text-left font-medium">
                    {{ formatDate(subKey, $frontmatter.lang) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Añadir columnas a la tabla -->
                <tr v-for="(row, rowKey, rowIndex) in table" class="odd:bg-white even:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-800 border-1">
                    {{ formatDate(rowKey, $frontmatter.lang) }}
                  </td>
                  <!-- Añadir filas -->
                  <td v-for="subKey in getSubKeys(table)" class="px-4 py-3 align-top border-1">
                    <!-- Cada fila de la tabla puede tener múltiples elementos -->
                    <p v-for="(line, lineKey) in row[subKey]" class="flex items-center gap-2 mb-1" style="margin-right: 10px; display: flex">
                      {{ formatDate(lineKey, $frontmatter.lang) }} - {{ Object.keys(line).map(formatDate).join(" ,") }}
                      <span class="flex flex-wrap gap-1 text-gray-500">
                        <!--{{ Object.keys(Object.values(line)[0]).join(", ") }}
                      <!--<i v-for="(item, index) in Object.keys(line)" :key="index" :class="{ 'line-through text-red-400': item.includes('exceptions') }"> ({{ formatDate(item,$frontmatter.lang) }}) </i>-->
                      </span>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
h1:empty,
h3:empty,
td:empty,
th:empty,
tr:empty,
span:empty {
  display: none !important;
}
</style>
