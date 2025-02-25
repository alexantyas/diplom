<template>
    <div class="container">
      <h2 class="text-center mt-3">Список команд</h2>
      <div class="card p-3 shadow-sm">
        <h6>Добавить команду</h6>
        <input v-model="newTeam.name" type="text" class="form-control form-control-sm mb-2" placeholder="Название команды">
        <button @click="addTeam" class="btn btn-success btn-sm w-100">Добавить</button>
      </div>
  
      <div class="mt-3">
        <h6>Команды</h6>
        <ul class="list-group">
          <li v-for="(team, index) in teams" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
            <input v-model="team.name" type="text" class="form-control form-control-sm me-2">
            <button @click="removeTeam(index)" class="btn btn-danger btn-sm">Удалить</button>
          </li>
        </ul>
      </div>
  
    </div>
  </template>
  
  <script>
  import { useStore } from 'vuex';
  import { computed, ref, watch } from 'vue';
  
  export default {
    setup() {
      const store = useStore();
      const teams = computed(() => store.state.teams);
  
      const newTeam = ref({ name: '' });
  
      const addTeam = () => {
        if (newTeam.value.name.trim() !== '') {
          store.commit('setTeams', [...teams.value, { name: newTeam.value.name }]);
          newTeam.value.name = ''; // Очистка ввода
        }
      };
  
      const removeTeam = (index) => {
        const updatedTeams = [...teams.value];
        updatedTeams.splice(index, 1);
        store.commit('setTeams', updatedTeams);
      };
  
      const startCompetition = () => {
        if (teams.value.length > 0) {
          console.log("Начинаем соревнование с командами:", teams.value);
          store.commit('setTeams', teams.value);
        }
      };
  
      return { teams, newTeam, addTeam, removeTeam, startCompetition };
    }
  };
  </script>
  