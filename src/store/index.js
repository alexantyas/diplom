import { createStore } from 'vuex';

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    competition: JSON.parse(localStorage.getItem('competition')) || null,
    teams: JSON.parse(localStorage.getItem('teams')) || [],
    participants: JSON.parse(localStorage.getItem('participants')) || [],
    schedule: JSON.parse(localStorage.getItem('schedule')) || [] // ✅ Добавлено хранение расписания
  },
  mutations: {
    setJudges(state, judges) { // ✅ Добавили судей
      state.judges = judges;
      localStorage.setItem('judges', JSON.stringify(judges));
    },
    addJudge(state, judge) { // ✅ Добавить судью
      state.judges.push(judge);
      localStorage.setItem('judges', JSON.stringify(state.judges));
    },
    updateJudge(state, { index, name, category, tatami }) { // ✅ Обновить судью
      if (state.judges[index]) {
        state.judges[index].name = name;
        state.judges[index].category = category;
        state.judges[index].tatami = tatami;
        localStorage.setItem('judges', JSON.stringify(state.judges));
      }
    },
    removeJudge(state, index) { // ✅ Удаление судьи
      state.judges.splice(index, 1);
      localStorage.setItem('judges', JSON.stringify(state.judges));
    
    },
    setUser(state, user) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout(state) {
      state.user = null;
      localStorage.removeItem('user');
    },
    setCompetition(state, competition) {
      state.competition = competition;
      localStorage.setItem('competition', JSON.stringify(competition));
    },
    setTeams(state, teams) {
      state.teams = teams;
      localStorage.setItem('teams', JSON.stringify(teams));
    },
    setParticipants(state, participants) {
      state.participants = participants;
      localStorage.setItem('participants', JSON.stringify(participants));
    },
    addTeam(state, team) {
      state.teams.push(team);
      localStorage.setItem('teams', JSON.stringify(state.teams));
    },
    updateTeam(state, { index, name }) {
      state.teams[index].name = name;
      localStorage.setItem('teams', JSON.stringify(state.teams));
    },
    removeTeam(state, index) {
      state.teams.splice(index, 1);
      localStorage.setItem('teams', JSON.stringify(state.teams));
    },
    addParticipant(state, participant) {
      state.participants.push(participant);
      localStorage.setItem('participants', JSON.stringify(state.participants));
    },
    updateParticipant(state, { index, name, weight }) {
      state.participants[index].name = name;
      state.participants[index].weight = weight;
      localStorage.setItem('participants', JSON.stringify(state.participants));
    },
    removeParticipant(state, index) {
      state.participants.splice(index, 1);
      localStorage.setItem('participants', JSON.stringify(state.participants));
    },

    // ✅ Новые мутации для работы с расписанием
    setSchedule(state, schedule) {  
      state.schedule = schedule;
      localStorage.setItem('schedule', JSON.stringify(schedule));
    },
    addMatch(state, match) {  
      state.schedule.push(match);
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
    },
    updateMatch(state, { index, match }) {  
      state.schedule[index] = match;
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
    },
    removeMatch(state, index) {  
      state.schedule.splice(index, 1);
      localStorage.setItem('schedule', JSON.stringify(state.schedule));
    },
    saveResults(state, results) {
      state.schedule = results;
      localStorage.setItem("schedule", JSON.stringify(results));
    }
  },
  getters: {
    isAuthenticated: state => !!state.user,
    userRole: state => state.user ? state.user.role : null,
    competition: state => state.competition,
    teams: state => state.teams,
    participants: state => state.participants,
    schedule: state => state.schedule,
    judges: state => state.judges // ✅ Получение судей из хранилища
  }
});
