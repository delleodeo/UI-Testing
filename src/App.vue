<script setup>
import MobileNav from './components/MobileNav.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
</script>

<template>
  <!-- Remount on same route navigation to trigger "refresh" -->
  <router-view :key="route.fullPath"></router-view>
  <MobileNav />
</template>
