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
            <p class="mb-1"><strong>Город:</strong> {{ comp.city }}</p>
            <p class="mb-1"><strong>Дата:</strong> {{ comp.startDate }}</p>
            <p class="mb-3"><strong>Тип:</strong> {{ comp.type }}</p>
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

    onMounted(() => {
      competitions.value = JSON.parse(localStorage.getItem('competitions')) || [];
      applications.value = JSON.parse(localStorage.getItem('applications')) || [];
    });

    const getApplicationCount = (competitionId) => {
      return applications.value.filter(app => app.competitionId === competitionId).length;
    };

    const updateStatus = (updatedComp) => {
      const updatedList = competitions.value.map(comp =>
        comp.id === updatedComp.id ? { ...comp } : comp
      );
      localStorage.setItem('competitions', JSON.stringify(updatedList));
      competitions.value = updatedList;
    };

    const deleteCompetition = (idToDelete) => {
      if (!confirm('Вы уверены, что хотите удалить это соревнование?')) return;
      const updated = competitions.value.filter(c => c.id !== idToDelete);
      localStorage.setItem('competitions', JSON.stringify(updated));
      competitions.value = updated;
    };

    const openCompetition = (id) => {
      router.push(`/dashboard/competition/${id}`);
    };

    return {
      competitions,
      applications,
      updateStatus,
      deleteCompetition,
      openCompetition,
      getApplicationCount
    };
  }
};

</script>
