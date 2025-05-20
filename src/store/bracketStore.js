import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

const STORAGE_KEY_BASE = 'tournament_brackets'
function getStorageKey(competitionId) {
  return competitionId
    ? `${STORAGE_KEY_BASE}_${competitionId}`
    : STORAGE_KEY_BASE
}

export function useBracketStore() {
  const store = useStore()
  const competitionId = computed(() => store.state.competition?.id)
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
  const thirdPlaceMatch = ref({
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
    // 1. Достаём правильный ключ
    const key = getStorageKey(competitionId.value)
    const savedState = localStorage.getItem(key)
    if (!savedState) return false

    const allBrackets = JSON.parse(savedState)
    // 2. Список сохранённых категорий для этого соревнования
    const savedCategories = Object.keys(allBrackets)
    if (savedCategories.length === 0) return false

    // 3. Восстанавливаем выбранную категорию:
    //    – если она ещё не установлена или некорректна, берём первую из savedCategories
    if (!selectedCategory.value || !allBrackets[selectedCategory.value]) {
      selectedCategory.value = savedCategories[0]
    }

    // 4. Само состояние для этой категории
    const state = allBrackets[selectedCategory.value]

    top32Matches.value    = state.top32Matches    || []
    top16Matches.value    = state.top16Matches    || []
    top8Matches.value     = state.top8Matches     || []
    top4Matches.value     = state.top4Matches     || []
    finalMatch.value      = state.finalMatch      || {
      participant1: null,
      participant2: null,
      participant1Score: 0,
      participant2Score: 0,
      winner: null,
      winnerScore: null
    }
    thirdPlaceMatch.value = state.thirdPlaceMatch || {
      participant1: null,
      participant2: null,
      participant1Score: 0,
      participant2Score: 0,
      winner: null,
      winnerScore: null
    }

    return true
  } catch (err) {
    console.error('Ошибка при загрузке состояния:', err)
    return false
  }
}

  // Сохранение состояния в localStorage
  const saveState = () => {
    try {
      if (!selectedCategory.value) return

      const key = getStorageKey(competitionId.value)
      const savedState = localStorage.getItem(key)
      const allBrackets = savedState ? JSON.parse(savedState) : {}

      allBrackets[selectedCategory.value] = {
        top32Matches: top32Matches.value,
        top16Matches: top16Matches.value,
        top8Matches: top8Matches.value,
        top4Matches: top4Matches.value,
        finalMatch: finalMatch.value,
        thirdPlaceMatch: thirdPlaceMatch.value
      }

      localStorage.setItem(key, JSON.stringify(allBrackets))
    } catch (err) {
      console.error('Ошибка при сохранении состояния:', err)
    }
  }
  watch(competitionId, () => {
    selectedCategory.value = ''
    loadState()
  })
  // Наблюдение за изменениями состояния
  watch(
    [selectedCategory, top32Matches, top16Matches, top8Matches, top4Matches, finalMatch, thirdPlaceMatch],
    () => {
      if (selectedCategory.value) {
        saveState()
      }
    },
    { deep: true }
  )

  const selectCategory = (category) => {
    selectedCategory.value = category
    
    // Очищаем все матчи при отмене выбора категории
    if (!category) {
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
      thirdPlaceMatch.value = {
        participant1: null,
        participant2: null,
        participant1Score: 0,
        participant2Score: 0,
        winner: null,
        winnerScore: null
      }
      return
    }

    const stateLoaded = loadState()
    if (!stateLoaded) {
      initializeBracket()
    }
  }

  const createMatchFromSchedule = (scheduleMatch) => {
    return {
      participant1: scheduleMatch ? {
        name: scheduleMatch.fighter1,
        team: scheduleMatch.team1,
        weight: scheduleMatch.category
      } : null,
      participant2: scheduleMatch ? {
        name: scheduleMatch.fighter2,
        team: scheduleMatch.team2,
        weight: scheduleMatch.category
      } : null,
      participant1Score: scheduleMatch?.points1 || 0,
      participant2Score: scheduleMatch?.points2 || 0,
      winner: scheduleMatch?.result || null,
      winnerScore: scheduleMatch?.points || null,
      category: scheduleMatch?.category
    }
  }

  const initializeNextStage = (currentStageMatches, nextStageRef, finalMatchRef = null) => {
    const nextStageMatches = []
    
    for (let i = 0; i < currentStageMatches.length; i += 2) {
      const match1 = currentStageMatches[i]
      const match2 = i + 1 < currentStageMatches.length ? currentStageMatches[i + 1] : null
      
      // Если у участника нет пары, он автоматически проходит дальше
      if (!match2) {
        const nextMatch = {
          participant1: match1.participant1,
          participant2: null,
          participant1Score: 0,
          participant2Score: 0,
          winner: match1.participant1.name, // Автоматическая победа
          winnerScore: 0,
          category: match1.category,
          status: 'finished'
        }
        
        if (finalMatchRef && currentStageMatches.length === 2) {
          finalMatchRef.value = nextMatch
        } else if (nextStageRef) {
          nextStageMatches.push(nextMatch)
        }
        continue
      }
      
      const nextMatch = {
        participant1: match1?.winner ? {
          name: match1.winner,
          team: match1.winner === match1.participant1?.name ? match1.participant1?.team : match1.participant2?.team,
          weight: match1.category
        } : null,
        participant2: match2?.winner ? {
          name: match2.winner,
          team: match2.winner === match2.participant1?.name ? match2.participant1?.team : match2.participant2?.team,
          weight: match2.category
        } : null,
        participant1Score: 0,
        participant2Score: 0,
        winner: null,
        winnerScore: null,
        category: match1?.category
      }
      
      if (finalMatchRef && currentStageMatches.length === 2) {
        finalMatchRef.value = nextMatch
      } else if (nextStageRef) {
        nextStageMatches.push(nextMatch)
      }
    }
    
    if (nextStageRef && !finalMatchRef) {
      nextStageRef.value = nextStageMatches
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

      // Определяем начальную стадию на основе количества схваток
      const matchCount = filteredSchedule.length
      console.log('Количество схваток в категории:', matchCount)

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
      thirdPlaceMatch.value = {
        participant1: null,
        participant2: null,
        participant1Score: 0,
        participant2Score: 0,
        winner: null,
        winnerScore: null
      }

      // Определяем начальную стадию на основе количества схваток
      let startingStage
      if (matchCount === 1) {
        startingStage = 2 // Финал
      } else if (matchCount <= 2) {
        startingStage = 4 // Полуфинал (топ 4)
      } else if (matchCount <= 4) {
        startingStage = 8 // Четвертьфинал (топ 8)
      } else if (matchCount <= 8) {
        startingStage = 16 // 1/8 финала (топ 16)
      } else if (matchCount <= 16) {
        startingStage = 32 // 1/16 финала (топ 32)
      }

      console.log('Начальная стадия турнира:', startingStage)

      // Распределение матчей по этапам
      switch (startingStage) {
        case 32:
          // Начинаем с топ 32 (1/16 финала)
          top32Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
          initializeNextStage(top32Matches.value, top16Matches) // создаем топ 16
          initializeNextStage(top16Matches.value, top8Matches) // создаем топ 8
          initializeNextStage(top8Matches.value, top4Matches) // создаем топ 4
          initializeNextStage(top4Matches.value, null, finalMatch) // создаем финал
          break
        case 16:
          // Начинаем с топ 16 (1/8 финала)
          top16Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
          initializeNextStage(top16Matches.value, top8Matches) // создаем топ 8
          initializeNextStage(top8Matches.value, top4Matches) // создаем топ 4
          initializeNextStage(top4Matches.value, null, finalMatch) // создаем финал
          break
        case 8:
          // Начинаем с топ 8 (1/4 финала)
          top8Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
          initializeNextStage(top8Matches.value, top4Matches) // создаем топ 4
          initializeNextStage(top4Matches.value, null, finalMatch) // создаем финал
          break
        case 4:
          // Начинаем с топ 4 (полуфинал)
          top4Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
          initializeNextStage(top4Matches.value, null, finalMatch) // создаем финал
          break
        case 2:
          // Только финал
          finalMatch.value = createMatchFromSchedule(filteredSchedule[0])
          break
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

  const isValidMatch = (participant1, participant2) => {
    return participant1 && 
           participant2 && 
           participant1.name !== participant2.name && // Проверка на разных участников
           participant1.name && 
           participant2.name;
  }

  const createScheduleMatch = (participant1, participant2, category, stage) => {
    // Проверяем валидность матча
    if (!isValidMatch(participant1, participant2)) {
      console.warn('Попытка создать невалидный матч:', { participant1, participant2 });
      return null;
    }

    return {
      fighter1: participant1.name,
      fighter2: participant2.name,
      category: category,
      team1: participant1.team,
      team2: participant2.team,
      status: 'upcoming',
      stage: getStageString(stage),
      points1: 0,
      points2: 0,
      points: 0,
      result: null,
      time: '',
      judge: '',
      referee: '',
      tatami: ''
    }
  }

  const setWinner = async ({ match, winner, score, stage, matchIndex }) => {
    try {
      console.log('Установка победителя:', { stage, matchIndex, winner })
      
      // Обновляем текущий матч
      match.winner = winner.name // Изменено: сохраняем имя победителя
      match.winnerScore = score
      match.status = 'finished'

      // Обновляем финальный матч или матч за третье место
      if (stage === 2) {
        finalMatch.value = {
          ...match,
          participant1: match.participant1,
          participant2: match.participant2,
          participant1Score: match.participant1Score,
          participant2Score: match.participant2Score,
          winner: winner.name, // Изменено: сохраняем имя победителя
          winnerScore: score,
          category: match.category,
          status: 'finished'
        }
      }

      // Если это полуфинал, создаем матч за 3-е место между проигравшими
      if (stage === 4) {
        const loser = match.participant1.name === winner.name ? match.participant2 : match.participant1
        
        if (!thirdPlaceMatch.value.participant1) {
          thirdPlaceMatch.value.participant1 = loser
        } else {
          thirdPlaceMatch.value.participant2 = loser
          thirdPlaceMatch.value.category = match.category
        }

        if (thirdPlaceMatch.value.participant1 && thirdPlaceMatch.value.participant2) {
          const newThirdPlaceMatch = {
            fighter1: thirdPlaceMatch.value.participant1.name,
            fighter2: thirdPlaceMatch.value.participant2.name,
            category: match.category,
            team1: thirdPlaceMatch.value.participant1.team || '',
            team2: thirdPlaceMatch.value.participant2.team || '',
            status: 'upcoming',
            stage: '3rd place',
            points1: 0,
            points2: 0,
            points: 0,
            result: null,
            time: '--:--',
            judge: '',
            referee: '',
            tatami: '1'
          }
          store.commit('addMatch', newThirdPlaceMatch)
        }
      }

      // Обновляем существующий матч в расписании
      const scheduleMatches = store.state.schedule.filter(m => 
        m.fighter1 === match.participant1?.name && 
        m.fighter2 === match.participant2?.name && 
        m.category === match.category
      )

      if (scheduleMatches.length > 0) {
        const scheduleMatchIndex = store.state.schedule.indexOf(scheduleMatches[0])
        const updatedMatch = {
          ...scheduleMatches[0],
          result: winner.name,
          points: score,
          points1: match.participant1Score,
          points2: match.participant2Score,
          status: 'finished',
          stage: getStageString(stage),
          category: match.category,
          fighter1: match.participant1.name,
          fighter2: match.participant2.name
        }
        
        store.commit('removeMatch', scheduleMatchIndex)
        store.commit('addMatch', updatedMatch)
      } else {
        const newMatch = {
          fighter1: match.participant1.name,
          fighter2: match.participant2.name,
          category: match.category,
          team1: match.participant1.team || '',
          team2: match.participant2.team || '',
          status: 'finished',
          stage: getStageString(stage),
          points1: match.participant1Score,
          points2: match.participant2Score,
          points: score,
          result: winner.name,
          time: '--:--',
          judge: '',
          referee: '',
          tatami: '1'
        }
        store.commit('addMatch', newMatch)
      }

      // Определяем следующую стадию и добавляем победителя
      let nextStageMatches
      let nextMatch

      switch (stage) {
        case 32:
          nextStageMatches = top16Matches
          break
        case 16:
          nextStageMatches = top8Matches
          break
        case 8:
          nextStageMatches = top4Matches
          break
        case 4:
          nextMatch = finalMatch
          break
      }

      // Добавляем победителя в следующую стадию
      if (stage !== 2) {
        const nextMatchIndex = Math.floor(matchIndex / 2)
        console.log('Следующий матч:', { nextMatchIndex, stage })

        if (nextStageMatches) {
          // Для всех стадий кроме полуфинала
          if (!nextStageMatches.value[nextMatchIndex]) {
            nextStageMatches.value[nextMatchIndex] = {
              participant1: null,
              participant2: null,
              participant1Score: 0,
              participant2Score: 0,
              winner: null,
              winnerScore: null,
              category: match.category
            }
          }
          
          const nextMatch = nextStageMatches.value[nextMatchIndex]
          if (!nextMatch.participant1) {
            nextMatch.participant1 = {
              name: winner.name,
              team: winner.team,
              weight: match.category
            }
          } else {
            nextMatch.participant2 = {
              name: winner.name,
              team: winner.team,
              weight: match.category
            }
          }

          // Создаем новый матч в расписании
          if (nextMatch.participant1 && nextMatch.participant2) {
            const existingMatch = store.state.schedule.find(m =>
              m.fighter1 === nextMatch.participant1.name &&
              m.fighter2 === nextMatch.participant2.name &&
              m.category === match.category
            )

            if (!existingMatch) {
              const newScheduleMatch = {
                fighter1: nextMatch.participant1.name,
                fighter2: nextMatch.participant2.name,
                category: match.category,
                team1: nextMatch.participant1.team || '',
                team2: nextMatch.participant2.team || '',
                status: 'upcoming',
                stage: getStageString(stage / 2),
                points1: 0,
                points2: 0,
                points: 0,
                result: null,
                time: '--:--',
                judge: '',
                referee: '',
                tatami: '1'
              }
              store.commit('addMatch', newScheduleMatch)
            }
          }
        } else if (nextMatch) {
          // Для полуфинала (переход в финал)
          if (!nextMatch.value.participant1) {
            nextMatch.value.participant1 = {
              name: winner.name,
              team: winner.team,
              weight: match.category
            }
          } else {
            nextMatch.value.participant2 = {
              name: winner.name,
              team: winner.team,
              weight: match.category
            }
          }

          // Создаем финальный матч в расписании
          if (nextMatch.value.participant1 && nextMatch.value.participant2) {
            const existingMatch = store.state.schedule.find(m =>
              m.fighter1 === nextMatch.value.participant1.name &&
              m.fighter2 === nextMatch.value.participant2.name &&
              m.category === match.category
            )

            if (!existingMatch) {
              const newFinalMatch = {
                fighter1: nextMatch.value.participant1.name,
                fighter2: nextMatch.value.participant2.name,
                category: match.category,
                team1: nextMatch.value.participant1.team || '',
                team2: nextMatch.value.participant2.team || '',
                status: 'upcoming',
                stage: 'final',
                points1: 0,
                points2: 0,
                points: 0,
                result: null,
                time: '--:--',
                judge: '',
                referee: '',
                tatami: '1'
              }
              store.commit('addMatch', newFinalMatch)
            }
          }
        }
      }

      // Сохраняем результаты финального матча
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
              final: finalMatch.value,
              thirdPlace: thirdPlaceMatch.value
            }
          })
        } catch (err) {
          error.value = 'Ошибка при сохранении результатов турнира'
          console.error(err)
        }
      }

      // Обновляем статусы всех матчей
      store.state.schedule.forEach((m, idx) => {
        if (m.result) {
          store.commit('updateMatch', {
            index: idx,
            match: { ...m, status: 'finished' }
          })
        }
      })

      // Сохраняем состояние
      saveState()
      
      console.log('Обновление завершено:', {
        stage,
        winner: winner.name,
        nextStage: stage / 2
      })
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
      thirdPlaceMatch.value = {
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
    thirdPlaceMatch,
    initializeBracket,
    setWinner,
    selectCategory,
    clearAllData,
    loadState,
  }
} 