<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CrudPage from '@/components/crud/CrudPage.vue'
import ErrorPage from '@/pages/ErrorPage.vue'
import { publishedModules } from '@/lib/published'
import type { ModuleDefinition } from '@/types/module'

const route = useRoute()
const module = computed<ModuleDefinition | undefined>(() =>
  publishedModules.value.find((c) => c.route === route.path),
)
</script>
<template>
  <CrudPage v-if="module" :module="module" />
  <ErrorPage v-else code="404" message="你访问的页面不存在" />
</template>
