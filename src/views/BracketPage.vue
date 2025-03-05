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

    <div v-else class="bracket-container">
      <bracket-round
        v-if="filteredTop32Matches.length"
        title="1/16 финала"
        :matches="filteredTop32Matches"
        :stage="32"
        @winner-selected="setWinner"
      />

      <bracket-round
        v-if="filteredTop16Matches.length"
        title="1/8 финала"
        :matches="filteredTop16Matches"
        :stage="16"
        @winner-selected="setWinner"
      />

      <bracket-round
        v-if="filteredTop8Matches.length"
        title="1/4 финала"
        :matches="filteredTop8Matches"
        :stage="8"
        @winner-selected="setWinner"
      />

      <bracket-round
        v-if="filteredTop4Matches.length"
        title="1/2 финала"
        :matches="filteredTop4Matches"
        :stage="4"
        @winner-selected="setWinner"
      />

      <bracket-round
        title="ФИНАЛ"
        :matches="[finalMatch]"
        :stage="2"
        :is-final="true"
        @winner-selected="setWinner"
      />
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
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
      initializeBracket,
      setWinner,
      selectCategory
    } = useBracketStore()

    const filteredTop32Matches = computed(() => {
      if (!selectedCategory.value) return top32Matches.value
      return top32Matches.value.filter(match => 
        match.participant1?.weight === selectedCategory.value ||
        match.participant2?.weight === selectedCategory.value
      )
    })

    const filteredTop16Matches = computed(() => {
      if (!selectedCategory.value) return top16Matches.value
      return top16Matches.value.filter(match => 
        match.participant1?.weight === selectedCategory.value ||
        match.participant2?.weight === selectedCategory.value
      )
    })

    const filteredTop8Matches = computed(() => {
      if (!selectedCategory.value) return top8Matches.value
      return top8Matches.value.filter(match => 
        match.participant1?.weight === selectedCategory.value ||
        match.participant2?.weight === selectedCategory.value
      )
    })

    const filteredTop4Matches = computed(() => {
      if (!selectedCategory.value) return top4Matches.value
      return top4Matches.value.filter(match => 
        match.participant1?.weight === selectedCategory.value ||
        match.participant2?.weight === selectedCategory.value
      )
    })

    onMounted(() => {
      initializeBracket()
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
      selectCategory,
      setWinner
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
  gap: 30px;
  overflow-x: auto;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .bracket-container {
    flex-direction: column;
    gap: 20px;
  }
}
</style> 