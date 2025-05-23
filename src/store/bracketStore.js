// bracketStore.js (ПОЛНЫЙ ЛИСТИНГ с исправленной логикой)

import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

const STORAGE_KEY = 'tournament_brackets'

export function useBracketStore() {
  const store = useStore()
  const selectedCategory = ref('')
  const loading = ref(false)
  const error = ref(null)
  function getPureName(f) {
  if (!f) return ''
  if (typeof f === 'string') return f
  if (typeof f === 'object' && f.name) return getPureName(f.name)
  return ''
}
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
          thirdPlaceMatch.value = state.thirdPlaceMatch || {
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
        finalMatch: finalMatch.value,
        thirdPlaceMatch: thirdPlaceMatch.value
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allBrackets))
    } catch (err) {
      console.error('Ошибка при сохранении состояния:', err)
    }
  }

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
      name: getPureName(scheduleMatch.fighter1),
      team: scheduleMatch.team1,
      weight: scheduleMatch.category
    } : null,
    participant2: scheduleMatch ? {
      name: getPureName(scheduleMatch.fighter2),
      team: scheduleMatch.team2,
      weight: scheduleMatch.category
    } : null,
    participant1Score: scheduleMatch?.points1 || 0,
    participant2Score: scheduleMatch?.points2 || 0,
    winner: scheduleMatch?.result ? getPureName(scheduleMatch.result) : null,
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
      // console.log('Количество схваток в категории:', matchCount)

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

      // console.log('Начальная стадия турнира:', startingStage)

      // Распределение матчей по этапам
      switch (startingStage) {
        case 32:
          top32Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
          initializeNextStage(top32Matches.value, top16Matches)
          initializeNextStage(top16Matches.value, top8Matches)
          initializeNextStage(top8Matches.value, top4Matches)
          initializeNextStage(top4Matches.value, null, finalMatch)
          break
        case 16:
          top16Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
          initializeNextStage(top16Matches.value, top8Matches)
          initializeNextStage(top8Matches.value, top4Matches)
          initializeNextStage(top4Matches.value, null, finalMatch)
          break
        case 8:
          top8Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
          initializeNextStage(top8Matches.value, top4Matches)
          initializeNextStage(top4Matches.value, null, finalMatch)
          break
        case 4:
          top4Matches.value = filteredSchedule.map(match => createMatchFromSchedule(match))
          initializeNextStage(top4Matches.value, null, finalMatch)
          break
        case 2:
          finalMatch.value = createMatchFromSchedule(filteredSchedule[0])
          break
      }

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
    if (!isValidMatch(participant1, participant2)) {
      // console.warn('Попытка создать невалидный матч:', { participant1, participant2 });
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

  // ГЛАВНОЕ ИСПРАВЛЕНИЕ: СИНХРОНИЗАЦИЯ с расписанием и формирование следующего этапа
  const setWinner = async ({ match, winner, score, stage, matchIndex }) => {
    try {
      // console.log('Установка победителя:', { stage, matchIndex, winner })

      // Обновляем текущий матч в локальной сетке
      match.winner = winner.name
      match.winnerScore = score
      match.status = 'finished'

      // Находим и обновляем этот матч в расписании, если он там есть
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
        store.commit('updateMatch', {
          index: scheduleMatchIndex,
          match: updatedMatch
        })
      }

      // ФИНАЛ
      if (stage === 2) {
        finalMatch.value = {
          ...match,
          participant1: match.participant1,
          participant2: match.participant2,
          participant1Score: match.participant1Score,
          participant2Score: match.participant2Score,
          winner: winner.name,
          winnerScore: score,
          category: match.category,
          status: 'finished'
        }
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

      // МАТЧ ЗА 3 МЕСТО
      if (stage === 4) {
        const loser = match.participant1.name === winner.name ? match.participant2 : match.participant1
        if (!thirdPlaceMatch.value.participant1) {
          thirdPlaceMatch.value.participant1 = loser
        } else if (!thirdPlaceMatch.value.participant2) {
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
          // Добавляем матч за 3 место только если его ещё нет
          const existing3rd = store.state.schedule.find(m =>
            m.fighter1 === newThirdPlaceMatch.fighter1 &&
            m.fighter2 === newThirdPlaceMatch.fighter2 &&
            m.category === newThirdPlaceMatch.category &&
            m.stage === '3rd place'
          )
          if (!existing3rd) {
            store.commit('addMatch', newThirdPlaceMatch)
          }
        }
      }

      // ПРОДВИГАЕМ В СЛЕДУЮЩУЮ СТАДИЮ И СОЗДАЁМ ПАРУ В РАСПИСАНИИ
      let nextStageMatches
      let nextMatchRef
      let nextStageNum = stage / 2

      switch (stage) {
        case 32: nextStageMatches = top16Matches; break
        case 16: nextStageMatches = top8Matches; break
        case 8:  nextStageMatches = top4Matches; break
        case 4:  nextMatchRef = finalMatch; break
        default: nextStageMatches = null; nextMatchRef = null
      }

      // Если это не финал — ищем/создаём следующую пару
      if (stage !== 2 && nextStageMatches) {
        const nextMatchIndex = Math.floor(matchIndex / 2)
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
        // Ставим победителя на первую или вторую позицию в зависимости от чётности
        if (!nextMatch.participant1) {
          nextMatch.participant1 = {
            name: winner.name,
            team: winner.team,
            weight: match.category
          }
        } else if (!nextMatch.participant2) {
          nextMatch.participant2 = {
            name: winner.name,
            team: winner.team,
            weight: match.category
          }
        }

        // Если оба участника уже определены — создаём новую пару в расписании
        if (nextMatch.participant1 && nextMatch.participant2) {
          // Проверка, нет ли такого матча уже
          const alreadyScheduled = store.state.schedule.find(m =>
            m.fighter1 === nextMatch.participant1.name &&
            m.fighter2 === nextMatch.participant2.name &&
            m.category === match.category &&
            m.stage === getStageString(nextStageNum)
          )
          if (!alreadyScheduled) {
            const newScheduleMatch = {
              fighter1: nextMatch.participant1.name,
              fighter2: nextMatch.participant2.name,
              category: match.category,
              team1: nextMatch.participant1.team || '',
              team2: nextMatch.participant2.team || '',
              status: 'upcoming',
              stage: getStageString(nextStageNum),
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
      }

      // Для полуфинала: обновляем финальный матч
      if (stage === 4 && nextMatchRef) {
        if (!nextMatchRef.value.participant1) {
          nextMatchRef.value.participant1 = {
            name: winner.name,
            team: winner.team,
            weight: match.category
          }
        } else if (!nextMatchRef.value.participant2) {
          nextMatchRef.value.participant2 = {
            name: winner.name,
            team: winner.team,
            weight: match.category
          }
        }

        // Когда оба есть — матч финала в расписание
        if (nextMatchRef.value.participant1 && nextMatchRef.value.participant2) {
          const existingFinal = store.state.schedule.find(m =>
            m.fighter1 === nextMatchRef.value.participant1.name &&
            m.fighter2 === nextMatchRef.value.participant2.name &&
            m.category === match.category &&
            m.stage === 'final'
          )
          if (!existingFinal) {
            const newFinalMatch = {
              fighter1: nextMatchRef.value.participant1.name,
              fighter2: nextMatchRef.value.participant2.name,
              category: match.category,
              team1: nextMatchRef.value.participant1.team || '',
              team2: nextMatchRef.value.participant2.team || '',
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

      // Обновляем статусы всех завершённых матчей в расписании
      store.state.schedule.forEach((m, idx) => {
        if (m.result && m.status !== 'finished') {
          store.commit('updateMatch', {
            index: idx,
            match: { ...m, status: 'finished' }
          })
        }
      })

      saveState()
    } catch (err) {
      error.value = 'Ошибка при обновлении матча'
      console.error(err)
    }
  }

  const clearAllData = async () => {
    try {
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
    clearAllData
  }
}
