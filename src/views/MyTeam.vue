<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">ARENA</a>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li class="nav-item"><router-link to="/events" class="nav-link">Предстоящие соревнования</router-link></li>
          <li class="nav-item"><router-link to="/my-team" class="nav-link active">Моя команда</router-link></li>
          <li class="nav-item"><router-link to="/profile-coach" class="nav-link">Профиль</router-link></li>
        </ul>
        <button @click="logout" class="btn btn-danger">Выход</button>
      </div>
    </div>
  </nav>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Состав команды</h4>
    </div>
    <div v-if="!Array.isArray(team) || team.length === 0">У вас пока нет участников в команде.</div>
    <table v-else class="table table-bordered">
      <thead>
        <tr>
          <th>ФИО</th>
          <th>Вес</th>
          <th>Город</th>
          <th>Страна</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in team" :key="member.id">
          <td>{{ member.last_name }} {{ member.first_name }} {{ member.middle_name }}</td>
          <td>{{ member.weight }}</td>
          <td>{{ getCityName(member.city_id) }}</td>
          <td>{{ getCountryName(member.country_id) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import api from '@/api';
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();

    const team = ref([]);
    const users = ref([]);
    const cities = ref([]);
    const countries = ref([]);

    // Вся авторизация делается через interceptor (см. api.js!)
    const fetchTeam = async () => {
      // 1. Получаем список участников своей команды
      const teamMembersResp = await api.get('/teams/my-team');
      const teamMembers = teamMembersResp.data;

      // 2. Получаем всех пользователей
      const usersResp = await api.get('/users/');
      users.value = usersResp.data;

      // 3. Город и страна
      const citiesResp = await api.get('/cities/');
      cities.value = citiesResp.data;
      const countriesResp = await api.get('/countries/');
      countries.value = countriesResp.data;

      // 4. Собираем участников (users из своей команды)
      team.value = teamMembers.map(tm => {
        const u = users.value.find(usr => usr.id === tm.user_id);
        return u || {};
      }).filter(u => u.id); // убираем несуществующих
    };

    const getCityName = id => {
      const city = cities.value.find(c => c.id === id);
      return city ? city.name : '';
    };
    const getCountryName = id => {
      const country = countries.value.find(c => c.id === id);
      return country ? country.name : '';
    };

    onMounted(async () => {
      try {
        await fetchTeam();
      } catch (err) {
        console.error('Ошибка при получении состава команды:', err);
      }
    });

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      team,
      getCityName,
      getCountryName,
      logout,
    };
  }
};
</script>
