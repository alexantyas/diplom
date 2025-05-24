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

    <!-- Таблица с секцией по активной вкладке -->
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
          <tr v-for="(m, i) in currentMatches" :key="i">
            <td>{{ i+1 }}</td>
            <td>
              <span v-if="m.stage" class="badge bg-info">{{ m.stage }}</span>
              <span v-else>-</span>
            </td>
            <td><span class="badge bg-secondary">{{ m.category }}</span></td>
            <td>
              <span>
                {{ getNameById(m.red_participant_type, m.red_participant_id) }}
              </span>
            </td>
            <td>
             <span>
                {{ getNameById(m.blue_participant_type, m.blue_participant_id) }}
             </span>
            </td>
            <td>
              <input type="time"
                     v-model="m.time"
                     class="form-control form-control-sm"
                     :disabled="activeTab === 'finished'"
                     @change="updateMatch(m)"
              />
            </td>
            <td>
              <select v-model="m.judge"
                      class="form-select form-select-sm"
                      :disabled="activeTab === 'finished'"
                      @change="updateMatch(m)">
                <option value="">–</option>
                <option v-for="j in judges" :key="j.name" :value="j.name">{{ j.name }}</option>
              </select>
            </td>
            <td>
              <select v-model="m.referee"
                      class="form-select form-select-sm"
                      :disabled="activeTab === 'finished'"
                      @change="updateMatch(m)">
                <option value="">–</option>
                <option v-for="j in judges" :key="j.name+'r'" :value="j.name">{{ j.name }}</option>
              </select>
            </td>
            <td>
              <input v-model="m.tatami"
                     class="form-control form-control-sm"
                     :disabled="activeTab === 'finished'"
                     @change="updateMatch(m)"
              />
            </td>
            <td>
  <select
    v-model="m.result"
    class="form-select form-select-sm"
    :disabled="activeTab === 'finished'"
    @change="updateMatch(m)"
  >
    <!-- Пустой вариант -->
    <option :value="null">–</option>

    <!-- Красный участник -->
    <option
      v-if="m.red_participant_id"
      :value="getNameById(m.red_participant_type, m.red_participant_id)"
    >
      {{ getNameById(m.red_participant_type, m.red_participant_id) }}
      ({{ m.red_participant_type === 'team' ? 'командный' : 'индивидуальный' }})
    </option>

    <!-- Синий участник -->
    <option
      v-if="m.blue_participant_id"
      :value="getNameById(m.blue_participant_type, m.blue_participant_id)"
    >
      {{ getNameById(m.blue_participant_type, m.blue_participant_id) }}
      ({{ m.blue_participant_type === 'team' ? 'командный' : 'индивидуальный' }})
    </option>
  </select>
</td>
            <td>
              <input v-model="m.note"
                     class="form-control form-control-sm"
                     @change="updateMatch(m)" />
            </td>
            <td>
              <input type="number"
                     v-model.number="m.points"
                     class="form-control form-control-sm"
                     @change="updateMatch(m)" />
            </td>
            <td>
              <select v-model="m.status"
        class="form-select form-select-sm"
        @change="updateMatch(m)">
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
import { useBracketStore } from '@/store/bracketStore'
import { createMatchesBatch, getApprovedApplications } from '@/api'
import { getScheduleKey } from '@/utils/storageKeys'

export default {
  setup() {
    const store = useStore()
    const route = useRoute()
    const competitionId = Number(route.params.id)

    const uniqueCategories = computed(() =>
      Array.from(new Set(schedule.value.map(m => m.category)))
    )

    const participants = computed(() => store.state.participants || [])
    const participantsMap = computed(() => {
      const m = {}
      for (const p of participants.value) {
        m[`${p.type}:${p.id}`] = p.name
      }
      return m
    })
    const weightMap = computed(() => {
      const m = {}
      for (const p of participants.value) {
        m[`${p.type}:${p.id}`] = p.weight
      }
      return m
    })
    function getNameById(type, id) {
      return participantsMap.value[`${type}:${id}`] || '—'
    }
    function getWeightById(type, id) {
      const w = weightMap.value[`${type}:${id}`]
      return w != null ? `${w} кг` : ''
    }

    // фильтры и табы
    const selectedCategory = ref('')
    const selectedJudge    = ref('')
    const activeTab        = ref('upcoming')

    // работа с брэкетом
    const {
      top32Matches,
      top16Matches,
      top8Matches,
      top4Matches,
      finalMatch,
      thirdPlaceMatch,
      initializeBracket,
      setWinner: bracketSetWinner,
      selectCategory
    } = useBracketStore()

    // расписание и список судей
    const schedule = computed(() => store.state.schedule || [])
    const judges   = computed(() => store.state.judges   || [])

    // список категорий для фильтра
    
    // фильтрация
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

    // порядок стадий
    const STAGES = [
      '1/16 финала',
      '1/8 финала',
      '1/4 финала',
      '1/2 финала',
      'Финал'
    ]
    function nextStage(stage) {
      const i = STAGES.indexOf(stage)
      return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null
    }

    // после завер­шения всех матчей в одной стадии, формируем следующую
    async function advanceToNextStage(category, fromStage) {
      const toStage = nextStage(fromStage)
      if (!toStage) return

      // выбираем все завершённые матчи этой категории и стадии
      const finished = store.state.schedule.filter(m =>
        m.category === category &&
        m.stage    === fromStage &&
        m.status   === 'finished' &&
        m.winner_participant_id != null
      )

      // собираем массив победителей
      const winners = finished.map(m => ({
        type: m.winner_participant_type,
        id:   m.winner_participant_id
      }))

      // формируем DTO для первых n/2 пар
      const dtos = []
      for (let i = 0; i + 1 < winners.length; i += 2) {
        const a = winners[i]
        const b = winners[i + 1]
        dtos.push({
          red_participant_type:   a.type,
          red_participant_id:     a.id,
          blue_participant_type:  b.type,
          blue_participant_id:    b.id,
          competition_id:         competitionId,
          category,               // сохраняем ту же категорию
          stage:                  toStage,
          status:                 'upcoming',
          referee_id:             null,
          judge_id:               null,
          match_time:             null,
          score:                  null,
          comment:                null
        })
      }

      if (!dtos.length) return

      // создаём на бэке и впиливаем в стор
      const { data: newMatches } = await createMatchesBatch(dtos)
      newMatches.forEach(m => m.category = category)
      store.commit('setSchedule', [
        ...store.state.schedule,
        ...newMatches
      ])
      localStorage.setItem(
        getScheduleKey(competitionId),
        JSON.stringify(store.state.schedule)
      )
    }
const updateMatch = async m => {
      const updateData = {
        stage:       m.stage,
        match_time:  m.time,
        judge_id:    judges.value.find(j => j.name === m.judge)?.id || null,
        referee_id:  judges.value.find(j => j.name === m.referee)?.id || null,
        status:      m.status,
        score:       m.points,
        comment:     m.note,
        result:      m.result,
        // эти два поля должны быть возвращены бэком в ответе PATCH
        // и попадут в state.schedule через экшен
        // winner_participant_type и winner_participant_id
      }

      // отправляем патч
      await store.dispatch('updateScheduleMatch', {
        id:         m.id,
        updateData
      })

      // если матч помечен как "finished", продвигаем победителя
      if (m.status === 'finished' && m.winner_participant_id) {
        await advanceToNextStage(m.category, m.stage)
      }
    }
    // генерация расписания по заявкам
    const generateSchedule = async () => {
      try {
        await store.dispatch('loadApprovedApplications', competitionId)
        const apps = store.state.applications.filter(a => a.status === 'approved')
        if (!apps.length) {
          alert('Нет одобренных заявок')
          return
        }

        // собираем участников
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
        store.commit('setParticipants', parts.map(p => ({
          id: p.id, type: p.type, name: p.name, weight: p.weight
        })))

        // по весам группируем и создаём DTO
        const byWeight = {}
        parts.forEach(p => (byWeight[p.weight] ||= []).push(p))

        const dtos = []
        Object.entries(byWeight).forEach(([w, list]) => {
          let stage = list.length === 2  ? 'Финал'
                    : list.length === 4  ? '1/2 финала'
                    : list.length === 8  ? '1/4 финала'
                    : list.length === 16 ? '1/8 финала'
                    : list.length === 32 ? '1/16 финала'
                    : '1/8 финала'
          const pool = [...list]
          while (pool.length >= 2) {
            const f1 = pool.shift()
            const opp = f1.team != null
              ? pool.filter(x => x.team !== f1.team)
              : [...pool]
            if (!opp.length) break
            const f2 = opp[Math.floor(Math.random() * opp.length)]
            pool.splice(pool.indexOf(f2), 1)

            dtos.push({
              red_participant_type:   f1.type,
              red_participant_id:     f1.id,
              blue_participant_type:  f2.type,
              blue_participant_id:    f2.id,
              competition_id: competitionId,
              category:   `${w} кг`,      // <-- вот здесь критично
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

        const { data: created } = await createMatchesBatch(dtos)
        store.commit('setSchedule', created)
        localStorage.setItem(
          getScheduleKey(competitionId),
          JSON.stringify(created)
        )
      }
      catch (e) {
        console.error(e)
        alert('Ошибка генерации расписания')
      }
    }

    // добавление одной схватки
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
        competition_id: competitionId,
        category:   selectedCategory.value,
        stage:      '',
        status:     'upcoming',
        referee_id: null,
        judge_id:   null,
        match_time: null,
        score:      null,
        comment:    null
      }
      const { data } = await createMatchesBatch([dto])
      store.commit('setSchedule', [...schedule.value, data[0]])
    }

    // перезагрузка расписания с сервера
    const saveSchedule = async () => {
      await store.dispatch('loadSchedule', competitionId)
      alert('Расписание синхронизировано')
    }

    // сохранить результаты турнира (брэкет)
    const saveResults = async () => {
      await store.dispatch('saveTournamentResults')
      alert('Результаты сохранены')
    }

    // обновление одного матча + продвижение победителя
    

    // при монтировании — пытаемся взять из localStorage либо грузим
    onMounted(async () => {
      await store.dispatch('loadApprovedApplications', competitionId)
      const key = getScheduleKey(competitionId)
      const saved = localStorage.getItem(key)
      if (saved) {
        store.commit('setSchedule', JSON.parse(saved))
      } else {
        await store.dispatch('loadSchedule', competitionId)
      }
    })

    // при смене категории — обновляем брэкет
    watch(selectedCategory, cat => {
      if (cat) {
        selectCategory(cat.replace(' кг',''))
        initializeBracket()
      }
    })

    // при изменении расписания — если у текущей категории что-то изменилось, реинициализируем брэкет
    watch(() => store.state.schedule, (newS, oldS) => {
      if (!selectedCategory.value) return
      const a = oldS.filter(m => m.category === selectedCategory.value)
      const b = newS.filter(m => m.category === selectedCategory.value)
      if (b.some((x,i) => !a[i] || x.status!==a[i].status || x.comment!==a[i].comment)) {
        initializeBracket()
      }
    }, { deep: true })

    return {
      judges,
      selectedCategory,
      selectedJudge,
      uniqueCategories,
      currentMatches,
      activeTab,
      getNameById,
      getWeightById,
      generateSchedule,
      addMatch,
      saveSchedule,
      saveResults,
      updateMatch,
      advanceToNextStage,
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

