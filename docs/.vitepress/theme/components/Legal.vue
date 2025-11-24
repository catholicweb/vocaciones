<script setup lang="ts">
import { useData } from "vitepress";
import { ref } from "vue";

const { site } = useData();

// Acceder a la configuración legal desde site.themeConfig.legal
const legal = site.value.themeConfig?.legal || {};

// Variables con valores por defecto
const NOMBRE_PARROQUIA = legal.nombreParroquia || "Nombre de la Parroquia";
const cifParroquia = legal.cifParroquia || "CIF";
const DIRECCION_COMPLETA = ref(legal.direccionCompleta || "Dirección completa");
const localidad = legal.localidad || "Localidad";
const provincia = legal.provincia || "Provincia";
const codigoPostal = legal.codigoPostal || "CP";
const telefono = legal.telefono || "Teléfono";
const emailContacto = legal.emailContacto || "email@parroquia.es";
const diocesis = legal.diocesis || "Diócesis";
const ubicacionServidor = legal.ubicacionServidor || "la Unión Europea";
const fechaActualizacion = legal.fechaActualizacion || "14 Noviembre 2025";
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 legal prose prose-serious">
    <Content />
  </div>
</template>

<style type="text/css"></style>
