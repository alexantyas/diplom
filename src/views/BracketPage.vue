<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <div class="bracket-page">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span class="fw-bold">Выберите весовую категорию:</span>
        <button
          v-for="cat in weightCategories"
          :key="cat"
          class="btn"
          :class="selectedCategory === cat ? 'btn-primary' : 'btn-outline-primary'"
          @click="selectCategory(cat)"
        >{{ cat }}</button>
      </div>

      <div v-if="loading" class="text-center my-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
      </div>

      <div v-else-if="error" class="alert alert-danger my-4">
        {{ error }}
      </div>

      <div v-else-if="!selectedCategory" class="text-center my-4">
        <h4>Выберите весовую категорию для отображения сетки</h4>
      </div>

     <div v-else class="bracket-grid">
    <div class="bracket-stage" v-for="(round, idx) in bracketRounds" :key="idx">
      <div class="stage-title">{{ round.title }}</div>
      <div class="matches">
        <div
          v-for="(match, mi) in round.matches"
          :key="mi"
          class="match-card"
          :class="{ finished: match.winner }"
        >
          <div class="fighter" :class="{ winner: match.winner === getFighterName(match.participant1) }">
  {{ getFighterName(match.participant1) }}
  <button
    v-if="!match.winner && match.participant1"
    class="btn btn-sm btn-outline-success"
    @click="setWinner({ match, winner: match.participant1, score: 0, stage: round.stage, matchIndex: mi })"
    title="Отметить победителя"
  >🏆</button>
</div>
<div class="fighter" :class="{ winner: match.winner === getFighterName(match.participant2) }">
  {{ getFighterName(match.participant2) }}
  <button
    v-if="!match.winner && match.participant2"
    class="btn btn-sm btn-outline-success"
    @click="setWinner({ match, winner: match.participant2, score: 0, stage: round.stage, matchIndex: mi })"
    title="Отметить победителя"
  >🏆</button>
</div>
        </div>
      </div>
    </div>
  </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useBracketStore } from '@/store/bracketStore'

export default {
  setup() {
    const {
      selectedCategory,
      loading,
      error,
      weightCategories,
      top16Matches,
      top8Matches,
      top4Matches,
      finalMatch,
      thirdPlaceMatch,
      setWinner,
      selectCategory,
    } = useBracketStore()

    // Составляем список раундов для отрисовки
    const bracketRounds = computed(() => {
      const rounds = []
      if (top16Matches.value?.length) {
        rounds.push({ title: '1/8 финала', matches: top16Matches.value, stage: 16 })
      }
      if (top8Matches.value?.length) {
        rounds.push({ title: '1/4 финала', matches: top8Matches.value, stage: 8 })
      }
      if (top4Matches.value?.length) {
        rounds.push({ title: '1/2 финала', matches: top4Matches.value, stage: 4 })
      }
      if (finalMatch.value && (finalMatch.value.participant1 || finalMatch.value.participant2)) {
        rounds.push({ title: 'Финал', matches: [finalMatch.value], stage: 2 })
      }
      if (thirdPlaceMatch.value && (thirdPlaceMatch.value.participant1 || thirdPlaceMatch.value.participant2)) {
        rounds.push({ title: 'Матч за 3-е место', matches: [thirdPlaceMatch.value], stage: 0 })
      }
      return rounds
    })

    // Универсальный вывод имени бойца
    function getFighterName(f) {
      if (!f) return '—'
      if (typeof f === 'string') return f
      if (typeof f === 'object' && f.name) return f.name
      return ''
    }

    // При монтировании ничего не делаем (ждём выбора категории)

    return {
      selectedCategory,
      loading,
      error,
      weightCategories,
      bracketRounds,
      setWinner,
      selectCategory,
      getFighterName
    }
  }
}
</script>



<style scoped>
.bracket-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(160px, 1fr);
  gap: 18px;
  align-items: start;
  max-width: 100vw;
  overflow-x: auto;
  min-height: 70vh;
}

.bracket-stage {
  width: 100%;
}

.stage-title {
  font-weight: bold;
  text-align: center;
  margin-bottom: 4px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px 0;
  font-size: 1rem;
}

.matches {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px #0001;
  padding: 7px 4px; /* было 12px 8px */
  min-height: 48px;  /* было 80px */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  transition: box-shadow 0.2s;
  font-size: 0.95rem;
}
.match-card.finished {
  box-shadow: 0 2px 10px #42b98344;
}
.fighter {
  padding: 4px 2px;
  border-radius: 6px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.2s;
}
.fighter.winner {
  background: #e9ffe7;
  font-weight: bold;
  color: #237030;
  font-size: 1.07em;
}
.btn-outline-success {
  margin-left: 8px;
  font-size: 0.9em;
  padding: 2px 8px;
  height: 22px;
  min-width: 25px;
}

/* Для малых экранов: */
@media (max-width: 900px) {
  .bracket-grid {
    gap: 6px;
  }
  .bracket-stage {
    min-width: 100px;
    max-width: 110px;
  }
  .match-card {
    padding: 4px 2px;
    min-height: 30px;
    font-size: 0.85rem;
  }
  .fighter {
    font-size: 0.85rem;
  }
}
</style>
