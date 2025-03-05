import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

const STORAGE_KEY = 'tournament_brackets'

export function useBracketStore() {
  const store = useStore()
  const selectedCategory = ref('')
  const loading = ref(false)
  const error = ref(null)
  
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
    const categories = new Set(store.getters.schedule.map(match => match.category))
    return Array.from(categories).sort()
  })

  // Загрузка состояния из localStorage
  const loadState = () => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        const allBrackets = JSON.parse(savedState)
        
        if (selectedCategory.value && allBrackets[selectedCategory.value]) {
          const state = allBrackets[selectedCategory.value]
          top32Matches.value = state.top32Matches || []
          top16Matches.value = state.top16Matches || []
          top8Matches.value = state.top8Matches || []
          top4Matches.value = state.top4Matches || []
          finalMatch.value = state.finalMatch || {
            participant1: null,
            participant2: null,
            participant1Score: 0,
            participant2Score: 0,
            winner: null,
            winnerScore: null
          }
          return true // Состояние загружено
        }
      }
      return false // Состояние не найдено
    } catch (err) {
      console.error('Ошибка при загрузке состояния:', err)
      return false
    }
  }

  // Сохранение состояния в localStorage
  const saveState = () => {
    try {
      if (!selectedCategory.value) return

      const savedState = localStorage.getItem(STORAGE_KEY)
      const allBrackets = savedState ? JSON.parse(savedState) : {}

      allBrackets[selectedCategory.value] = {
        top32Matches: top32Matches.value,
        top16Matches: top16Matches.value,
        top8Matches: top8Matches.value,
        top4Matches: top4Matches.value,
        finalMatch: finalMatch.value
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allBrackets))
    } catch (err) {
      console.error('Ошибка при сохранении состояния:', err)
    }
  }

  // Наблюдение за изменениями состояния
  watch(
    [selectedCategory, top32Matches, top16Matches, top8Matches, top4Matches, finalMatch],
    () => {
      if (selectedCategory.value) {
        saveState()
      }
    },
    { deep: true }
  )

  const selectCategory = (category) => {
    selectedCategory.value = category
    const stateLoaded = loadState()
    if (!stateLoaded) {
      initializeBracket()
    }
  }

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

  const initializeNextStage = (currentStageMatches, nextStageRef, finalMatchRef = null) => {
    const nextStageCount = Math.ceil(currentStageMatches.length / 2)
    
    if (finalMatchRef) {
      finalMatchRef.value = {
        participant1: null,
        participant2: null,
        participant1Score: 0,
        participant2Score: 0,
        winner: null,
        winnerScore: null
      }
    } else if (nextStageRef) {
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

  const getStageString = (stage) => {
    switch (stage) {
      case 32: return '1/16'
      case 16: return '1/8'
      case 8: return '1/4'
      case 4: return '1/2'
      case 2: return 'final'
      default: return ''
    }
  }

  const initializeBracket = () => {
    loading.value = true
    error.value = null
    
    try {
      const schedule = store.getters.schedule
      
      if (selectedCategory.value && !weightCategories.value.includes(selectedCategory.value)) {
        error.value = 'Некорректная весовая категория'
        return
      }
      
      const filteredSchedule = selectedCategory.value
        ? schedule.filter(match => match.category === selectedCategory.value)
        : schedule

      const participantCount = new Set(
        filteredSchedule.flatMap(match => [match.fighter1, match.fighter2])
      ).size

      // Очистка всех матчей
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

      // Распределение матчей по этапам
      if (participantCount <= 2) {
        finalMatch.value = createMatchFromSchedule(filteredSchedule[0])
      } else if (participantCount <= 4) {
        top4Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
      } else if (participantCount <= 8) {
        top8Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
      } else if (participantCount <= 16) {
        top16Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
      } else {
        top32Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
      }

      // Инициализация последующих этапов
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

      // Сохраняем состояние после инициализации
      if (selectedCategory.value) {
        saveState()
      }
    } catch (err) {
      error.value = 'Ошибка при инициализации турнирной сетки'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const setWinner = async ({ match, winner, score, stage, matchIndex }) => {
    try {
      // Обновляем текущий матч
      match.winner = winner
      match.winnerScore = score

      // Обновляем финальный матч, если это он
      if (stage === 2) {
        finalMatch.value = {
          ...match,
          participant1: match.participant1,
          participant2: match.participant2,
          participant1Score: match.participant1Score,
          participant2Score: match.participant2Score,
          winner,
          winnerScore: score
        }
      }

      const scheduleMatch = store.getters.schedule.find(m => 
        m.fighter1 === match.participant1?.name && 
        m.fighter2 === match.participant2?.name && 
        m.category === match.category
      )

      if (scheduleMatch) {
        const matchIndex = store.getters.schedule.indexOf(scheduleMatch)
        await store.commit('updateMatch', {
          index: matchIndex,
          match: {
            ...scheduleMatch,
            result: winner.name,
            points: score,
            points1: match.participant1Score,
            points2: match.participant2Score,
            status: 'finished',
            stage: getStageString(stage)
          }
        })
      }

      // Обновление следующего этапа
      const nextMatchIndex = Math.floor(matchIndex / 2)
      let nextMatch

      switch (stage) {
        case 32:
          nextMatch = top16Matches.value[nextMatchIndex]
          break
        case 16:
          nextMatch = top8Matches.value[nextMatchIndex]
          break
        case 8:
          nextMatch = top4Matches.value[nextMatchIndex]
          break
        case 4:
          nextMatch = finalMatch.value
          break
      }

      if (nextMatch && stage !== 2) {
        if (!nextMatch.participant1) {
          nextMatch.participant1 = { ...winner }
          nextMatch.participant1Score = 0
        } else {
          nextMatch.participant2 = { ...winner }
          nextMatch.participant2Score = 0
        }

        if (nextMatch.participant1 && nextMatch.participant2) {
          const newScheduleMatch = {
            fighter1: nextMatch.participant1.name,
            fighter2: nextMatch.participant2.name,
            category: match.category,
            team1: nextMatch.participant1.team,
            team2: nextMatch.participant2.team,
            status: 'upcoming',
            stage: getStageString(stage / 2),
            points1: 0,
            points2: 0,
            points: 0,
            result: null
          }
          
          await store.dispatch('addMatch', newScheduleMatch)
        }
      }

      if (stage === 2) {
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
          })
        } catch (err) {
          error.value = 'Ошибка при сохранении результатов турнира'
          console.error(err)
        }
      }

      // Сохраняем состояние после любых изменений
      saveState()
    } catch (err) {
      error.value = 'Ошибка при обновлении матча'
      console.error(err)
    }
  }

  // Обновляем функцию очистки всех данных
  const clearAllData = async () => {
    try {
      // Очищаем все локальные состояния
      selectedCategory.value = ''
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

      // Вызываем мутацию logout в основном store
      store.commit('logout')
    } catch (err) {
      console.error('Ошибка при очистке данных:', err)
    }
  }

  return {
    selectedCategory,
    loading,
    error,
    weightCategories,
    top32Matches,
    top16Matches,
    top8Matches,
    top4Matches,
    finalMatch,
    initializeBracket,
    setWinner,
    selectCategory,
    clearAllData
  }
} 