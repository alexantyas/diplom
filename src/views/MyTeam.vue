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
    <div v-if="team.length === 0">У вас пока нет участников в команде.</div>
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
        <tr v-for="(member, index) in team" :key="member.id">
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
    const token = localStorage.getItem('token');

    const user = ref({});
    const team = ref([]);
    const teamMembers = ref([]);
    const users = ref([]);
    const cities = ref([]);
    const countries = ref([]);

    const fetchTeam = async () => {
      // 1. Получить данные тренера
      const userResp = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
      user.value = userResp.data;

      // 2. Получить всех team_members, где team_id тренера
      const teamMembersResp = await api.get('/teams/members/');
      teamMembers.value = teamMembersResp.data.filter(tm => tm.team_id === user.value.organization);

      // 3. Получить всех пользователей и инфу о городах/странах
      const usersResp = await api.get('/users/');
      users.value = usersResp.data;

      const citiesResp = await api.get('/cities/');
      cities.value = citiesResp.data;
      const countriesResp = await api.get('/countries/');
      countries.value = countriesResp.data;

      // 4. Собрать участников команды
      team.value = teamMembers.value.map(tm => {
        const u = users.value.find(usr => usr.id === tm.user_id);
        return u || {};
      }).filter(u => u.id); // Убираем пустые
    };

    const getCityName = (id) => {
      const city = cities.value.find(c => c.id === id);
      return city ? city.name : '';
    };
    const getCountryName = (id) => {
      const country = countries.value.find(c => c.id === id);
      return country ? country.name : '';
    };

    onMounted(fetchTeam);

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      user,
      team,
      getCityName,
      getCountryName,
      logout,
    };
  }
};
</script>
