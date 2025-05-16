<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">ARENA</a>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link to="/profile-participant" class="nav-link">Профиль</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/events" class="nav-link">Предстоящие соревнования</router-link>
          </li>
        </ul>
        <button @click="logout" class="btn btn-danger">Выход</button>
      </div>
    </div>
  </nav>
  <div class="container mt-5">
    <div class="row mb-4">
      <div class="col-md-9">
        <div class="card p-4 h-100">
          <h4 class="mb-3">Профиль участника</h4>
          <p><strong>ФИО:</strong> {{ user.last_name }} {{ user.first_name }} {{ user.middle_name }}</p>
          <p><strong>Адрес:</strong> {{ cityName }}, {{ countryName }}</p>
          <p><strong>Телефон:</strong> {{ user.phone }}</p>
          <p><strong>Ник:</strong> {{ user.login }}</p>
          <button class="btn btn-outline-success">Редактировать профиль</button>
        </div>
      </div>
      <div class="col-md-3 d-flex align-items-center">
        <div class="card p-3 w-100 text-center">
          <div class="mb-2 fw-bold">Фото</div>
          <div class="rounded-circle bg-secondary mx-auto" style="width: 100px; height: 100px;"></div>
        </div>
      </div>
    </div>

    <!-- Мои заявки -->
    <div class="card p-4 mb-4">
      <h5 class="mb-3">Мои заявки</h5>
      <div v-if="myApplications.length === 0">Заявок пока нет.</div>
      <ul class="list-group" v-else>
        <li class="list-group-item" v-for="app in myApplications" :key="app.application.id">
          Соревнование: {{ app.competition.name }} — <strong>{{ app.status }}</strong>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import api from '@/api'; // путь до твоего api.js (axios instance)
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();

    const token = localStorage.getItem('token');
    const user = ref({});
    const myApplications = ref([]);
    const competitions = ref([]);
    const applications = ref([]);
    const applicationParticipants = ref([]);
    const cities = ref([]);
    const countries = ref([]);

    
    const cityName = computed(() => user.value.city_id || '');
    const countryName = computed(() => user.value.country_id || '');

    const fetchProfileData = async () => {
  // 1. Получить профиль пользователя
  const userResp = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
  user.value = userResp.data;

  // 2. Получить все application_participants для этого user_id
  const apResp = await api.get('/applications/participants/');
  const myAppParts = apResp.data.filter(ap => ap.user_id === user.value.id);

  // 3. Получить все заявки и все соревнования
  const appsResp = await api.get('/applications/');
  applications.value = appsResp.data;
  const compsResp = await api.get('/competitions/');
  competitions.value = compsResp.data;

  // 4. Собрать мои заявки с названиями соревнований
  myApplications.value = myAppParts.map(ap => {
    const app = applications.value.find(a => a.id === ap.application_id);
    const comp = app ? competitions.value.find(c => c.id === app.competition_id) : null;
    return {
      application: app,
      competition: comp,
      status: ap.status
    };
  });
};

    onMounted(fetchProfileData);

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      user,
      myApplications,
      cityName,
      countryName,
      logout,
    };
  }
};
</script>
