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

    <!-- ОДНА ТАБЛИЦА С СЕКЦИЕЙ ПО АКТИВНОЙ ВКЛАДКЕ -->
    <div class="table-responsive">
      <table class="table table-bordered table-sm m-0"
             style="table-layout: fixed; width: 1600px; min-width: 1600px; white-space:nowrap;">
        <colgroup>
          <col style="width: 30px;">
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
            <td>
              <span class="badge bg-secondary">{{ m.category }}</span>
            </td>
            <td>
              <span>{{ getFighterName(m.fighter1) }}</span>
            </td>
            <td>
              <span>{{ getFighterName(m.fighter2) }}</span>
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
              <select v-model="m.result"
                      class="form-select form-select-sm"
                      @change="updateMatch(m)">
                <option :value="null">–</option>
                <option v-if="m.fighter1" :value="m.fighter1">
                  {{ getFighterName(m.fighter1) }} ({{ m.fighter1.type === 'team' ? 'командный' : 'индивидуальный' }})
                </option>
                <option v-if="m.fighter2" :value="m.fighter2">
                  {{ getFighterName(m.fighter2) }} ({{ m.fighter2.type === 'team' ? 'командный' : 'индивидуальный' }})
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
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useBracketStore } from '@/store/bracketStore';
import { getScheduleKey } from '@/utils/storageKeys';

export default {
  setup() {
    const store = useStore();
    const route = useRoute();
    const competitionId = Number(route.params.id);

    const selectedCategory = ref('');
    const selectedJudge    = ref('');
    const activeTab = ref('upcoming');

    const {
      setWinner: bracketSetWinner,
    } = useBracketStore();

    const schedule = computed(() => Array.isArray(store.state.schedule) ? store.state.schedule : []);
    const judges   = computed(() => store.state.judges);

    const uniqueCategories = computed(() =>
      Array.from(new Set(schedule.value.map(m => m.category)))
    );

    const filterMatches = arr => arr.filter(m =>
      (!selectedCategory.value || m.category === selectedCategory.value) &&
      (!selectedJudge.value    || m.judge    === selectedJudge.value)
    );

    const upcomingMatches = computed(() =>
      filterMatches(schedule.value.filter(m => m.status === 'upcoming'))
    );
    const finishedMatches = computed(() =>
      filterMatches(schedule.value.filter(m => m.status === 'finished'))
    );

    const currentMatches = computed(() => {
      return activeTab.value === 'upcoming'
        ? upcomingMatches.value
        : finishedMatches.value;
    });

    // Универсальная функция для вывода имени
   function getFighterName(f) {
  if (!f) return '—'
  if (typeof f === 'string') return f
  if (typeof f === 'object' && f.name) return getFighterName(f.name)
  return ''
}

    const getMatchIndex = m => schedule.value.findIndex(x => x.id === m.id);

    const promoteWinnerToNextStage = (match) => {
      // ... твоя старая логика ...
    };

    const updateMatch = m => {
      const idx = getMatchIndex(m);
      if (idx === -1) return;
      store.commit('updateMatch', { index: idx, match: m });
      localStorage.setItem(getScheduleKey(competitionId), JSON.stringify(store.state.schedule));
      if (m.status === 'finished' && m.result) {
        promoteWinnerToNextStage(m);
      }
    };

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
        let totalPairs = Math.floor(pool.length / 2);
        for (let i = 0; pool.length >= 2; i++) {
          const fighter1 = pool.shift();
          const opponents = pool.filter(x => fighter1.team != null ? x.team !== fighter1.team : true);
          if (opponents.length === 0) break;
          const fighter2 = opponents[Math.floor(Math.random() * opponents.length)];
          pool = pool.filter(x => x !== fighter2);
          const randJ = judges.value[Math.floor(Math.random() * judges.value.length)];

          let stage = '';
          if (totalPairs >= 8)      stage = '1/8 финала';
          else if (totalPairs >= 4) stage = '1/4 финала';
          else if (totalPairs >= 2) stage = '1/2 финала';
          else if (totalPairs === 1)stage = 'Финал';

          newSched.push({
            id:             num++,
            competition_id: competitionId,
            category:       `${weight} кг`,
            fighter1:       { name: fighter1.name }, // ГАРАНТИРОВАННО объект
            fighter2:       { name: fighter2.name },
            stage:          stage,
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
      localStorage.setItem(getScheduleKey(competitionId), JSON.stringify(newSched));
    };

    const addMatch = () => {
      if (!selectedCategory.value) return alert('Выберите категорию');
      store.commit('addMatch', {
        id: Date.now(),
        competition_id: competitionId,
        category: selectedCategory.value,
        fighter1: null, fighter2: null,
        stage: '', time: '', judge: '', referee: '', tatami: '', result: null, note: '', points: 0, status: 'upcoming'
      });
      localStorage.setItem(getScheduleKey(competitionId), JSON.stringify(store.state.schedule));
    };
    const saveSchedule = async () => {
      alert('Расписание сохранено (локально)');
    };
    const saveResults = async () => {
      alert('Результаты сохранены (локально)');
    };
    onMounted(() => {
      const lsKey = getScheduleKey(competitionId);
      const saved = localStorage.getItem(lsKey);
      if (saved) {
        store.commit('setSchedule', JSON.parse(saved));
      }
    });

    return {
      judges, selectedCategory, selectedJudge, uniqueCategories,
      generateSchedule, addMatch, saveSchedule, saveResults,
      updateMatch, activeTab, currentMatches, getFighterName
    };
  }
};
</script>
