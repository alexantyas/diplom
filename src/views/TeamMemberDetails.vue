<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <!-- Шапка -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><router-link to="/events" class="nav-link">Предстоящие соревнования</router-link></li>
            <li class="nav-item"><router-link to="/my-team" class="nav-link">Моя команда</router-link></li>
            <li class="nav-item"><router-link to="/profile-coach" class="nav-link">Профиль</router-link></li>
          </ul>
          <button @click="logout" class="btn btn-danger">Выход</button>
        </div>
      </div>
    </nav>

    <!-- Подробности участника -->
    <div class="container mt-4">
      <h4 class="mb-4">Подробности участника</h4>

      <div class="row mb-4">
        <div class="col-md-9">
          <div class="card p-4" v-if="participant">
            <template v-if="!editing">
              <p><strong>ФИО:</strong> {{ fullName }}</p>
              <p><strong>Вес:</strong> {{ participant.weight }} кг</p>
              <p><strong>Дата рождения:</strong> {{ formatDate(participant.birth_date) }}</p>
              <p><strong>Город:</strong> {{ getCityName(participant.city_id) }}</p>
              <p><strong>Страна:</strong> {{ getCountryName(participant.country_id) }}</p>
              <button class="btn btn-outline-success mt-2" @click="editing = true">Редактировать профиль</button>
            </template>

            <template v-else>
              <div class="form-group mb-2">
                <label>Фамилия</label>
                <input v-model="form.last_name" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Имя</label>
                <input v-model="form.first_name" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Отчество</label>
                <input v-model="form.middle_name" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Вес</label>
                <input v-model.number="form.weight" type="number" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Дата рождения</label>
                <input v-model="form.birth_date" type="date" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Город (ID)</label>
                <input v-model.number="form.city_id" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Страна (ID)</label>
                <input v-model.number="form.country_id" class="form-control" />
              </div>
              <div class="d-flex justify-content-end gap-2 mt-3">
                <button class="btn btn-success" @click="saveChanges">Сохранить</button>
                <button class="btn btn-secondary" @click="cancelEdit">Отмена</button>
              </div>
            </template>
          </div>
        </div>

        <!-- Фото (пока заглушка) -->
        <div class="col-md-3 d-flex align-items-center">
          <div class="card p-3 text-center w-100">
            <div class="mb-2 fw-bold">Фото</div>
            <div class="rounded-circle bg-secondary mx-auto" style="width: 100px; height: 100px;"></div>
          </div>
        </div>
      </div>

      <!-- Заглушка под статистику -->
      <div class="card p-4">
        <h5 class="mb-3">Статистика</h5>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Соревнование</th>
              <th>Схватка</th>
              <th>Результат</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="3">Нет данных</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import api from '@/api';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const id = Number(route.params.id);
    const participant = ref(null);
    const form = ref({});
    const editing = ref(false);
    const cities = ref([]);
    const countries = ref([]);

    const fetchParticipant = async () => {
      try {
        const [teamRes, citiesRes, countriesRes] = await Promise.all([
          api.get('/teams/my-team'),
          api.get('/cities/'),
          api.get('/countries/')
        ]);
        cities.value = citiesRes.data;
        countries.value = countriesRes.data;

        const match = teamRes.data.find(p => p.id === id);
        if (!match) return router.push('/my-team');

        participant.value = match;
        form.value = { ...match };
      } catch (err) {
        console.error('❌ Ошибка при получении участника:', err);
        router.push('/login');
      }
    };

    const saveChanges = async () => {
      try {
        await api.put(`/teams/members/${id}`, form.value);
        participant.value = { ...form.value };
        editing.value = false;
        alert('✅ Изменения сохранены');
      } catch (err) {
        console.error('❌ Ошибка при сохранении:', err);
        alert('Не удалось сохранить изменения');
      }
    };

    const cancelEdit = () => {
      form.value = { ...participant.value };
      editing.value = false;
    };

    const getCityName = id => cities.value.find(c => c.id === id)?.name || '—';
    const getCountryName = id => countries.value.find(c => c.id === id)?.name || '—';
    const formatDate = date => date ? new Date(date).toLocaleDateString('ru-RU') : '—';

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    const fullName = computed(() => {
      if (!participant.value) return '';
      const { last_name, first_name, middle_name } = participant.value;
      return [last_name, first_name, middle_name].filter(Boolean).join(' ');
    });

    onMounted(fetchParticipant);

    return {
      participant,
      form,
      editing,
      saveChanges,
      cancelEdit,
      getCityName,
      getCountryName,
      formatDate,
      fullName,
      logout
    };
  }
};
</script>
