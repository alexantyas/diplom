<template>
  <div class="container-fluid p-0">
    <!-- Фильтры и кнопки -->
    <div class="row mb-3 mx-3 gx-3 gy-2">
      <div class="col-md-6">
        <label class="form-label">Весовая категория</label>
        <select v-model="selectedCategory" class="form-select">
          <option value="">Все</option>
          <option v-for="c in uniqueCategories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Судья</label>
        <select v-model="selectedJudge" class="form-select">
          <option value="">Все</option>
          <option v-for="j in judges" :key="j.name" :value="j.name">{{ j.name }}</option>
        </select>
      </div>
    </div>
    <div class="d-flex gap-2 mb-3 mx-3">
      <button @click="generateSchedule" class="btn btn-secondary">
        Сформировать и сохранить
      </button>
      <button @click="addMatch" class="btn btn-secondary">
        Добавить схватку
      </button>
      <button @click="saveSchedule" class="btn btn-secondary">
        Сохранить расписание
      </button>
      <button @click="saveResults" class="btn btn-secondary">
        Сохранить результаты
      </button>
    </div>

    <!-- ВКЛАДКИ -->
    <ul class="nav nav-tabs mb-3 mx-3">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'upcoming' }"
          href="#"
          @click.prevent="activeTab = 'upcoming'"
        >Предстоящие схватки</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'finished' }"
          href="#"
          @click.prevent="activeTab = 'finished'"
        >Завершенные схватки</a>
      </li>
    </ul>

    <!-- Таблица -->
    <div class="table-responsive">
      <table class="table table-bordered table-sm m-0"
             style="table-layout: fixed; width: 1600px; min-width: 1600px; white-space:nowrap;">
        <colgroup>
          <col style="width: 40px;">
          <col style="width: 60px;">
          <col style="width: 90px;">
          <col style="width: 250px;">
          <col style="width: 250px;">
          <col style="width: 120px;">
          <col style="width: 170px;">
          <col style="width: 170px;">
          <col style="width: 60px;">
          <col style="width: 240px;">
          <col style="width: 200px;">
          <col style="width: 80px;">
          <col style="width: 150px;">
        </colgroup>
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Этап</th>
            <th>Категория</th>
            <th>Спортсмен 1</th>
            <th>Спортсмен 2</th>
            <th>Время</th>
            <th>Судья</th>
            <th>Рефери</th>
            <th>Ковер</th>
            <th>Результат</th>
            <th>Примечание</th>
            <th>Баллы</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in currentMatches" :key="m.id || i">
            <td>{{ i+1 }}</td>
            <td>
              <span v-if="m.stage" class="badge bg-info">{{ m.stage }}</span><span v-else>-</span>
            </td>
            <td><span class="badge bg-secondary">{{ m.category }}</span></td>
            <td>{{ getNameById(m.red_participant_type, m.red_participant_id) }}</td>
            <td>{{ getNameById(m.blue_participant_type, m.blue_participant_id) }}</td>
            <td>
              <input type="time"
                     v-model="m.time"
                     class="form-control form-control-sm"
                     :disabled="activeTab === 'finished'"
                     @change="updateField(m)" />
            </td>
            <td>
              <select v-model="m.judge"
                      class="form-select form-select-sm"
                      :disabled="activeTab === 'finished'"
                      @change="updateField(m)">
                <option value="">–</option>
                <option v-for="j in judges" :key="j.name" :value="j.name">{{ j.name }}</option>
              </select>
            </td>
            <td>
              <select v-model="m.referee"
                      class="form-select form-select-sm"
                      :disabled="activeTab === 'finished'"
                      @change="updateField(m)">
                <option value="">–</option>
                <option v-for="j in judges" :key="j.name+'r'" :value="j.name">{{ j.name }}</option>
              </select>
            </td>
            <td>
              <input v-model="m.tatami"
                     class="form-control form-control-sm"
                     :disabled="activeTab === 'finished'"
                     @change="updateField(m)" />
            </td>
            <td>
              <template v-if="m.status === 'finished' && m.winner_participant_id">
                {{ getNameById(m.winner_participant_type, m.winner_participant_id) }}
                <span class="text-muted">
                  ({{ m.winner_participant_type === 'team' ? 'командный' : 'индивидуальный' }})
                </span>
              </template>
              <template v-else>
                <select
                  v-model="selectedResults[m.id]"
                  class="form-select form-select-sm"
                  :disabled="activeTab === 'finished'"
                >
                  <option :value="null">–</option>
                  <option
                    v-if="m.red_participant_id"
                    :value="JSON.stringify({id: m.red_participant_id, type: m.red_participant_type})"
                  >
                    {{ getNameById(m.red_participant_type, m.red_participant_id) }}
                    ({{ m.red_participant_type === 'team' ? 'командный' : 'индивидуальный' }})
                  </option>
                  <option
                    v-if="m.blue_participant_id"
                    :value="JSON.stringify({id: m.blue_participant_id, type: m.blue_participant_type})"
                  >
                    {{ getNameById(m.blue_participant_type, m.blue_participant_id) }}
                    ({{ m.blue_participant_type === 'team' ? 'командный' : 'индивидуальный' }})
                  </option>
                </select>
              </template>
            </td>
            <td>
              <input v-model="m.note"
                     class="form-control form-control-sm"
                     @change="updateField(m)" />
            </td>
            <td>
              <input type="number"
                     v-model.number="m.points"
                     class="form-control form-control-sm"
                     @change="updateField(m)" />
            </td>
            <td>
              <select v-model="m.status"
                      class="form-select form-select-sm"
                      @change="onStatusChange(m, $event.target.value)">
                <option value="upcoming">Не начат</option>
                <option value="finished">Завершен</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { createMatchesBatch } from '../api.js'

export default {
  setup() {
    const store = useStore()
    const route = useRoute()
    const competitionId = Number(route.params.id)
    const selectedResults = ref({})

    // Сброс выбора при изменении расписания
    const schedule = computed(() => store.state.schedule || [])
    watch(schedule, () => { selectedResults.value = {} })

    const judges = computed(() => store.state.judges || [])
    const participants = computed(() => store.state.participants || [])

    const uniqueCategories = computed(() =>
      Array.from(new Set(schedule.value.map(m => m.category)))
    )

    const participantsMap = computed(() => {
      const m = {}
      for (const p of participants.value) {
        m[`${p.type}:${p.id}`] = p.name
      }
      return m
    })
    function getNameById(type, id) {
      return participantsMap.value[`${type}:${id}`] || '—'
    }

    const selectedCategory = ref('')
    const selectedJudge = ref('')
    const activeTab = ref('upcoming')

    const filterMatches = arr => arr.filter(m =>
      (!selectedCategory.value || m.category === selectedCategory.value) &&
      (!selectedJudge.value    || m.judge    === selectedJudge.value)
    )
    const upcomingMatches = computed(() =>
      filterMatches(schedule.value.filter(m => m.status === 'upcoming'))
    )
    const finishedMatches = computed(() =>
      filterMatches(schedule.value.filter(m => m.status === 'finished'))
    )
    const currentMatches = computed(() =>
      activeTab.value === 'upcoming' ? upcomingMatches.value : finishedMatches.value
    )

    // Обработчик смены статуса
    async function onStatusChange(m, newStatus) {
      console.log('[DEBUG] onStatusChange for match', m.id, 'newStatus=', newStatus)
      let winner_id = null
      let winner_type = null

      // достаём выбор победителя
      const sel = selectedResults.value[m.id]
      if (newStatus === 'finished' && sel) {
        try {
          const obj = JSON.parse(sel)
          winner_id = obj.id
          winner_type = obj.type
        } catch {}
      }

      const updateData = {
        stage:        m.stage,
        match_time:   m.time,
        judge_id:     judges.value.find(j => j.name === m.judge)?.id || null,
        referee_id:   judges.value.find(j => j.name === m.referee)?.id || null,
        status:       newStatus,
        score:        m.points,
        comment:      m.note,
        ...(newStatus === 'finished' && winner_id
          ? { winner_participant_id: winner_id, winner_participant_type: winner_type }
          : {})
      }

      console.log('PATCH updateData:', updateData)
      // отправка обновления
      await store.dispatch('updateScheduleMatch', {
  id: m.id,
  updateData,
  competitionId,
})
      // очистка селекта победителя
      selectedResults.value[m.id] = null
      // перезагрузка расписания и бранкета
      await store.dispatch('loadSchedule', competitionId)
      await store.dispatch('loadBracket', competitionId)
    }

    // Общий апдейт остальных полей
    async function updateField(m) {
      const updateData = {
        stage:      m.stage,
        match_time: m.time,
        judge_id:   judges.value.find(j => j.name === m.judge)?.id || null,
        referee_id: judges.value.find(j => j.name === m.referee)?.id || null,
        score:      m.points,
        comment:    m.note
      }
      await store.dispatch('updateScheduleMatch', { id: m.id, updateData,competitionId })
    }

    // Генерация расписания
     const generateSchedule = async () => {
  try {
    // 1) Загрузить одобренные заявки
    await store.dispatch('loadApprovedApplications', competitionId)
    const apps = store.state.applications.filter(a => a.status === 'approved')
    if (!apps.length) {
      alert('Нет одобренных заявок')
      return
    }

    // 2) Собрать участников
    const parts = []
    for (const app of apps) {
      if (Array.isArray(app.team_participants)) {
        for (const p of app.team_participants) {
          parts.push({
            id:     p.id,
            type:   'team',
            name:   `${p.last_name} ${p.first_name}`.trim(),
            team:   app.team_id,
            weight: p.weight
          })
        }
      }
      if (Array.isArray(app.individual_participants) && app.individual_participants.length) {
        const ip = app.individual_participants[0]
        parts.push({
          id:     ip.user.id,
          type:   'individual',
          name:   `${ip.user.last_name} ${ip.user.first_name}`.trim(),
          team:   null,
          weight: ip.user.weight
        })
      }
    }
    // сохранить участников в стор, если нужно
    store.commit('setParticipants', parts.map(p => ({
      id: p.id, type: p.type, name: p.name, weight: p.weight
    })))

    // 3) Группировка по весовым категориям и формирование пар
    const byWeight = {}
    parts.forEach(p => {
      byWeight[p.weight] ||= []
      byWeight[p.weight].push(p)
    })

    const dtos = []
    Object.entries(byWeight).forEach(([w, list]) => {
      const stage = list.length === 2   ? 'Финал'
                  : list.length === 4   ? '1/2 финала'
                  : list.length === 8   ? '1/4 финала'
                  : list.length === 16  ? '1/8 финала'
                  : list.length === 32  ? '1/16 финала'
                  : '1/8 финала'

      const pool = [...list]
      while (pool.length >= 2) {
        const f1 = pool.shift()
        // исключаем матчи внутри одной команды
        const oppCandidates = f1.team != null
          ? pool.filter(x => x.team !== f1.team)
          : [...pool]
        if (!oppCandidates.length) break

        const f2 = oppCandidates[Math.floor(Math.random() * oppCandidates.length)]
        pool.splice(pool.indexOf(f2), 1)

        dtos.push({
          red_participant_type:   f1.type,
          red_participant_id:     f1.id,
          blue_participant_type:  f2.type,
          blue_participant_id:    f2.id,
          competition_id:         competitionId,
          category:               `${w} кг`,
          stage,
          status:     'upcoming',
          referee_id: null,
          judge_id:   null,
          match_time: null,
          score:      null,
          comment:    null
        })
      }
    })

    if (!dtos.length) {
      alert('Нет участников для генерации расписания')
      return
    }

    // 4) Сохранить партии на бэке и обновить расписание
    await createMatchesBatch(dtos)
    await store.dispatch('loadSchedule', competitionId)
  }
  catch (e) {
    console.error(e)
    alert('Ошибка генерации расписания')
  }
}

// Добавление одной схватки
const addMatch = async () => {
  if (!selectedCategory.value) {
    alert('Выберите категорию')
    return
  }
  const dto = {
    red_participant_type:  null,
    red_participant_id:    null,
    blue_participant_type: null,
    blue_participant_id:   null,
    competition_id,
    category:   selectedCategory.value,
    stage:      '',
    status:     'upcoming',
    referee_id: null,
    judge_id:   null,
    match_time: null,
    score:      null,
    comment:    null
  }
  await createMatchesBatch([dto])
  await store.dispatch('loadSchedule', competitionId)
}

// Синхронизация расписания с бэкендом
const saveSchedule = async () => {
  await store.dispatch('loadSchedule', competitionId)
  alert('Расписание синхронизировано')
}

// Сохранение результатов турнира
const saveResults = async () => {
  await store.dispatch('saveTournamentResults')
  alert('Результаты сохранены')
}

    onMounted(async () => {
      await store.dispatch('loadApprovedApplications', competitionId)
      await store.dispatch('loadSchedule', competitionId)
    })

    return {
      judges, selectedCategory, selectedJudge, uniqueCategories,
      currentMatches, activeTab, getNameById,
      generateSchedule, addMatch, saveSchedule, saveResults,
      selectedResults, onStatusChange, updateField
    }
  }
}
</script>

<style scoped>
.table th { background-color:#f8f9fa; white-space:nowrap; }
.table td { vertical-align:middle; }
.upcoming-match { background-color:rgba(248,249,250,0.5); }
.finished-match { background-color:rgba(198,239,206,0.5); }
.bracket-match { background-color:rgba(207,226,255,0.5); }
.text-success.fw-bold { font-weight:600; }
input[type="time"] { min-width:110px; }
.badge { font-size:0.85em; padding:0.35em 0.65em; }
.nav-tabs { background: #f8f9fa; }
.nav-link.active { background: #fff; border-color: #dee2e6 #dee2e6 #fff; }
</style>
