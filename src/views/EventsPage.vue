<template>
  <div>
    <!-- Шапка -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/events" class="nav-link active">Предстоящие соревнования</router-link>
            </li>
            <li v-if="user.role === 'coach'" class="nav-item">
              <router-link to="/my-team" class="nav-link">Моя команда</router-link>
            </li>
            <li class="nav-item">
              <router-link :to="user.role === 'coach' ? '/profile-coach' : '/profile-participant'" class="nav-link">Профиль</router-link>
            </li>
          </ul>
          <button @click="logout" class="btn btn-danger">Выход</button>
        </div>
      </div>
    </nav>

    <!-- Список соревнований -->
    <div class="container mt-4">
      <h4 class="mb-4">Предстоящие соревнования</h4>
      <div v-if="openCompetitions.length === 0">Соревнований с открытой регистрацией нет.</div>

      <div
        v-for="competition in openCompetitions"
        :key="competition.id"
        class="card p-3 mb-3"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">{{ competition.name }}</h5>
            <p class="mb-1"><strong>Дата:</strong> {{ competition.date }}</p>
            <p class="mb-0"><strong>Статус:</strong> {{ competition.status }}</p>
          </div>
          <button
            class="btn btn-success"
            :disabled="hasApplied(competition.id)"
            @click="applyToCompetition(competition.id)"
          >
            {{ hasApplied(competition.id) ? 'Заявка подана' : 'Участвовать' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
  setup() {
    const router = useRouter();
    const store = useStore();
    const user = ref(JSON.parse(localStorage.getItem('user')) || {});
    const competitions = ref([]);
    const applications = ref([]);

    onMounted(() => {
      competitions.value = JSON.parse(localStorage.getItem('competitions')) || [];
      applications.value = JSON.parse(localStorage.getItem('applications')) || [];
    });

    const openCompetitions = computed(() =>
      competitions.value.filter(c => c.status === 'Открыта')
    );

    const hasApplied = (competitionId) => {
      return applications.value.some(app =>
        app.userId === user.value.username && app.competitionId === competitionId
      );
    };

    const applyToCompetition = (competitionId) => {
      if (hasApplied(competitionId)) return;

      const newApp = {
        id: Date.now(),
        competitionId,
        userId: user.value.username,
        role: user.value.role,
        status: 'pending',
        date: new Date().toISOString()
      };

      applications.value.push(newApp);
      localStorage.setItem('applications', JSON.stringify(applications.value));
      alert('Заявка успешно подана');
    };

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      user,
      openCompetitions,
      hasApplied,
      applyToCompetition,
      logout
    };
  }
};
</script>
