<template>
  <div class="bracket-page">
    <div class="category-selector">
      <h2>Турнирная сетка</h2>
      <div class="weight-selector">
        <span>Выберите весовую категорию:</span>
        <div class="weight-buttons">
          <base-button
            v-for="weight in weightCategories"
            :key="weight"
            :variant="selectedCategory === weight ? 'primary' : 'outline-primary'"
            @click="selectCategory(weight)"
          >
            {{ weight }}
          </base-button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger my-4">
      {{ error }}
    </div>

    <div v-else class="bracket-container">
      <!-- TOP 32 -->
      <div class="bracket-round">
        <h3>1/16 финала</h3>
        <div class="matches">
          <div v-for="(match, index) in filteredTop32Matches" 
               :key="'top32-' + index" 
               class="match-card">
            <div class="match-info">
              <div class="participant" 
                   :class="{ winner: match.winner === match.participant1 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ match.participant1?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="match.participant1?.weight">
                      {{ match.participant1.weight }}
                    </span>
                    <span class="team-info" v-if="match.participant1?.team">
                      {{ match.participant1.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="match.participant1Score !== undefined">
                  {{ match.participant1Score }}
                </div>
              </div>
              <div class="participant" 
                   :class="{ winner: match.winner === match.participant2 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ match.participant2?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="match.participant2?.weight">
                      {{ match.participant2.weight }}
                    </span>
                    <span class="team-info" v-if="match.participant2?.team">
                      {{ match.participant2.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="match.participant2Score !== undefined">
                  {{ match.participant2Score }}
                </div>
              </div>
            </div>
            <div class="match-actions" v-if="!match.winner && match.participant1 && match.participant2">
              <div class="score-inputs" v-if="!match.winner">
                <div class="score-input">
                  <input type="number" 
                         v-model="match.participant1Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
                <div class="score-input">
                  <input type="number" 
                         v-model="match.participant2Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
              </div>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(match, match.participant1, 32, index, match.participant1Score)"
                :disabled="!isValidScore(match.participant1Score)">
                Победил 1
              </base-button>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(match, match.participant2, 32, index, match.participant2Score)"
                :disabled="!isValidScore(match.participant2Score)">
                Победил 2
              </base-button>
            </div>
          </div>
        </div>
      </div>

      <!-- TOP 16 -->
      <div class="bracket-round">
        <h3>1/8 финала</h3>
        <div class="matches">
          <div v-for="(match, index) in filteredTop16Matches" 
               :key="'top16-' + index" 
               class="match-card">
            <div class="match-info">
              <div class="participant" 
                   :class="{ winner: match.winner === match.participant1 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ match.participant1?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="match.participant1?.weight">
                      {{ match.participant1.weight }}
                    </span>
                    <span class="team-info" v-if="match.participant1?.team">
                      {{ match.participant1.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="match.participant1Score !== undefined">
                  {{ match.participant1Score }}
                </div>
              </div>
              <div class="participant" 
                   :class="{ winner: match.winner === match.participant2 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ match.participant2?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="match.participant2?.weight">
                      {{ match.participant2.weight }}
                    </span>
                    <span class="team-info" v-if="match.participant2?.team">
                      {{ match.participant2.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="match.participant2Score !== undefined">
                  {{ match.participant2Score }}
                </div>
              </div>
            </div>
            <div class="match-actions" v-if="!match.winner && match.participant1 && match.participant2">
              <div class="score-inputs" v-if="!match.winner">
                <div class="score-input">
                  <input type="number" 
                         v-model="match.participant1Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
                <div class="score-input">
                  <input type="number" 
                         v-model="match.participant2Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
              </div>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(match, match.participant1, 16, index, match.participant1Score)"
                :disabled="!isValidScore(match.participant1Score)">
                Победил 1
              </base-button>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(match, match.participant2, 16, index, match.participant2Score)"
                :disabled="!isValidScore(match.participant2Score)">
                Победил 2
              </base-button>
            </div>
          </div>
        </div>
      </div>

      <!-- TOP 8 -->
      <div class="bracket-round">
        <h3>1/4 финала</h3>
        <div class="matches">
          <div v-for="(match, index) in filteredTop8Matches" 
               :key="'top8-' + index" 
               class="match-card">
            <div class="match-info">
              <div class="participant" 
                   :class="{ winner: match.winner === match.participant1 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ match.participant1?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="match.participant1?.weight">
                      {{ match.participant1.weight }}
                    </span>
                    <span class="team-info" v-if="match.participant1?.team">
                      {{ match.participant1.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="match.participant1Score !== undefined">
                  {{ match.participant1Score }}
                </div>
              </div>
              <div class="participant" 
                   :class="{ winner: match.winner === match.participant2 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ match.participant2?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="match.participant2?.weight">
                      {{ match.participant2.weight }}
                    </span>
                    <span class="team-info" v-if="match.participant2?.team">
                      {{ match.participant2.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="match.participant2Score !== undefined">
                  {{ match.participant2Score }}
                </div>
              </div>
            </div>
            <div class="match-actions" v-if="!match.winner && match.participant1 && match.participant2">
              <div class="score-inputs" v-if="!match.winner">
                <div class="score-input">
                  <input type="number" 
                         v-model="match.participant1Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
                <div class="score-input">
                  <input type="number" 
                         v-model="match.participant2Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
              </div>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(match, match.participant1, 8, index, match.participant1Score)"
                :disabled="!isValidScore(match.participant1Score)">
                Победил 1
              </base-button>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(match, match.participant2, 8, index, match.participant2Score)"
                :disabled="!isValidScore(match.participant2Score)">
                Победил 2
              </base-button>
            </div>
          </div>
        </div>
      </div>

      <!-- TOP 4 -->
      <div class="bracket-round">
        <h3>1/2 финала</h3>
        <div class="matches">
          <div v-for="(match, index) in filteredTop4Matches" 
               :key="'top4-' + index" 
               class="match-card">
            <div class="match-info">
              <div class="participant" 
                   :class="{ winner: match.winner === match.participant1 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ match.participant1?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="match.participant1?.weight">
                      {{ match.participant1.weight }}
                    </span>
                    <span class="team-info" v-if="match.participant1?.team">
                      {{ match.participant1.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="match.participant1Score !== undefined">
                  {{ match.participant1Score }}
                </div>
              </div>
              <div class="participant" 
                   :class="{ winner: match.winner === match.participant2 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ match.participant2?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="match.participant2?.weight">
                      {{ match.participant2.weight }}
                    </span>
                    <span class="team-info" v-if="match.participant2?.team">
                      {{ match.participant2.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="match.participant2Score !== undefined">
                  {{ match.participant2Score }}
                </div>
              </div>
            </div>
            <div class="match-actions" v-if="!match.winner && match.participant1 && match.participant2">
              <div class="score-inputs" v-if="!match.winner">
                <div class="score-input">
                  <input type="number" 
                         v-model="match.participant1Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
                <div class="score-input">
                  <input type="number" 
                         v-model="match.participant2Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
              </div>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(match, match.participant1, 4, index, match.participant1Score)"
                :disabled="!isValidScore(match.participant1Score)">
                Победил 1
              </base-button>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(match, match.participant2, 4, index, match.participant2Score)"
                :disabled="!isValidScore(match.participant2Score)">
                Победил 2
              </base-button>
            </div>
          </div>
        </div>
      </div>

      <!-- FINAL -->
      <div class="bracket-round">
        <h3>ФИНАЛ</h3>
        <div class="matches">
          <div class="match-card final-match">
            <div class="match-info">
              <div class="participant" 
                   :class="{ winner: finalMatch.winner === finalMatch.participant1 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ finalMatch.participant1?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="finalMatch.participant1?.weight">
                      {{ finalMatch.participant1.weight }}
                    </span>
                    <span class="team-info" v-if="finalMatch.participant1?.team">
                      {{ finalMatch.participant1.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="finalMatch.participant1Score !== undefined">
                  {{ finalMatch.participant1Score }}
                </div>
              </div>
              <div class="participant" 
                   :class="{ winner: finalMatch.winner === finalMatch.participant2 }">
                <div class="participant-info">
                  <div class="participant-name">
                    {{ finalMatch.participant2?.name }}
                  </div>
                  <div class="participant-details">
                    <span class="weight-info" v-if="finalMatch.participant2?.weight">
                      {{ finalMatch.participant2.weight }}
                    </span>
                    <span class="team-info" v-if="finalMatch.participant2?.team">
                      {{ finalMatch.participant2.team }}
                    </span>
                  </div>
                </div>
                <div class="score" v-if="finalMatch.participant2Score !== undefined">
                  {{ finalMatch.participant2Score }}
                </div>
              </div>
            </div>
            <div class="match-actions" v-if="!finalMatch.winner && finalMatch.participant1 && finalMatch.participant2">
              <div class="score-inputs" v-if="!finalMatch.winner">
                <div class="score-input">
                  <input type="number" 
                         v-model="finalMatch.participant1Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
                <div class="score-input">
                  <input type="number" 
                         v-model="finalMatch.participant2Score" 
                         placeholder="Очки"
                         class="form-control form-control-sm">
                </div>
              </div>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(finalMatch, finalMatch.participant1, 2, 0, finalMatch.participant1Score)"
                :disabled="!isValidScore(finalMatch.participant1Score)">
                Победил 1
              </base-button>
              <base-button 
                size="sm"
                variant="success" 
                @click="setWinner(finalMatch, finalMatch.participant2, 2, 0, finalMatch.participant2Score)"
                :disabled="!isValidScore(finalMatch.participant2Score)">
                Победил 2
              </base-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import BaseButton from '@/components/ui/BaseButton.vue'

export default {
  name: 'BracketPage',
  components: {
    BaseButton
  },
  setup() {
    const store = useStore()
    const selectedCategory = ref('')
    const loading = ref(false)
    const error = ref(null)
    
    // Состояния для каждого этапа турнира
    const top32Matches = ref([])
    const top16Matches = ref([])
    const top8Matches = ref([])
    const top4Matches = ref([])
    const finalMatch = ref({
      participant1: null,
      participant2: null,
      participant1Score: 0,
      participant2Score: 0,
      winner: null,
      winnerScore: null
    })

    const weightCategories = computed(() => {
      const categories = new Set(store.getters.schedule.map(match => match.category));
      return Array.from(categories).sort();
    });

    // Фильтрация матчей по весовой категории
    const filteredTop32Matches = computed(() => {
      if (!selectedCategory.value) return top32Matches.value
      return top32Matches.value.filter(match => 
        (match.participant1?.weight === selectedCategory.value) ||
        (match.participant2?.weight === selectedCategory.value)
      )
    })

    const filteredTop16Matches = computed(() => {
      if (!selectedCategory.value) return top16Matches.value
      return top16Matches.value.filter(match => 
        (match.participant1?.weight === selectedCategory.value) ||
        (match.participant2?.weight === selectedCategory.value)
      )
    })

    const filteredTop8Matches = computed(() => {
      if (!selectedCategory.value) return top8Matches.value
      return top8Matches.value.filter(match => 
        (match.participant1?.weight === selectedCategory.value) ||
        (match.participant2?.weight === selectedCategory.value)
      )
    })

    const filteredTop4Matches = computed(() => {
      if (!selectedCategory.value) return top4Matches.value
      return top4Matches.value.filter(match => 
        (match.participant1?.weight === selectedCategory.value) ||
        (match.participant2?.weight === selectedCategory.value)
      )
    })

    // Выбор весовой категории
    const selectCategory = (category) => {
      selectedCategory.value = category
      initializeBracket()
    }

    // Проверка валидности счета
    const isValidScore = (score) => {
      return score !== undefined && score !== null && score !== '' && !isNaN(score) && score >= 0;
    }

    // Инициализация турнирной сетки с обновленной структурой
    const initializeBracket = () => {
      loading.value = true
      error.value = null
      
      try {
        const schedule = store.getters.schedule
        
        // Проверяем существование выбранной категории
        if (selectedCategory.value && !weightCategories.value.includes(selectedCategory.value)) {
          error.value = 'Некорректная весовая категория'
          return
        }
        
        // Фильтруем матчи по выбранной весовой категории
        const filteredSchedule = selectedCategory.value
          ? schedule.filter(match => match.category === selectedCategory.value)
          : schedule

        // Определяем начальный этап турнира на основе количества участников
        const participantCount = new Set(
          filteredSchedule.flatMap(match => [match.fighter1, match.fighter2])
        ).size

        // Очищаем все массивы матчей
        top32Matches.value = []
        top16Matches.value = []
        top8Matches.value = []
        top4Matches.value = []
        finalMatch.value = {
          participant1: null,
          participant2: null,
          participant1Score: 0,
          participant2Score: 0,
          winner: null,
          winnerScore: null
        }

        // Определяем начальный этап и распределяем матчи
        if (participantCount <= 2) {
          // Сразу финал
          finalMatch.value = createMatchFromSchedule(filteredSchedule[0])
        } else if (participantCount <= 4) {
          // Начинаем с полуфинала (TOP 4)
          top4Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
        } else if (participantCount <= 8) {
          // Начинаем с четвертьфинала (TOP 8)
          top8Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
        } else if (participantCount <= 16) {
          // Начинаем с 1/8 финала (TOP 16)
          top16Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
        } else {
          // Начинаем с 1/16 финала (TOP 32)
          top32Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
        }

        // Заполняем пустыми матчами последующие этапы, если они нужны
        if (top32Matches.value.length > 0) {
          initializeNextStage(top32Matches.value, top16Matches)
        }
        if (top16Matches.value.length > 0) {
          initializeNextStage(top16Matches.value, top8Matches)
        }
        if (top8Matches.value.length > 0) {
          initializeNextStage(top8Matches.value, top4Matches)
        }
        if (top4Matches.value.length > 0 && !finalMatch.value.participant1) {
          initializeNextStage(top4Matches.value, null, finalMatch)
        }

      } catch (err) {
        error.value = 'Ошибка при инициализации турнирной сетки'
        console.error(err)
      } finally {
        loading.value = false
      }
    }

    // Вспомогательная функция для создания объекта матча из данных расписания
    const createMatchFromSchedule = (scheduleMatch) => ({
      participant1: {
        name: scheduleMatch.fighter1,
        weight: scheduleMatch.category,
        team: scheduleMatch.team1 || ''
      },
      participant2: {
        name: scheduleMatch.fighter2,
        weight: scheduleMatch.category,
        team: scheduleMatch.team2 || ''
      },
      participant1Score: scheduleMatch.points1 || 0,
      participant2Score: scheduleMatch.points2 || 0,
      winner: scheduleMatch.result ? (scheduleMatch.result === scheduleMatch.fighter1 ? 'participant1' : 'participant2') : null,
      winnerScore: scheduleMatch.points || 0,
      category: scheduleMatch.category
    })

    // Вспомогательная функция для инициализации следующего этапа
    const initializeNextStage = (currentStageMatches, nextStageRef, finalMatchRef = null) => {
      const nextStageCount = Math.ceil(currentStageMatches.length / 2)
      
      if (finalMatchRef) {
        // Инициализация финального матча
        finalMatchRef.value = {
          participant1: null,
          participant2: null,
          participant1Score: 0,
          participant2Score: 0,
          winner: null,
          winnerScore: null
        }
      } else if (nextStageRef) {
        // Инициализация следующего этапа
        nextStageRef.value = Array(nextStageCount).fill().map(() => ({
          participant1: null,
          participant2: null,
          participant1Score: 0,
          participant2Score: 0,
          winner: null,
          winnerScore: null
        }))
      }
    }

    // Обновленная функция установки победителя
    const setWinner = async (match, winner, currentStage, matchIndex, score) => {
      if (!isValidScore(score)) {
        error.value = 'Необходимо указать количество баллов';
        return;
      }

      // Обновляем результат матча
      match.winner = winner;
      match.winnerScore = score;

      // Обновляем матч в расписании
      const scheduleMatch = store.getters.schedule.find(m => 
        m.fighter1 === match.participant1.name && 
        m.fighter2 === match.participant2.name && 
        m.category === match.category
      );

      if (scheduleMatch) {
        const matchIndex = store.getters.schedule.indexOf(scheduleMatch);
        store.commit('updateMatch', {
          index: matchIndex,
          match: {
            ...scheduleMatch,
            result: winner.name,
            points: score,
            status: 'finished'
          }
        });
      }

      // Определяем следующий этап и индекс матча
      try {
        // Обновляем результат матча в сетке
        match.winner = winner;
        match.winnerScore = score;

        // Находим матч в расписании
        const scheduleMatch = store.getters.schedule.find(m => 
          m.fighter1 === match.participant1?.name && 
          m.fighter2 === match.participant2?.name && 
          m.category === match.category
        );

        if (scheduleMatch) {
          const matchIndex = store.getters.schedule.indexOf(scheduleMatch);
          await store.commit('updateMatch', {
            index: matchIndex,
            match: {
              ...scheduleMatch,
              result: winner.name,
              points: score,
              points1: match.participant1Score,
              points2: match.participant2Score,
              status: 'finished',
              stage: getStageString(currentStage)
            }
          });
        } else {
          console.warn('Матч не найден в расписании:', match);
        }

        // Определяем следующий этап
        const nextStage = getNextStage(currentStage);
        const nextMatchIndex = Math.floor(matchIndex / 2);

        // Получаем пару матчей для определения следующей схватки
        const currentStageMatches = getCurrentStageMatches(currentStage);
        const pairIndex = Math.floor(matchIndex / 2) * 2;
        const firstMatch = currentStageMatches[pairIndex];
        const secondMatch = currentStageMatches[pairIndex + 1];

        // Обновляем следующий матч в сетке
        let nextMatch;
        switch (currentStage) {
          case 32:
            nextMatch = top16Matches.value[nextMatchIndex];
            break;
          case 16:
            nextMatch = top8Matches.value[nextMatchIndex];
            break;
          case 8:
            nextMatch = top4Matches.value[nextMatchIndex];
            break;
          case 4:
            nextMatch = finalMatch.value;
            break;
        }

        // Обновляем участников следующего матча
        if (nextMatch && currentStage !== 2) {
          if (!nextMatch.participant1) {
            nextMatch.participant1 = winner;
            nextMatch.participant1Score = 0;
          } else {
            nextMatch.participant2 = winner;
            nextMatch.participant2Score = 0;
          }

          // Если оба участника следующего матча определены, создаем новый матч в расписании
          if (nextMatch.participant1 && nextMatch.participant2) {
            const newScheduleMatch = {
              fighter1: nextMatch.participant1.name,
              fighter2: nextMatch.participant2.name,
              category: match.category,
              team1: nextMatch.participant1.team,
              team2: nextMatch.participant2.team,
              status: 'upcoming',
              stage: nextStage,
              points1: 0,
              points2: 0,
              points: 0,
              result: null
            };

            // Проверяем, не существует ли уже такой матч
            const existingMatch = store.getters.schedule.find(m => 
              m.fighter1 === newScheduleMatch.fighter1 && 
              m.fighter2 === newScheduleMatch.fighter2 && 
              m.category === newScheduleMatch.category &&
              m.stage === newScheduleMatch.stage
            );

            if (!existingMatch) {
              // Добавляем новый матч в расписание
              await store.dispatch('addMatch', newScheduleMatch);
            }
          }
        }

        // Если это финальный матч, сохраняем результаты турнира
        if (currentStage === 2) {
          finalMatch.value.winner = winner;
          finalMatch.value.winnerScore = score;
          
          try {
            await store.dispatch('saveTournamentResults', {
              winner: winner,
              winnerScore: score,
              category: selectedCategory.value,
              bracket: {
                top32: top32Matches.value,
                top16: top16Matches.value,
                top8: top8Matches.value,
                top4: top4Matches.value,
                final: finalMatch.value
              }
            });
          } catch (err) {
            error.value = 'Ошибка при сохранении результатов турнира';
            console.error(err);
          }
        }
      } catch (err) {
        error.value = 'Ошибка при обновлении матча';
        console.error(err);
      }
    };

    // Вспомогательная функция для получения текущих матчей этапа
    const getCurrentStageMatches = (stage) => {
      switch (stage) {
        case 32: return top32Matches.value;
        case 16: return top16Matches.value;
        case 8: return top8Matches.value;
        case 4: return top4Matches.value;
        case 2: return [finalMatch.value];
        default: return [];
      }
    };

    // Вспомогательная функция для определения следующего этапа
    const getNextStage = (currentStage) => {
      switch (currentStage) {
        case 32: return '1/8';
        case 16: return '1/4';
        case 8: return '1/2';
        case 4: return 'final';
        default: return '';
      }
    };

    // Вспомогательная функция для получения строкового представления этапа
    const getStageString = (stage) => {
      switch (stage) {
        case 32: return '1/16';
        case 16: return '1/8';
        case 8: return '1/4';
        case 4: return '1/2';
        case 2: return 'final';
        default: return '';
      }
    };

    // Инициализация при монтировании
    onMounted(() => {
      initializeBracket()
    })

    return {
      selectedCategory,
      weightCategories,
      loading,
      error,
      filteredTop32Matches,
      filteredTop16Matches,
      filteredTop8Matches,
      filteredTop4Matches,
      finalMatch,
      selectCategory,
      isValidScore,
      setWinner
    }
  }
}
</script>

<style scoped>
.bracket-page {
  padding: 20px;
}

.category-selector {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.weight-selector {
  margin-top: 20px;
}

.weight-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.bracket-container {
  display: flex;
  gap: 30px;
  overflow-x: auto;
  padding: 20px 0;
}

.bracket-round {
  min-width: 280px;
}

.matches {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.match-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.match-info {
  margin-bottom: 15px;
}

.participant {
  padding: 12px;
  border: 1px solid #e9ecef;
  margin: 4px 0;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-weight: 500;
  font-size: 1rem;
}

.participant-details {
  display: flex;
  gap: 10px;
  font-size: 0.85em;
  color: #6c757d;
  margin-top: 2px;
}

.weight-info, .team-info {
  padding: 2px 6px;
  background: #f8f9fa;
  border-radius: 4px;
}

.score {
  font-weight: bold;
  font-size: 1.2rem;
  min-width: 40px;
  text-align: center;
  padding: 0 8px;
  color: #198754;
}

.score-inputs {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  width: 100%;
}

.score-input {
  flex: 1;
}

.score-input input {
  width: 100%;
  text-align: center;
}

.winner {
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.winner .participant-name {
  color: #155724;
  font-weight: 600;
}

.match-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
}

.match-actions .btn-group {
  display: flex;
  gap: 8px;
}

.final-match {
  border-color: #ffd700;
  background-color: #fff9e6;
}

h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

h3 {
  margin-bottom: 20px;
  color: #495057;
  font-size: 1.2rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .bracket-container {
    flex-direction: column;
    gap: 20px;
  }

  .bracket-round {
    min-width: 100%;
  }
}
</style> 