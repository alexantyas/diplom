<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <router-link to="/" class="navbar-brand">ARENA</router-link>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link to="/create" class="nav-link">Создание</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/dashboard/created" class="nav-link">Созданные соревнования</router-link>
          </li>
        </ul>
        <button class="btn btn-danger" @click="logout">Выход</button>
      </div>
    </div>
  </nav>
</template>

<script>
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  setup() {
    const router = useRouter()
    const store = useStore()

    const logout = () => {
      store.commit('logout')
      router.push('/login')
    }

    return { logout }
  }
}
</script>
