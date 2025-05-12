<template>
  <div class="container mt-4">
    <h4 class="mb-4">Созданные соревнования</h4>
    <div v-if="competitions.length === 0" class="alert alert-info">
      Пока не создано ни одного соревнования.
    </div>
    <table v-else class="table table-bordered table-hover text-center align-middle">
      <thead class="table-dark">
        <tr>
          <th>Название</th>
          <th>Город</th>
          <th>Дата</th>
          <th>Тип</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="comp in competitions" :key="comp.id">
          <td>{{ comp.name }}</td>
          <td>{{ comp.city }}</td>
          <td>{{ comp.startDate }}</td>
          <td>{{ comp.type }}</td>
          <td>
            <span v-if="comp.status === 'Открыта'" class="badge bg-primary">Заявки принимаются</span>
            <span v-else-if="comp.status === 'Проводится'" class="badge bg-warning text-dark">Проводится</span>
            <span v-else-if="comp.status === 'Завершено'" class="badge bg-success">Завершено</span>
            <span v-else class="badge bg-secondary">Неизвестно</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const competitions = ref([]);

    onMounted(() => {
      competitions.value = JSON.parse(localStorage.getItem('competitions')) || [];
    });

    return { competitions };
  }
};
</script>
