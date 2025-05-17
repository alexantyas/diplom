<template>
  <div>
    <!-- Навигационная шапка -->

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
              <label class="form-label">Место проведения</label>
              <select v-model="competition.venue_id" class="form-select">
  <option disabled value="">Выберите место проведения</option>
  <option v-for="venue in venues" :key="venue.id" :value="venue.id">
    {{ venue.name }} — {{ venue.city_name }}
  </option>
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
import { ref, computed, onMounted } from 'vue';
import * as XLSX from 'xlsx';

export default {
  setup() {
    const createdCompetitions = ref([]);

    onMounted(() => {
      createdCompetitions.value = JSON.parse(localStorage.getItem('competitions')) || [];
    });
    const store = useStore();
    const router = useRouter();
    const importedData = ref(null);
    const venues = ref([]);

    onMounted(async () => {
      const token = localStorage.getItem("access_token");
      try {
        const response = await fetch("http://localhost:8000/competitions/venues/", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        venues.value = await response.json();
      } catch (error) {
        console.error("Ошибка при загрузке мест проведения:", error);
      }
    });

    const competition = ref({
      name: '',
      venue_id: '',
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
            if (row.length === 0 || row.every(cell => !cell)) return;

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

            if (participant.name && participant.team) {
              participants.push(participant);
            }
          });

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

    const saveCompetition = async () => {
      if (!competition.value.name || !competition.value.startDate || !competition.value.venue_id) {
        alert('Пожалуйста, заполните все поля!');
        return;
      }

      const token = localStorage.getItem('access_token');
      const payload = {
        name: competition.value.name,
        organizer: JSON.parse(localStorage.getItem("user"))?.full_name || 'admin',
        start_date: competition.value.startDate,
        status: 'Открыта',
        comment: '',
        venue_id: competition.value.venue_id
      };

      try {
        const response = await fetch('http://localhost:8000/competitions/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Ошибка при создании соревнования');

        alert('✅ Соревнование успешно создано!');
      } catch (error) {
        console.error(error);
        alert('❌ Не удалось создать соревнование');
      }
    };

    const logout = async () => {
      try {
        store.commit("logout");
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push('/login');
      } catch (error) {
        console.error('Ошибка при выходе:', error);
        window.location.href = '/login';
      }
    };

    return {
      competition,
      venues,
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
