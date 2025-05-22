<template>
  
  <div class="container">
    <router-view />
  </div>
</template>

<script>


export default {
  
}
</script>
<style scoped>
/* Перехватываем только эту .container в данном компоненте */
.container {
  max-width: none !important;  /* убираем ограничение из Bootstrap */
  width: 100%     !important;
  }
</style>