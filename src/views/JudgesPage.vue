<template>
  <div class="container mt-3">
    <h3>⚖️ Судейская</h3>

    <!-- ✅ Таблица судей -->
    <div class="card p-3 shadow-sm mb-3">
      <h6>📜 Список судей</h6>
      <input type="file" @change="importJudges" accept=".xlsx, .xls" class="form-control form-control-sm mb-2">
      <button @click="downloadJudgesTemplate" class="btn btn-outline-primary btn-sm w-100">📥 Скачать шаблон судей</button>

      <table class="table table-striped mt-2">
        <thead>
          <tr>
            <th>#</th>
            <th>ФИО</th>
            <th>Квалификация</th>
            <th>Татами</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(judge, index) in judges" :key="index">
            <td>{{ index + 1 }}</td>
            <td><input v-model="judge.name" class="form-control form-control-sm"></td>
            <td>
              <select v-model="judge.category" class="form-select form-select-sm">
                <option>Международная</option>
                <option>Национальная</option>
                <option>Региональная</option>
              </select>
            </td>
            <td><input v-model.number="judge.tatami" type="number" class="form-control form-control-sm"></td>
            <td>
              <button @click="updateJudge(index, judge)" class="btn btn-primary btn-sm">💾</button>
              <button @click="removeJudge(index)" class="btn btn-danger btn-sm ms-2">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ✅ Таблица расписания для судей -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>#</th>
          <th>Весовая категория</th>
          <th>Спортсмен 1</th>
          <th>Спортсмен 2</th>
          <th>Результат</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(match, index) in schedule" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ match.category }}</td>
          <td>{{ match.fighter1 }}</td>
          <td>{{ match.fighter2 }}</td>
          <td>
            <select v-model="match.result" class="form-select form-select-sm">
              <option value="">Выберите победителя</option>
              <option :value="match.fighter1">{{ match.fighter1 }}</option>
              <option v-if="match.fighter2 !== 'Автоматическая победа'" :value="match.fighter2">{{ match.fighter2 }}</option>
              <option value="draw">Ничья</option>
            </select>
          </td>
          <td>
            <button @click="saveResult(index, match)" class="btn btn-primary btn-sm">💾 Сохранить</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ Кнопка для сохранения всех результатов -->
    <button @click="saveAllResults" class="btn btn-success">📥 Сохранить все результаты</button>

    <!-- ✅ Уведомление об успешном сохранении -->
    <div v-if="successMessage" class="alert alert-success mt-3">
      {{ successMessage }}
    </div>
  </div>
</template>

<script>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import * as XLSX from "xlsx";

export default {
  setup() {
    const store = useStore();
    const schedule = computed(() => store.state.schedule);
    const successMessage = ref("");

    // ✅ Берём судей из localStorage или Vuex
    const judges = ref(JSON.parse(localStorage.getItem("judges")) || store.state.judges);

    // ✅ Сохранение результата отдельного матча
    const saveResult = (index, match) => {
      store.commit("updateMatch", { index, match });
      successMessage.value = `Результат матча #${index + 1} сохранен!`;
      setTimeout(() => (successMessage.value = ""), 3000);
    };

    // ✅ Сохранение всех результатов
    const saveAllResults = () => {
      store.commit("saveResults", schedule.value);
      successMessage.value = "Все результаты сохранены!";
      setTimeout(() => (successMessage.value = ""), 3000);
    };

    // ✅ Обновление судьи
    const updateJudge = (index, judge) => {
      judges.value[index] = { ...judge };
      store.commit("updateJudge", { index, ...judge });

      // ✅ Сохраняем обновлённый список в localStorage
      localStorage.setItem("judges", JSON.stringify(judges.value));
    };

    // ✅ Удаление судьи из списка
    const removeJudge = (index) => {
      if (confirm("Удалить судью?")) {
        judges.value.splice(index, 1); // Удаляем из списка
        store.commit("removeJudge", index); // Удаляем из Vuex

        // ✅ Обновляем localStorage
        localStorage.setItem("judges", JSON.stringify(judges.value));
      }
    };

    // ✅ Импорт списка судей из Excel
    const importJudges = async (event) => {
  const file = event.target.files[0];
  if (!file) return alert("Выберите файл");

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      if (sheet.length === 0) {
        alert("Ошибка: Пустой файл");
        return;
      }

      // ✅ Учитываем правильное название столбца "ФИО судьи"
      const importedJudges = sheet.map(row => ({
        name: row["ФИО судьи"]?.trim() || "Не указано", 
        category: row["Квалификация"]?.trim() || "Региональная",
        tatami: row["Татами"] ? Number(row["Татами"]) : 1
      }));

      // ✅ Обновляем Vuex и localStorage
      store.commit("setJudges", importedJudges);
      judges.value = [...importedJudges];
      localStorage.setItem("judges", JSON.stringify(importedJudges));

      alert("✅ Судьи успешно импортированы!");

    } catch (error) {
      alert("Ошибка при обработке файла: " + error.message);
    }
  };
  reader.readAsArrayBuffer(file);
};


    // ✅ Скачивание шаблона списка судей
    const downloadJudgesTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([{ "ФИО": "", "Квалификация": "Международная", "Татами": 1 }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Шаблон судей");
      XLSX.writeFile(wb, "Шаблон_судей.xlsx");
    };

    return { 
      schedule, 
      judges, 
      saveResult, 
      saveAllResults, 
      updateJudge, 
      removeJudge, 
      importJudges, 
      downloadJudgesTemplate 
    };
  }
};

</script>
