<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <div class="bracket-page">
      <category-selector
        :categories="weightCategories"
        :selected-category="selectedCategory"
        @select="selectCategory"
      />

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

      <div v-else class="bracket-container">
        <div class="main-bracket">
          <bracket-round
            v-if="top32Matches.length"
            title="1/16 финала"
            :matches="top32Matches"
            :stage="32"
            @winner-selected="setWinner"
          />

          <bracket-round
            v-if="top16Matches.length"
            title="1/8 финала"
            :matches="top16Matches"
            :stage="16"
            @winner-selected="setWinner"
          />

          <bracket-round
            v-if="top8Matches.length"
            title="1/4 финала"
            :matches="top8Matches"
            :stage="8"
            @winner-selected="setWinner"
          />

          <bracket-round
            v-if="top4Matches.length"
            title="1/2 финала"
            :matches="top4Matches"
            :stage="4"
            @winner-selected="setWinner"
          />

          <bracket-round
            v-if="finalMatch && finalMatch.participant1 && finalMatch.participant2"
            title="ФИНАЛ"
            :matches="[finalMatch]"
            :stage="2"
            :is-final="true"
            @winner-selected="setWinner"
          />
        </div>

        <div v-if="thirdPlaceMatch && thirdPlaceMatch.participant1 && thirdPlaceMatch.participant2" class="third-place-match">
          <bracket-round
            title="Матч за 3-е место"
            :matches="[thirdPlaceMatch]"
            :stage="3"
            @winner-selected="setWinner"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useBracketStore } from '@/store/bracketStore'
import CategorySelector from '@/components/bracket/CategorySelector.vue'
import BracketRound from '@/components/bracket/BracketRound.vue'

export default {
  name: 'BracketPage',
  components: {
    CategorySelector,
    BracketRound
  },
  setup() {
    const {
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
      setWinner,
      selectCategory
    } = useBracketStore()

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
      setWinner,
      selectCategory
    }
  }
}
</script>

<style scoped>
.bracket-page {
  padding: 20px;
}

.bracket-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 20px 0;
}

.main-bracket {
  display: flex;
  gap: 30px;
  overflow-x: auto;
}

.third-place-match {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

@media (max-width: 768px) {
  .main-bracket {
    flex-direction: column;
    gap: 20px;
  }
}
</style>