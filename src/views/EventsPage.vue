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

export default {
  setup() {
    const router = useRouter();
    const store = useStore();

    const user = ref(JSON.parse(localStorage.getItem('user')) || {});
    const competitions = ref([]);
    const applications = ref([]);
    const myAppParts = ref([]);

    const token = localStorage.getItem("access_token");

    const isCoach = computed(() => user.value.role_id === 2);
const isAthlete = computed(() => user.value.role_id === 3);

    onMounted(async () => {
      try {
        const [compRes, appRes, partRes] = await Promise.all([
          fetch("http://localhost:8000/competitions/", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:8000/applications/", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:8000/applications/participants/", {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);

        competitions.value = await compRes.json();
        applications.value = await appRes.json();

        const allParticipants = await partRes.json();
        myAppParts.value = allParticipants.filter(p => p.user_id === user.value.id);
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

  let memberIds = [];

  // Определяем роли
  const isCoach = user.value.role_id === 2;
  const isAthlete = user.value.role_id === 3;

  if (isCoach) {
    const res = await fetch("http://localhost:8000/teams/my-team", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const teamMembers = await res.json();
    memberIds = teamMembers.map(m => m.user_id);
  } else if (isAthlete) {
    memberIds = [user.value.id];
  } else {
    alert("Ваша роль не позволяет подать заявку");
    return;
  }

  // Формируем тело заявки
  const payload = {
    competition_id: competitionId,
    request_type_id: isCoach ? 2 : 1,
    ...(isCoach ? { team_id: user.value.team_id } : {}), // включаем team_id только если тренер
    request_date: new Date().toISOString().replace('Z', '')
  };

  try {
    // Создаём заявку
    const res = await fetch("http://localhost:8000/applications/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const createdApplication = await res.json();

    // Добавляем участников в заявку
    for (const user_id of memberIds) {
      const partRes = await fetch("http://localhost:8000/applications/participants/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          application_id: createdApplication.id,
          user_id: user_id
        })
      });

      if (!partRes.ok) {
        const err = await partRes.text();
        throw new Error(`Ошибка при добавлении участника: ${err}`);
      }
    }

    alert("✅ Заявка и участники успешно поданы");
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
