<template>
  <div class="container mt-4">
    <h2>📑 Экспорт отчетов (Excel)</h2>

    <div class="d-flex flex-wrap gap-3">
      <button @click="exportMatchResults" class="btn btn-primary">📥 Результаты поединков</button>
      <button @click="exportParticipants" class="btn btn-secondary">📥 Список участников</button>
      <button @click="exportJudges" class="btn btn-success">📥 Список судей</button>
      <button @click="exportFullReport" class="btn btn-danger">📥 Полный отчет</button>
    </div>
  </div>
</template>

<script>
import * as XLSX from "xlsx";
import { useStore } from "vuex";
import { computed } from "vue";

export default {
  setup() {
    const store = useStore();
    const competition = computed(() => store.state.competition || {});
    const matches = computed(() => store.state.schedule || []);
    const participants = computed(() => store.state.participants || []);
    const judges = computed(() => store.state.judges || []);

    // 📌 Экспорт результатов поединков
    const exportMatchResults = () => {
      if (matches.value.length === 0) {
        alert("❌ Нет данных для экспорта!");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        matches.value.map((match, index) => ({
          "#": index + 1,
          "Категория": match.category || "—",
          "Спортсмен 1": match.fighter1 || "—",
          "Спортсмен 2": match.fighter2 || "—",
          "Судья": match.judge || "—",
          "Татами": match.tatami || "—",
          "Результат": match.result || "—",
          "Время": match.time || "—"
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Результаты поединков");
      XLSX.writeFile(workbook, "Результаты_поединков.xlsx");
    };

    // 📌 Экспорт списка участников
    const exportParticipants = () => {
      if (participants.value.length === 0) {
        alert("❌ Нет данных для экспорта!");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        participants.value.map((participant, index) => ({
          "#": index + 1,
          "ФИО": participant.name || "—",
          "Команда": participant.team || "—",
          "Весовая категория": `${participant.weight || "—"} кг`,
          "Город": participant.city || "—",
          "Страна": participant.country || "—"
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Список участников");
      XLSX.writeFile(workbook, "Список_участников.xlsx");
    };

    // 📌 Экспорт списка судей
    const exportJudges = () => {
      if (judges.value.length === 0) {
        alert("❌ Нет данных для экспорта!");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        judges.value.map((judge, index) => ({
          "#": index + 1,
          "ФИО": judge.name || "—",
          "Квалификация": judge.category || "—",
          "Татами": judge.tatami || "—"
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Список судей");
      XLSX.writeFile(workbook, "Список_судей.xlsx");
    };

    // 📌 Экспорт полного отчета
    const exportFullReport = () => {
      if (matches.value.length === 0 && participants.value.length === 0 && judges.value.length === 0) {
        alert("❌ Нет данных для экспорта!");
        return;
      }

      const workbook = XLSX.utils.book_new();

      // 🔹 Информация о соревновании
      const competitionSheet = XLSX.utils.json_to_sheet([
        { "Название": competition.value.name || "—" },
        { "Город": competition.value.city || "—" },
        { "Страна": competition.value.country || "—" },
        { "Дата начала": competition.value.startDate || "—" },
        { "Тип": competition.value.type || "—" }
      ]);
      XLSX.utils.book_append_sheet(workbook, competitionSheet, "Информация о соревновании");

      // 🔹 Результаты поединков
      if (matches.value.length > 0) {
        const matchSheet = XLSX.utils.json_to_sheet(
          matches.value.map((match, index) => ({
            "#": index + 1,
            "Категория": match.category || "—",
            "Спортсмен 1": match.fighter1 || "—",
            "Спортсмен 2": match.fighter2 || "—",
            "Судья": match.judge || "—",
            "Татами": match.tatami || "—",
            "Результат": match.result || "—",
            "Время": match.time || "—"
          }))
        );
        XLSX.utils.book_append_sheet(workbook, matchSheet, "Результаты поединков");
      }

      // 🔹 Список участников
      if (participants.value.length > 0) {
        const participantSheet = XLSX.utils.json_to_sheet(
          participants.value.map((participant, index) => ({
            "#": index + 1,
            "ФИО": participant.name || "—",
            "Команда": participant.team || "—",
            "Весовая категория": `${participant.weight || "—"} кг`,
            "Город": participant.city || "—",
            "Страна": participant.country || "—"
          }))
        );
        XLSX.utils.book_append_sheet(workbook, participantSheet, "Список участников");
      }

      // 🔹 Список судей
      if (judges.value.length > 0) {
        const judgeSheet = XLSX.utils.json_to_sheet(
          judges.value.map((judge, index) => ({
            "#": index + 1,
            "ФИО": judge.name || "—",
            "Квалификация": judge.category || "—",
            "Татами": judge.tatami || "—"
          }))
        );
        XLSX.utils.book_append_sheet(workbook, judgeSheet, "Список судей");
      }

      XLSX.writeFile(workbook, "Полный_отчет_по_соревнованию.xlsx");
    };

    return { exportMatchResults, exportParticipants, exportJudges, exportFullReport };
  }
};
</script>
