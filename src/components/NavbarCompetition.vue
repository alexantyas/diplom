<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <a class="navbar-brand" href="#">ARENA</a>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link to="/dashboard/created" class="nav-link">Все соревнования</router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/competition/${competitionId}`"
              class="nav-link"
            >Подробно</router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/competition/${competitionId}/schedule`"
              class="nav-link"
            >Расписание</router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/competition/${competitionId}/bracket`"
              class="nav-link"
            >Сетка</router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/competition/${competitionId}/judges`"
              class="nav-link"
            >Судейская</router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/competition/${competitionId}/participants`"
              class="nav-link"
            >Участники</router-link>
          </li>
          <li class="nav-item">
            <router-link
              :to="`/competition/${competitionId}/print`"
              class="nav-link"
            >Печать</router-link>
          </li>
        </ul>
        <button @click="logout" class="btn btn-danger">Выход</button>
      </div>
    </div>
  </nav>
</template>

<script>
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const competitionId = route.params.id;

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return { competitionId, logout };
  }
};
</script>
