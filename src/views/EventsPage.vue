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
      <div v-if="competitions.length === 0">Загрузка...</div>
      <div v-else-if="openCompetitions.length === 0">Соревнований с открытой регистрацией нет.</div>

      <div
        v-for="competition in openCompetitions"
        :key="competition.id"
        class="card p-3 mb-3"
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
import api from '@/api';

export default {
  setup() {
    const router = useRouter();
    const store = useStore();

    const user = ref(JSON.parse(localStorage.getItem('user')) || {});
    const competitions = ref([]);
    const applications = ref([]);
    const myAppParts = ref([]); // только индивидуальные участники

    const token = localStorage.getItem("access_token");

    const isCoach = computed(() => user.value.role_id === 2);
    const isAthlete = computed(() => user.value.role_id === 3);

    onMounted(async () => {
      try {
        const [compRes, appRes, individualRes] = await Promise.all([
          fetch("http://localhost:8000/competitions/", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:8000/applications/", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:8000/applications/participants/individual/", {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);

        competitions.value = await compRes.json();
        applications.value = await appRes.json();

        const allIndividual = await individualRes.json();
        myAppParts.value = allIndividual.filter(p => p.user_id === user.value.id);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
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
            request_type_id: 2, // командная
            team_id: user.value.team_id,
            request_date: new Date().toISOString().replace('Z', ''),
            team_participants: teamPayload
          };

          const appRes = await fetch("http://localhost:8000/applications/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (!appRes.ok) {
            const err = await appRes.text();
            throw new Error(err);
          }

        } else if (isAthlete.value) {
          // Подача индивидуальной заявки
          const payload = {
            competition_id: competitionId,
            request_type_id: 1, // индивидуальная
            request_date: new Date().toISOString().replace('Z', ''),
            individual_participants: [{
              user_id: user.value.id,
              status: "Подано"
            }]
          };

          const appRes = await fetch("http://localhost:8000/applications/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (!appRes.ok) {
            const err = await appRes.text();
            throw new Error(err);
          }
        } else {
          alert("Ваша роль не позволяет подать заявку");
          return;
        }

        alert("✅ Заявка успешно подана");
        location.reload();

      } catch (error) {
        console.error("❌ Ошибка при подаче заявки:", error);
        alert("❌ Не удалось подать заявку");
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
      formatDate
    };
  }
};
</script>

