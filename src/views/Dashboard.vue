<template>
  <div>
    <!-- Навигация -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/create" class="nav-link">Создание</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/dashboard/teams" class="nav-link">Команды</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/dashboard/schedule" class="nav-link">Расписание</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/dashboard/bracket" class="nav-link">Сетка</router-link>
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

    <!-- Основной контент -->
    <div class="container-fluid">
      <router-view />
    </div>
  </div>
</template>

<script>
import { useStore } from "vuex";
import { computed, ref } from "vue";
import * as XLSX from "xlsx";
import { useRouter } from "vue-router";

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
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
    const logout = async () => {
      try {
        store.commit("logout");
        // Небольшая задержка для завершения очистки данных
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push('/login');
      } catch (error) {
        console.error('Ошибка при выходе:', error);
        // Принудительное перенаправление в случае ошибки
        window.location.href = '/login';
      }
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

    // ✅ Импорт соревнования (добавил город и страну участников)
    const importCompetition = async (event) => {
      const file = event.target.files[0];
      if (!file) return alert("Выберите файл");

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

          if (sheet.length === 0) {
            alert("Ошибка: Пустой файл");
            return;
          }

          const headers = sheet[0].map(header => header.trim().toLowerCase());
          const dataRows = sheet.slice(1);

          let participants = [];
          let teamsSet = new Set();

          dataRows.forEach(row => {
            let participant = {};

            headers.forEach((header, index) => {
              if (header.includes("команда")) {
                participant.team = row[index]?.trim() || "Без команды";
                teamsSet.add(participant.team);
              }
              if (header.includes("участник")) participant.name = row[index]?.trim() || "Без имени";
              if (header.includes("вес")) participant.weight = row[index] ? Number(row[index]) : null;
              if (header.includes("город")) participant.city = row[index]?.trim() || "";
              if (header.includes("страна")) participant.country = row[index]?.trim() || "";
            });

            participants.push(participant);
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

    // ✅ Подтверждение импорта (теперь также сохраняет город и страну участников)
    const confirmImport = () => {
      if (importedData.value) {
        store.commit("setTeams", importedData.value.teams);
        store.commit("setParticipants", importedData.value.participants);
        alert("✅ Данные успешно импортированы!");
        importedData.value = null; // 🔥 Закрываем окно предпросмотра
      }
    };

    const cancelImport = () => {
      importedData.value = null; // 🔥 Закрываем окно предпросмотра
    };

    return { userRole, competition, createCompetition, logout, downloadTemplate, importCompetition, importedData, confirmImport, cancelImport };
  }
};
</script>

