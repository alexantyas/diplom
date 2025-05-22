<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/profile-participant" class="nav-link">Профиль</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/events" class="nav-link">Предстоящие соревнования</router-link>
            </li>
          </ul>
          <button @click="logout" class="btn btn-danger">Выход</button>
        </div>
      </div>
    </nav>

    <div class="container mt-5">
      <div class="row g-4">
        <!-- Профиль -->
        <div class="col-md-8">
          <div class="card bg-white shadow-sm p-4">
            <h4 class="mb-3" style="color: #333;">Профиль участника</h4>
            <ul class="list-group list-group-flush">
              <li class="list-group-item bg-transparent"><strong>ФИО:</strong> {{ user?.last_name }} {{ user?.first_name }} {{ user?.middle_name }}</li>
              <li class="list-group-item bg-transparent"><strong>Адрес:</strong> {{ cityName }}, {{ countryName }}</li>
              <li class="list-group-item bg-transparent"><strong>Телефон:</strong> {{ user?.phone }}</li>
              <li class="list-group-item bg-transparent"><strong>Ник:</strong> {{ user?.login }}</li>
            </ul>
            <div class="mt-3">
              <button class="btn btn-outline-success w-100">Редактировать профиль</button>
            </div>
          </div>
        </div>

        <!-- Фото -->
        <div class="col-md-4">
          <div class="card bg-white shadow-sm h-100 d-flex flex-column justify-content-center align-items-center p-4 text-center">
            <h5 class="mb-3 " style="color: #333;" >Фотография</h5>

            <div
              v-if="preview"
              class="rounded-circle border shadow-sm mb-3"
              style="width: 150px; height: 150px; overflow: hidden;"
            >
              <img :src="preview" alt="Фото" class="w-100 h-100 object-fit-cover" />
            </div>
            <div
              v-else
              class="rounded-circle bg-light border d-flex align-items-center justify-content-center mb-3"
              style="width: 150px; height: 150px;"
            >
              <i class="bi bi-person-fill fs-1 text-muted"></i>
            </div>

            <label class="btn btn-outline-primary btn-sm w-100">
              Добавить фотографию
              <input type="file" accept="image/*" hidden @change="handlePhotoUpload" />
            </label>
          </div>
        </div>
      </div>

      <!-- Мои заявки -->
      <div class="card bg-white mt-5 shadow-sm p-4">
  <h5 class="mb-3" style="color: #333;">Мои заявки</h5>
  <div v-if="myApplications.length === 0" class="text-muted">Заявок пока нет.</div>
  <ul class="list-group" v-else>
    <li
      v-for="app in myApplications"
      :key="app.application.id"
      class="list-group-item d-flex justify-content-between align-items-center"
    >
      Соревнование: {{ app.competition?.name || 'Без названия' }}
      <span
        class="badge rounded-pill"
        :class="{
          'bg-success': app.status.toLowerCase() === 'подано',
          'bg-danger': app.status.toLowerCase() === 'отклонено'
        }"
        :style="app.status.toLowerCase() === 'на рассмотрении' ? 'background-color: #cce5ff; color: #004085;' : ''"
      >
        {{ app.status }}
      </span>
    </li>
  </ul>
</div>
    </div>
  </div>
</template>


<script>
import api from '@/api';
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();

    const user = ref({});
    const myApplications = ref([]);
    const competitions = ref([]);
    const applications = ref([]);

    const cityName = computed(() => user.value?.city_id || '');
    const countryName = computed(() => user.value?.country_id || '');

    const fetchProfileData = async () => {
      try {
        const userResp = await api.get('/users/me');
        user.value = userResp.data;

        const apResp = await api.get('/applications/participants/individual');
        const myAppParts = apResp.data.filter(ap => ap.user_id === user.value.id);

        const appsResp = await api.get('/applications/');
        applications.value = appsResp.data;
        const compsResp = await api.get('/competitions/');
        competitions.value = compsResp.data;

        myApplications.value = myAppParts.map(ap => {
          const app = applications.value.find(a => a.id === ap.application_id);
          const comp = app ? competitions.value.find(c => c.id === app.competition_id) : null;
          return {
            application: app,
            competition: comp,
            status: ap.status
          };
        });
      } catch (e) {
        router.push('/login');
      }
    };

    onMounted(fetchProfileData);

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };
    const preview = ref(null);

      const handlePhotoUpload = (event) => {
      const file = event.target.files[0];
        if (file) {
        preview.value = URL.createObjectURL(file);
        }
      };
    return {
      handlePhotoUpload,
      user,
      myApplications,
      cityName,
      countryName,
      logout,
      preview
    };
  }
};
</script>
