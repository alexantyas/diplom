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
  {
    path: '/register-participant',
    component: () => import('@/views/RegisterParticipant.vue')
  },
  {
    path: '/register-coach',
    component: () => import('@/views/RegisterCoach.vue')
  },
  {
    path: '/create',
    component: CreateCompetition,
    meta: { requiresAuth: true, roles: ['organizer'] }
  },
  {
    path: '/profile-participant',
    component: () => import('@/views/ParticipantProfile.vue'),
    meta: { requiresAuth: true, roles: ['participant'] }
  },
  {
    path: '/profile-coach',
    component: () => import('@/views/CoachProfile.vue'),
    meta: { requiresAuth: true, roles: ['coach'] }
  },
  {
    path: '/my-team',
    component: () => import('@/views/MyTeam.vue'),
    meta: { requiresAuth: true, roles: ['coach'] }
  },
  {
    path: '/events',
    component: () => import('@/views/EventsPage.vue'),
    meta: { requiresAuth: true, roles: ['coach', 'participant'] }
  },
  {
  path: '/dashboard/competition/:id',
  component: () => import('@/views/CompetitionDashboard.vue'),
  meta: { requiresAuth: true, roles: ['organizer'] }
},

  {
    path: '/my-team/:id',
    component: () => import('@/views/TeamMemberDetails.vue'),
    meta: { requiresAuth: true, roles: ['coach'] }
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: 'teams' },
      { path: 'teams', component: TeamsPage, meta: { requiresAuth: true, roles: ['organizer'] } },
      { path: 'schedule', component: SchedulePage, meta: { requiresAuth: true } },
      { path: 'judges', component: JudgesPage, meta: { requiresAuth: true } },
      { path: 'print', component: PrintPage, meta: { requiresAuth: true, roles: ['organizer', 'secretariat', 'admin'] } },
      { path: 'participants', component: ParticipantsPage, meta: { requiresAuth: true, roles: ['organizer'] } },
      { path: 'bracket', component: BracketPage },
      {
        path: 'created',
        component: () => import('@/views/CreatedCompetitions.vue'),
        meta: { requiresAuth: true, roles: ['organizer'] }
      }
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
  } else if (isAuthenticated && to.path === '/login') {
    switch (userRole) {
      case 'organizer':
      case 'admin':
        next('/create');
        break;
      case 'participant':
        next('/profile-participant');
        break;
      case 'coach':
        next('/profile-coach');
        break;
      default:
        next('/login');
    }
  } else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    next('/login');
  } else {
    next();
  }
});

export default router;
