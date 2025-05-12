<template>
    <!-- Навигационная панель -->
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
    <!-- Верх: профиль -->
    <div class="row mb-4">
      <div class="col-md-9">
        <div class="card p-4 h-100">
          <h4 class="mb-3">Профиль участника</h4>
          <p><strong>ФИО:</strong> {{ user.fullName }}</p>
          <p><strong>Адрес:</strong> {{ user.city }}, {{ user.country }}</p>
          <p><strong>Телефон:</strong> {{ user.phone }}</p>
          <p><strong>Выигранных матчей:</strong> 0</p>
          <p><strong>Поражений:</strong> 0</p>
          <p><strong>Ник:</strong> {{ user.username }}</p>
          <p><strong>Документы:</strong> —</p>
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
        <li class="list-group-item" v-for="app in myApplications" :key="app.id">
          Соревнование: {{ getCompetitionName(app.competitionId) }} — <strong>{{ app.status }}</strong>
        </li>
      </ul>
    </div>

    <!-- Статистика -->
    <div class="card p-4">
      <h5 class="mb-3">Статистика</h5>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Соревнование</th>
            <th>Схватка</th>
            <th>Результат</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="3" class="text-center">Нет данных</td>
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

export default {
  setup() {
    const store = useStore();
    const router = useRouter();

    const user = ref(JSON.parse(localStorage.getItem('user')) || {});
    const applications = ref([]);
    const competitions = ref([]);

    onMounted(() => {
      applications.value = JSON.parse(localStorage.getItem('applications')) || [];
      competitions.value = JSON.parse(localStorage.getItem('competitions')) || [];
      myApplications.value = applications.value.filter(app => app.userId === user.value.username);
    });

    const myApplications = ref([]);

    const getCompetitionName = (id) => {
      const comp = competitions.value.find(c => c.id === id);
      return comp ? comp.name : 'Неизвестно';
    };

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      user,
      myApplications,
      getCompetitionName,
      logout
    };
  }
};
</script>

