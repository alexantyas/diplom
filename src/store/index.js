// src/store/index.js
import { createStore } from 'vuex';
import api from '@/api';
import { getApprovedApplications, getMatchesByCompetition } from '@/api';
import { patchMatch, getBracket, postBracketResults } from '@/api'

const SCHEDULE_KEY_BASE = 'schedule'
function getScheduleKey(competitionId) {
  return competitionId != null
    ? `${SCHEDULE_KEY_BASE}_${competitionId}`
    : SCHEDULE_KEY_BASE
}

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    competition: JSON.parse(localStorage.getItem('competition')) || null,
    teams: JSON.parse(localStorage.getItem('teams')) || [],
    participants: JSON.parse(localStorage.getItem('participants')) || [],
    judges: JSON.parse(localStorage.getItem('judges')) || [],
    schedule: JSON.parse(localStorage.getItem('schedule')) || [],
    applications: [],
    users: [],
    loading: false,
    error: null,
    tournamentResults: JSON.parse(localStorage.getItem('tournamentResults')) || [],
    bracketState: JSON.parse(localStorage.getItem('bracketState')) || null
  },

  mutations: {
    // --- Аутентификация (API, не менять) ---
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

    // --- Управление соревнованием, командами, участниками, судьями (API/старое) ---
    setCompetition(state, competition) {
      state.competition = competition;
      localStorage.setItem('competition', JSON.stringify(competition));
    },
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

    // --- Таблица расписания: изменения только локально (старый стиль) ---
    
 addMatch(state, match) {
  // Всегда храним result как строку (имя победителя)
  if (match.result && typeof match.result === 'object' && match.result.name) {
    match.result = match.result.name
  }
  if (match.fighter1 && typeof match.fighter1 === 'string') {
    match.fighter1 = { name: match.fighter1 }
  }
  if (match.fighter2 && typeof match.fighter2 === 'string') {
    match.fighter2 = { name: match.fighter2 }
  }
  state.schedule.push(match);
  
  // Use a replacer function to handle circular references
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return; // Skip circular reference
        }
        seen.add(value);
      }
      return value;
    };
  };
  
  localStorage.setItem('schedule', JSON.stringify(state.schedule, getCircularReplacer()));
},
setSchedule(state, schedule) {
    state.schedule = schedule;
    localStorage.setItem('schedule', JSON.stringify(schedule));
  },

    updateMatch(state, { index, match }) {
  if (index >= 0 && index < state.schedule.length) {
    if (match.fighter1 && typeof match.fighter1 === 'string') {
      match.fighter1 = { name: match.fighter1 }
    }
    if (match.fighter2 && typeof match.fighter2 === 'string') {
      match.fighter2 = { name: match.fighter2 }
    }
    if (match.result && typeof match.result === 'object' && match.result.name) {
      match.result = match.result.name
    }
    let newStage = match.stage;
    if (match.status === 'finished' && !match.stage) {
      newStage = 'Обычный этап';
    }
    const updatedMatch = {
      ...state.schedule[index],
      ...match,
      category: match.category || state.schedule[index].category,
      fighter1: match.fighter1 || state.schedule[index].fighter1,
      fighter2: match.fighter2 || state.schedule[index].fighter2,
      stage: match.stage || state.schedule[index].stage,
      status: match.status || state.schedule[index].status,
      result: match.result || state.schedule[index].result,
      points: match.points || state.schedule[index].points,
      points1: match.points1 || state.schedule[index].points1,
      points2: match.points2 || state.schedule[index].points2
    }
    state.schedule[index] = updatedMatch;
  }
  
  // In updateMatch mutation
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return; // Skip circular reference
        }
        seen.add(value);
      }
      return value;
    };
  };
  
  localStorage.setItem('schedule', JSON.stringify(state.schedule, getCircularReplacer()));
},

    removeMatch(state, index) {
      state.schedule.splice(index, 1);
      
      // Use a replacer function to handle circular references
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return; // Skip circular reference
            }
            seen.add(value);
          }
          return value;
        };
      };
      
      localStorage.setItem('schedule', JSON.stringify(state.schedule, getCircularReplacer()));
    },

    // --- Прочее (для результатов и сетки) ---
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
      
      // Используем функцию для обработки циклических ссылок
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return; // Skip circular reference
            }
            seen.add(value);
          }
          return value;
        };
      };
      
      localStorage.setItem('tournamentResults', JSON.stringify(results, getCircularReplacer()));
    },
    setBracketState(state, bracketState) {
      // In setBracketState mutation
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return; // Skip circular reference
            }
            seen.add(value);
          }
          return value;
        };
      };
      
      const stateToSave = JSON.parse(JSON.stringify(bracketState, getCircularReplacer()));
      state.bracketState = stateToSave;
      localStorage.setItem('bracketState', JSON.stringify(stateToSave));
    },
    clearSchedule(state) {
      state.schedule = [];
      localStorage.removeItem('schedule');
    },
    clearTournamentResults(state) {
      state.tournamentResults = [];
      localStorage.removeItem('tournamentResults');
    },
    setApplications(state, apps) {
      state.applications = apps;
    },
  },

  actions: {
    // --- Импорт данных, генерация расписания, заявки, создание/просмотр/переход в соревнование --- (API)
    async importCompetitionData({ commit }, data) {
      if (data.competition) commit('setCompetition', data.competition);
      if (data.teams) commit('setTeams', data.teams);
      if (data.participants) commit('setParticipants', data.participants);
      if (data.schedule) commit('setSchedule', data.schedule);
      if (data.judges) commit('setJudges', data.judges);
      return true;
    },

    async loadApprovedApplications({ commit }, competitionId) {
      if (!competitionId) throw new Error('Competition ID is missing');
      const { data } = await getApprovedApplications(competitionId);
      commit('setApplications', data);

      // собираем участников для генерации расписания
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

    async updateScheduleMatch({ commit, state }, { id, updateData }) {
    // 1) Отправляем PATCH на бэкенд
    const { data: updated } = await patchMatch(id, updateData);
    // 2) Ищем его в state.schedule и коммитим обновлённый
    const idx = state.schedule.findIndex(m => m.id === id);
    if (idx !== -1) {
      commit('updateMatch', { index: idx, match: updated });
    }
    return updated;
  },// --- Сохранение результатов турнира в localStorage (как раньше) ---
    async saveResults({ state }) {
      const results = {
        competition: state.competition,
        schedule: state.schedule,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('competitionResults', JSON.stringify(results));
      return true;
    },

    // --- CRUD для пользователей (API) ---
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

    async saveTournamentResults({ commit, state }) {
    const compId = state.competition.id;
    // 1) Группируем все матчи по stage
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
    // 2) Шлём единый POST
    await postBracketResults(compId, { rounds });
    // 3) Обновляем schedule свежими данными
    const { data } = await getMatchesByCompetition(compId);
    commit('setSchedule', data);
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
   weightCategories: state => {
      const s = new Set()
      for (const p of state.participants) {
        if (p.weight != null) {
          s.add(`${p.weight} кг`)
        }
      }
      // опционально сортируем по числу
      return Array.from(s).sort((a, b) => parseInt(a) - parseInt(b))
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