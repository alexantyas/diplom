<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <div class="container mt-4">
      <h2>📑 Печать отчетов</h2>

      <!-- Кнопки экспорта -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card p-3">
            <h5>📋 Расписание соревнований</h5>
            <p class="text-muted">Экспорт расписания с результатами, судьями и временем проведения</p>
            <div class="d-flex gap-2">
              <button @click="printScheduleToPDF" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                📄 Печать в PDF
              </button>
              <button @click="exportScheduleToExcel" class="btn btn-success">
                📊 Экспорт в Excel
              </button>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card p-3">
            <h5>📝 Другие отчеты</h5>
            <p class="text-muted">Дополнительные отчеты и документы</p>
            <div class="d-flex gap-2">
              <button @click="exportJudges" class="btn btn-secondary">
                👨‍⚖️ Список судей
              </button>
              <button @click="exportFullReport" class="btn btn-info">
                📋 Полный отчет
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Предпросмотр для печати -->
      <div v-if="showPreview" class="card p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5>👁️ Предпросмотр расписания</h5>
          <button @click="showPreview = false" class="btn btn-outline-secondary btn-sm">Закрыть</button>
        </div>
        
        <!-- Область для печати -->
        <div id="schedule-print-area" class="print-area">
          <!-- Заголовок отчета -->
          <div class="print-header text-center mb-4">
            <h2>{{ competition?.name || 'Расписание соревнований' }}</h2>
            <p class="mb-1"><strong>Организатор:</strong> {{ competition?.organizer || '—' }}</p>
            <p class="mb-1"><strong>Дата:</strong> {{ formatDate(competition?.start_date) }}</p>
            <p class="mb-1"><strong>Место:</strong> {{ getVenueInfo() }}</p>
            <p><strong>Сформировано:</strong> {{ new Date().toLocaleString('ru-RU') }}</p>
          </div>

          <!-- Статистика -->
          <div class="print-stats row text-center mb-4">
            <div class="col-3">
              <div class="border p-2">
                <h6>Всего матчей</h6>
                <div class="h4">{{ schedule.length }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="border p-2">
                <h6>Завершено</h6>
                <div class="h4">{{ finishedMatches.length }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="border p-2">
                <h6>Предстоящих</h6>
                <div class="h4">{{ upcomingMatches.length }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="border p-2">
                <h6>Ковров</h6>
                <div class="h4">{{ uniqueCarpets.length }}</div>
              </div>
            </div>
          </div>

          <!-- Таблица расписания -->
          <table class="table table-bordered table-sm print-table">
            <thead class="table-dark">
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 8%">Этап</th>
                <th style="width: 12%">Категория</th>
                <th style="width: 20%">Участник 1</th>
                <th style="width: 20%">Участник 2</th>
                <th style="width: 8%">Время</th>
                <th style="width: 6%">Ковер</th>
                <th style="width: 12%">Судья</th>
                <th style="width: 9%">Результат</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(match, index) in sortedSchedule" :key="match.id" 
                  :class="{ 'table-success': match.status === 'finished' }">
                <td>{{ index + 1 }}</td>
                <td>
                  <span class="badge bg-info">{{ match.stage || '—' }}</span>
                </td>
                <td>{{ match.category }}</td>
                <td>{{ getParticipantName(match.red_participant_type, match.red_participant_id) }}</td>
                <td>{{ getParticipantName(match.blue_participant_type, match.blue_participant_id) }}</td>
                <td>{{ formatTime(match.match_time) }}</td>
                <td class="text-center">{{ match.tatami || '—' }}</td>
                <td>{{ getJudgeName(match.judge_id) }}</td>
                <td>
                  <div v-if="match.status === 'finished' && match.winner_participant_id">
                    <strong>{{ getParticipantName(match.winner_participant_type, match.winner_participant_id) }}</strong>
                    <br>
                    <small class="text-muted">{{ match.score || '' }}</small>
                  </div>
                  <span v-else class="text-muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Подпись -->
          <div class="print-signature mt-5">
            <div class="row">
              <div class="col-6">
                <p>Главный судья: ________________________</p>
              </div>
              <div class="col-6">
                <p>Главный секретарь: ________________________</p>
              </div>
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
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import * as XLSX from 'xlsx'

export default {
  setup() {
    const store = useStore()
    const route = useRoute()
    const competitionId = Number(route.params.id)

    // Состояние
    const loading = ref(false)
    const showPreview = ref(false)
    const successMessage = ref('')
    const errorMessage = ref('')

    // Данные
    const competition = computed(() => store.state.competition)
    const schedule = computed(() => store.state.schedule || [])
    const judges = computed(() => store.state.judges || [])
    const participants = computed(() => store.state.participants || [])

    // Вычисляемые свойства
    const finishedMatches = computed(() => 
      schedule.value.filter(m => m.status === 'finished')
    )
    
    const upcomingMatches = computed(() => 
      schedule.value.filter(m => m.status === 'upcoming')
    )
    
    const uniqueCarpets = computed(() => 
      [...new Set(schedule.value.map(m => m.tatami).filter(Boolean))]
    )

    const sortedSchedule = computed(() => 
      [...schedule.value].sort((a, b) => {
        // Сортируем по времени, затем по ковру
        if (a.match_time && b.match_time) {
          return new Date(a.match_time) - new Date(b.match_time)
        }
        return 0
      })
    )

    // Карта участников для быстрого поиска
    const participantsMap = computed(() => {
      const map = {}
      participants.value.forEach(p => {
        map[`${p.type}:${p.id}`] = p.name
      })
      return map
    })

    // Функции форматирования
    const formatDate = (dateString) => {
      if (!dateString) return '—'
      return new Date(dateString).toLocaleDateString('ru-RU')
    }

    const formatTime = (dateTimeString) => {
      if (!dateTimeString) return '—'
      return new Date(dateTimeString).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getParticipantName = (type, id) => {
      if (!type || !id) return '—'
      return participantsMap.value[`${type}:${id}`] || 'Неизвестно'
    }

    const getJudgeName = (judgeId) => {
      if (!judgeId) return '—'
      const judge = judges.value.find(j => j.id === judgeId)
      return judge ? judge.name : '—'
    }

    const getVenueInfo = () => {
      if (!competition.value) return '—'
      
      if (competition.value.venue) {
        const venue = competition.value.venue
        return `${venue.name}${venue.city_name ? ` (${venue.city_name})` : ''}`
      }
      
      return '—'
    }

    // Печать в PDF
    const printScheduleToPDF = async () => {
      loading.value = true
      showPreview.value = true
      
      try {
        // Ждем отрисовки
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Настройки для печати
        const printContent = document.getElementById('schedule-print-area')
        const originalContent = document.body.innerHTML
        
        // Добавляем стили для печати
        const printStyles = `
          <style>
            @media print {
              body { margin: 0; font-family: Arial, sans-serif; }
              .print-area { max-width: 100%; }
              .print-table { font-size: 11px; }
              .print-table th, .print-table td { padding: 4px 6px; }
              .print-header { margin-bottom: 20px; }
              .print-stats { margin-bottom: 20px; }
              .print-signature { margin-top: 30px; }
              .badge { background-color: #6c757d !important; color: white; padding: 2px 6px; border-radius: 3px; }
              .table-success { background-color: #d4edda !important; }
              .table-bordered { border: 1px solid #000 !important; }
              .table-bordered th, .table-bordered td { border: 1px solid #000 !important; }
            }
          </style>
        `
        
        // Создаем новое окно для печати
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Расписание соревнований</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            ${printStyles}
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `)
        
        printWindow.document.close()
        printWindow.focus()
        
        // Ждем загрузки и печатаем
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
          successMessage.value = 'PDF документ сформирован успешно!'
          setTimeout(() => successMessage.value = '', 3000)
        }, 1000)
        
      } catch (error) {
        console.error('Ошибка печати:', error)
        errorMessage.value = 'Ошибка при формировании PDF'
        setTimeout(() => errorMessage.value = '', 3000)
      } finally {
        loading.value = false
      }
    }

    // Экспорт в Excel
    const exportScheduleToExcel = () => {
      try {
        const excelData = sortedSchedule.value.map((match, index) => ({
          '№': index + 1,
          'Этап': match.stage || '—',
          'Категория': match.category,
          'Участник 1': getParticipantName(match.red_participant_type, match.red_participant_id),
          'Участник 2': getParticipantName(match.blue_participant_type, match.blue_participant_id),
          'Время': formatTime(match.match_time),
          'Ковер': match.tatami || '—',
          'Судья': getJudgeName(match.judge_id),
          'Рефери': getJudgeName(match.referee_id),
          'Результат': match.status === 'finished' 
            ? getParticipantName(match.winner_participant_type, match.winner_participant_id)
            : '—',
          'Счет': match.score || '—',
          'Статус': match.status || '—'
        }))

        const ws = XLSX.utils.json_to_sheet(excelData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Расписание')
        
        const fileName = `Расписание_${competition.value?.name || 'Соревнование'}_${new Date().toLocaleDateString('ru-RU')}.xlsx`
        XLSX.writeFile(wb, fileName)
        
        successMessage.value = 'Excel файл успешно сохранен!'
        setTimeout(() => successMessage.value = '', 3000)
        
      } catch (error) {
        console.error('Ошибка экспорта Excel:', error)
        errorMessage.value = 'Ошибка при экспорте в Excel'
        setTimeout(() => errorMessage.value = '', 3000)
      }
    }

    // Экспорт судей
    const exportJudges = () => {
      try {
        const judgesData = judges.value.map((judge, index) => ({
          '№': index + 1,
          'ФИО': judge.name,
          'Квалификация': judge.category || '—',
          'Ковер': judge.tatami || '—'
        }))

        const ws = XLSX.utils.json_to_sheet(judgesData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Судьи')
        XLSX.writeFile(wb, 'Список_судей.xlsx')
        
        successMessage.value = 'Список судей экспортирован!'
        setTimeout(() => successMessage.value = '', 3000)
        
      } catch (error) {
        errorMessage.value = 'Ошибка экспорта судей'
        setTimeout(() => errorMessage.value = '', 3000)
      }
    }

    // Полный отчет
    const exportFullReport = () => {
      try {
        const wb = XLSX.utils.book_new()
        
        // Лист с расписанием
        const scheduleData = sortedSchedule.value.map((match, index) => ({
          '№': index + 1,
          'Этап': match.stage || '—',
          'Категория': match.category,
          'Участник 1': getParticipantName(match.red_participant_type, match.red_participant_id),
          'Участник 2': getParticipantName(match.blue_participant_type, match.blue_participant_id),
          'Время': formatTime(match.match_time),
          'Ковер': match.tatami || '—',
          'Результат': match.status === 'finished' 
            ? getParticipantName(match.winner_participant_type, match.winner_participant_id)
            : '—'
        }))
        
        const scheduleWs = XLSX.utils.json_to_sheet(scheduleData)
        XLSX.utils.book_append_sheet(wb, scheduleWs, 'Расписание')
        
        // Лист с судьями
        const judgesData = judges.value.map((judge, index) => ({
          '№': index + 1,
          'ФИО': judge.name,
          'Квалификация': judge.category || '—',
          'Ковер': judge.tatami || '—'
        }))
        
        const judgesWs = XLSX.utils.json_to_sheet(judgesData)
        XLSX.utils.book_append_sheet(wb, judgesWs, 'Судьи')
        
        const fileName = `Полный_отчет_${new Date().toLocaleDateString('ru-RU')}.xlsx`
        XLSX.writeFile(wb, fileName)
        
        successMessage.value = 'Полный отчет сформирован!'
        setTimeout(() => successMessage.value = '', 3000)
        
      } catch (error) {
        errorMessage.value = 'Ошибка формирования отчета'
        setTimeout(() => errorMessage.value = '', 3000)
      }
    }

    // Загрузка данных
    const loadData = async () => {
      try {
        // 1. Загружаем данные соревнования
        const competitionResponse = await fetch(`http://localhost:8000/competitions/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        
        if (competitionResponse.ok) {
          const competitions = await competitionResponse.json()
          const currentCompetition = competitions.find(c => c.id === competitionId)
          if (currentCompetition) {
            store.commit('setCompetition', currentCompetition)
            console.log('Загружено соревнование:', currentCompetition)
          }
        }
        
        // 2. Загружаем расписание
        await store.dispatch('loadSchedule', competitionId)
        
        // 3. Загружаем судей
        const judgesResponse = await fetch(`http://localhost:8000/judges/?competition_id=${competitionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        if (judgesResponse.ok) {
          const judgesData = await judgesResponse.json()
          store.commit('setJudges', judgesData)
        }
        
        // 4. Загружаем участников
        await store.dispatch('loadApprovedApplications', competitionId)
        
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
        errorMessage.value = 'Ошибка загрузки данных'
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      loading,
      showPreview,
      successMessage,
      errorMessage,
      competition,
      schedule,
      finishedMatches,
      upcomingMatches,
      uniqueCarpets,
      sortedSchedule,
      competitionId,
      formatDate,
      formatTime,
      getParticipantName,
      getJudgeName,
      getVenueInfo,
      printScheduleToPDF,
      exportScheduleToExcel,
      exportJudges,
      exportFullReport
    }
  }
}
</script>

<style scoped>
.print-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.print-table {
  font-size: 12px;
}

.print-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.print-stats .border {
  border-radius: 4px;
}

.print-signature {
  border-top: 1px solid #dee2e6;
  padding-top: 20px;
}

@media print {
  .container, .btn, .alert {
    display: none !important;
  }
  
  .print-area {
    display: block !important;
    margin: 0;
    padding: 0;
  }
}

.card {
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}
</style>