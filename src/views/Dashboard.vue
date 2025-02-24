<template>
  <div>
    <!-- ✅ Шапка с навигацией -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/dashboard/teams" class="nav-link">Команды</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/dashboard/schedule" class="nav-link">Расписание</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/dashboard/judges" class="nav-link">Судейская</router-link>
            </li>
            <li v-if="userRole === 'organizer'" class="nav-item">
              <router-link to="/dashboard/participants" class="nav-link">Участники</router-link>
            </li>
            <li v-if="userRole === 'organizer'" class="nav-item">
              <router-link to="/dashboard/print" class="nav-link">Печать</router-link>
            </li>
          </ul>
          <button @click="logout" class="btn btn-danger">Выход</button>
        </div>
      </div>
    </nav>

    <!-- ✅ Основной контент -->
    <div class="container-fluid">
      <div class="row">
        <!-- ✅ Панель управления соревнованиями -->
        <div v-if="userRole === 'organizer' || userRole === 'admin'" class="col-md-3 sidebar bg-light p-3">
          <h6 class="text-center fw-bold">Управление соревнованиями</h6>

          <!-- ✅ Создание соревнования -->
          <div class="card p-3 shadow-sm mb-3">
            <h6>Создать соревнование</h6>
            <input v-model="competition.name" type="text" class="form-control form-control-sm mb-2" placeholder="Название">
            <input v-model="competition.city" type="text" class="form-control form-control-sm mb-2" placeholder="Город">
            <select v-model="competition.country" class="form-select form-select-sm mb-2">
              <option>Россия</option>
              <option>США</option>
              <option>Германия</option>
            </select>
            <input v-model="competition.startDate" type="date" class="form-control form-control-sm mb-2">
            <select v-model="competition.type" class="form-select form-select-sm mb-2">
              <option>Чемпионат континента</option>
              <option>Международный турнир</option>
              <option>Национальный турнир</option>
            </select>
            <button @click="createCompetition" class="btn btn-primary btn-sm w-100">Создать</button>
          </div>

          <!-- ✅ Импорт соревнования -->
          <div class="card p-3 shadow-sm">
            <h6>Импорт соревнования</h6>
            <input type="file" @change="importCompetition" accept=".xlsx, .xls" class="form-control form-control-sm mb-2">
            <button @click="downloadTemplate" class="btn btn-outline-primary btn-sm w-100">📥 Скачать шаблон Excel</button>

            <!-- 🔥 Маленькое окно предпросмотра -->
            <div v-if="importedData" class="preview-box">
              <h6 class="text-center fw-bold">📥 Предпросмотр</h6>
              <p><strong>📌 Команд:</strong> {{ importedData.teams.length }}</p>
              <p><strong>👥 Участников:</strong> {{ importedData.participants.length }}</p>

              <div class="d-flex justify-content-between mt-2">
                <button @click="confirmImport" class="btn btn-success btn-sm">✅ Подтвердить</button>
                <button @click="cancelImport" class="btn btn-danger btn-sm">❌ Отмена</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ Основной контент -->
        <div class="col-md-9 main-content">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from "vuex";
import { computed, ref } from "vue";
import * as XLSX from "xlsx";

export default {
  setup() {
    const store = useStore();
    const userRole = computed(() => store.getters.userRole);

    const competition = ref({
      name: "",
      city: "",
      country: "Россия",
      startDate: "",
      type: "Чемпионат континента"
    });

    const importedData = ref(null);

    // ✅ Функция выхода
    const logout = () => {
      store.commit("logout"); // Очищаем пользователя в Vuex
      window.location.href = "/login"; // Перенаправляем на страницу входа
    };

    // ✅ Функция скачивания шаблона Excel
    const downloadTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([
        { "Команда": "", "Участник": "", "Вес": "", "Город": "", "Страна": "" }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Шаблон соревнования");

      // 📥 Скачивание файла
      XLSX.writeFile(wb, "Шаблон_Соревнования.xlsx");
    };

    // ✅ Создание соревнования
    const createCompetition = () => {
      if (!competition.value.name || !competition.value.city || !competition.value.startDate) {
        alert("❌ Заполните все поля!");
        return;
      }

      store.commit("setCompetition", { ...competition.value });
      alert("✅ Соревнование создано!");
    };

    // ✅ Импорт соревнования
    const importCompetition = async (event) => {
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

          const teamsSet = new Set();
          const participants = [];

          sheet.forEach(row => {
            if (row.Команда) teamsSet.add(row.Команда);
            if (row.Участник) {
              participants.push({
                name: row.Участник.trim(),
                weight: row.Вес ? Number(row.Вес) : null,
                team: row.Команда ? row.Команда.trim() : "Без команды"
              });
            }
          });

          importedData.value = {
            teams: Array.from(teamsSet).map(name => ({ name })),
            participants
          };
        } catch (error) {
          alert("Ошибка при обработке файла: " + error.message);
        }
      };
      reader.readAsArrayBuffer(file);
    };

    return { userRole, competition, createCompetition, logout, downloadTemplate, importCompetition, importedData };
  }
};
</script>
