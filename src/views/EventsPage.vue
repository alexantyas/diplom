<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <!-- Шапка -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/events" class="nav-link active">Предстоящие соревнования</router-link>
            </li>
            <li v-if="isCoach" class="nav-item">
              <router-link to="/my-team" class="nav-link">Моя команда</router-link>
            </li>
            <li class="nav-item">
              <router-link :to="profileRoute" class="nav-link">Профиль</router-link>
            </li>
          </ul>
          <button @click="logout" class="btn btn-danger">Выход</button>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <h4 class="mb-4">Предстоящие соревнования</h4>
      <div v-if="competitions.length === 0">Загрузка...</div>
      <div v-else-if="openCompetitions.length === 0">Соревнований с открытой регистрацией нет.</div>

      <div
        v-for="competition in openCompetitions"
        :key="competition.id"
        class="card p-3 mb-3 bg-white shadow-sm"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">{{ competition.name }}</h5>
            <p class="mb-1"><strong>Дата:</strong> {{ formatDate(competition.start_date) }}</p>
            <p class="mb-0"><strong>Место:</strong> {{ competition.venue?.name }} ({{ competition.venue?.city?.name || '' }})</p>
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
import api from '../store/api.js';

export default {
  setup() {
    const router = useRouter();
    const store = useStore();

    // user из Vuex (реактивно)
    const user = computed(() => store.state.user || {});

    const competitions = ref([]);
    const applications = ref([]);
    const myAppParts = ref([]);

    // ВНИМАНИЕ: Только по role_id!
    const isCoach = computed(() => user.value && user.value.role_id === 2);
    const isAthlete = computed(() => user.value && user.value.role_id === 3);

    const profileRoute = computed(() =>
      user.value && user.value.role_id === 2
        ? '/profile-coach'
        : user.value && user.value.role_id === 3
        ? '/profile-participant'
        : '/login'
    );

    onMounted(async () => {
      try {
        const [compRes, appRes, individualRes] = await Promise.all([
          api.get('/competitions/'),
          api.get('/applications/'),
          api.get('/applications/participants/individual/')
        ]);
        competitions.value = compRes.data;
        applications.value = appRes.data;
        myAppParts.value = individualRes.data.filter(p => p.user_id === user.value?.id);
      } catch (error) {
        router.push('/login');
      }
    });

    const openCompetitions = computed(() =>
      competitions.value.filter(c => c.status === 'Открыта')
    );

    const hasApplied = (competitionId) => {
      return myAppParts.value.some(p => {
        const app = applications.value.find(a => a.id === p.application_id);
        return app?.competition_id === competitionId;
      });
    };

    const applyToCompetition = async (competitionId) => {
      console.log("user:", user.value);
      if (hasApplied(competitionId)) return;

      try {
        if (isCoach.value) {
          // Подача командной заявки
          const res = await api.get("/teams/my-team");
          const teamMembers = res.data;

          if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
            alert("❌ У вашей команды нет участников");
            return;
          }

          const teamPayload = teamMembers.map(m => ({
            first_name: m.first_name,
            last_name: m.last_name,
            middle_name: m.middle_name,
            weight: m.weight,
            birth_date: m.birth_date,
            country_id: m.country_id,
            city_id: m.city_id,
            status: "Подано"
          }));

          const payload = {
            competition_id: competitionId,
            request_type_id: 2,
            team_id: user.value.team_id,
            request_date: new Date().toISOString().replace('Z', ''),
            team_participants: teamPayload
          };

          await api.post('/applications/', payload);

        } else if (isAthlete.value) {
          // Подача индивидуальной заявки
          const payload = {
            competition_id: competitionId,
            request_type_id: 1,
            request_date: new Date().toISOString().replace('Z', ''),
            individual_participants: [{
              user_id: user.value.id,
              status: "Подано"
            }]
          };

          await api.post('/applications/', payload);

        } else {
          alert("Ваша роль не позволяет подать заявку");
          return;
        }

        alert("✅ Заявка успешно подана");

      } catch (error) {
        let msg = "❌ Не удалось подать заявку";
        if (error.response && error.response.data && error.response.data.detail) {
          msg += `: ${error.response.data.detail}`;
        }
        console.error("❌ Ошибка при подаче заявки:", error);
        alert(msg);
      }
    };

    const formatDate = (str) => {
      return new Date(str).toLocaleDateString("ru-RU");
    };

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      user,
      competitions,
      openCompetitions,
      hasApplied,
      applyToCompetition,
      logout,
      formatDate,
      isCoach,
      profileRoute,
    };
  }
};
</script>
