import { 
  getMatchesByCompetition as apiGetMatchesByCompetition,
  getCompetitions as apiGetCompetitions,
  putMatch as apiPutMatch
} from './api.js'

// Получить все матчи для турнира
export const getMatchesByCompetition = async (competitionId) => {
  try {
    const result = await apiGetMatchesByCompetition(competitionId)
    return result?.data || result || []
  } catch (error) {
    console.error('Ошибка при получении матчей турнира:', error)
    throw error
  }
}

// Получить список турниров
export const getCompetitions = async () => {
  try {
    const result = await apiGetCompetitions()
    return result?.data || result || []
  } catch (error) {
    console.error('Ошибка при получении турниров:', error)
    throw error
  }
}

// Получить информацию об участнике через прямой API запрос
export const getParticipantInfo = async (participantType, participantId) => {
  try {
    if (participantType === 'user') {
      // Делаем прямой запрос к API для получения пользователя
      const response = await fetch(`/api/users/${participantId}`)
      if (response.ok) {
        const user = await response.json()
        return {
          name: `${user.first_name} ${user.last_name}`.trim(),
          type: 'user',
          id: participantId
        }
      } else {
        // Если пользователь не найден, возвращаем заглушку
        return {
          name: `Участник ${participantId}`,
          type: 'user',
          id: participantId
        }
      }
    } else if (participantType === 'team') {
      // Для команд можем также получить реальные данные
      const response = await fetch(`/api/teams/${participantId}`)
      if (response.ok) {
        const team = await response.json()
        return {
          name: team.name,
          type: 'team', 
          id: participantId
        }
      } else {
        return {
          name: `Команда ${participantId}`,
          type: 'team', 
          id: participantId
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при получении информации об участнике:', error)
    // В случае ошибки возвращаем базовую информацию
    return {
      name: participantType === 'user' ? `Участник ${participantId}` : `Команда ${participantId}`,
      type: participantType,
      id: participantId
    }
  }
}

// Получить матчи для турнирной сетки, сгруппированные по категориям и этапам
export const getBracketData = async (competitionId) => {
  try {
    const matches = await getMatchesByCompetition(competitionId)
    
    if (!Array.isArray(matches)) {
      console.warn('Получены матчи не в виде массива:', matches)
      return {
        categories: {},
        stageOrder: ["1/8 финала", "1/4 финала", "1/2 финала", "финал"],
        categoryNames: []
      }
    }
    
    const categories = {}
    const stageOrder = ["1/8 финала", "1/4 финала", "1/2 финала", "финал"]
    
    matches.forEach(match => {
      const category = match.category || "Без категории"
      const stage = match.stage || "1/8 финала"
      
      if (!categories[category]) {
        categories[category] = {}
        stageOrder.forEach(s => {
          categories[category][s] = []
        })
      }
      
      if (categories[category][stage]) {
        categories[category][stage].push(match)
      }
    })
    
    return {
      categories,
      stageOrder,
      categoryNames: Object.keys(categories).sort()
    }
  } catch (error) {
    console.error('Ошибка при получении данных турнирной сетки:', error)
    throw error
  }
}

// Получить матчи для конкретной категории
export const getBracketDataByCategory = async (competitionId, category) => {
  try {
    const matches = await getMatchesByCompetition(competitionId)
    
    if (!Array.isArray(matches)) {
      console.warn('Получены матчи не в виде массива:', matches)
      return {
        stages: {},
        stageOrder: ["1/8 финала", "1/4 финала", "1/2 финала", "финал"]
      }
    }
    
    const categoryMatches = matches.filter(match => match.category === category)
    const stages = {}
    const stageOrder = ["1/8 финала", "1/4 финала", "1/2 финала", "финал"]
    
    stageOrder.forEach(stage => {
      stages[stage] = []
    })
    
    categoryMatches.forEach(match => {
      const stage = match.stage || "1/8 финала"
      if (stages[stage]) {
        stages[stage].push(match)
      }
    })
    
    return {
      stages,
      stageOrder
    }
  } catch (error) {
    console.error('Ошибка при получении данных турнирной сетки по категории:', error)
    throw error
  }
}

// Получить расширенную информацию о матче с именами участников
export const getMatchWithParticipants = async (match) => {
  try {
    const redParticipant = await getParticipantInfo(
      match.red_participant_type, 
      match.red_participant_id
    )
    
    let blueParticipant = null
    if (match.blue_participant_id) {
      blueParticipant = await getParticipantInfo(
        match.blue_participant_type,
        match.blue_participant_id
      )
    }
    
    return {
      ...match,
      red_participant: redParticipant,
      blue_participant: blueParticipant
    }
  } catch (error) {
    console.error('Ошибка при получении участников матча:', error)
    return match
  }
}

// Обновить результат матча
export const updateMatch = async (matchId, updateData) => {
  try {
    const result = await apiPutMatch(matchId, updateData)
    return result?.data || result
  } catch (error) {
    console.error('Ошибка при обновлении матча:', error)
    throw error
  }
}