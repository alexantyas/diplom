<template>
  <div class="container mt-3">
    <h3>👥 Участники соревнования</h3>

    <!-- ✅ Фильтр по имени, команде и весу -->
    <div class="row mb-3">
      <div class="col-md-3">
        <input v-model="searchQuery" type="text" class="form-control" placeholder="🔍 Поиск по имени">
      </div>
      <div class="col-md-3">
        <select v-model="selectedTeam" class="form-select">
          <option value="">Все команды</option>
          <option v-for="team in uniqueTeams" :key="team" :value="team">{{ team }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <select v-model="selectedWeight" class="form-select">
          <option value="">Все веса</option>
          <option v-for="weight in uniqueWeights" :key="weight" :value="weight">{{ weight }} кг</option>
        </select>
      </div>
    </div>

    <!-- ✅ Кнопки управления -->
    <button @click="showAddModal = true" class="btn btn-success mb-3">➕ Добавить участника</button>
    <button @click="downloadParticipants" class="btn btn-outline-primary mb-3 ms-2">📥 Скачать список участников</button>
    <input type="file" @change="importParticipants" accept=".xlsx, .xls" class="form-control form-control-sm mb-3">

    <!-- ✅ Таблица участников -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>#</th>
          <th>ФИО</th>
          <th>Команда</th>
          <th>Вес</th>
          <th>Город</th>
          <th>Страна</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(participant, index) in filteredParticipants" :key="index">
          <td>{{ index + 1 }}</td>
          <td><input v-model="participant.name" class="form-control form-control-sm"></td>
          <td>
            <select v-model="participant.team" class="form-select form-select-sm">
              <option v-for="team in uniqueTeams" :key="team" :value="team">{{ team }}</option>
            </select>
          </td>
          <td><input v-model.number="participant.weight" class="form-control form-control-sm" type="number"></td>
          <td><input v-model="participant.city" class="form-control form-control-sm"></td>
          <td><input v-model="participant.country" class="form-control form-control-sm"></td>
          <td>
            <button @click="updateParticipant(index, participant)" class="btn btn-primary btn-sm">💾</button>
            <button @click="removeParticipant(index)" class="btn btn-danger btn-sm ms-2">🗑</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ Модальное окно добавления участника -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <h5>➕ Добавить участника</h5>
        <input v-model="newParticipant.name" type="text" class="form-control mb-2" placeholder="ФИО">
        <input v-model.number="newParticipant.weight" type="number" class="form-control mb-2" placeholder="Вес (кг)">
        <select v-model="newParticipant.team" class="form-select mb-2">
          <option value="">Выберите команду</option>
          <option v-for="team in uniqueTeams" :key="team" :value="team">{{ team }}</option>
        </select>
        <input v-model="newParticipant.city" type="text" class="form-control mb-2" placeholder="Город">
        <input v-model="newParticipant.country" type="text" class="form-control mb-2" placeholder="Страна">
        <div class="modal-actions">
          <button @click="addParticipant" class="btn btn-success">✅ Добавить</button>
          <button @click="showAddModal = false" class="btn btn-danger">❌ Закрыть</button>
        </div>
      </div>
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
    const participants = computed(() => store.state.participants);

    const searchQuery = ref("");
    const selectedTeam = ref("");
    const selectedWeight = ref("");
    const showAddModal = ref(false);
    const newParticipant = ref({ name: "", weight: "", team: "", city: "", country: "" });

    // ✅ Фильтрация участников
    const filteredParticipants = computed(() => {
      return participants.value.filter(p =>
        (searchQuery.value === "" || p.name.toLowerCase().includes(searchQuery.value.toLowerCase())) &&
        (selectedTeam.value === "" || p.team === selectedTeam.value) &&
        (selectedWeight.value === "" || p.weight == selectedWeight.value)
      );
    });

    // ✅ Уникальные команды и веса
    const uniqueTeams = computed(() => [...new Set(participants.value.map(p => p.team))]);
    const uniqueWeights = computed(() => [...new Set(participants.value.map(p => p.weight))]);

    // ✅ Добавление участника
    const addParticipant = () => {
      if (!newParticipant.value.name || !newParticipant.value.weight || !newParticipant.value.team || !newParticipant.value.city || !newParticipant.value.country) {
        alert("❌ Заполните все поля!");
        return;
      }
      store.commit("addParticipant", { ...newParticipant.value });
      newParticipant.value = { name: "", weight: "", team: "", city: "", country: "" };
      showAddModal.value = false;
    };

    // ✅ Обновление участника
    const updateParticipant = (index, participant) => {
      store.commit("updateParticipant", { index, ...participant });
    };

    // ✅ Удаление участника
    const removeParticipant = (index) => {
      if (confirm("Удалить участника?")) {
        store.commit("removeParticipant", index);
      }
    };

    // ✅ Импорт списка участников
    const importParticipants = async (event) => {
      try {
        const file = event.target.files[0];
        if (!file) throw new Error("Файл не выбран");

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

            const headers = sheet[0].map(header => header.trim().toLowerCase());
            const dataRows = sheet.slice(1);

            const importedParticipants = dataRows.map(row => {
              let participant = {};
              headers.forEach((header, index) => {
                if (header === "команда") participant.team = row[index]?.trim() || "";
                if (header === "участник") participant.name = row[index]?.trim() || "";
                if (header === "вес") participant.weight = row[index] ? Number(row[index]) : null;
                if (header === "город") participant.city = row[index]?.trim() || "";
                if (header === "страна") participant.country = row[index]?.trim() || "";
              });
              return participant;
            });

            store.commit("setParticipants", importedParticipants);
            alert("✅ Участники успешно импортированы!");
          } catch (error) {
            alert("Ошибка при обработке файла: " + error.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    };

    return {
      participants, filteredParticipants, searchQuery, selectedTeam, selectedWeight,
      uniqueTeams, uniqueWeights, showAddModal, newParticipant,
      addParticipant, updateParticipant, removeParticipant, importParticipants
    };
  }
};
</script>
