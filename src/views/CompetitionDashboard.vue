<template>
  <NavbarCompetition />
  <div class="container mt-4">
    <router-view />
  </div>
</template>

<script>
import NavbarCompetition from '@/components/NavbarCompetition.vue'

export default {
  components: { NavbarCompetition }
}
</script>
