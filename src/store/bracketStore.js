// bracketStore.js (ПОЛНЫЙ ЛИСТИНГ с исправленной логикой)
import { getBracket, patchMatch, postBracketResults,createMatchesBatch} from '@/api'
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
const STORAGE_KEY = 'tournament_brackets'
const STAGE_NAMES = [
  '1/16 финала',
  '1/8 финала',
  '1/4 финала',
  '1/2 финала',
  'Финал'
]
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

 async function initializeBracket() {
  loading.value = true
  error.value   = null

  try {
    const competitionId = store.getters.currentCompetitionId
    const { data }     = await getBracket(competitionId)
    const rounds       = data.rounds  // { "1/16": [...], "1/8": [...], ..., "final": [...], "3rd place": [...] }

    // Чистим
    top32Matches.value    = []
    top16Matches.value    = []
    top8Matches.value     = []
    top4Matches.value     = []
    finalMatch.value      = { id:null, participant1:null, participant2:null, participant1Score:0, participant2Score:0, winner:null, winnerScore:0, status:null, comment:null, matchTime:null }
    thirdPlaceMatch.value = { ...finalMatch.value }

    // Хелпер: перевод MatchRead → внутренний объект для отрисовки
    const toLocal = m => ({
      id: m.id,
      participant1: {
        name: m.red_participant_type === 'individual' ? m.red_participant_id : null,
        team: m.red_participant_type === 'team'     ? m.red_participant_id : null
      },
      participant2: {
        name: m.blue_participant_type === 'individual' ? m.blue_participant_id : null,
        team: m.blue_participant_type === 'team'       ? m.blue_participant_id : null
      },
      participant1Score: m.points1 ?? 0,
      participant2Score: m.points2 ?? 0,
      winner:            m.winner_participant_id,
      winnerScore:       m.score ?? 0,
      category:          m.category,
      status:            m.status,
      comment:           m.comment,
      matchTime:         m.match_time,
      stage:             m.stage
    })

    // Заполняем по раундам
    top32Matches.value = (rounds['1/16'] || []).map(toLocal)
    top16Matches.value = (rounds['1/8']  || []).map(toLocal)
    top8Matches.value  = (rounds['1/4']  || []).map(toLocal)
    top4Matches.value  = (rounds['1/2']  || []).map(toLocal)

    if ((rounds['final'] || []).length) {
      finalMatch.value = toLocal(rounds['final'][0])
    }
    if ((rounds['3rd place'] || []).length) {
      thirdPlaceMatch.value = toLocal(rounds['3rd place'][0])
    }

  } catch (err) {
    console.error(err)
    error.value = 'Ошибка при загрузке турнирной сетки'
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
    // 1) Локально отмечаем, что матч завершён
    match.winner      = winner.name
    match.winnerScore = score
    match.status      = 'finished'

    // 2) Патчим этот же матч в бекенде
    await patchMatch(match.id, {
      stage:                     getStageString(stage),
      status:                    'finished',
      winner_participant_type:   winner.team,
      winner_participant_id:     winner.id,
      score,
      comment:                   match.comment
    })

    // 3) Ищем его же в общем расписании — и тоже патчим, если нашли
    const scheduleMatches = store.state.schedule.filter(m => {
      const f1 = getPureName(m.fighter1), f2 = getPureName(m.fighter2)
      const p1 = getPureName(match.participant1), p2 = getPureName(match.participant2)
      return (
        (f1 === p1 && f2 === p2) ||
        (f1 === p2 && f2 === p1)
      ) && m.category === match.category
    })
    if (scheduleMatches.length) {
      const orig = scheduleMatches[0]
      const updateDto = {
        result: winner.name,
        points: score,
        points1: match.participant1Score,
        points2: match.participant2Score,
        status: 'finished',
        stage: getStageString(stage),
      }
      await patchMatch(orig.id, updateDto)
    }

    // 4) ФИНАЛ — формируем финальный объект и пушим весь брэкет одной порцией
    if (stage === 2) {
      finalMatch.value = {
        ...match,
        winner:      winner.name,
        winnerScore: score,
        status:      'finished'
      }

      const compId = store.getters.currentCompetitionId
      const payload = { rounds: {
        '1/16': top32Matches.value.map(m => ({
          id:                 m.id,
          stage:              m.stage,
          status:             m.status,
          winner_participant_type:   m.participant1.name === m.winner ? m.participant1.team : m.participant2.team,
          winner_participant_id:     m.winner,
          points1:            m.participant1Score,
          points2:            m.participant2Score,
          comment:            m.comment
        })),
        '1/8':  top16Matches.value.map(m => ({ /* аналогично */ })),
        '1/4':  top8Matches.value.map(m => ({ /* … */ })),
        '1/2':  top4Matches.value.map(m => ({ /* … */ })),
        'final':[{
          id:                       match.id,
          stage:                    match.stage,
          status:                   match.status,
          winner_participant_type:  winner.team,
          winner_participant_id:    winner.id,
          points1:                  match.participant1Score,
          points2:                  match.participant2Score,
          comment:                  match.comment
        }],
        '3rd place': thirdPlaceMatch.value?.id
          ? [{
              id:                      thirdPlaceMatch.value.id,
              stage:                   '3rd place',
              status:                  thirdPlaceMatch.value.status,
              winner_participant_type: thirdPlaceMatch.value.winner?.team,
              winner_participant_id:   thirdPlaceMatch.value.winner,
              points1:                 thirdPlaceMatch.value.participant1Score,
              points2:                 thirdPlaceMatch.value.participant2Score,
              comment:                 thirdPlaceMatch.value.comment
            }]
          : []
      }}

      await postBracketResults(compId, payload)
    }

    // 5) МАТЧ ЗА 3 МЕСТО — создаём новый матч через бек и пишем в local state
    if (stage === 4) {
      const loser = match.participant1.name === winner.name
        ? match.participant2
        : match.participant1

      if (!thirdPlaceMatch.value.participant1) {
        thirdPlaceMatch.value.participant1 = loser
      } else if (!thirdPlaceMatch.value.participant2) {
        thirdPlaceMatch.value.participant2 = loser
        thirdPlaceMatch.value.category = match.category
      }

      if (
        thirdPlaceMatch.value.participant1 &&
        thirdPlaceMatch.value.participant2 &&
        !thirdPlaceMatch.value.id
      ) {
       const loser = match.participant1.name === winner.name
  ? match.participant2
  : match.participant1; // Форма для POST /matches/batch
        const new3rd = {
  red_participant_type:  'individual',
  red_participant_id:    loser.id,  // здесь берём ID из объекта loser
  blue_participant_type: 'individual',
  blue_participant_id:   (loser.id === match.participant1.id
                         ? match.participant2.id
                         : match.participant1.id),
  competition_id:        store.getters.currentCompetitionId,
  stage:                 '3rd place',
  status:                'upcoming'
};
        const { data } = await createMatchesBatch([new3rd]);
thirdPlaceMatch.value.id = data[0].id;
      }
    }

    // 6) ПРОДВИГАЕМ В СЛЕДУЮЩУЮ СТАДИЮ — и если нужно, создаём матч через бек
    let nextStageMatches, nextMatchRef, nextStageNum = stage / 2
    switch (stage) {
      case 32: nextStageMatches = top16Matches; break
      case 16: nextStageMatches = top8Matches;  break
      case 8:  nextStageMatches = top4Matches;  break
      case 4:  nextMatchRef      = finalMatch;  break
    }
    if (stage !== 2 && nextStageMatches) {
      
      const idx = Math.floor(matchIndex / 2)
      if (!nextStageMatches.value[idx]) {
        nextStageMatches.value[idx] = { participant1:null, participant2:null, participant1Score:0, participant2Score:0, winner:null, winnerScore:0, category:match.category }
      }
      const nm = nextStageMatches.value[idx]
      if (!nm.participant1) nm.participant1 = { name: winner.name, team: winner.team, weight: match.category }
      else if (!nm.participant2) nm.participant2 = { name: winner.name, team: winner.team, weight: match.category }

      if (nm.participant1 && nm.participant2 && !nm.id) {
        // создаём через бек
        const dto = {
  red_participant_type:  'individual',
  red_participant_id:    nextMatch.participant1.id,
  blue_participant_type: 'individual',
  blue_participant_id:   nextMatch.participant2.id,
  competition_id:        store.getters.currentCompetitionId,
  stage:                 getStageString(nextStageNum),
  status:                'upcoming'
};
        const { data } = await createMatchesBatch([dto]);
nextMatch.id = data[0].id;
      }
    }

    // 7) Финальная подстраховка: все в расписании с результатом — делаем patch статус
    await Promise.all(
      store.state.schedule
        .filter(m => m.result && m.status !== 'finished')
        .map(m => patchMatch(m.id, { status:'finished' }))
    )

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
