<template>
  <div class="container mt-3">
    <h3>📅 Расписание матчей</h3>

    <!-- ✅ Фильтр по категориям -->
    <div class="mb-3">
      <label class="form-label">Выберите весовую категорию:</label>
      <select v-model="selectedCategory" class="form-select">
        <option value="">Все категории</option>
        <option v-for="category in uniqueCategories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </div>

    <!-- ✅ Кнопки управления расписанием -->
    <button @click="generateSchedule" class="btn btn-primary mb-3">Автоматически сформировать расписание</button>
    <button @click="addMatch" class="btn btn-success mb-3">Добавить матч</button>

    <!-- ✅ Таблица расписания -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>#</th>
          <th>Весовая категория</th>
          <th>Спортсмен 1</th>
          <th>Спортсмен 2</th>
          <th>Время</th>
          <th>Результат</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(match, index) in filteredSchedule" :key="index" 
            draggable="true"
            @dragstart="dragStart(index)" 
            @drop="drop(index)" 
            @dragover.prevent>
          <td>{{ index + 1 }}</td>
          <td>{{ match.category }}</td>
          <td><input v-model="match.fighter1" class="form-control form-control-sm"></td>
          <td>
            <input v-model="match.fighter2" class="form-control form-control-sm"
                   :disabled="match.fighter2 === 'Автоматическая победа'">
          </td>
          <td><input v-model="match.time" class="form-control form-control-sm" type="time"></td>
          <td>
            <select v-model="match.result" class="form-select form-select-sm">
              <option value="">Выберите победителя</option>
              <option :value="match.fighter1">{{ match.fighter1 }}</option>
              <option v-if="match.fighter2 !== 'Автоматическая победа'" :value="match.fighter2">{{ match.fighter2 }}</option>
              <option value="draw">Ничья</option>
            </select>
          </td>
          <td :class="getStatusClass(match)">
            {{ getMatchStatus(match) }}
          </td>
          <td>
            <button @click="removeMatch(index)" class="btn btn-danger btn-sm">🗑</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ Кнопка сохранения расписания -->
    <button @click="saveSchedule" class="btn btn-success">Сохранить расписание</button>
    <button @click="saveResults" class="btn btn-info ms-2">Сохранить результаты</button>

    <!-- ✅ Уведомление об успешном сохранении -->
    <div v-if="successMessage" class="alert alert-success mt-3">
      {{ successMessage }}
    </div>
  </div>
</template>

<script>
import { computed, ref } from "vue";
import { useStore } from "vuex";

export default {
  setup() {
    const store = useStore();
    const schedule = computed(() => store.state.schedule);  // ✅ Берём расписание из Vuex
    const participants = computed(() => store.state.participants);
    const selectedCategory = ref("");
    const successMessage = ref("");
    const dragIndex = ref(null);

    // ✅ Уникальные категории (для фильтра)
    const uniqueCategories = computed(() => {
      const categories = new Set(schedule.value.map(m => m.category));
      return Array.from(categories);
    });

    // ✅ Фильтрация матчей по категории
    const filteredSchedule = computed(() => {
      if (!selectedCategory.value) return schedule.value;
      return schedule.value.filter(m => m.category === selectedCategory.value);
    });

    // ✅ Определение статуса матча
    const getMatchStatus = (match) => {
      if (!match.result) return "Не начат";
      if (match.result === "draw") return "Ничья";
      return `Победитель: ${match.result}`;
    };

    // ✅ Установка класса для статуса
    const getStatusClass = (match) => {
      if (!match.result) return "text-muted";
      if (match.result === "draw") return "text-warning";
      return "text-success fw-bold";
    };

    // ✅ Перетаскивание (Drag & Drop)
    const dragStart = (index) => {
      dragIndex.value = index;
    };

    const drop = (index) => {
      if (dragIndex.value === null) return;

      const movedMatch = schedule.value.splice(dragIndex.value, 1)[0]; // Убираем матч с прежнего места
      schedule.value.splice(index, 0, movedMatch); // Вставляем на новое место
      store.commit("setSchedule", schedule.value); // Сохраняем изменения в Vuex

      dragIndex.value = null;
    };

    // ✅ Автоматическая генерация расписания (исправлено!)
    const generateSchedule = () => {
      const groupedByWeight = {};

      // Группируем участников по весу
      participants.value.forEach(participant => {
        if (!groupedByWeight[participant.weight]) {
          groupedByWeight[participant.weight] = [];
        }
        groupedByWeight[participant.weight].push(participant);
      });

      const matches = [];
      Object.keys(groupedByWeight).forEach(weight => {
        let fighters = groupedByWeight[weight];

        // Группируем бойцов по командам
        let teamGroups = {};
        fighters.forEach(fighter => {
          if (!teamGroups[fighter.team]) {
            teamGroups[fighter.team] = [];
          }
          teamGroups[fighter.team].push(fighter);
        });

        // Если бойцы только из одной команды - бой не создаётся
        if (Object.keys(teamGroups).length < 2) {
          console.log(`Недостаточно команд в категории ${weight} кг. Расписание не создано.`);
          return;
        }

        // Составляем пары бойцов из разных команд
        let availableFighters = [...fighters];
        while (availableFighters.length > 1) {
          let fighter1 = availableFighters.shift();
          let fighter2Index = availableFighters.findIndex(f => f.team !== fighter1.team);

          if (fighter2Index !== -1) {
            let fighter2 = availableFighters.splice(fighter2Index, 1)[0];
            matches.push({
              category: `${weight} кг`,
              fighter1: fighter1.name,
              fighter2: fighter2.name,
              time: "00:00",
              result: ""
            });
          }
        }

        // Если остался один без соперника – даём "Автоматическую победу"
        if (availableFighters.length === 1) {
          matches.push({
            category: `${weight} кг`,
            fighter1: availableFighters[0].name,
            fighter2: "Автоматическая победа",
            time: "00:00",
            result: availableFighters[0].name
          });
        }
      });

      store.commit("setSchedule", matches);
    };

    return { 
      schedule, generateSchedule, saveSchedule: () => store.commit("setSchedule", schedule.value),
      saveResults: () => store.commit("saveResults", schedule.value),
      addMatch: () => store.commit("addMatch", { category: "Без категории", fighter1: "", fighter2: "", time: "00:00", result: "" }),
      removeMatch: (index) => store.commit("removeMatch", index),
      selectedCategory, uniqueCategories, filteredSchedule, getMatchStatus, getStatusClass, successMessage,
      dragStart, drop
    };
  }
};
</script>
