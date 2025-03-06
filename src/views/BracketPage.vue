<template>
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
          v-if="shouldShowStage(32)"
          title="1/16 финала"
          :matches="filteredTop32Matches"
          :stage="32"
          @winner-selected="setWinner"
        />

        <bracket-round
          v-if="shouldShowStage(16)"
          title="1/8 финала"
          :matches="filteredTop16Matches"
          :stage="16"
          @winner-selected="setWinner"
        />

        <bracket-round
          v-if="shouldShowStage(8)"
          title="1/4 финала"
          :matches="filteredTop8Matches"
          :stage="8"
          @winner-selected="setWinner"
        />

        <bracket-round
          v-if="shouldShowStage(4)"
          title="1/2 финала"
          :matches="filteredTop4Matches"
          :stage="4"
          @winner-selected="setWinner"
        />

        <bracket-round
          v-if="shouldShowStage(2)"
          title="ФИНАЛ"
          :matches="[finalMatch]"
          :stage="2"
          :is-final="true"
          @winner-selected="setWinner"
        />
      </div>

      <div v-if="shouldShowThirdPlace" class="third-place-match">
        <bracket-round
          title="Матч за 3-е место"
          :matches="[thirdPlaceMatch]"
          :stage="3"
          @winner-selected="setWinner"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, watch } from 'vue'
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
      initializeBracket,
      setWinner,
      selectCategory
    } = useBracketStore()

    const shouldShowThirdPlace = computed(() => {
      return thirdPlaceMatch.participant1 && thirdPlaceMatch.participant2
    })

    const shouldShowStage = (stage) => {
      switch (stage) {
        case 32:
          return filteredTop32Matches.value.length > 0
        case 16:
          return filteredTop16Matches.value.length > 0 || filteredTop32Matches.value.length > 0
        case 8:
          return filteredTop8Matches.value.length > 0 || filteredTop16Matches.value.length > 0 || filteredTop32Matches.value.length > 0
        case 4:
          return filteredTop4Matches.value.length > 0 || filteredTop8Matches.value.length > 0 || filteredTop16Matches.value.length > 0 || filteredTop32Matches.value.length > 0
        case 2:
          return (finalMatch.value.participant1 && finalMatch.value.participant2) || 
                 filteredTop4Matches.value.length > 0 || 
                 filteredTop8Matches.value.length > 0 || 
                 filteredTop16Matches.value.length > 0 || 
                 filteredTop32Matches.value.length > 0
        default:
          return false
      }
    }

    const filteredTop32Matches = computed(() => {
      if (!selectedCategory.value) return []
      return top32Matches.value.filter(match => 
        match.participant1?.weight === selectedCategory.value ||
        match.participant2?.weight === selectedCategory.value
      )
    })

    const filteredTop16Matches = computed(() => {
      if (!selectedCategory.value) return []
      return top16Matches.value.filter(match => 
        match.participant1?.weight === selectedCategory.value ||
        match.participant2?.weight === selectedCategory.value
      )
    })

    const filteredTop8Matches = computed(() => {
      if (!selectedCategory.value) return []
      return top8Matches.value.filter(match => 
        match.participant1?.weight === selectedCategory.value ||
        match.participant2?.weight === selectedCategory.value
      )
    })

    const filteredTop4Matches = computed(() => {
      if (!selectedCategory.value) return []
      return top4Matches.value.filter(match => 
        match.participant1?.weight === selectedCategory.value ||
        match.participant2?.weight === selectedCategory.value
      )
    })

    return {
      selectedCategory,
      loading,
      error,
      weightCategories,
      filteredTop32Matches,
      filteredTop16Matches,
      filteredTop8Matches,
      filteredTop4Matches,
      finalMatch,
      thirdPlaceMatch,
      selectCategory,
      setWinner,
      shouldShowStage,
      shouldShowThirdPlace
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