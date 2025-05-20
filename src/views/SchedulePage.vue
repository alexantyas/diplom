<template>
  <div class="container-fluid mt-3">
    <!-- Фильтры -->
    <div class="row mb-3">
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

    <!-- Кнопки -->
    <div class="d-flex gap-2 mb-3">
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

    <!-- Таблицы -->
    <template v-for="(sec, idx) in sections" :key="idx">
      <h5 :class="{ 'mt-4': idx>0 }">{{ sec.title }}</h5>
      <div class="table-responsive">
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th>#</th><th>Этап</th><th>Категория</th>
              <th>Спортсмен 1</th><th>Спортсмен 2</th><th>Время</th>
              <th>Судья</th><th>Рефери</th><th>Ковер</th>
              <th>Результат</th><th>Примечание</th><th>Баллы</th><th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(m,i) in sec.matches" :key="i"
              :class="[ sec.rowClass, { 'bracket-match': isBracketMatch(m) } ]"
            >
              <td>{{ i+1 }}</td>
              <td>
                <span v-if="m.stage" class="badge bg-info">{{ m.stage }}</span>
                <span v-else>-</span>
              </td>
              <td><span class="badge bg-secondary">{{ m.category }}</span></td>
              <td>
  <span v-if="m.fighter1">{{ m.fighter1.name }}</span>
  <span v-else>-</span>
</td>
              <td>
  <span v-if="m.fighter2">{{ m.fighter2.name }}</span>
  <span v-else>-</span>
</td>
              <td>
                <input type="time" v-model="m.time" class="form-control form-control-sm"
                       @change="updateMatch(m)" />
              </td>
              <td>
                <select v-model="m.judge" class="form-select form-select-sm" @change="updateMatch(m)">
                  <option value="">–</option>
                  <option v-for="j in judges" :key="j.name" :value="j.name">{{ j.name }}</option>
                </select>
              </td>
              <td>
                <select v-model="m.referee" class="form-select form-select-sm" @change="updateMatch(m)">
                  <option value="">–</option>
                  <option v-for="j in judges" :key="j.name" :value="j.name">{{ j.name }}</option>
                </select>
              </td>
              <td>
                <input v-model="m.tatami" class="form-control form-control-sm" @change="updateMatch(m)" />
              </td>
              <td>
                <template v-if="!isBracketMatch(m) || !m.result">
                  <select v-model="m.fighter1" class="form-select form-select-sm" @change="updateMatch(m)">
  <option :value="null">–</option>
  <option v-for="p in participants" :key="p.type+'-'+p.id" :value="p">
    {{ p.name }} ({{ p.type === 'team' ? 'командный' : 'индивидуальный' }})
  </option>
</select>
                </template>
                <span v-else class="text-success">{{ m.result?.name || m.result }}</span>
              </td>
              <td>
                <template v-if="!isBracketMatch(m)">
                  <input v-model="m.note" class="form-control form-control-sm" @change="updateMatch(m)" />
                </template>
                <span v-else>{{ m.note||'-' }}</span>
              </td>
              <td>
                <template v-if="!isBracketMatch(m) || !m.result">
                  <input type="number" v-model.number="m.points"
                         class="form-control form-control-sm" @change="updateMatch(m)" />
                </template>
                <span v-else>{{ m.points }}</span>
              </td>
              <td>
                <template v-if="!isBracketMatch(m) || !m.result">
                  <select v-model="m.status" class="form-select form-select-sm"
                          @change="updateMatchStatus(m)">
                    <option v-for="opt in sec.statusOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </template>
                <span v-else class="badge bg-success">Завершён</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useBracketStore } from '@/store/bracketStore';
import { getScheduleKey } from '@/utils/storageKeys'
export default {
  setup() {
    const store = useStore();
    const route = useRoute();
    const competitionId = Number(route.params.id);
    const { weightCategories, selectCategory, initializeBracket,loadState } = useBracketStore()
    const selectedCategory = ref('');
    const selectedJudge    = ref('');

    const applications = computed(() => store.state.applications);
    const schedule = computed(() => store.state.schedule || []);
    const judges       = computed(() => store.state.judges);
    const participants = computed(() => store.state.participants);

    const approvedApps = computed(() =>
      store.state.applications.filter(a => a.status === 'approved')
    );

    const uniqueCategories = computed(() =>
      Array.from(new Set(schedule.value.map(m => m.category)))
    );

    onMounted(async () => {
  await store.dispatch('loadApprovedApplications', competitionId)

  const lsKey = getScheduleKey(competitionId)
   const saved = localStorage.getItem(lsKey)
   if (saved) {
     // есть локальный кеш — сразу в state
     store.commit('setSchedule', JSON.parse(saved))
   } else {
     // кеша нет — грузим из API и сразу кешируем
     await store.dispatch('loadSchedule', competitionId)
   }
   const hasSaved = loadState()
    if (!hasSaved && weightCategories.value.length) {
      selectCategory(weightCategories.value[0])
      initializeBracket()
    }
  });
    // Фильтрация
    const filterMatches = arr => arr.filter(m =>
  (!selectedCategory.value || m.category === selectedCategory.value) &&
  (!selectedJudge.value    || m.judge    === selectedJudge.value)
);

    const upcomingMatches = computed(() =>
      filterMatches(schedule.value.filter(m => m.status==='upcoming'))
        .sort((a,b)=>a.time.localeCompare(b.time))
    );
    const finishedMatches = computed(() =>
      filterMatches(schedule.value.filter(m => m.status==='finished'))
        .sort((a,b)=>b.time.localeCompare(a.time))
    );

    const sections = computed(()=>[
      {
        title: 'Предстоящие схватки',
        matches: upcomingMatches.value,
        rowClass: 'upcoming-match',
        statusOptions:[
          {value:'upcoming', label:'Не начат'},
          {value:'finished', label:'Завершен'}
        ]
      },
      {
        title: 'Завершенные схватки',
        matches: finishedMatches.value,
        rowClass: 'finished-match',
        statusOptions:[
          {value:'finished', label:'Завершен'},
          {value:'upcoming', label:'Вернуть в ожидание'}
        ]
      }
    ]);


    const getMatchIndex = m =>
        schedule.value.findIndex(x => x.id === m.id);
    
    
        const isBracketMatch = m =>
      m.stage && ['1/16','1/8','1/4','1/2','final'].includes(m.stage);

    
    

    // Обновление любого поля матча
    const updateMatch = async m => {
      const idx = getMatchIndex(m);
      if (idx===-1) return;
      store.commit('updateMatch', { index: idx, match: m });
      await store.dispatch('saveScheduleToServer', competitionId);
    };


    const updateMatchStatus = async m => {
      await updateMatch(m);
    };

    // Генерация на основе approved-заявок
const generateSchedule = async () => {
      selectedCategory.value = '';
      selectedJudge.value = '';

      await store.dispatch('loadApprovedApplications', competitionId);
      await store.dispatch('loadSchedule', competitionId);
      const apps = store.state.applications.filter(a => a.status === 'approved');

      const parts = [];
      for (const app of apps) {
        if (app.request_type_id === 2 && Array.isArray(app.team_participants)) {
          parts.push(...app.team_participants.map(p => ({
            id:     p.id,
            type:   "team",
            name:   `${p.last_name} ${p.first_name}${p.middle_name ? ` ${p.middle_name}` : ''}`,
            team:   app.team_id,
            weight: p.weight,
          })));
        }
        if (
          Array.isArray(app.individual_participants) &&
          app.individual_participants.length > 0
        ) {
          const ip = app.individual_participants[0];
          parts.push({
            id:     ip.user.id,
            type:   "individual",
            name:   `${ip.user.last_name} ${ip.user.first_name}${ip.user.middle_name ? ` ${ip.user.middle_name}` : ''}`,
            team:   null,
            weight: ip.user.weight,
          });
        }
      }
      const byWeight = {};
      parts.forEach(p => {
        ;(byWeight[p.weight] ||= []).push(p);
      });

      const newSched = [];
      let num = 1;

      Object.entries(byWeight).forEach(([weight, list]) => {
        let pool = [...list];
        while (pool.length >= 2) {
          const fighter1 = pool.shift();
          const opponents = pool.filter(x =>
            fighter1.team != null
              ? x.team !== fighter1.team
              : true
          );
          if (opponents.length === 0) break;
          const fighter2 = opponents[Math.floor(Math.random() * opponents.length)];
          pool = pool.filter(x => x !== fighter2);
          const randJ = judges.value[Math.floor(Math.random() * judges.value.length)];
          newSched.push({
            id:             num++,
            competition_id: competitionId,
            category:       `${weight} кг`,
            fighter1:       fighter1,
            fighter2:       fighter2,
            stage:          '',
            time:           '',
            judge:          randJ?.name   || '',
            referee:        '',
            tatami:         randJ?.tatami || '1',
            result:         null,
            note:           '',
            points:         0,
            status:         'upcoming',
          });
        }
      });
      store.commit('setSchedule', newSched);
      await store.dispatch('saveScheduleToServer', competitionId);
      await store.dispatch('saveSchedule', competitionId);
    };


    const addMatch = () => {
      if(!selectedCategory.value) return alert('Выберите категорию');
      store.commit('addMatch', {
        id: Date.now(),
        competition_id: competitionId,
        category: selectedCategory.value,
        fighter1: null, fighter2: null,
        stage:'', time:'', judge:'', referee:'', tatami:'', result: null, note:'', points:0, status:'upcoming'
      });
    };

    const saveSchedule = async () => {
      await store.dispatch('saveSchedule', competitionId);
      alert('Расписание сохранено');
    };
    const saveResults = async () => {
      await store.dispatch('saveResults');
      alert('Результаты сохранены');
    };

    

    return {
      judges, participants, selectedCategory, selectedJudge,
      uniqueCategories, sections,
      generateSchedule, addMatch, saveSchedule, saveResults,
      updateMatch, updateMatchStatus, isBracketMatch
    };
  }
};
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
</style>
