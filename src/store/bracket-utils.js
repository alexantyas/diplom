// Утилиты для работы с турнирной сеткой

// Порядок этапов турнира
export const STAGE_ORDER = ["1/8", "1/4", "1/2", "финал", "3 место"]

// Определение количества участников на каждом этапе
export const STAGE_PARTICIPANTS = {
  "1/8": 16,
  "1/4": 8, 
  "1/2": 4,
  "финал": 2
}

// Статусы матчей
export const MATCH_STATUS = {
  UPCOMING: 'upcoming',
  IN_PROGRESS: 'in_progress', 
  FINISHED: 'finished',
  CANCELLED: 'cancelled'
}

// Типы участников
export const PARTICIPANT_TYPES = {
  USER: 'user',
  TEAM: 'team'
}

/**
 * Получить следующий этап турнира
 * @param {string} currentStage - текущий этап
 * @returns {string|null} - следующий этап или null если это финал
 */
export function getNextStage(currentStage) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null
  }
  return STAGE_ORDER[currentIndex + 1]
}

/**
 * Получить предыдущий этап турнира
 * @param {string} currentStage - текущий этап
 * @returns {string|null} - предыдущий этап или null если это первый этап
 */
export function getPreviousStage(currentStage) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex <= 0) {
    return null
  }
  return STAGE_ORDER[currentIndex - 1]
}

/**
 * Проверить, является ли участник победителем в матче
 * @param {Object} match - объект матча
 * @param {string} participantType - тип участника ('red' или 'blue')
 * @returns {boolean} - true если участник победил
 */
export function isParticipantWinner(match, participantType) {
  if (match.status !== MATCH_STATUS.FINISHED || !match.winner_participant_id) {
    return false
  }
  
  const participantId = participantType === 'red' 
    ? match.red_participant_id 
    : match.blue_participant_id
    
  return match.winner_participant_id === participantId
}

/**
 * Получить очки участника из счета матча
 * @param {Object} match - объект матча
 * @param {string} participantType - тип участника ('red' или 'blue')
 * @returns {string} - очки участника
 */
export function getParticipantScore(match, participantType) {
  if (!match.score) return '0'
  
  // Формат счета "3:2"
  if (typeof match.score === 'string' && match.score.includes(':')) {
    const scores = match.score.split(':')
    return participantType === 'red' ? scores[0] : scores[1]
  }
  
  // Если это просто число очков для победителя
  if (isParticipantWinner(match, participantType)) {
    return match.score.toString()
  }
  
  return '0'
}

/**
 * Отформатировать имя участника
 * @param {Object} participant - объект участника
 * @returns {string} - отформатированное имя
 */
export function formatParticipantName(participant) {
  if (!participant) return 'Ожидание'
  
  if (participant.type === PARTICIPANT_TYPES.USER) {
    return `${participant.first_name} ${participant.last_name}`
  } else if (participant.type === PARTICIPANT_TYPES.TEAM) {
    return participant.name
  }
  
  return participant.name || 'Неизвестно'
}

/**
 * Получить цвет для статуса матча
 * @param {string} status - статус матча
 * @returns {string} - CSS класс для цвета
 */
export function getStatusColor(status) {
  switch (status) {
    case MATCH_STATUS.UPCOMING:
      return 'warning'
    case MATCH_STATUS.IN_PROGRESS:
      return 'info'
    case MATCH_STATUS.FINISHED:
      return 'success'
    case MATCH_STATUS.CANCELLED:
      return 'danger'
    default:
      return 'secondary'
  }
}

/**
 * Получить текст для статуса матча
 * @param {string} status - статус матча
 * @returns {string} - текст статуса на русском
 */
export function getStatusText(status) {
  const statusMap = {
    [MATCH_STATUS.UPCOMING]: 'Предстоящий',
    [MATCH_STATUS.IN_PROGRESS]: 'В процессе',
    [MATCH_STATUS.FINISHED]: 'Завершен',
    [MATCH_STATUS.CANCELLED]: 'Отменен'
  }
  return statusMap[status] || status
}

/**
 * Проверить, может ли матч быть начат
 * @param {Object} match - объект матча
 * @returns {boolean} - true если матч может быть начат
 */
export function canStartMatch(match) {
  return match.status === MATCH_STATUS.UPCOMING && 
         match.red_participant_id && 
         match.blue_participant_id
}

/**
 * Проверить, может ли матч быть завершен
 * @param {Object} match - объект матча
 * @returns {boolean} - true если матч может быть завершен
 */
export function canFinishMatch(match) {
  return match.status === MATCH_STATUS.IN_PROGRESS
}

/**
 * Сгруппировать матчи по этапам
 * @param {Array} matches - массив матчей
 * @returns {Object} - объект с матчами, сгруппированными по этапам
 */
export function groupMatchesByStage(matches) {
  const grouped = {}
  
  // Инициализируем этапы
  STAGE_ORDER.forEach(stage => {
    grouped[stage] = []
  })
  
  // Группируем матчи
  matches.forEach(match => {
    const stage = match.stage || STAGE_ORDER[0]
    if (grouped[stage]) {
      grouped[stage].push(match)
    }
  })
  
  return grouped
}

/**
 * Сгруппировать матчи по категориям, затем по этапам
 * @param {Array} matches - массив матчей
 * @returns {Object} - объект с матчами, сгруппированными по категориям и этапам
 */
export function groupMatchesByCategory(matches) {
  const categories = {}
  
  // Группируем матчи по категориям
  matches.forEach(match => {
    const category = match.category || "Без категории"
    
    if (!categories[category]) {
      categories[category] = {}
      // Инициализируем этапы для каждой категории
      STAGE_ORDER.forEach(stage => {
        categories[category][stage] = []
      })
    }
    
    const stage = match.stage || STAGE_ORDER[0]
    if (categories[category][stage]) {
      categories[category][stage].push(match)
    }
  })
  
  return categories
}

/**
 * Получить список всех категорий из матчей
 * @param {Array} matches - массив матчей
 * @returns {Array} - отсортированный массив названий категорий
 */
export function getCategoriesFromMatches(matches) {
  const categories = new Set()
  
  matches.forEach(match => {
    const category = match.category || "Без категории"
    categories.add(category)
  })
  
  return Array.from(categories).sort()
}

/**
 * Получить общее количество матчей в категории
 * @param {Object} categoryData - данные категории (объект с этапами)
 * @returns {number} - общее количество матчей
 */
export function getTotalMatchesInCategory(categoryData) {
  if (!categoryData) return 0
  
  return Object.values(categoryData).reduce((total, matches) => {
    return total + (Array.isArray(matches) ? matches.length : 0)
  }, 0)
}

/**
 * Проверить, есть ли активные матчи в категории
 * @param {Object} categoryData - данные категории
 * @returns {boolean} - true если есть незавершенные матчи
 */
export function hasActiveMatchesInCategory(categoryData) {
  if (!categoryData) return false
  
  const allMatches = Object.values(categoryData).flat()
  return allMatches.some(match => 
    match.status === MATCH_STATUS.UPCOMING || 
    match.status === MATCH_STATUS.IN_PROGRESS
  )
}

/**
 * Получить статистику по категории
 * @param {Object} categoryData - данные категории
 * @returns {Object} - объект со статистикой
 */
export function getCategoryStats(categoryData) {
  if (!categoryData) {
    return {
      total: 0,
      finished: 0,
      upcoming: 0,
      inProgress: 0,
      cancelled: 0
    }
  }
  
  const allMatches = Object.values(categoryData).flat()
  
  return {
    total: allMatches.length,
    finished: allMatches.filter(m => m.status === MATCH_STATUS.FINISHED).length,
    upcoming: allMatches.filter(m => m.status === MATCH_STATUS.UPCOMING).length,
    inProgress: allMatches.filter(m => m.status === MATCH_STATUS.IN_PROGRESS).length,
    cancelled: allMatches.filter(m => m.status === MATCH_STATUS.CANCELLED).length
  }
}

/**
 * Получить позицию матча для визуального отображения
 * @param {number} stageIndex - индекс этапа
 * @param {number} matchIndex - индекс матча в этапе
 * @returns {Object} - стили для позиционирования
 */
export function getMatchPosition(stageIndex, matchIndex) {
  const baseMargin = 20
  const stageMultiplier = Math.pow(2, stageIndex)
  const marginTop = baseMargin * stageMultiplier * matchIndex
  
  return {
    marginTop: `${marginTop}px`,
    position: 'relative'
  }
}

/**
 * Валидация данных матча
 * @param {Object} match - объект матча
 * @returns {Object} - результат валидации
 */
export function validateMatch(match) {
  const errors = []
  
  if (!match.red_participant_id) {
    errors.push('Отсутствует красный участник')
  }
  
  if (!match.blue_participant_id) {
    errors.push('Отсутствует синий участник')
  }
  
  if (!match.competition_id) {
    errors.push('Отсутствует ID турнира')
  }
  
  if (!match.category) {
    errors.push('Отсутствует категория')
  }
  
  if (match.status === MATCH_STATUS.FINISHED && !match.winner_participant_id) {
    errors.push('Для завершенного матча должен быть указан победитель')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Создать пустой матч для следующего этапа
 * @param {Object} baseMatch - базовый матч для копирования данных
 * @param {string} nextStage - следующий этап
 * @returns {Object} - новый матч
 */
export function createEmptyMatch(baseMatch, nextStage) {
  return {
    competition_id: baseMatch.competition_id,
    category: baseMatch.category,
    stage: nextStage,
    status: MATCH_STATUS.UPCOMING,
    red_participant_type: null,
    red_participant_id: null,
    blue_participant_type: null,
    blue_participant_id: null,
    winner_participant_type: null,
    winner_participant_id: null,
    score: null,
    match_time: null,
    referee_id: null,
    judge_id: null,
    comment: null
  }
}