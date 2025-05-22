<template>
  
    <div class="container py-5">
      <h2 class="text-center fw-bold mb-5" style="color: #333;">Созданные соревнования</h2>

      <div v-if="competitions.length === 0" class="alert alert-info text-center">
        Пока не создано ни одного соревнования.
      </div>

      <div v-else class="row g-4">
        <div class="col-12" v-for="comp in competitions" :key="comp.id">
          <div
            class="card shadow-sm border-0 p-4"
            style="border-radius: 12px; transition: box-shadow 0.2s;"
            @click="openCompetition(comp.id)"
            @mouseover="hover = true" @mouseleave="hover = false"
          >
            <div class="d-flex justify-content-between align-items-start flex-wrap">
              <div>
                <h4 class="fw-bold mb-3">{{ comp.name }}</h4>
                <p class="mb-0 text-muted">
  <span><strong>Организация:</strong> {{ comp.organizer }}</span> •
  <span><strong>Город:</strong> {{ comp.venue.city_name }}</span> •
  <span><strong>Место:</strong> {{ comp.venue.name }}</span> •
  <span><strong>Дата:</strong> {{ formatDate(comp.start_date) }}</span> •
  <span><strong>Тип:</strong> {{ comp.type || '—' }}</span> •
  <span><strong>Заявок:</strong> {{ getApplicationCount(comp.id) }}</span>
</p>
                <!-- Индикатор статуса -->
                <span
                  class="badge"
                  :class="{
                    'bg-success': comp.status === 'Открыта',
                    'bg-warning text-dark': comp.status === 'Проводится',
                    'bg-secondary': comp.status === 'Завершено'
                  }"
                >
                  {{ comp.status }}
                </span>
              </div>

              <!-- Управление -->
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
                  class="btn btn-outline-danger btn-sm"
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
