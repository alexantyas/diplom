import { createStore } from 'vuex';
import { api } from '../mocks/api';

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    competition: JSON.parse(localStorage.getItem('competition')) || null,
    teams: JSON.parse(localStorage.getItem('teams')) || [],
    participants: JSON.parse(localStorage.getItem('participants')) || [],
    schedule: JSON.parse(localStorage.getItem('schedule')) || [],
    judges: JSON.parse(localStorage.getItem('judges')) || [],
    users: [],
    loading: false,
    error: null,
    tournamentResults: JSON.parse(localStorage.getItem('tournamentResults')) || [],
    bracketState: JSON.parse(localStorage.getItem('bracketState')) || null
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
  state.tournamentResults = [];
  state.bracketState = null;

  // Удаляем все ключи, кроме registeredUsers
  Object.keys(localStorage).forEach(key => {
    if (key !== 'registeredUsers') {
      localStorage.removeItem(key);
    }
  });
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
      console.log('Сохранение расписания в хранилище:', schedule);
      state.schedule = schedule;
      localStorage.setItem('schedule', JSON.stringify(schedule));
      console.log('Расписание после сохранения:', state.schedule);
    },
    addMatch(state, match) {
      console.log('Добавление матча в расписание:', match);
      state.schedule.push(match);
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
      console.log('Расписание после добавления матча:', state.schedule);
    },
    updateMatch(state, { index, match }) {
      console.log('Обновление матча:', { index, match });
      if (index >= 0 && index < state.schedule.length) {
        // Проверяем наличие всех необходимых полей
        const updatedMatch = {
          ...state.schedule[index], // Сначала берем все существующие поля
          ...match, // Затем применяем новые значения
          // Явно указываем важные поля, предпочитая новые значения, но сохраняя старые если новых нет
          category: match.category || state.schedule[index].category,
          fighter1: match.fighter1 || state.schedule[index].fighter1,
          fighter2: match.fighter2 || state.schedule[index].fighter2,
          stage: match.stage || state.schedule[index].stage,
          status: match.status || state.schedule[index].status,
          result: match.result || state.schedule[index].result,
          points: match.points || state.schedule[index].points,
          points1: match.points1 || state.schedule[index].points1,
          points2: match.points2 || state.schedule[index].points2
        };
        
        console.log('Обновленный матч перед сохранением:', updatedMatch);
        state.schedule[index] = updatedMatch;
        console.log('Матч после обновления:', state.schedule[index]);
      }
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
      console.log('Все расписание после обновления:', state.schedule);
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
    },

    SET_USERS(state, users) {
      state.users = users;
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_TOURNAMENT_RESULTS(state, results) {
      state.tournamentResults = results;
      localStorage.setItem('tournamentResults', JSON.stringify(results));
    },
    setBracketState(state, bracketState) {
      // Создаем глубокую копию состояния перед сохранением
      const stateToSave = JSON.parse(JSON.stringify(bracketState));
      state.bracketState = stateToSave;
      localStorage.setItem('bracketState', JSON.stringify(stateToSave));
    },
    clearSchedule(state) {
      state.schedule = [];
    },
    clearTournamentResults(state) {
      state.tournamentResults = [];
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
    },

    async fetchUsers({ commit }) {
      commit('SET_LOADING', true);
      try {
        const users = await api.getUsers();
        commit('SET_USERS', users);
        commit('SET_ERROR', null);
      } catch (error) {
        commit('SET_ERROR', error.message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async createUser({ dispatch }, userData) {
      try {
        await api.createUser(userData);
        await dispatch('fetchUsers');
      } catch (error) {
        throw error;
      }
    },
    
    async updateUser({ dispatch }, { id, userData }) {
      try {
        await api.updateUser(id, userData);
        await dispatch('fetchUsers');
      } catch (error) {
        throw error;
      }
    },
    
    async deleteUser({ dispatch }, id) {
      try {
        await api.deleteUser(id);
        await dispatch('fetchUsers');
      } catch (error) {
        throw error;
      }
    },

    async saveTournamentResults({ commit, state }, results) {
      try {
        state.tournamentResults.push(results);
        commit('SET_TOURNAMENT_RESULTS', state.tournamentResults);
        return true;
      } catch (error) {
        console.error('Ошибка при сохранении результатов турнира:', error);
        return false;
      }
    },

    clearAllData({ commit }) {
      commit('clearSchedule');
      commit('clearTournamentResults');
    }
  },

  getters: {
    isAuthenticated: state => !!state.user,
    userRole: state => {
  if (!state.user) return null;
  if (state.user.role_id === 1) return 'organizer';
  if (state.user.role_id === 2) return 'coach';
  if (state.user.role_id === 3) return 'participant';
  
  return null;
},
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
    },
    getUsers: state => state.users,
    isLoading: state => state.loading,
    getError: state => state.error,
    getTournamentResults: state => state.tournamentResults
  }
});
