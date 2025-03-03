import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import LoginPage from '@/views/LoginPage.vue';
import CreateCompetition from '@/views/CreateCompetition.vue';
import Dashboard from '@/views/Dashboard.vue';
import TeamsPage from '@/views/TeamsPage.vue';
import SchedulePage from '@/views/SchedulePage.vue';
import JudgesPage from '@/views/JudgesPage.vue';
import PrintPage from '@/views/PrintPage.vue';
import ParticipantsPage from '@/views/ParticipantsPage.vue';
import BracketPage from '@/views/BracketPage.vue';

const routes = [
  { path: '/login', component: LoginPage },
  { path: '/', redirect: '/login' },
  { path: '/create', component: CreateCompetition, meta: { requiresAuth: true, roles: ['organizer'] } },
  { 
    path: '/dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: 'teams' }, // Редирект по умолчанию на команды
      { path: 'teams', component: TeamsPage, meta: { requiresAuth: true, roles: ['organizer'] } },
      { path: 'schedule', component: SchedulePage, meta: { requiresAuth: true } },
      { path: 'judges', component: JudgesPage, meta: { requiresAuth: true } },
      { path: 'print', component: PrintPage, meta: { requiresAuth: true, roles: ['organizer', 'secretariat', 'admin'] } },
      { path: 'participants', component: ParticipantsPage, meta: { requiresAuth: true, roles: ['organizer'] } },
      { path: 'bracket', component: BracketPage }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;
  const userRole = store.getters.userRole;
  const hasCompetition = store.getters.competition;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (isAuthenticated && to.path === '/login') {
    next('/create');
  } else if (isAuthenticated && !hasCompetition && to.path !== '/create') {
    next('/create');
  } else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
