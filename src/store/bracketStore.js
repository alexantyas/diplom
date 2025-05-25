import { getBracket, putMatch, postBracketResults, createMatchesBatch } from '@/api'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

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

  // Категории формируются по расписанию (актуально!)
  const weightCategories = computed(() => {
    const categories = new Set(store.getters.schedule.map(match => match.category))
    return Array.from(categories).sort()
  })

  // Смена категории — просто грузим сетку из backend
  const selectCategory = async (category) => {
    selectedCategory.value = category
    await initializeBracket()
  }

  // Конвертер для получения чистого имени
  function getPureName(f) {
    if (!f) return ''
    if (typeof f === 'string') return f
    if (typeof f === 'object' && f.name) return getPureName(f.name)
    return ''
  }

  // Инициализация сетки (всегда только через backend)
  async function initializeBracket() {
    loading.value = true
    error.value   = null

    try {
      const competitionId = store.getters.competition?.id || store.state.competition?.id
      if (!competitionId || !selectedCategory.value) {
        top32Matches.value = []
        top16Matches.value = []
        top8Matches.value  = []
        top4Matches.value  = []
        finalMatch.value   = { participant1: null, participant2: null, participant1Score: 0, participant2Score: 0, winner: null, winnerScore: null }
        thirdPlaceMatch.value = { ...finalMatch.value }
        return
      }

      const { data } = await getBracket(competitionId)
      const rounds = data.rounds

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

      // Заполняем только выбранную категорию
      top32Matches.value = (rounds['1/16'] || []).filter(m => m.category === selectedCategory.value).map(toLocal)
      top16Matches.value = (rounds['1/8']  || []).filter(m => m.category === selectedCategory.value).map(toLocal)
      top8Matches.value  = (rounds['1/4']  || []).filter(m => m.category === selectedCategory.value).map(toLocal)
      top4Matches.value  = (rounds['1/2']  || []).filter(m => m.category === selectedCategory.value).map(toLocal)

      if ((rounds['final'] || []).length) {
        const final = rounds['final'].find(m => m.category === selectedCategory.value)
        if (final) finalMatch.value = toLocal(final)
      }
      if ((rounds['3rd place'] || []).length) {
        const third = rounds['3rd place'].find(m => m.category === selectedCategory.value)
        if (third) thirdPlaceMatch.value = toLocal(third)
      }

    } catch (err) {
      error.value = 'Ошибка при загрузке турнирной сетки'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Установка победителя
  const setWinner = async ({ match, winner, score, stage, matchIndex }) => {
    try {
      // 1) PATCH матч на сервере
      await putMatch(match.id, {
        stage: getStageString(stage),
        status: 'finished',
        winner_participant_type: winner.team,
        winner_participant_id: winner.id,
        score,
        comment: match.comment
      })
      // 2) Обновляем всю сетку по API (гарантия свежести)
      await initializeBracket()
      // (по необходимости можно также делать refetch расписания)
      await store.dispatch('loadSchedule', store.getters.competition.id)
    } catch (err) {
      error.value = 'Ошибка при обновлении матча'
      console.error(err)
    }
  }

  // Прочее (очистка)
  const clearAllData = async () => {
    selectedCategory.value = ''
    top32Matches.value = []
    top16Matches.value = []
    top8Matches.value = []
    top4Matches.value = []
    finalMatch.value = { participant1: null, participant2: null, participant1Score: 0, participant2Score: 0, winner: null, winnerScore: null }
    thirdPlaceMatch.value = { ...finalMatch.value }
    store.commit('logout')
  }

  // Вспомогательное
  const getStageString = (stage) => {
    switch (stage) {
      case 32: return '1/16'
      case 16: return '1/8'
      case 8:  return '1/4'
      case 4:  return '1/2'
      case 2:  return 'final'
      default: return ''
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
