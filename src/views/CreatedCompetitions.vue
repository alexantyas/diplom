<template>
  <div class="container mt-4">
    <h4 class="mb-4">Созданные соревнования</h4>

    <div v-if="competitions.length === 0" class="alert alert-info">
      Пока не создано ни одного соревнования.
    </div>

    <div v-else class="row g-4">
      <div class="col-12" v-for="comp in competitions" :key="comp.id">
        <div
          class="card shadow-sm p-4"
          style="cursor: pointer;"
          @click="openCompetition(comp.id)"
        >
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start flex-wrap">
              <div>
                <h5 class="card-title">{{ comp.name }}</h5>
                <p class="mb-1">
                  <strong>Организатор:</strong> {{ comp.organizer }}
                </p>
                <p class="mb-1">
                  <strong>Город:</strong> {{ comp.venue.city_name }}
                </p>
                <p class="mb-1">
                  <strong>Место:</strong> {{ comp.venue.name }}
                </p>
                <p class="mb-1">
                  <strong>Дата:</strong> {{ formatDate(comp.start_date) }}
                </p>
                <p class="mb-3">
                  <strong>Тип:</strong> {{ comp.type || '—' }}
                </p>
                <p class="mb-1">
                  <strong>Заявок:</strong> {{ getApplicationCount(comp.id) }}
                </p>
              </div>

              <div class="d-flex flex-column align-items-end ms-auto">
                <select
                  v-model="comp.status"
                  @click.stop
                  @change.stop.prevent="updateStatus(comp, $event)"
                  class="form-select form-select-sm mb-2"
                  style="width: 200px;"
                >
                  <option value="Открыта">Заявки принимаются</option>
                  <option value="Проводится">Проводится</option>
                  <option value="Завершено">Завершено</option>
                </select>

                <button
                  class="btn btn-sm btn-outline-danger"
                  @click.stop="deleteCompetition(comp.id)"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const competitions = ref([]);
    const applications = ref([]);
    const router = useRouter();

    onMounted(async () => {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1) Соревнования
      try {
        const res = await fetch("http://localhost:8000/competitions/", { headers });
        competitions.value = await res.json();
      } catch (e) {
        console.error("Ошибка загрузки соревнований:", e);
      }

      // 2) Заявки
      try {
        const res = await fetch("http://localhost:8000/applications/", { headers });
        const allApps = await res.json();
        applications.value = allApps;
      } catch (e) {
        console.error("Ошибка загрузки заявок:", e);
      }
    });

    const getApplicationCount = (competitionId) =>
      applications.value.filter(app => app.competition_id === competitionId).length;

    const updateStatus = async (comp, event) => {
      event.stopPropagation();
      const token = localStorage.getItem("access_token");
      try {
        await fetch(`http://localhost:8000/competitions/${comp.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(comp)
        });
      } catch (e) {
        console.error("Ошибка обновления статуса:", e);
      }
    };

    const deleteCompetition = async (id) => {
      if (!confirm("Удалить соревнование?")) return;
      const token = localStorage.getItem("access_token");
      try {
        const res = await fetch(`http://localhost:8000/competitions/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        competitions.value = competitions.value.filter(c => c.id !== id);
      } catch (e) {
        console.error("Ошибка удаления:", e);
        alert("Не удалось удалить");
      }
    };

    const openCompetition = (id) => {
      router.push(`/competition/${id}`);
    };

    const formatDate = (str) => {
      const d = new Date(str);
      return isNaN(d) ? "—" : d.toLocaleDateString("ru-RU");
    };

    return {
      competitions,
      applications,
      getApplicationCount,
      updateStatus,
      deleteCompetition,
      openCompetition,
      formatDate
    };
  }
};
</script>
