// src/store/index.js
import { createStore } from 'vuex';
import api from '@/api';
import { getApprovedApplications, createMatchesBatch, getMatchesByCompetition } from '@/api';

export default createStore({
  state: {
    // Пользователь
    user: JSON.parse(localStorage.getItem('user')) || null,

    // Текущие данные соревнования
    competition: JSON.parse(localStorage.getItem('competition')) || null,
    teams:       JSON.parse(localStorage.getItem('teams'))       || [],
    participants:JSON.parse(localStorage.getItem('participants'))|| [],
    judges:      JSON.parse(localStorage.getItem('judges'))      || [],

    // Расписание матчей
    schedule:    JSON.parse(localStorage.getItem('schedule'))    || [],

    // Заявки на участие (новое)
    applications: [],

    // Результаты турнира и состояние сетки
    tournamentResults: JSON.parse(localStorage.getItem('tournamentResults')) || [],
    bracketState:      JSON.parse(localStorage.getItem('bracketState'))      || null,

    // Для справочника пользователей
    users:   [],
    loading: false,
    error:   null,
  },

  mutations: {
    // --- Аутентификация ---
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
      state.applications = [];

      Object.keys(localStorage).forEach(key => {
        if (key !== 'registeredUsers') {
          localStorage.removeItem(key);
        }
      });
    },

    // --- Заявки ---
    setApplications(state, apps) {
      state.applications = apps;
    },

    // --- Соревнование ---
    setCompetition(state, competition) {
      state.competition = competition;
      localStorage.setItem('competition', JSON.stringify(competition));
    },

    // --- Команды ---
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

    // --- Участники ---
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

    // --- Расписание матчей ---
    setSchedule(state, schedule) {
      state.schedule = schedule;
      localStorage.setItem('schedule', JSON.stringify(schedule));
    },
    addMatch(state, match) {
      state.schedule.push(match);
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
    },
    updateMatch(state, { index, match }) {
      if (index >= 0 && index < state.schedule.length) {
        // Мержим новое в старое
        state.schedule[index] = { 
          ...state.schedule[index], 
          ...match 
        };
        localStorage.setItem('schedule', JSON.stringify(state.schedule));
      }
    },
    removeMatch(state, index) {
      state.schedule.splice(index, 1);
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
    },

    // --- Судьи ---
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

    // --- Пользователи справочника ---
    SET_USERS(state, users) {
      state.users = users;
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },

    // --- Результаты турнира и сетка ---
    SET_TOURNAMENT_RESULTS(state, results) {
      state.tournamentResults = results;
      localStorage.setItem('tournamentResults', JSON.stringify(results));
    },
    setBracketState(state, bracketState) {
      state.bracketState = JSON.parse(JSON.stringify(bracketState));
      localStorage.setItem('bracketState', JSON.stringify(state.bracketState));
    },
    clearSchedule(state) {
      state.schedule = [];
      localStorage.removeItem('schedule');
    },
    clearTournamentResults(state) {
      state.tournamentResults = [];
      localStorage.removeItem('tournamentResults');
    },
  },

  actions: {
    // Импортирование пачки данных
    async importCompetitionData({ commit }, data) {
      if (data.competition) commit('setCompetition', data.competition);
      if (data.teams)       commit('setTeams', data.teams);
      if (data.participants)commit('setParticipants', data.participants);
      if (data.schedule)    commit('setSchedule', data.schedule);
      if (data.judges)      commit('setJudges', data.judges);
      return true;
    },
     
    // --- Загрузка и сохранение заявок и расписания ---
    async loadApprovedApplications({ commit }, competitionId) {
      // GET /applications?competition_id=…
      const { data } = await getApprovedApplications(competitionId);
      commit('setApplications', data);
    },

     
async loadScheduleFromServer({ commit }, competitionId) {
      // GET /matches?competition_id=…
      const { data } = await getMatchesByCompetition(competitionId);
      commit('setSchedule', data);
    },


   async saveScheduleToServer({ state, commit }, competitionId) {
  const matches = state.schedule.map(m => ({
    red_id:      m.red_id ?? null,
    blue_id:     m.blue_id ?? null,
    competition_id: m.competition_id ?? state.competition?.id ?? null,
    judge_id:    m.judge_id ?? null,
    referee_id:  m.referee_id ?? null,
    match_time:  m.time && m.time.length === 5
                  ? new Date(`2025-05-19T${m.time}:00`).toISOString()
                  : null,
    score:       m.points ?? null,
    comment:     m.note ?? null,
    winner_id:   m.result === m.fighter1 ? m.red_user_id
               : m.result === m.fighter2 ? m.blue_user_id
               : null
  }));

  const { data } = await createMatchesBatch(matches);
  commit('setSchedule', data);
}, // --- Сохранение результатов турнира в localStorage ---
    async saveResults({ state }) {
      const results = {
        competition: state.competition,
        schedule:    state.schedule,
        timestamp:   new Date().toISOString()
      };
      localStorage.setItem('competitionResults', JSON.stringify(results));
      return true;
    },

    // --- CRUD для справочника пользователей ---
    async fetchUsers({ commit }) {
      commit('SET_LOADING', true);
      try {
        const users = await api.getUsers();
        commit('SET_USERS', users);
        commit('SET_ERROR', null);
      } catch (e) {
        commit('SET_ERROR', e.message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async createUser({ dispatch }, userData) {
      await api.createUser(userData);
      await dispatch('fetchUsers');
    },
    async updateUser({ dispatch }, { id, userData }) {
      await api.updateUser(id, userData);
      await dispatch('fetchUsers');
    },
    async deleteUser({ dispatch }, id) {
      await api.deleteUser(id);
      await dispatch('fetchUsers');
    },

    // --- Сохранение результатов внутри Vuex ---
    async saveTournamentResults({ commit, state }, results) {
      const arr = [...state.tournamentResults, results];
      commit('SET_TOURNAMENT_RESULTS', arr);
      return true;
    },

    clearAllData({ commit }) {
      commit('clearSchedule');
      commit('clearTournamentResults');
    },
  },

  getters: {
    isAuthenticated: state => !!state.user,
    userRole: state => {
      if (!state.user) return null;
      switch (state.user.role_id) {
        case 1: return 'organizer';
        case 2: return 'coach';
        case 3: return 'participant';
        default: return null;
      }
    },
    competition:       state => state.competition,
    teams:             state => state.teams,
    participants:      state => state.participants,
    schedule:          state => state.schedule,
    judges:            state => state.judges,
    applications:      state => state.applications,
    users:             state => state.users,
    isLoading:         state => state.loading,
    getError:          state => state.error,
    getTournamentResults: state => state.tournamentResults,

    // Вспомогательные геттеры
    participantsByTeam:   state => team   => state.participants.filter(p => p.team === team),
    participantsByWeight: state => weight => state.participants.filter(p => p.weight === weight),
    matchesByStatus:      state => status => state.schedule.filter(m => m.status === status),
    judgesByRole:         state => role   => state.judges.filter(j => j.role === role),
  }
});
