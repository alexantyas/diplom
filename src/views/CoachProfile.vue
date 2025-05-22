<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <!-- Шапка -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/events" class="nav-link">Предстоящие соревнования</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/my-team" class="nav-link">Моя команда</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/profile-coach" class="nav-link active">Профиль</router-link>
            </li>
          </ul>
          <button @click="logout" class="btn btn-danger">Выход</button>
        </div>
      </div>
    </nav>

    <!-- Профиль тренера -->
    <div class="container mt-4">
      <div class="row mb-4">
        <div class="col-md-9">
          <div class="card p-4 h-100">
            <h4 class="mb-3">Профиль тренера</h4>
            <p><strong>ФИО:</strong> {{ user?.last_name || '' }} {{ user?.first_name || '' }} {{ user?.middle_name || '' }}</p>
            <p><strong>Адрес:</strong> {{ user?.city || '' }}, {{ user?.country || '' }}</p>
            <p><strong>Телефон:</strong> {{ user?.phone || '' }}</p>
            <p><strong>Команда:</strong> {{ user?.organization || '—' }}</p>
            <button class="btn btn-outline-success mt-3">Редактировать профиль</button>
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
          <li class="list-group-item" v-for="app in myApplications" :key="app.id">
            Соревнование: {{ getCompetitionName(app.competition_id) }} — <strong>{{ statusRu(app.status) }}</strong>
          </li>
        </ul>
      </div>
    </div>
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

    const user = ref({});
    const allApplications = ref([]);
    const competitions = ref([]);
    const myApplications = ref([]);

    const statusRu = status => {
      switch (status) {
        case 'pending': return 'Подано';
        case 'approved': return 'Одобрено';
        case 'rejected': return 'Отклонено';
        default: return status;
      }
    };

    const getCompetitionName = (competition_id) => {
      const comp = competitions.value.find(c => c.id === competition_id);
      return comp ? comp.name : 'Без названия';
    };

    const fetchProfileData = async () => {
      try {
        const userResp = await api.get('/users/me');
        user.value = userResp.data;

        const appsResp = await api.get('/applications/');
        allApplications.value = appsResp.data;

        const compsResp = await api.get('/competitions/');
        competitions.value = compsResp.data;

        myApplications.value = allApplications.value.filter(
          app => app.user_id === user.value.id
        );
      } catch (e) {
        router.push('/login');
      }
    };

    onMounted(fetchProfileData);

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      user,
      myApplications,
      logout,
      statusRu,
      getCompetitionName
    };
  }
};
</script>
