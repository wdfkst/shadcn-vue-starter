<script setup lang="ts">
import CrudPage from '@/components/crud/CrudPage.vue'
import module from './schema'
import { api } from './api'
</script>

<template>
  <CrudPage :module="module" :repository="api" />
</template>
