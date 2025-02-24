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

    <!-- ✅ Кнопки управления расписанием + сохранение -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <button @click="generateSchedule" class="btn btn-primary">Автоматически сформировать расписание</button>
      <button @click="addMatch" class="btn btn-success">Добавить матч</button>
      <button @click="saveSchedule" class="btn btn-info">Сохранить расписание</button>
      <button @click="saveResults" class="btn btn-warning">Сохранить результаты</button>
    </div>

    <!-- ✅ Таблица расписания -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>#</th>
          <th>Весовая категория</th>
          <th>Спортсмен 1</th>
          <th>Спортсмен 2</th>
          <th>Время</th>
          <th>Судья</th>
          <th>Татами</th>
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
          <td>{{ match.judge }}</td>
          <td>{{ match.tatami }}</td>
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
    const schedule = computed(() => store.state.schedule);
    const participants = computed(() => store.state.participants);
    const judges = computed(() => store.state.judges);
    const selectedCategory = ref("");
    const successMessage = ref("");

    // ✅ Фильтрация по категориям
    const uniqueCategories = computed(() => {
      return [...new Set(schedule.value.map(m => m.category))];
    });

    const filteredSchedule = computed(() => {
      if (!selectedCategory.value) return schedule.value;
      return schedule.value.filter(m => m.category === selectedCategory.value);
    });

    // ✅ Определение статуса
    const getMatchStatus = (match) => {
      if (!match.result) return "Не начат";
      if (match.result === "draw") return "Ничья";
      return `Победитель: ${match.result}`;
    };

    // ✅ Определение CSS-класса статуса
    const getStatusClass = (match) => {
      if (!match.result) return "text-muted";
      if (match.result === "draw") return "text-warning";
      return "text-success fw-bold";
    };

    // ✅ Удаление схватки
    const removeMatch = (index) => {
      if (confirm("Удалить этот матч?")) {
        const updatedSchedule = [...schedule.value];
        updatedSchedule.splice(index, 1);
        store.commit("setSchedule", updatedSchedule);
      }
    };

    // ✅ Автоматическое формирование расписания с назначением судей
    const generateSchedule = () => {
      if (!participants.value.length) {
        alert("❌ Нет участников!");
        return;
      }
      if (!judges.value.length) {
        alert("❌ Нет судей!");
        return;
      }

      const groupedByWeight = {};
      participants.value.forEach((p) => {
        if (!groupedByWeight[p.weight]) groupedByWeight[p.weight] = [];
        groupedByWeight[p.weight].push(p);
      });

      const matches = [];
      Object.keys(groupedByWeight).forEach((weight) => {
        let fighters = groupedByWeight[weight];
        let availableFighters = [...fighters];

        while (availableFighters.length > 1) {
          let fighter1 = availableFighters.shift();
          let fighter2 = availableFighters.shift();
          let randomJudge = judges.value[Math.floor(Math.random() * judges.value.length)];
          matches.push({
            category: `${weight} кг`,
            fighter1: fighter1.name,
            fighter2: fighter2.name,
            time: "00:00",
            result: "",
            judge: randomJudge.name,
            tatami: randomJudge.tatami
          });
        }

        if (availableFighters.length === 1) {
          let randomJudge = judges.value[Math.floor(Math.random() * judges.value.length)];
          matches.push({
            category: `${weight} кг`,
            fighter1: availableFighters[0].name,
            fighter2: "Автоматическая победа",
            time: "00:00",
            result: availableFighters[0].name,
            judge: randomJudge.name,
            tatami: randomJudge.tatami
          });
        }
      });

      if (matches.length === 0) {
        alert("⚠️ Расписание не было составлено. Проверьте участников!");
        return;
      }

      store.commit("setSchedule", matches);
      alert("✅ Расписание успешно сгенерировано!");
    };

    // ✅ Сохранение результатов
    const saveResults = () => {
      if (!schedule.value.length) {
        alert("❌ Нет данных для сохранения!");
        return;
      }

      store.commit("saveResults", schedule.value);
      successMessage.value = "✅ Результаты успешно сохранены!";
      setTimeout(() => {
        successMessage.value = "";
      }, 3000);
    };

    return {
      schedule,
      generateSchedule,
      selectedCategory,
      uniqueCategories,
      filteredSchedule,
      getMatchStatus,
      getStatusClass,
      removeMatch,
      saveResults, // ✅ Добавил сохранение результатов
      successMessage,
    };
  },
};
</script>




