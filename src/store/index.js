import { createStore } from 'vuex';

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    competition: JSON.parse(localStorage.getItem('competition')) || null,
    teams: JSON.parse(localStorage.getItem('teams')) || [],
    participants: JSON.parse(localStorage.getItem('participants')) || [],
    schedule: JSON.parse(localStorage.getItem('schedule')) || [],
    judges: JSON.parse(localStorage.getItem('judges')) || []
  },

  mutations: {
    // Аутентификация
    setUser(state, user) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout(state) {
      state.user = null;
      state.competition = null;
      state.teams = [];
      state.participants = [];
      state.schedule = [];
      state.judges = [];
      
      // Очищаем localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('competition');
      localStorage.removeItem('teams');
      localStorage.removeItem('participants');
      localStorage.removeItem('schedule');
      localStorage.removeItem('judges');
    },

    // Управление соревнованием
    setCompetition(state, competition) {
      state.competition = competition;
      localStorage.setItem('competition', JSON.stringify(competition));
    },

    // Управление командами
    setTeams(state, teams) {
      state.teams = teams;
      localStorage.setItem('teams', JSON.stringify(teams));
    },
    addTeam(state, team) {
      state.teams.push(team);
      localStorage.setItem('teams', JSON.stringify(state.teams));
    },
    removeTeam(state, index) {
      state.teams.splice(index, 1);
      localStorage.setItem('teams', JSON.stringify(state.teams));
    },

    // Управление участниками
    setParticipants(state, participants) {
      state.participants = participants;
      localStorage.setItem('participants', JSON.stringify(participants));
    },
    addParticipant(state, participant) {
      state.participants.push(participant);
      localStorage.setItem('participants', JSON.stringify(state.participants));
    },
    updateParticipant(state, { index, participant }) {
      state.participants[index] = { ...state.participants[index], ...participant };
      localStorage.setItem('participants', JSON.stringify(state.participants));
    },
    removeParticipant(state, index) {
      state.participants.splice(index, 1);
      localStorage.setItem('participants', JSON.stringify(state.participants));
    },

    // Управление расписанием
    setSchedule(state, schedule) {
      state.schedule = schedule;
      localStorage.setItem('schedule', JSON.stringify(schedule));
    },
    addMatch(state, match) {
      state.schedule.push(match);
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
    },
    updateMatch(state, { index, match }) {
      state.schedule[index] = { ...state.schedule[index], ...match };
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
    },
    removeMatch(state, index) {
      state.schedule.splice(index, 1);
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
    },

    // Управление судьями
    setJudges(state, judges) {
      state.judges = judges;
      localStorage.setItem('judges', JSON.stringify(judges));
    },
    addJudge(state, judge) {
      state.judges.push(judge);
      localStorage.setItem('judges', JSON.stringify(state.judges));
    },
    updateJudge(state, { index, judge }) {
      state.judges[index] = { ...state.judges[index], ...judge };
      localStorage.setItem('judges', JSON.stringify(state.judges));
    },
    removeJudge(state, index) {
      state.judges.splice(index, 1);
      localStorage.setItem('judges', JSON.stringify(state.judges));
    }
  },

  actions: {
    // Асинхронные действия с данными
    async importCompetitionData({ commit }, data) {
      try {
        if (data.competition) commit('setCompetition', data.competition);
        if (data.teams) commit('setTeams', data.teams);
        if (data.participants) commit('setParticipants', data.participants);
        if (data.schedule) commit('setSchedule', data.schedule);
        if (data.judges) commit('setJudges', data.judges);
        return true;
      } catch (error) {
        console.error('Ошибка при импорте данных:', error);
        return false;
      }
    },

    // Сохранение результатов
    async saveResults({ state }) {
      try {
        const results = {
          competition: state.competition,
          schedule: state.schedule,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('competitionResults', JSON.stringify(results));
        return true;
      } catch (error) {
        console.error('Ошибка при сохранении результатов:', error);
        return false;
      }
    }
  },

  getters: {
    isAuthenticated: state => !!state.user,
    userRole: state => state.user ? state.user.role : null,
    competition: state => state.competition,
    teams: state => state.teams,
    participants: state => state.participants,
    schedule: state => state.schedule,
    judges: state => state.judges,
    
    // Дополнительные геттеры для фильтрации и агрегации данных
    participantsByTeam: state => team => {
      return state.participants.filter(p => p.team === team);
    },
    participantsByWeight: state => weight => {
      return state.participants.filter(p => p.weight === weight);
    },
    matchesByStatus: state => status => {
      return state.schedule.filter(m => m.status === status);
    },
    judgesByRole: state => role => {
      return state.judges.filter(j => j.role === role);
    }
  }
});
