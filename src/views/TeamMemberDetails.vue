<template>
  <div>
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

    <!-- Подробности -->
    <div class="container mt-4">
      <h4 class="mb-4">Подробности участника</h4>

      <div class="row mb-4">
        <!-- Информация -->
        <div class="col-md-9">
          <div class="card p-4">
            <template v-if="!editing">
              <p><strong>ФИО:</strong> {{ participant.name }}</p>
              <p><strong>Вес:</strong> {{ participant.weight }}</p>
              <p><strong>Город:</strong> {{ participant.city }}</p>
              <p><strong>Страна:</strong> {{ participant.country }}</p>
              <p><strong>Телефон:</strong> —</p>
              <p><strong>Почта:</strong> —</p>
              <p><strong>Документы:</strong> —</p>
              <button class="btn btn-outline-success mt-2" @click="editing = true">Редактировать профиль</button>
            </template>

            <template v-else>
              <div class="form-group mb-2">
                <label>ФИО</label>
                <input v-model="form.name" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Вес</label>
                <input v-model="form.weight" type="number" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Город</label>
                <input v-model="form.city" class="form-control" />
              </div>
              <div class="form-group mb-2">
                <label>Страна</label>
                <input v-model="form.country" class="form-control" />
              </div>
              <div class="d-flex justify-content-end gap-2 mt-3">
                <button class="btn btn-success" @click="saveChanges">Сохранить</button>
                <button class="btn btn-secondary" @click="cancelEdit">Отмена</button>
              </div>
            </template>
          </div>
        </div>

        <!-- Фото -->
        <div class="col-md-3 d-flex align-items-center">
          <div class="card p-3 text-center w-100">
            <div class="mb-2 fw-bold">Фото</div>
            <div class="rounded-circle bg-secondary mx-auto" style="width: 100px; height: 100px;"></div>
          </div>
        </div>
      </div>

      <!-- Статистика -->
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
            <tr>
              <td colspan="3">Нет данных</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const participant = ref({});
    const editing = ref(false);
    const form = ref({});
    const id = Number(route.params.id);

    onMounted(() => {
      const participants = JSON.parse(localStorage.getItem('participants')) || [];
      if (participants[id]) {
        participant.value = participants[id];
        form.value = { ...participants[id] };
      } else {
        router.push('/my-team');
      }
    });

    const saveChanges = () => {
      const participants = JSON.parse(localStorage.getItem('participants')) || [];
      participants[id] = { ...form.value };
      localStorage.setItem('participants', JSON.stringify(participants));
      participant.value = { ...form.value };
      editing.value = false;
      alert('Изменения сохранены');
    };

    const cancelEdit = () => {
      form.value = { ...participant.value };
      editing.value = false;
    };

    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };

    return {
      participant,
      form,
      editing,
      saveChanges,
      cancelEdit,
      logout
    };
  }
};
</script>
