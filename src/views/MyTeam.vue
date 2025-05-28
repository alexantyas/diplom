<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
    <!-- Навбар и прочее, оставь по своему коду -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">ARENA</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><router-link to="/events" class="nav-link">Предстоящие соревнования</router-link></li>
            <li class="nav-item"><router-link to="/my-team" class="nav-link active">Моя команда</router-link></li>
            <li class="nav-item"><router-link to="/profile-coach" class="nav-link">Профиль</router-link></li>
          </ul>
          <button @click="logout" class="btn btn-danger">Выход</button>
        </div>
      </div>
    </nav>
<div class="d-flex gap-3 mb-3 flex-wrap">
  <input
    type="text"
    class="form-control"
    style="max-width:220px"
    v-model="search"
    placeholder="Поиск по ФИО..."
  />

  <select class="form-control" style="max-width:130px" v-model="weightFilter">
    <option value="">Все веса</option>
    <option v-for="w in weights" :key="w" :value="w">{{ w }}</option>
  </select>

  <select class="form-control" style="max-width:160px" v-model="cityFilter">
    <option value="">Все города</option>
    <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option>
  </select>
</div>
    <div class="team-table-wrapper">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">Состав команды</h4>
    <button class="btn btn-success" @click="openAddModal">
      <span style="font-size:18px;vertical-align:-2px">+</span> Добавить участника
    </button>
  </div>
  <table class="table team-table">
    <thead>
      <tr>
        <th>ФИО</th>
        <th>Вес</th>
        <th>Дата рождения</th>
        <th>Город</th>
        <th>Страна</th>
        <th style="text-align:center;">Действия</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="member in filteredTeam" :key="member.id">
        <td>{{ member.last_name }} {{ member.first_name }} {{ member.middle_name || '' }}</td>
        <td>{{ member.weight }}</td>
        <td>{{ formatDate(member.birth_date) }}</td>
        <td>{{ getCityName(member.city_id) }}</td>
        <td>{{ getCountryName(member.country_id) }}</td>
        <td style="text-align:center;">
          <button class="btn-action btn-edit" title="Редактировать" @click="openEditModal(member)">
            ✏️
          </button>
          <button class="btn-action btn-delete" title="Удалить" @click="deleteMember(member.id)">
            🗑️
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

    <!-- Модалка для добавления/редактирования -->
    <div class="modal fade" :class="{ show: showModal }" style="display: block;" v-if="showModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="saveMember">
            <div class="modal-header">
              <h5 class="modal-title">{{ editMode ? 'Редактировать участника' : 'Добавить участника' }}</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <input v-model="form.last_name" class="form-control mb-1" placeholder="Фамилия" required />
                <input v-model="form.first_name" class="form-control mb-1" placeholder="Имя" required />
                <input v-model="form.middle_name" class="form-control mb-1" placeholder="Отчество" />
                <input v-model="form.weight" type="number" class="form-control mb-1" placeholder="Вес" required />
                <input v-model="form.birth_date" type="date" class="form-control mb-1" placeholder="Дата рождения" required />
                <select v-model="form.city_id" class="form-control mb-1" required>
                  <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <select v-model="form.country_id" class="form-control mb-1" required>
                  <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">Отмена</button>
              <button type="submit" class="btn btn-success">Сохранить</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- /Модалка -->
  </div>
</template>

<script setup>
import { ref, onMounted,computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import api from '../api.js';

const store = useStore();
const router = useRouter();

const team = ref([]);
const cities = ref([]);
const countries = ref([]);
const myTeamId = ref(null);

const showModal = ref(false);
const editMode = ref(false);
const form = ref({
  id: null,
  team_id: null,
  last_name: '', first_name: '', middle_name: '',
  weight: '', birth_date: '', city_id: '', country_id: ''
});
const search = ref('');
const weightFilter = ref('');
const cityFilter = ref('');

// Массив уникальных весов для фильтра
const weights = computed(() =>
  Array.from(new Set(team.value.map(m => m.weight))).sort((a, b) => a - b)
);

// Фильтруем участников
const filteredTeam = computed(() => {
  return team.value.filter(member => {
    // ФИО
    const fio = `${member.last_name} ${member.first_name} ${member.middle_name || ''}`.toLowerCase();
    // Фильтр по ФИО
    let fits = fio.includes(search.value.trim().toLowerCase());
    // Фильтр по весу
    if (weightFilter.value)
      fits = fits && member.weight === +weightFilter.value;
    // Фильтр по городу
    if (cityFilter.value)
      fits = fits && member.city_id === +cityFilter.value;
    return fits;
  });
});
const fetchTeam = async () => {
  try {
    // Получить участников
    const teamRes = await api.get('/teams/my-team');
    team.value = teamRes.data;
    // Если есть участники — берём team_id с первого
    if (team.value.length > 0) {
      form.value.team_id = team.value[0].team_id;
      myTeamId.value = team.value[0].team_id;
    } else {
      // Если нет — получаем команду пользователя
      const res = await api.get('/teams/my-team');
      if (res.data.length > 0) {
        form.value.team_id = res.data[0].team_id;
        myTeamId.value = res.data[0].team_id;
      } else {
        // Можно получить /teams/, но тогда нужен id текущего юзера
        // Или сделать отдельный endpoint для team_id
        // Или запретить добавлять участника, пока нет команды
      }
    }
    // Справочники
    const [citiesRes, countriesRes] = await Promise.all([
      api.get('/cities/'),
      api.get('/countries/')
    ]);
    cities.value = citiesRes.data;
    countries.value = countriesRes.data;
  } catch (err) {
    alert('Ошибка при загрузке команды');
  }
};

const openAddModal = () => {
  editMode.value = false;
  form.value = {
    id: null,
    team_id: myTeamId.value,
    last_name: '', first_name: '', middle_name: '',
    weight: '', birth_date: '', city_id: '', country_id: ''
  };
  showModal.value = true;
};
const openEditModal = member => {
  editMode.value = true;
  form.value = { ...member }; // id, team_id, last_name, first_name, ...
  showModal.value = true;
};
const closeModal = () => {
  showModal.value = false;
};

const saveMember = async () => {
  try {
    if (editMode.value) {
      await api.put(`/teams/members/${form.value.id}`, form.value);
    } else {
      await api.post('/teams/members/', form.value);
    }
    await fetchTeam();
    showModal.value = false;
  } catch (err) {
    alert('Ошибка при сохранении участника');
  }
};

const deleteMember = async (id) => {
  if (!confirm('Удалить участника?')) return;
  try {
    await api.delete(`/teams/members/${id}`);
    await fetchTeam();
  } catch (err) {
    alert('Ошибка при удалении');
  }
};

const getCityName = id => {
  const city = cities.value.find(c => c.id === id);
  return city ? city.name : '';
};
const getCountryName = id => {
  const country = countries.value.find(c => c.id === id);
  return country ? country.name : '';
};
const formatDate = iso => {
  return new Date(iso).toLocaleDateString('ru-RU');
};
const logout = () => {
  store.commit('logout');
  router.push('/login');
};

onMounted(fetchTeam);
</script>

<style scoped>
.team-table-wrapper {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px 0 rgba(60,60,60,0.07);
  padding: 32px;
  margin-top: 24px;
  overflow-x: auto;
}

.table.team-table {
  border-collapse: separate;
  border-spacing: 0;
  min-width: 900px;
  font-size: 17px;
  background: transparent;
}
.table.team-table th {
  background: #f6f6f6;
  color: #262626;
  font-weight: 600;
  border-top: none;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 2;
}
.table.team-table th, .table.team-table td {
  padding: 13px 18px;
  border-right: 1px solid #f2f2f2;
}
.table.team-table tr {
  transition: background 0.14s;
}
.table.team-table tbody tr:nth-child(even) {
  background: #f7f8fa;
}
.table.team-table tbody tr:hover {
  background: #eaf3ff !important;
}
.table.team-table td {
  vertical-align: middle;
  border-bottom: 1px solid #f0f0f0;
  border-top: none;
}

.btn-action {
  min-width: 36px;
  min-height: 36px;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 16px;
  font-weight: 500;
  margin-right: 5px;
  transition: background 0.12s, color 0.12s;
}
.btn-edit {
  background: #eaf4ff;
  color: #1d72b8;
  border: none;
}
.btn-edit:hover {
  background: #d0e7ff;
  color: #11517b;
}
.btn-delete {
  background: #ffeaea;
  color: #c53030;
  border: none;
}
.btn-delete:hover {
  background: #ffd6d6;
  color: #a51c1c;
}

</style>