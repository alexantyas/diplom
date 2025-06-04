<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <div class="container mt-3">
      <h3>⚖️ Судейская</h3>

      <!-- ✅ Таблица судей -->
      <div class="card p-3 shadow-sm mb-3">
        <h6>📜 Список судей</h6>
        <input type="file" @change="importJudges" accept=".xlsx, .xls" class="form-control form-control-sm mb-2">
        <button @click="downloadJudgesTemplate" class="btn btn-outline-primary btn-sm w-100 mb-3">📥 Скачать шаблон судей</button>

        <table class="table table-striped mt-2">
          <thead>
            <tr>
              <th>#</th>
              <th>ФИО</th>
              <th>Квалификация</th>
              <th>Ковер</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(judge, index) in judges" :key="judge.id">
              <td>{{ index + 1 }}</td>
              <td>{{ judge.name }}</td>
              <td>{{ judge.category }}</td>
              <td>{{ judge.tatami }}</td>
              <td>
                <button @click="editJudge(judge)" class="btn btn-primary btn-sm">✏️</button>
                <button @click="removeJudge(judge.id)" class="btn btn-danger btn-sm ms-2">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Форма добавления нового судьи -->
        <div class="mt-3">
          <h6>Добавить судью</h6>
          <div class="row g-2">
            <div class="col-md-4">
              <input v-model="newJudge.name" class="form-control form-control-sm" placeholder="ФИО судьи">
            </div>
            <div class="col-md-3">
              <select v-model="newJudge.category" class="form-select form-select-sm">
                <option value="">Выберите квалификацию</option>
                <option>Международная</option>
                <option>Национальная</option>
                <option>Региональная</option>
              </select>
            </div>
            <div class="col-md-2">
              <input v-model.number="newJudge.tatami" type="number" class="form-control form-control-sm" placeholder="Ковер">
            </div>
            <div class="col-md-3">
              <button @click="addJudge" class="btn btn-success btn-sm w-100">Добавить</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Сообщения -->
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as XLSX from 'xlsx'
import { getJudges, createJudges, importJudges as apiImportJudges, deleteJudge } from '@/api/judgeService'

export default {
  setup() {
    const route = useRoute()
    const competitionId = Number(route.params.id)
    
    const judges = ref([])
    const newJudge = ref({ name: '', category: '', tatami: 1 })
    const successMessage = ref('')
    const errorMessage = ref('')

    // Загрузка судей из API
    const loadJudges = async () => {
      try {
        const response = await getJudges(competitionId)
        judges.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки судей:', error)
        errorMessage.value = 'Ошибка загрузки судей'
      }
    }

    // Добавление судьи
    const addJudge = async () => {
      if (!newJudge.value.name.trim()) {
        errorMessage.value = 'Введите ФИО судьи'
        return
      }

      try {
        const judgeData = {
          ...newJudge.value,
          competition_id: competitionId
        }
        
        await createJudges([judgeData])
        await loadJudges()
        
        // Очистка формы
        newJudge.value = { name: '', category: '', tatami: 1 }
        successMessage.value = 'Судья успешно добавлен!'
        setTimeout(() => successMessage.value = '', 3000)
      } catch (error) {
        console.error('Ошибка добавления судьи:', error)
        errorMessage.value = 'Ошибка добавления судьи'
      }
    }

    // Удаление судьи
    const removeJudge = async (judgeId) => {
      if (!confirm('Удалить судью?')) return

      try {
        await deleteJudge(judgeId)
        await loadJudges()
        successMessage.value = 'Судья удален!'
        setTimeout(() => successMessage.value = '', 3000)
      } catch (error) {
        console.error('Ошибка удаления судьи:', error)
        errorMessage.value = 'Ошибка удаления судьи'
      }
    }

    // Импорт судей из Excel
    const importJudges = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      try {
        await apiImportJudges(competitionId, file)
        await loadJudges()
        successMessage.value = 'Судьи успешно импортированы!'
        setTimeout(() => successMessage.value = '', 3000)
      } catch (error) {
        console.error('Ошибка импорта судей:', error)
        errorMessage.value = 'Ошибка импорта судей'
      }
    }

    // Скачивание шаблона
    const downloadJudgesTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([
        { "ФИО судьи": "", "Квалификация": "Международная", "Татами": 1 }
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Шаблон судей")
      XLSX.writeFile(wb, "Шаблон_судей.xlsx")
    }

    const editJudge = (judge) => {
      // Можно добавить модальное окно для редактирования
      console.log('Редактирование судьи:', judge)
    }

    onMounted(() => {
      if (competitionId) {
        loadJudges()
      }
    })

    return {
      judges,
      newJudge,
      successMessage,
      errorMessage,
      addJudge,
      removeJudge,
      importJudges,
      downloadJudgesTemplate,
      editJudge
    }
  }
}
</script>

<style scoped>
.alert {
  margin-top: 1rem;
}
</style>