<template>
  <div id="app">
    <!-- Рендерим шапку только если activeNavbar не null -->
    <component v-if="activeNavbar" :is="activeNavbar" />
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavbarGeneral from '@/components/NavbarGeneral.vue'
import NavbarCompetition from '@/components/NavbarCompetition.vue'

export default {
  setup() {
    const route = useRoute()

    const activeNavbar = computed(() => {
      const path = route.path

      // Без шапки для страниц логина, регистрации и личных кабинетов
      if (
        path === '/login' ||
        path.startsWith('/register') ||
        path.startsWith('/profile-participant') ||
        path.startsWith('/profile-coach') ||
        path.startsWith('/my-team') ||
        path.startsWith('/events')
      ) {
        return null
      }

      // Специальная шапка для маршрутов /competition/:id/*
      if (path.startsWith('/competition/')) {
        return NavbarCompetition
      }

      // Общая шапка для всех остальных маршрутов
      return NavbarGeneral
    })

    return { activeNavbar }
  }
}
</script>

<style>
html, body {
  background-color: #e0dcd5;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
