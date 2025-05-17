<template>
  <div class="container mt-4">
    <h4 class="mb-4">Созданные соревнования</h4>

    <div v-if="competitions.length === 0" class="alert alert-info">
      Пока не создано ни одного соревнования.
    </div>

    <div v-else class="row g-4">
      <div class="col-12" v-for="comp in competitions" :key="comp.id">
        <div class="card shadow-sm p-4" style="cursor: pointer;" @click="openCompetition(comp.id)">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start flex-wrap">
              <div>
                <h5 class="card-title">{{ comp.name }}</h5>
                <p class="mb-1"><strong>Город:</strong> {{ comp.venue.city_name }}</p>
                <p class="mb-1"><strong>Место:</strong> {{ comp.venue.name }}</p>
                <p class="mb-1"><strong>Дата:</strong> {{ formatDate(comp.start_date) }}</p>
                <p class="mb-3"><strong>Тип:</strong> {{ comp.type || '—' }}</p>
                <p class="mb-1">
                  <strong>Заявок:</strong> {{ getApplicationCount(comp.id) }}
                </p>
              </div>

              <div class="d-flex flex-column align-items-end ms-auto">
                <select
                  v-model="comp.status"
                  @change.stop="updateStatus(comp)"
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
      try {
        const res = await fetch("http://localhost:8000/competitions/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        competitions.value = data;
      } catch (e) {
        console.error("Ошибка при загрузке соревнований:", e);
      }

      // позже: замени на fetch реальных заявок
      applications.value = JSON.parse(localStorage.getItem("applications")) || [];
    });

    const getApplicationCount = (competitionId) => {
      return applications.value.filter(app => app.competitionId === competitionId).length;
    };

    const updateStatus = async (updatedComp) => {
      const token = localStorage.getItem("access_token");
      try {
        await fetch(`http://localhost:8000/competitions/${updatedComp.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedComp)
        });
      } catch (error) {
        console.error("Ошибка при обновлении статуса:", error);
      }
    };

    const deleteCompetition = async (idToDelete) => {
  if (!confirm('Вы уверены, что хотите удалить это соревнование?')) return;

  const token = localStorage.getItem("access_token");

  try {
    const res = await fetch(`http://localhost:8000/competitions/${idToDelete}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Ошибка при удалении");

    // Убираем с фронта
    competitions.value = competitions.value.filter(c => c.id !== idToDelete);
  } catch (e) {
    console.error(e);
    alert("❌ Не удалось удалить соревнование");
  }
};

    const openCompetition = (id) => {
      router.push(`/competition/${id}`);
    };

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ru-RU");
    };

    return {
      competitions,
      applications,
      updateStatus,
      deleteCompetition,
      openCompetition,
      getApplicationCount,
      formatDate
    };
  }
};
</script>