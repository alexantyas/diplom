<template>
  <div class="match-card" :class="{ 'final-match': isFinal }">
    <div class="match-info">
      <div v-for="(participant, index) in ['participant1', 'participant2']" 
           :key="index"
           class="participant"
           :class="{ winner: match.winner === match[participant] }">
        <div class="participant-info">
          <div class="participant-name">
            {{ match[participant]?.name }}
          </div>
          <div class="participant-details">
            <span class="weight-info" v-if="match[participant]?.weight">
              {{ match[participant].weight }}
            </span>
            <span class="team-info" v-if="match[participant]?.team">
              {{ match[participant].team }}
            </span>
          </div>
        </div>
        <div class="score" v-if="match[`${participant}Score`] !== undefined">
          {{ match[`${participant}Score`] }}
        </div>
      </div>
    </div>
    
    <div class="match-actions" v-if="!match.winner && match.participant1 && match.participant2">
      <div class="score-inputs" v-if="!match.winner">
        <div class="score-input" v-for="(participant, index) in ['participant1', 'participant2']" :key="index">
          <input type="number" 
                 v-model="match[`${participant}Score`]" 
                 placeholder="Очки"
                 class="form-control form-control-sm">
        </div>
      </div>
      <base-button 
        v-for="(participant, index) in ['participant1', 'participant2']"
        :key="index"
        size="sm"
        variant="success" 
        @click="setWinner(match[participant], match[`${participant}Score`])"
        :disabled="!isValidScore(match[`${participant}Score`])">
        Победил {{ index + 1 }}
      </base-button>
    </div>
  </div>
</template>

<script>
import BaseButton from '@/components/ui/BaseButton.vue'

export default {
  name: 'BracketMatch',
  components: {
    BaseButton
  },
  props: {
    match: {
      type: Object,
      required: true
    },
    stage: {
      type: Number,
      required: true
    },
    matchIndex: {
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
    const isValidScore = (score) => {
      return score !== undefined && score !== null && score !== '' && !isNaN(score) && score >= 0;
    }

    const setWinner = (winner, score) => {
      if (isValidScore(score)) {
        emit('winner-selected', {
          match: props.match,
          winner,
          score,
          stage: props.stage,
          matchIndex: props.matchIndex
        });
      }
    }

    return {
      isValidScore,
      setWinner
    }
  }
}
</script>

<style scoped>
.match-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.match-info {
  margin-bottom: 15px;
}

.participant {
  padding: 12px;
  border: 1px solid #e9ecef;
  margin: 4px 0;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-weight: 500;
  font-size: 1rem;
}

.participant-details {
  display: flex;
  gap: 10px;
  font-size: 0.85em;
  color: #6c757d;
  margin-top: 2px;
}

.weight-info, .team-info {
  padding: 2px 6px;
  background: #f8f9fa;
  border-radius: 4px;
}

.score {
  font-weight: bold;
  font-size: 1.2rem;
  min-width: 40px;
  text-align: center;
  padding: 0 8px;
  color: #198754;
}

.score-inputs {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  width: 100%;
}

.score-input {
  flex: 1;
}

.score-input input {
  width: 100%;
  text-align: center;
}

.winner {
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.winner .participant-name {
  color: #155724;
  font-weight: 600;
}

.match-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
}

.final-match {
  border-color: #ffd700;
  background-color: #fff9e6;
}
</style> 