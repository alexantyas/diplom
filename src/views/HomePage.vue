<template>
  <div class="container text-center mt-5">
    <div v-if="user">
      <div class="alert alert-success" role="alert">
        Добро пожаловать, {{ user.first_name }}!
      </div>

      <div class="d-flex flex-column align-items-center">
        <router-link to="/create" class="btn btn-success btn-lg">
          Создать соревнование
        </router-link>
        <a href="#" class="mt-2 text-danger text-decoration-none">
          > Импортировать соревнование
        </a>
      </div>
    </div>
    <div v-else>
      <div class="alert alert-warning" role="alert">
        Вы не авторизованы
      </div>
      <router-link to="/login" class="btn btn-primary">Войти</router-link>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  setup() {
    const store = useStore()
    const user = computed(() => store.state.user)
    return { user }
  }
}
</script>
