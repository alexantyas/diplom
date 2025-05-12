<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container">
    <a class="navbar-brand" href="#">ARENA</a>
    <div class="collapse navbar-collapse">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <router-link to="/create" class="nav-link">Создание</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/dashboard/created" class="nav-link">Созданные соревнования</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/dashboard/teams" class="nav-link">Команды</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/dashboard/schedule" class="nav-link">Расписание</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/dashboard/judges" class="nav-link">Судейская</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/dashboard/participants" class="nav-link">Участники</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/dashboard/print" class="nav-link">Печать</router-link>
        </li>
      </ul>
      <button @click="logout" class="btn btn-danger">Выход</button>
    </div>
  </div>
</nav>

  <div class="container mt-4">
    <h4 class="mb-4">Панель соревнования</h4>

    <div v-if="competition" class="card p-4 mb-4 shadow-sm">
      <h5 class="card-title mb-3">{{ competition.name }}</h5>
      <p><strong>Город:</strong> {{ competition.city }}</p>
      <p><strong>Дата:</strong> {{ competition.startDate }}</p>
      <p><strong>Тип:</strong> {{ competition.type }}</p>
      <p><strong>Статус:</strong>
        <span :class="statusClass(competition.status)">
          {{ statusText(competition.status) }}
        </span>
      </p>
    </div>

    <div v-if="applications.length">
      <h5>Заявки на участие</h5>
      <div class="row">
        <div class="col-md-4 mb-3" v-for="app in applications" :key="app.id">
          <div
            class="card p-3 shadow-sm"
            style="cursor: pointer"
            @click="handleCardClick(app)"
          >
            <p><strong>Пользователь:</strong> {{ app.userId }}</p>
            <p><strong>Роль:</strong> {{ app.role }}</p>
            <p><strong>Тип заявки:</strong> {{ app.applicationType }}</p>
            <p><strong>Статус:</strong> {{ app.status }}</p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="alert alert-warning">Нет поданных заявок.</div>

    <!-- Модалка -->
    <div class="modal fade" id="teamModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Состав команды</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <ul v-if="teamMembers.length">
              <li v-for="(p, i) in teamMembers" :key="i">
                {{ p.name }} — {{ p.weight }} кг ({{ p.city }}, {{ p.country }})
              </li>
            </ul>
            <div v-else>Нет участников в этой команде</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    const competitionId = Number(route.params.id);
    const competition = ref(null);
    const applications = ref([]);
    const participants = ref([]);
    const teamMembers = ref([]);

    onMounted(() => {
      const comps = JSON.parse(localStorage.getItem('competitions')) || [];
      competition.value = comps.find(c => c.id === competitionId);

      const apps = JSON.parse(localStorage.getItem('applications')) || [];
      applications.value = apps.filter(a => a.competitionId === competitionId);

      participants.value = JSON.parse(localStorage.getItem('participants')) || [];
    });

    const statusClass = (status) => ({
      'badge bg-primary': status === 'Открыта',
      'badge bg-warning text-dark': status === 'Проводится',
      'badge bg-success': status === 'Завершено',
      'badge bg-secondary': !['Открыта', 'Проводится', 'Завершено'].includes(status)
    });

    const statusText = (status) => {
      if (status === 'Открыта') return 'Заявки принимаются';
      if (status === 'Проводится') return 'Проводится';
      if (status === 'Завершено') return 'Завершено';
      return 'Неизвестно';
    };

    const handleCardClick = (app) => {
      if (app.applicationType === 'Командная') {
        teamMembers.value = participants.value.filter(p => p.team === app.userId);
        const modal = new bootstrap.Modal(document.getElementById('teamModal'));
        modal.show();
      }
    };

    return {
      competition,
      applications,
      teamMembers,
      handleCardClick,
      statusClass,
      statusText
    };
  }
};
</script>
