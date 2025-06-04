// src/store/index.js
import { createStore } from 'vuex';
import api from '@/api';
import { getApprovedApplications, getMatchesByCompetition } from '@/api';
import { patchMatch, getBracket, postBracketResults } from '@/api';
import * as matchService from '@/api/matchService';
export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    competition: JSON.parse(localStorage.getItem('competition')) || null,
    teams: [],
    participants: [],
    judges: [],
    schedule: [],
    applications: [],
    users: [],
    loading: false,
    error: null,
    tournamentResults: [],
    bracketState: null,
  },

  mutations: {
    // --- Только критичные данные сохраняем в localStorage ---
    setUser(state, user) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    setCompetition(state, competition) {
      state.competition = competition;
      localStorage.setItem('competition', JSON.stringify(competition));
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

    // --- Управление справочными данными (без localStorage) ---
    setTeams(state, teams) {
      state.teams = teams;
    },
    addTeam(state, team) {
      state.teams.push(team);
    },
    removeTeam(state, index) {
      state.teams.splice(index, 1);
    },
    setParticipants(state, participants) {
      state.participants = participants;
    },
    addParticipant(state, participant) {
      state.participants.push(participant);
    },
    updateParticipant(state, { index, participant }) {
      state.participants[index] = { ...state.participants[index], ...participant };
    },
    removeParticipant(state, index) {
      state.participants.splice(index, 1);
    },
    setJudges(state, judges) {
      state.judges = judges;
    },
    addJudge(state, judge) {
      state.judges.push(judge);
    },
    updateJudge(state, { index, judge }) {
      state.judges[index] = { ...state.judges[index], ...judge };
    },
    removeJudge(state, index) {
      state.judges.splice(index, 1);
    },

    // --- Обновление расписания и сетки только после загрузки с backend ---
    setSchedule(state, schedule) {
  state.schedule = schedule.map(m => ({
    ...m,
    points: m.score,
    note: m.comment,
    time: m.match_time,
    judge: state.judges.find(j => j.id === m.judge_id)?.name || '',
    referee: state.judges.find(j => j.id === m.referee_id)?.name || '',
    tatami: m.tatami || ''
  }));
},
    setBracketState(state, bracketState) {
      state.bracketState = bracketState;
    },
    setApplications(state, apps) {
      state.applications = apps;
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
    },
    clearSchedule(state) {
      state.schedule = [];
    },
    clearTournamentResults(state) {
      state.tournamentResults = [];
    },
  },

  actions: {
    // --- Импорт/инициализация всех данных по турниру (только через backend) ---
    async importCompetitionData({ commit }, data) {
      if (data.competition) commit('setCompetition', data.competition);
      if (data.teams) commit('setTeams', data.teams);
      if (data.participants) commit('setParticipants', data.participants);
      if (data.schedule) commit('setSchedule', data.schedule);
      if (data.judges) commit('setJudges', data.judges);
      return true;
    },

    async initTournamentState({ commit, dispatch }, competitionId) {
      commit('SET_LOADING', true);
      try {
        // 1. Грузим соревнование (и опционально заявки)
        const { data: competitions } = await api.getCompetitions();
        const competition = competitions.find(c => c.id === competitionId);
        commit('setCompetition', competition);

        await dispatch('loadApprovedApplications', competitionId);
        // 2. Грузим расписание и сетку
        await dispatch('loadSchedule', competitionId);
        await dispatch('loadBracket', competitionId);
        commit('SET_LOADING', false);
      } catch (error) {
        commit('SET_ERROR', error.message || 'Ошибка инициализации турнира');
        commit('SET_LOADING', false);
      }
    },

    async loadApprovedApplications({ commit }, competitionId) {
      if (!competitionId) throw new Error('Competition ID is missing');
      const { data } = await getApprovedApplications(competitionId);
      commit('setApplications', data);

      let participants = [];
      for (const app of data) {
        if (app.individual_participants) {
          participants.push(
            ...app.individual_participants.map(p => ({
              id: p.user.id,
              type: "individual",
              name: `${p.user.last_name} ${p.user.first_name} ${p.user.middle_name || ""}`.trim()
            }))
          );
        }
        if (app.team_participants) {
          participants.push(
            ...app.team_participants.map(p => ({
              id: p.id,
              type: "team",
              name: `${p.last_name} ${p.first_name} ${p.middle_name || ""}`.trim()
            }))
          );
        }
      }
      participants = participants.filter(
        (v, i, a) => a.findIndex(t => t.id === v.id && t.type === v.type) === i
      );
      commit('setParticipants', participants);
    },

    async loadSchedule({ commit }, competitionId) {
      if (!competitionId) throw new Error('Competition ID is missing');
      const { data } = await getMatchesByCompetition(competitionId);
      commit('setSchedule', data);
    },

    async loadBracket({ commit }, competitionId) {
      if (!competitionId) throw new Error('Competition ID is missing');
      const { data } = await getBracket(competitionId);
      commit('setBracketState', data);
    },

async updateScheduleMatch({ commit, state, dispatch }, payload = {}) {
  const { id, updateData, competitionId } = payload;
  if (id == null || typeof updateData !== 'object') {
    const errMsg = 'Неполные данные: нужен id и объект updateData';
    console.error('[Vuex][updateScheduleMatch]', errMsg, payload);
    commit('SET_ERROR', errMsg);
    return;
  }

  const compId = competitionId || state.competition?.id;
  if (!compId) {
    const errMsg = 'Соревнование не выбрано';
    console.error('[Vuex][updateScheduleMatch]', errMsg);
    commit('SET_ERROR', errMsg);
    return;
  }

  try {
    const { data: updated } = await matchService.updateMatch(id, updateData);
    await dispatch('loadSchedule', compId);
    await dispatch('loadBracket',  compId);
    return updated;
  } catch (error) {
    console.error('[Vuex][updateScheduleMatch] error →', error);
    commit('SET_ERROR', error.message || 'Ошибка обновления матча');
    throw error;
  }
}
,

    // --- Сохранение результатов турнира (если требуется) ---
    async saveTournamentResults({ commit, state }) {
      const compId = state.competition.id;
      const rounds = {};
      for (const m of state.schedule) {
        const stage = m.stage || 'unknown';
        if (!rounds[stage]) rounds[stage] = [];
        rounds[stage].push({
          id:                         m.id,
          stage:                      m.stage,
          status:                     m.status,
          winner_participant_type:    m.winner_participant_type,
          winner_participant_id:      m.winner_participant_id,
          points1:                    m.points1,
          points2:                    m.points2,
          comment:                    m.comment
        });
      }
      await postBracketResults(compId, { rounds });
      // Обновляем schedule свежими данными
      const { data } = await getMatchesByCompetition(compId);
      commit('setSchedule', data);
      return true;
    },

    clearAllData({ commit }) {
      commit('clearSchedule');
      commit('clearTournamentResults');
    },
    // --- CRUD для пользователей ---
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
    weightCategories: state => {
      const s = new Set();
      for (const p of state.participants) {
        if (p.weight != null) {
          s.add(`${p.weight} кг`);
        }
      }
      return Array.from(s).sort((a, b) => parseInt(a) - parseInt(b));
    },
    competition: state => state.competition,
    teams: state => state.teams,
    participants: state => state.participants,
    schedule: state => state.schedule,
    judges: state => state.judges,
    applications: state => state.applications,
    users: state => state.users,
    isLoading: state => state.loading,
    getError: state => state.error,
    getTournamentResults: state => state.tournamentResults,
    participantsByTeam: state => team => state.participants.filter(p => p.team === team),
    participantsByWeight: state => weight => state.participants.filter(p => p.weight === weight),
    matchesByStatus: state => status => state.schedule.filter(m => m.status === status),
    judgesByRole: state => role => state.judges.filter(j => j.role === role),
  }
});
