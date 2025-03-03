<template>
  <div class="container-fluid mt-3">
    <!-- Фильтры и кнопки управления -->
    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Выберите весовую категорию</label>
        <select v-model="selectedCategory" class="form-select">
          <option value="">Все категории</option>
          <option v-for="category in uniqueCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Выберите судью</label>
        <select v-model="selectedJudge" class="form-select">
          <option value="">Все судьи</option>
          <option v-for="judge in judges" :key="judge.name" :value="judge.name">
            {{ judge.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Кнопки управления -->
    <div class="d-flex gap-2 mb-3">
      <button @click="generateSchedule" class="btn btn-secondary">Сформировать расписание</button>
      <button @click="addMatch" class="btn btn-secondary">Добавить схватку</button>
      <button @click="saveSchedule" class="btn btn-secondary">Сохранить расписание</button>
      <button @click="saveResults" class="btn btn-secondary">Сохранить результаты</button>
    </div>

    <!-- Общая функция для отображения таблицы -->
    <template v-for="(section, index) in sections" :key="index">
      <h5 :class="{ 'mt-4': index > 0 }">{{ section.title }}</h5>
      <div class="table-responsive">
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Весовая категория</th>
              <th>Спортсмен 1</th>
              <th>Спортсмен 2</th>
              <th>Время</th>
              <th>Судья стола</th>
              <th>Рефери</th>
              <th>Ковер</th>
              <th>Результат</th>
              <th>Примечание</th>
              <th>Баллы</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(match, matchIndex) in section.matches" 
                :key="matchIndex"
                :class="section.rowClass"
                :draggable="section.draggable"
                @dragstart="section.draggable && dragStart(matchIndex)"
                @drop="section.draggable && drop(matchIndex)"
                @dragover.prevent>
              <td>{{ matchIndex + 1 }}</td>
              <td>{{ match.category }}</td>
              <td>{{ match.fighter1 }}</td>
              <td>{{ match.fighter2 }}</td>
              <td>
                <input 
                  type="time" 
                  v-model="match.time" 
                  class="form-control form-control-sm"
                  @change="updateMatch(match)"
                >
              </td>
              <td>{{ match.judge }}</td>
              <td>{{ match.referee }}</td>
              <td>{{ match.tatami }}</td>
              <td>
                <select v-model="match.result" class="form-select form-select-sm">
                  <option value="">Не завершен</option>
                  <option :value="match.fighter1">{{ match.fighter1 }}</option>
                  <option :value="match.fighter2">{{ match.fighter2 }}</option>
                </select>
              </td>
              <td>
                <input v-model="match.note" class="form-control form-control-sm">
              </td>
              <td>
                <input v-model="match.points" type="number" class="form-control form-control-sm">
              </td>
              <td>
                <select 
                  v-model="match.status" 
                  class="form-select form-select-sm" 
                  @change="updateMatchStatus(match, getMatchIndex(match))"
                >
                  <option v-for="option in section.statusOptions" 
                         :key="option.value" 
                         :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { computed, ref } from 'vue';

export default {
  setup() {
    const store = useStore();
    const selectedCategory = ref('');
    const selectedJudge = ref('');
    
    const schedule = computed(() => store.state.schedule || []);
    const judges = computed(() => store.state.judges || []);
    const participants = computed(() => store.state.participants || []);

    const uniqueCategories = computed(() => {
      const categories = new Set(schedule.value.map(match => match.category));
      return Array.from(categories);
    });

    // Обновленная функция фильтрации без учета рефери
    const filterMatches = (matches) => {
      return matches.filter(match => {
        const categoryMatch = !selectedCategory.value || match.category === selectedCategory.value;
        const judgeMatch = !selectedJudge.value || match.judge === selectedJudge.value;
        return categoryMatch && judgeMatch;
      });
    };

    const currentMatches = computed(() => 
      filterMatches(schedule.value.filter(match => match.status === 'current'))
    );

    const upcomingMatches = computed(() => 
      filterMatches(schedule.value.filter(match => match.status === 'upcoming'))
    );

    const finishedMatches = computed(() => 
      filterMatches(schedule.value.filter(match => match.status === 'finished'))
    );

    // Получаем индекс матча в общем списке
    const getMatchIndex = (match) => {
      return store.state.schedule.findIndex(m => 
        m.fighter1 === match.fighter1 && 
        m.fighter2 === match.fighter2 && 
        m.category === match.category
      );
    };

    // Обновление статуса матча
    const updateMatchStatus = (match, index) => {
      if (index === -1) return;
      
      const updatedMatch = { ...match };
      store.commit('updateMatch', { 
        index, 
        match: updatedMatch 
      });
    };

    // Обновление времени матча
    const updateMatch = (match) => {
      const index = getMatchIndex(match);
      if (index === -1) return;
      
      store.commit('updateMatch', { 
        index, 
        match 
      });
    };

    const sections = computed(() => [
      {
        title: 'Текущие схватки',
        matches: currentMatches.value,
        rowClass: 'current-match',
        draggable: true,
        statusOptions: [
          { value: 'current', label: 'В процессе' },
          { value: 'finished', label: 'Завершен' },
          { value: 'upcoming', label: 'Вернуть в ожидание' }
        ]
      },
      {
        title: 'Предстоящие схватки',
        matches: upcomingMatches.value,
        rowClass: 'upcoming-match',
        draggable: false,
        statusOptions: [
          { value: 'upcoming', label: 'Не начат' },
          { value: 'current', label: 'Начать' }
        ]
      },
      {
        title: 'Завершенные схватки',
        matches: finishedMatches.value,
        rowClass: 'finished-match',
        draggable: false,
        statusOptions: [
          { value: 'finished', label: 'Завершен' },
          { value: 'current', label: 'Вернуть в текущие' }
        ]
      }
    ]);

    // Сброс фильтров (обновлен)
    const resetFilters = () => {
      selectedCategory.value = '';
      selectedJudge.value = '';
    };

    const generateSchedule = () => {
      // Группируем участников по весовым категориям
      const participantsByWeight = {};
      participants.value.forEach(participant => {
        const weight = participant.weight;
        if (!participantsByWeight[weight]) {
          participantsByWeight[weight] = [];
        }
        participantsByWeight[weight].push(participant);
      });

      let newSchedule = [];
      let matchNumber = 1;

      // Для каждой весовой категории
      Object.entries(participantsByWeight).forEach(([weight, categoryParticipants]) => {
        // Группируем участников по командам
        const participantsByTeam = {};
        categoryParticipants.forEach(participant => {
          if (!participantsByTeam[participant.team]) {
            participantsByTeam[participant.team] = [];
          }
          participantsByTeam[participant.team].push(participant);
        });

        // Создаем массив для жеребьевки
        let availableParticipants = [...categoryParticipants];
        
        while (availableParticipants.length >= 2) {
          // Берем первого участника
          const fighter1 = availableParticipants[0];
          availableParticipants = availableParticipants.filter(p => p !== fighter1);

          // Ищем подходящего соперника (не из той же команды)
          const possibleOpponents = availableParticipants.filter(p => p.team !== fighter1.team);
          
          if (possibleOpponents.length > 0) {
            // Случайно выбираем соперника из подходящих кандидатов
            const randomIndex = Math.floor(Math.random() * possibleOpponents.length);
            const fighter2 = possibleOpponents[randomIndex];
            
            // Удаляем выбранного соперника из доступных участников
            availableParticipants = availableParticipants.filter(p => p !== fighter2);

            // Случайно выбираем судью
            const randomJudge = judges.value[Math.floor(Math.random() * judges.value.length)];

            // Создаем схватку
            newSchedule.push({
              id: matchNumber++,
              category: `${weight} кг`,
              fighter1: fighter1.name,
              fighter2: fighter2.name,
              time: '',
              judge: randomJudge?.name || '',
              referee: '',
              tatami: randomJudge?.tatami || '1',
              result: '',
              note: '',
              points: 0,
              status: 'upcoming'
            });
          } else {
            // Если не нашли подходящего соперника, возвращаем участника обратно в пул
            availableParticipants.push(fighter1);
            // Предотвращаем бесконечный цикл, если остались только участники из одной команды
            if (new Set(availableParticipants.map(p => p.team)).size === 1) {
              console.warn(`В категории ${weight} кг остались только участники из одной команды`);
              break;
            }
          }
        }

        // Если остались нераспределенные участники
        if (availableParticipants.length > 0) {
          console.warn(`Нераспределенные участники в категории ${weight} кг:`, 
            availableParticipants.map(p => `${p.name} (${p.team})`).join(', '));
        }
      });

      // Сохраняем сгенерированное расписание
      store.commit('setSchedule', newSchedule);
      alert('Расписание сгенерировано');
    };

    const addMatch = () => {
      store.commit('addMatch', {
        category: selectedCategory.value,
        fighter1: '',
        fighter2: '',
        time: '',
        judge: '',
        referee: '',
        tatami: '',
        result: '',
        note: '',
        points: 0,
        status: 'upcoming'
      });
    };

    const saveSchedule = () => {
      store.commit('setSchedule', [...currentMatches.value, ...upcomingMatches.value]);
      alert('Расписание сохранено');
    };

    const saveResults = () => {
      store.commit('saveResults', [...currentMatches.value, ...upcomingMatches.value]);
      alert('Результаты сохранены');
    };

    const removeMatch = (index) => {
      store.commit('removeMatch', index);
    };

    const dragStart = (index) => {
      // Логика начала перетаскивания
    };

    const drop = (index) => {
      // Логика завершения перетаскивания
    };

    return {
      sections,
      selectedCategory,
      selectedJudge,
      uniqueCategories,
      judges,
      resetFilters,
      generateSchedule,
      addMatch,
      saveSchedule,
      saveResults,
      removeMatch,
      dragStart,
      drop,
      updateMatchStatus,
      updateMatch,
      getMatchIndex
    };
  }
};
</script>

<style scoped>
.table th {
  background-color: #f8f9fa;
  white-space: nowrap;
}

.table td {
  vertical-align: middle;
}

/* Стили для разных типов схваток */
.current-match {
  background-color: rgba(255, 243, 205, 0.5);
}

.upcoming-match {
  background-color: rgba(248, 249, 250, 0.5);
}

.finished-match {
  background-color: rgba(198, 239, 206, 0.5);
}

/* Стиль для победителя */
.finished-match strong {
  color: #28a745;
}

/* Добавляем стиль для поля времени */
input[type="time"] {
  min-width: 110px;
}
</style>




