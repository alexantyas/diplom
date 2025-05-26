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
                  {{ match.red_participant?.name || 'Ожидание' }}
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
                  {{ match.blue_participant?.name || 'Ожидание' }}
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
import { getBracketData, getBracketDataByCategory, getMatchWithParticipants, getCompetitions } from '../store/bracket.js'

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
  
  async mounted() {
    // Получаем ID турнира из URL
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
      },
      immediate: false
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
        
        // Автоматически выбираем первую категорию
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
        
        // Загружаем информацию об участниках для каждого матча в категории
        for (const stage of categoryData.stageOrder) {
          for (let i = 0; i < categoryData.stages[stage].length; i++) {
            // getMatchWithParticipants теперь синхронная функция, но оставим await для совместимости
            categoryData.stages[stage][i] = await getMatchWithParticipants(categoryData.stages[stage][i])
          }
        }
        
        this.currentCategoryData = categoryData
      } catch (error) {
        console.error('Ошибка загрузки данных категории:', error)
        this.error = `Не удалось загрузить данные для категории "${category}"`
      }
    },

    getTotalMatchesInCategory(category) {
      if (!this.bracketData?.categories[category]) return 0
      
      const stages = this.bracketData.categories[category]
      return Object.values(stages).reduce((total, matches) => total + matches.length, 0)
    },

    isWinner(match, side) {
      if (match.status !== 'finished' || !match.winner_participant_id) {
        return false
      }
      
      if (side === 'red') {
        return match.winner_participant_id === match.red_participant_id
      } else {
        return match.winner_participant_id === match.blue_participant_id
      }
    },

    getParticipantScore(match, side) {
      if (!match.score) return '0'
      
      // Предполагаем формат счета "3:2" или просто число для победителя
      if (typeof match.score === 'string' && match.score.includes(':')) {
        const scores = match.score.split(':')
        return side === 'red' ? scores[0] : scores[1]
      }
      
      // Если это просто число очков для победителя
      if (this.isWinner(match, side)) {
        return match.score
      }
      
      return '0'
    },

    getStatusText(status) {
      const statusMap = {
        'upcoming': 'Предстоящий',
        'in_progress': 'В процессе', 
        'finished': 'Завершен',
        'cancelled': 'Отменен'
      }
      return statusMap[status] || status
    },

    formatDateTime(dateTime) {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getMatchPositionStyle(stageIndex, matchIndex) {
      // Добавляем дополнительные отступы для лучшего визуального распределения
      const baseMargin = 20
      const stageMultiplier = Math.pow(2, stageIndex)
      const marginTop = baseMargin * stageMultiplier * matchIndex
      
      return {
        marginTop: `${marginTop}px`
      }
    }
  }
}
</script>



<style scoped>
.bracket-page {
  padding: 10px;
  background: #1a1a1a;
  color: #ffffff;
  height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.bracket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 15px;
  background: #2c2c2c;
  border-radius: 4px;
  border: 1px solid #404040;
}

.bracket-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 16px;
  font-weight: 300;
}

.competition-info {
  display: flex;
  align-items: center;
}

.competition-name {
  padding: 4px 8px;
  background: #007acc;
  color: white;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 400;
}

.category-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
  padding: 0 10px;
  flex-wrap: wrap;
}

.category-tab {
  padding: 6px 12px;
  border: 1px solid #404040;
  border-radius: 3px;
  background: #2c2c2c;
  color: #cccccc;
  font-size: 11px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.category-tab:hover {
  border-color: #007acc;
  color: #ffffff;
  background: #333333;
}

.category-tab.active {
  background: #007acc;
  border-color: #007acc;
  color: white;
}

.match-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
  font-weight: 500;
}

.loading, .no-competition, .no-data {
  text-align: center;
  padding: 20px;
  background: #2c2c2c;
  border-radius: 4px;
  color: #cccccc;
  font-size: 13px;
  border: 1px solid #404040;
}

.bracket-container {
  height: calc(100vh - 90px);
  overflow: hidden;
  padding: 0;
}

.bracket-tree {
  display: flex;
  gap: 40px;
  min-width: fit-content;
  align-items: flex-start;
  position: relative;
  padding: 10px;
  height: 100%;
}

.stage-column {
  min-width: 140px;
  position: relative;
  flex-shrink: 0;
}

/* Линии соединения */
.stage-column:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -20px;
  width: 40px;
  height: 1px;
  background: #404040;
  z-index: 1;
}

.stage-title {
  text-align: center;
  margin: 0 0 15px 0;
  padding: 8px 4px;
  background: transparent;
  color: #ffffff;
  border-bottom: 2px solid #007acc;
  font-size: 12px;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.matches-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-card {
  background: transparent;
  border: none;
  padding: 0;
  position: relative;
}

.participant {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  margin: 1px 0;
  background: #2c2c2c;
  border: 1px solid #404040;
  color: #cccccc;
  transition: all 0.3s ease;
  position: relative;
  font-size: 11px;
  min-height: 24px;
}

.participant:first-child {
  border-bottom: none;
  border-radius: 3px 3px 0 0;
}

.participant:last-child {
  border-top: none;
  border-radius: 0 0 3px 3px;
}

.participant.empty {
  color: #666666;
  font-style: italic;
  background: #1f1f1f;
}

.participant.winner {
  background: #007acc;
  color: #ffffff;
  border-color: #007acc;
  font-weight: 500;
}

.participant.winner::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #00ff88;
}

.participant-name {
  flex: 1;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.score {
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  min-width: 20px;
  text-align: right;
}

.participant.winner .score {
  color: #ffffff;
  font-weight: 600;
}

.match-separator {
  display: none;
}

.vs {
  display: none;
}

.match-result {
  display: none;
}

.match-info {
  position: absolute;
  bottom: -15px;
  left: 0;
  font-size: 8px;
  color: #666666;
}

.match-id {
  color: #666666;
}

.match-status {
  display: none;
}

.match-time {
  display: none;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .bracket-tree {
    gap: 30px;
  }
  
  .stage-column {
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .bracket-page {
    padding: 5px;
  }
  
  .bracket-header {
    flex-direction: column;
    gap: 5px;
    padding: 6px 10px;
  }
  
  .bracket-header h2 {
    font-size: 14px;
  }
  
  .category-tabs {
    padding: 0 5px;
    gap: 3px;
    margin-bottom: 10px;
  }
  
  .category-tab {
    padding: 4px 8px;
    font-size: 10px;
  }
  
  .bracket-container {
    height: calc(100vh - 80px);
  }
  
  .bracket-tree {
    gap: 25px;
    padding: 5px;
  }
  
  .stage-column {
    min-width: 100px;
  }
  
  .stage-column:not(:last-child)::after {
    right: -12px;
    width: 25px;
  }
  
  .stage-title {
    font-size: 10px;
    padding: 6px 2px;
    margin-bottom: 10px;
  }
  
  .matches-container {
    gap: 8px;
  }
  
  .participant {
    padding: 4px 6px;
    font-size: 10px;
    min-height: 20px;
  }
  
  .participant-name {
    max-width: 70px;
  }
  
  .score {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .bracket-tree {
    gap: 20px;
  }
  
  .stage-column {
    min-width: 80px;
  }
  
  .stage-column:not(:last-child)::after {
    right: -10px;
    width: 20px;
  }
  
  .participant {
    padding: 3px 4px;
    font-size: 9px;
    min-height: 18px;
  }
  
  .participant-name {
    max-width: 50px;
  }
  
  .score {
    font-size: 10px;
  }
  
  .stage-title {
    font-size: 9px;
  }
}

/* Адаптивность */
@media (max-width: 1200px) {
  .bracket-tree {
    gap: 20px;
  }
  
  .stage-column {
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .bracket-page {
    padding: 5px;
  }
  
  .bracket-header {
    flex-direction: column;
    gap: 8px;
    padding: 8px 10px;
  }
  
  .bracket-header h2 {
    font-size: 16px;
  }
  
  .category-tabs {
    padding: 0 5px;
    gap: 3px;
  }
  
  .category-tab {
    padding: 4px 8px;
    font-size: 10px;
    flex-direction: column;
    gap: 2px;
  }
  
  .bracket-container {
    height: calc(100vh - 100px);
  }
  
  .bracket-tree {
    gap: 15px;
    padding: 5px;
  }
  
  .stage-column {
    min-width: 120px;
    padding: 6px;
  }
  
  .stage-column:not(:last-child)::after {
    right: -8px;
    width: 15px;
  }
  
  .stage-column:not(:last-child)::before {
    right: -11px;
    border-left-width: 3px;
    border-top-width: 2px;
    border-bottom-width: 2px;
  }
  
  .stage-title {
    font-size: 8px;
    padding: 3px;
  }
  
  .match-card {
    padding: 4px;
    min-height: 45px;
  }
  
  .participant {
    padding: 2px 3px;
    min-height: 16px;
    font-size: 8px;
  }
  
  .participant-name {
    font-size: 8px;
  }
  
  .score {
    font-size: 9px;
  }
  
  .vs {
    font-size: 6px;
    padding: 1px 2px;
  }
  
  .match-info {
    font-size: 6px;
    margin-top: 2px;
    padding-top: 2px;
  }
  
  .match-status {
    font-size: 5px;
  }
}

@media (max-width: 480px) {
  .bracket-tree {
    gap: 10px;
  }
  
  .stage-column {
    min-width: 100px;
    padding: 4px;
  }
  
  .match-card {
    min-height: 40px;
    padding: 3px;
  }
  
  .participant {
    min-height: 14px;
    font-size: 7px;
    padding: 1px 2px;
  }
  
  .participant-name {
    font-size: 7px;
  }
  
  .score {
    font-size: 8px;
  }
}

/* Улучшения для широких экранов */
@media (min-width: 1400px) {
  .bracket-tree {
    gap: 30px;
    justify-content: center;
  }
  
  .stage-column {
    min-width: 180px;
  }
  
  .match-card {
    min-height: 70px;
  }
  
  .participant {
    font-size: 10px;
    min-height: 22px;
  }
}
</style>