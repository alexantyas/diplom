<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/events" class="nav-link">Предстоящие соревнования</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/my-team" class="nav-link">Моя команда</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/profile-coach" class="nav-link active">Профиль</router-link>
            </li>
          </ul>
          <button @click="logout" class="btn btn-danger">Выход</button>
        </div>
      </div>
    </nav>

    <div class="container mt-5">
      <div class="row g-4">
        <!-- Профиль тренера -->
        <div class="col-md-8">
          <div class="card bg-white shadow-sm p-4">
            <h4 class="mb-3" style="color: #333;">Профиль тренера</h4>
            <ul class="list-group list-group-flush">
              <li class="list-group-item bg-transparent"><strong>ФИО:</strong> {{ user?.last_name }} {{ user?.first_name }} {{ user?.middle_name }}</li>
              <li class="list-group-item bg-transparent"><strong>Адрес:</strong> {{ cityName }}, {{ countryName }}</li>
              <li class="list-group-item bg-transparent"><strong>Телефон:</strong> {{ user?.phone }}</li>
              <li class="list-group-item bg-transparent"><strong>Команда:</strong> {{ user?.organization || '—' }}</li>
            </ul>
            <div class="mt-3">
              <button class="btn btn-outline-success w-100" @click="openEditModal">Редактировать профиль</button>
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
      <!-- Кнопка внутри карточки профиля -->


<!-- Модалка редактирования -->
<div class="modal fade" :class="{ show: showEditModal }" tabindex="-1" style="display: block;" v-if="showEditModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <form @submit.prevent="saveProfile">
        <div class="modal-header">
          <h5 class="modal-title">Редактирование профиля</h5>
          <button type="button" class="btn-close" @click="closeEditModal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <input v-model="editForm.last_name" class="form-control mb-2" placeholder="Фамилия" required />
            <input v-model="editForm.first_name" class="form-control mb-2" placeholder="Имя" required />
            <input v-model="editForm.middle_name" class="form-control mb-2" placeholder="Отчество" />
            <input v-model="editForm.phone" class="form-control mb-2" placeholder="Телефон" />
            <select v-model="editForm.city_id" class="form-control mb-2" required>
              <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <select v-model="editForm.country_id" class="form-control mb-2" required>
              <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <input v-model="editForm.organization" class="form-control mb-2" placeholder="Команда" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeEditModal">Отмена</button>
          <button type="submit" class="btn btn-success">Сохранить</button>
        </div>
      </form>
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
            :key="app.id"
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            Соревнование: {{ getCompetitionName(app.competition_id) }}
            <span
              class="badge rounded-pill"
              :class="{
                'bg-success': app.status === 'approved',
                'bg-danger': app.status === 'rejected'
              }"
              :style="app.status === 'pending' ? 'background-color: #cce5ff; color: #004085;' : ''"
            >
              {{ statusRu(app.status) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api.js';
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
    const cities = ref([]);
    const countries = ref([]);

    // Для получения названий города и страны
    const cityName = computed(() => {
      const city = cities.value.find(c => c.id === user.value.city_id);
      return city ? city.name : '';
    });
    const countryName = computed(() => {
      const country = countries.value.find(c => c.id === user.value.country_id);
      return country ? country.name : '';
    });

    const showEditModal = ref(false);
const editForm = ref({
  last_name: '', first_name: '', middle_name: '',
  phone: '', city_id: '', country_id: '', organization: ''
});

  const openEditModal = () => {
  // Копируем данные профиля в форму редактирования
  editForm.value = {
    last_name: user.value.last_name || '',
    first_name: user.value.first_name || '',
    middle_name: user.value.middle_name || '',
    phone: user.value.phone || '',
    city_id: user.value.city_id || '',
    country_id: user.value.country_id || '',
    organization: user.value.organization || ''
  };
  showEditModal.value = true;
};
const closeEditModal = () => {
  showEditModal.value = false;
};

  const saveProfile = async () => {
  try {
    // PATCH или PUT, в зависимости от твоего API
    await api.put(`/users/${user.value.id}`, editForm.value);
    await fetchProfileData(); // обновим профиль
    showEditModal.value = false;
  } catch (e) {
    alert('Ошибка при сохранении профиля');
  }
};

    const preview = ref(null);

    const handlePhotoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        preview.value = URL.createObjectURL(file);
        // Здесь можно отправлять фото на бэк (если реализовано)
      }
    };

    const statusRu = status => {
      switch (status) {
        case 'pending': return 'На рассмотрении';
        case 'approved': return 'Одобрено';
        case 'rejected': return 'Отклонено';
        default: return status;
      }
    };

    const getCompetitionName = (competition_id) => {
      const comp = competitions.value.find(c => c.id === competition_id);
      return comp ? comp.name : 'Без названия';
    };

    const fetchProfileData = async () => {
      try {
        const userResp = await api.get('/users/me');
        user.value = userResp.data;

        const appsResp = await api.get('/applications/');
        myApplications.value = appsResp.data.filter(
          app => app.user_id === user.value.id
        );

        const compsResp = await api.get('/competitions/');
        competitions.value = compsResp.data;

        // Справочники для города/страны
        const [citiesRes, countriesRes] = await Promise.all([
          api.get('/cities/'),
          api.get('/countries/')
        ]);
        cities.value = citiesRes.data;
        countries.value = countriesRes.data;
      } catch (e) {
        router.push('/login');
      }
    };

    onMounted(fetchProfileData);

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      user,
      myApplications,
      cityName,
      countryName,
      logout,
      preview,
      handlePhotoUpload,
      getCompetitionName,
      statusRu, showEditModal, editForm,
  openEditModal, closeEditModal, saveProfile,
    };
  }
};
</script>
