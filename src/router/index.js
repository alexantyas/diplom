import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import HomePage from '@/views/HomePage.vue';
import LoginPage from '@/views/LoginPage.vue';
import CreateCompetition from '@/views/CreateCompetition.vue';
import Dashboard from '@/views/Dashboard.vue';
import TeamsPage from '@/views/TeamsPage.vue';
import SchedulePage from '@/views/SchedulePage.vue';
import JudgesPage from '@/views/JudgesPage.vue';
import PrintPage from '@/views/PrintPage.vue';
import ParticipantsPage from '@/views/ParticipantsPage.vue';

const routes = [
  { path: '/login', component: LoginPage },
  { path: '/', redirect: '/login' },
  { path: '/create', component: CreateCompetition, meta: { requiresAuth: true, roles: ['organizer'] } },
  { 
    path: '/dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      { path: 'teams', component: TeamsPage, meta: { requiresAuth: true, roles: ['organizer'] } },
      { path: 'schedule', component: SchedulePage, meta: { requiresAuth: true } },
      { path: 'judges', component: JudgesPage, meta: { requiresAuth: true } }, // ✅ Теперь судейская доступна всем
      { path: 'print', component: PrintPage, meta: { requiresAuth: true, roles: ['organizer', 'secretariat', 'admin'] } },
      { path: 'participants', component: ParticipantsPage, meta: { requiresAuth: true, roles: ['organizer'] } } 
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

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
