<template>
  <div id="app">
    <component :is="activeNavbar" />
    <router-view />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavbarGeneral from '@/components/NavbarGeneral.vue'
import NavbarCompetition from '@/components/NavbarCompetition.vue'

export default {
  components: {
    NavbarGeneral,
    NavbarCompetition
  },
  setup() {
    const route = useRoute()

    const activeNavbar = computed(() => {
      const path = route.path

      // Без шапки: login + регистрации + личные кабинеты
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

      // Шапка для competition/:id/*
      if (path.startsWith('/competition/')) {
        return 'NavbarCompetition'
      }

      // Общая шапка (для /dashboard и /create)
      return 'NavbarGeneral'
    })

    return { activeNavbar }
  }
}
</script>

<style>
body {
  background-color: #f8f9fa;
}
</style>
