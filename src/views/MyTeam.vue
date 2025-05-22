<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
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
          <th>Дата рождения</th>
          <th>Город</th>
          <th>Страна</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in team" :key="member.id">
          <td>{{ member.last_name }} {{ member.first_name }} {{ member.middle_name || '' }}</td>
          <td>{{ member.weight }}</td>
          <td>{{ formatDate(member.birth_date) }}</td>
          <td>{{ getCityName(member.city_id) }}</td>
          <td>{{ getCountryName(member.country_id) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import api from '@/api';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();

    const team = ref([]);
    const cities = ref([]);
    const countries = ref([]);

    const fetchTeam = async () => {
      try {
        const [teamRes, citiesRes, countriesRes] = await Promise.all([
          api.get('/teams/my-team'),
          api.get('/cities/'),
          api.get('/countries/')
        ]);
        team.value = teamRes.data;
        cities.value = citiesRes.data;
        countries.value = countriesRes.data;
      } catch (err) {
        console.error('❌ Ошибка при получении состава команды:', err);
        alert("Ошибка при загрузке команды.");
      }
    };

    const getCityName = id => {
      const city = cities.value.find(c => c.id === id);
      return city ? city.name : '';
    };

    const getCountryName = id => {
      const country = countries.value.find(c => c.id === id);
      return country ? country.name : '';
    };

    const formatDate = iso => {
      return new Date(iso).toLocaleDateString('ru-RU');
    };

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    onMounted(fetchTeam);

    return {
      team,
      getCityName,
      getCountryName,
      formatDate,
      logout
    };
  }
};
</script>
