<template>
  <div class="bracket-round">
    <h3>{{ title }}</h3>
    <div class="matches">
      <bracket-match
        v-for="(match, index) in matches"
        :key="index"
        :match="match"
        :stage="stage"
        :match-index="index"
        :is-final="isFinal"
        @winner-selected="onWinnerSelected"
      />
    </div>
  </div>
</template>

<script>
import BracketMatch from './BracketMatch.vue'

export default {
  name: 'BracketRound',
  components: {
    BracketMatch
  },
  props: {
    title: {
      type: String,
      required: true
    },
    matches: {
      type: Array,
      required: true
    },
    stage: {
      type: Number,
      required: true
    },
    isFinal: {
      type: Boolean,
      default: false
    }
  },
  emits: ['winner-selected'],
  setup(props, { emit }) {
    const onWinnerSelected = (data) => {
      emit('winner-selected', data)
    }

    return {
      onWinnerSelected
    }
  }
}
</script>

<style scoped>
.bracket-round {
  min-width: 280px;
}

.matches {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h3 {
  margin-bottom: 20px;
  color: #495057;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .bracket-round {
    min-width: 100%;
  }
}
</style> 