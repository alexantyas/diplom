<template>
  <div class="bracket-page">
    <div class="bracket-header">
      <h2>Турнирная сетка</h2>
      <div class="competition-info">
        <span v-if="competitionName" class="competition-name">
          {{ competitionName }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Загрузка турнирной сетки...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="bracketData && bracketData.categoryNames.length > 0" class="bracket-container">
      <!-- Табы для весовых категорий -->
      <div class="category-tabs">
        <button
          v-for="category in bracketData.categoryNames"
          :key="category"
          class="category-tab"
          :class="{ active: selectedCategory === category }"
          @click="selectCategory(category)"
        >
          {{ category }}
          <span class="match-count">
            ({{ getTotalMatchesInCategory(category) }})
          </span>
        </button>
      </div>

      <!-- Турнирная сетка для выбранной категории -->
      <div v-if="selectedCategory && currentCategoryData" class="bracket-tree">
        <div 
          v-for="(stage, stageIndex) in currentCategoryData.stageOrder" 
          :key="stage"
          class="stage-column"
          :class="`stage-${stageIndex}`"
        >
          <h3 class="stage-title">{{ stage }}</h3>
          <div class="matches-container">
            <div 
              v-for="(match, matchIndex) in currentCategoryData.stages[stage]" 
              :key="match.id"
              class="match-card"
              :class="{ 
                'finished': match.status === 'finished',
                'has-winner': match.winner_participant_id 
              }"
              :data-match-id="match.id"
              :style="getMatchPositionStyle(stageIndex, matchIndex)"
            >
              <!-- Красный участник -->
              <div 
                class="participant red-participant"
                :class="{ 
                  'winner': isWinner(match, 'red'),
                  'empty': !match.red_participant
                }"
              >
                <span class="participant-name">
                  {{ getName(match.red_participant_type, match.red_participant_id) }}
                </span>
                <span v-if="match.status === 'finished'" class="score">
                  {{ getParticipantScore(match, 'red') }}
                </span>
              </div>

              <!-- Разделитель -->
              <div class="match-separator">
                <span class="vs">VS</span>
                <div v-if="match.status === 'finished'" class="match-result">
                  {{ match.score || '0:0' }}
                </div>
              </div>

              <!-- Синий участник -->
              <div 
                class="participant blue-participant"
                :class="{ 
                  'winner': isWinner(match, 'blue'),
                  'empty': !match.blue_participant
                }"
              >
                <span class="participant-name">
                  {{ getName(match.blue_participant_type, match.blue_participant_id) }}
                </span>
                <span v-if="match.status === 'finished'" class="score">
                  {{ getParticipantScore(match, 'blue') }}
                </span>
              </div>

              <!-- Информация о матче -->
              <div class="match-info">
                <span class="match-id">Схватка #{{ match.id }}</span>
                <span v-if="match.match_time" class="match-time">
                  {{ formatDateTime(match.match_time) }}
                </span>
                <span class="match-status" :class="match.status">
                  {{ getStatusText(match.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!competitionId" class="no-competition">
      Не указан ID турнира
    </div>

    <div v-else class="no-data">
      Нет данных для отображения турнирной сетки
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { 
  getBracketData,
  getBracketDataByCategory,
  getCompetitions
} from '../store/bracket.js'

export default {
  name: 'BracketPage',

  data() {
    return {
      competitionId: null,
      competitionName: '',
      bracketData: null,
      selectedCategory: null,
      currentCategoryData: null,
      loading: false,
      error: null
    }
  },

  computed: {
    ...mapState(['participants']),
    participantsMap() {
      const m = {}
      this.participants.forEach(p => {
        m[`${p.type}:${p.id}`] = p.name
      })
      return m
    }
  },

  async mounted() {
    this.competitionId = this.$route.params.id
    if (this.competitionId) {
      await this.loadBracketData()
      await this.loadCompetitionInfo()
    } else {
      this.error = 'Не указан ID турнира в URL'
    }
  },

  watch: {
    '$route.params.id': {
      handler(newId) {
        this.competitionId = newId
        if (this.competitionId) {
          this.loadBracketData()
          this.loadCompetitionInfo()
        }
      }
    }
  },

  methods: {
    async loadCompetitionInfo() {
      if (!this.competitionId) return
      try {
        const competitions = await getCompetitions()
        const competition = competitions.find(c => c.id == this.competitionId)
        this.competitionName = competition?.name || `Турнир #${this.competitionId}`
      } catch (error) {
        console.error('Ошибка загрузки информации о турнире:', error)
      }
    },

    async loadBracketData() {
      if (!this.competitionId) {
        this.bracketData = null
        return
      }
      this.loading = true
      this.error = null
      try {
        const data = await getBracketData(this.competitionId)
        this.bracketData = data
        if (data.categoryNames.length > 0) {
          this.selectedCategory = data.categoryNames[0]
          await this.loadCategoryData(this.selectedCategory)
        }
      } catch (error) {
        console.error('Ошибка загрузки турнирной сетки:', error)
        this.error = 'Не удалось загрузить турнирную сетку'
      } finally {
        this.loading = false
      }
    },

    async selectCategory(category) {
      this.selectedCategory = category
      await this.loadCategoryData(category)
    },

    async loadCategoryData(category) {
      if (!category || !this.competitionId) return
      try {
        const categoryData = await getBracketDataByCategory(this.competitionId, category)
        this.currentCategoryData = categoryData
      } catch (error) {
        console.error('Ошибка загрузки данных категории:', error)
        this.error = `Не удалось загрузить данные для категории "${category}"`
      }
    },

    getName(type, id) {
      return this.participantsMap[`${type}:${id}`] || 'Ожидание'
    },

    getTotalMatchesInCategory(category) {
      if (!this.bracketData?.categories[category]) return 0
      const stages = this.bracketData.categories[category]
      return Object.values(stages).reduce((t, arr) => t + arr.length, 0)
    },

    isWinner(match, side) {
      if (match.status !== 'finished' || !match.winner_participant_id) return false
      return side === 'red'
        ? match.winner_participant_id === match.red_participant_id
        : match.winner_participant_id === match.blue_participant_id
    },

    getParticipantScore(match, side) {
      if (!match.score) return '0'
      if (typeof match.score === 'string' && match.score.includes(':')) {
        const [r, b] = match.score.split(':')
        return side === 'red' ? r : b
      }
      return this.isWinner(match, side) ? match.score : '0'
    },

    getStatusText(status) {
      const map = {
        upcoming: 'Предстоящий',
        in_progress: 'В процессе',
        finished: 'Завершен',
        cancelled: 'Отменен'
      }
      return map[status] || status
    },

    formatDateTime(dt) {
      if (!dt) return ''
      return new Date(dt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getMatchPositionStyle(stageIndex, matchIndex) {
  const baseMargin = 8      // было 20 → стало 8px
  const stageMultiplier = Math.pow(2, stageIndex)
  const marginTop = baseMargin * stageMultiplier * matchIndex
  return { marginTop: `${marginTop}px` }
}
  }
}
</script>



<style scoped>
.bracket-page {
  padding: 15px;
  background: #f5f5f5;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.bracket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.bracket-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.competition-info {
  display: flex;
  align-items: center;
}

.competition-name {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
}

.category-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  padding: 0 15px;
  flex-wrap: wrap;
}

.category-tab {
  padding: 8px 15px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-tab:hover {
  border-color: #3498db;
  color: #3498db;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(52, 152, 219, 0.2);
}

.category-tab.active {
  background: #3498db;
  border-color: #3498db;
  color: white;
  box-shadow: 0 3px 10px rgba(52, 152, 219, 0.3);
}

.match-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 4px;
  border-radius: 8px;
  font-size: 10px;
}

.category-tab.active .match-count {
  background: rgba(255, 255, 255, 0.3);
}

.loading, .no-competition, .no-data {
  text-align: center;
  padding: 30px;
  background: white;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
}

.bracket-container {
  height: calc(100vh - 200px);
  overflow: auto;
  padding: 10px 0;
}

.bracket-tree {
  display: flex;
  gap: 40px;
  min-width: fit-content;
  align-items: flex-start;
  position: relative;
  height: 100%;
}

.stage-column {
  min-width: 200px;
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  position: relative;
  flex-shrink: 0;
}

/* Линии связи между этапами */
.stage-column:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -20px;
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, #3498db, #2980b9);
  z-index: 1;
}

/* Стрелки между этапами */
.stage-column:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 50%;
  right: -26px;
  width: 0;
  height: 0;
  border-left: 6px solid #2980b9;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  z-index: 2;
  transform: translateY(-50%);
}

.stage-title {
  text-align: center;
  margin: 0 0 15px 0;
  padding: 8px;
  background: #3498db;
  color: white;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.matches-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.match-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 10px;
  background: #ffffff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 100px;
}

.match-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3498db, #2980b9);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.match-card:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.match-card:hover::before {
  opacity: 1;
}

.match-card.finished {
  border-color: #28a745;
  background: linear-gradient(135deg, #ffffff 0%, #f8fff9 100%);
}

.match-card.has-winner {
  box-shadow: 0 3px 12px rgba(40, 167, 69, 0.2);
}

.participant {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  margin: 3px 0;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  min-height: 30px;
}

.participant.empty {
  color: #999;
  font-style: italic;
  background: #f8f9fa;
}

.participant.winner {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-color: #28a745;
  color: #155724;
  font-weight: 700;
  position: relative;
  overflow: hidden;
}

.participant.winner::before {
  content: '🏆';
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0.8;
}

.participant.winner .participant-name {
  padding-right: 20px;
}

.participant.winner .score {
  color: #28a745;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.participant-name {
  font-size: 11px;
  flex: 1;
  line-height: 1.2;
}

.score {
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
  margin-left: 8px;
}

.match-separator {
  text-align: center;
  margin: 6px 0;
  position: relative;
}

.vs {
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  color: #7f8c8d;
}

.match-result {
  font-size: 12px;
  font-weight: bold;
  color: #2c3e50;
  margin-top: 3px;
}

.match-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f3f4;
  font-size: 10px;
  color: #666;
}

.match-id {
  font-weight: 600;
}

.match-status {
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
  text-transform: uppercase;
  font-weight: 600;
}

.match-status.upcoming {
  background: #fff3cd;
  color: #856404;
}

.match-status.in_progress {
  background: #cce5ff;
  color: #004085;
}

.match-status.finished {
  background: #d4edda;
  color: #155724;
}

.match-status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.match-time {
  font-size: 9px;
  color: #999;
}

/* Адаптивность */
@media (max-width: 768px) {
  .bracket-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .category-tabs {
    padding: 0 10px;
    gap: 6px;
  }
  
  .category-tab {
    padding: 8px 12px;
    font-size: 12px;
    flex-direction: column;
    gap: 4px;
  }
  
  .bracket-tree {
    gap: 30px;
  }
  
  .stage-column {
    min-width: 220px;
    padding: 15px;
  }
  
  .stage-column:not(:last-child)::after {
    right: -15px;
    width: 30px;
  }
  
  .stage-column:not(:last-child)::before {
    right: -21px;
  }
  
  .participant-name {
    font-size: 12px;
  }
  
  .stage-title {
    font-size: 14px;
    padding: 8px;
  }
  
  .match-card {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .bracket-page {
    padding: 10px;
  }
  
  .category-tabs {
    padding: 0 5px;
    gap: 4px;
  }
  
  .category-tab {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .match-count {
    font-size: 10px;
  }
  
  .bracket-tree {
    gap: 20px;
  }
  
  .stage-column {
    min-width: 180px;
    padding: 10px;
  }
  
  .participant {
    padding: 6px 8px;
  }
  
  .participant-name {
    font-size: 11px;
  }
  
  .score {
    font-size: 14px;
  }
  
  .match-info {
    font-size: 10px;
  }
}
</style>