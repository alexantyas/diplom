<template>
  <div>
    <!-- Навигационная шапка -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/create" class="nav-link active">Создание</router-link>
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
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-6">
          <h2 class="mb-4">Создание соревнования</h2>
          <div class="card p-4 shadow-sm">
            <h4 class="mb-3">Основная информация</h4>
            <div class="mb-3">
              <label class="form-label">Название</label>
              <input v-model="competition.name" type="text" class="form-control" placeholder="Введите название">
            </div>

            <div class="mb-3">
              <label class="form-label">Город</label>
              <input v-model="competition.city" type="text" class="form-control" placeholder="Введите город">
            </div>

            <div class="mb-3">
              <label class="form-label">Страна</label>
              <select v-model="competition.country" class="form-select">
                <option>Швейцария</option>
                <option>Россия</option>
                <option>США</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Дата начала</label>
              <input v-model="competition.startDate" type="date" class="form-control">
            </div>

            <div class="mb-3">
              <label class="form-label">Тип соревнования</label>
              <select v-model="competition.type" class="form-select">
                <option>Чемпионат континента</option>
                <option>Международный турнир</option>
                <option>Национальный турнир</option>
              </select>
            </div>

            <button @click="saveCompetition" class="btn btn-primary btn-lg">Создать соревнование</button>
          </div>
        </div>

        <div class="col-md-6">
          <h2 class="mb-4">Импорт соревнования</h2>
          <div class="card p-3 shadow-sm">
            <h6>Импорт из Excel</h6>
            <input type="file" @change="importCompetition" accept=".xlsx, .xls" class="form-control form-control-sm mb-2">
            <button @click="downloadTemplate" class="btn btn-outline-primary btn-sm w-100">📥 Скачать шаблон Excel</button>

            <div v-if="importedData" class="preview-box mt-3 p-3 border rounded">
              <h6 class="text-center fw-bold">Предпросмотр импорта</h6>
              <p class="mb-2"><strong>📌 Команд:</strong> {{ importedData.teams.length }}</p>
              <p class="mb-2"><strong>👥 Участников:</strong> {{ importedData.participants.length }}</p>
              <div class="d-flex justify-content-between mt-3">
                <button @click="confirmImport" class="btn btn-success">✅ Подтвердить</button>
                <button @click="cancelImport" class="btn btn-danger">❌ Отмена</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';
import { onMounted } from 'vue';
export default {
  setup() {
    const createdCompetitions = ref([]);

    onMounted(() => {
      createdCompetitions.value = JSON.parse(localStorage.getItem('competitions')) || [];
    });
    const store = useStore();
    const router = useRouter();
    const importedData = ref(null);

    const competition = ref({
      name: '',
      city: '',
      country: 'Россия',
      startDate: '',
      type: 'Чемпионат континента'
    });

    const userRole = computed(() => store.getters.userRole);

    const importCompetition = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

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
            if (row.length === 0 || row.every(cell => !cell)) return; // Пропускаем пустые строки

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

            if (participant.name && participant.team) { // Проверяем наличие основных данных
              participants.push(participant);
            }
          });

          // Устанавливаем данные для предпросмотра
          importedData.value = {
            teams: Array.from(teamsSet).map(name => ({ name })),
            participants,
            competition: {
              name: 'Импортированное соревнование',
              city: participants[0]?.city || '',
              country: participants[0]?.country || 'Россия',
              startDate: new Date().toISOString().split('T')[0],
              type: 'Международный турнир'
            }
          };

        } catch (error) {
          alert("Ошибка при обработке файла: " + error.message);
          importedData.value = null;
        }
      };
      reader.readAsArrayBuffer(file);
    };

    const confirmImport = () => {
      if (importedData.value) {
        store.commit('setCompetition', importedData.value.competition);
        store.commit('setTeams', importedData.value.teams);
        store.commit('setParticipants', importedData.value.participants);
        alert('✅ Данные успешно импортированы!');
        router.push('/dashboard/teams');
      }
    };

    const cancelImport = () => {
      importedData.value = null;
    };

    const downloadTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([
        { 
          "Команда": "", 
          "Участник": "", 
          "Вес": "", 
          "Город": "", 
          "Страна": "" 
        }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Шаблон соревнования");
      XLSX.writeFile(wb, "Шаблон_Соревнования.xlsx");
    };

    const saveCompetition = () => {
  if (!competition.value.name || !competition.value.city || !competition.value.startDate) {
    alert('Пожалуйста, заполните все поля!');
    return;
  }

  const newCompetition = {
    id: Date.now(),
    name: competition.value.name,
    city: competition.value.city,
    country: competition.value.country,
    startDate: competition.value.startDate,
    type: competition.value.type,
    status: 'Открыта'
  };

  const existing = JSON.parse(localStorage.getItem('competitions')) || [];
  existing.push(newCompetition);
  localStorage.setItem('competitions', JSON.stringify(existing));

  alert('✅ Соревнование успешно создано!');
};


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

    return {
      competition,
      importedData,
      saveCompetition,
      confirmImport,
      cancelImport,
      downloadTemplate,
      importCompetition,
      logout,
      userRole
    };
  }
};
</script>

<style scoped>
.preview-box {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
}

.preview-box p {
  margin-bottom: 0.5rem;
}
</style>
