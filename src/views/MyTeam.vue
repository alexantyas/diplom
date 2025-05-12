<template>
  <div>
    <!-- Шапка -->
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

    <!-- Команда -->
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">Состав команды</h4>
        <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addMemberModal">
          Добавить участника
        </button>
      </div>

      <div v-if="team.length === 0">У вас пока нет участников в команде.</div>

      <table v-else class="table table-bordered">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Вес</th>
            <th>Город</th>
            <th>Страна</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
            <tr v-for="(member, index) in team" :key="index">
                <td>{{ member.name }}</td>
                <td>{{ member.weight }}</td>
                <td>{{ member.city }}</td>
                <td>{{ member.country }}</td>
            <td class="d-flex gap-2">
                <router-link :to="`/my-team/${index}`" class="btn btn-outline-primary btn-sm">Подробнее</router-link>
                <button @click="removeMember(index)" class="btn btn-outline-danger btn-sm">Удалить</button>
            </td>
            </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка -->
    <div class="modal fade" id="addMemberModal" tabindex="-1" aria-labelledby="addMemberModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <form @submit.prevent="addMember">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="addMemberModalLabel">Добавить участника</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
            </div>
            <div class="modal-body">
              <input v-model="newMember.name" class="form-control mb-2" placeholder="ФИО" required />
              <input v-model="newMember.weight" type="number" class="form-control mb-2" placeholder="Вес" required />
              <input v-model="newMember.city" class="form-control mb-2" placeholder="Город" required />
              <input v-model="newMember.country" class="form-control mb-2" placeholder="Страна" required />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
              <button type="submit" class="btn btn-success">Добавить</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { Modal } from 'bootstrap'; // 👈 ключевая строка

export default {
  setup() {
    const store = useStore();
    const router = useRouter();

    const user = ref(JSON.parse(localStorage.getItem('user')) || {});
    const participants = ref([]);
    const team = ref([]);
    const newMember = ref({ name: '', weight: '', city: '', country: '' });

    const updateTeam = () => {
      team.value = participants.value.filter(p => p.team === user.value.organization);
    };

    onMounted(() => {
      participants.value = JSON.parse(localStorage.getItem('participants')) || [];
      updateTeam();
    });

    const addMember = () => {
  const newP = {
    name: newMember.value.name,
    weight: Number(newMember.value.weight),
    city: newMember.value.city,
    country: newMember.value.country,
    team: user.value.organization
  };

  participants.value.push(newP);
  localStorage.setItem('participants', JSON.stringify(participants.value));
  newMember.value = { name: '', weight: '', city: '', country: '' };
  updateTeam();

  const modalElement = document.getElementById('addMemberModal');
  const modalInstance = Modal.getInstance(modalElement) || new Modal(modalElement);
  modalInstance.hide();

  // 👉 Убираем серый фон и блокировку
  document.body.classList.remove('modal-open');
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) backdrop.remove();

  alert('Участник добавлен!');
};


    const logout = () => {
      store.commit('logout');
      router.push('/login');
    };
    const removeMember = (index) => {
  if (confirm('Удалить участника из команды?')) {
    const participantIndex = participants.value.findIndex(p =>
      p.team === user.value.organization &&
      p.name === team.value[index].name &&
      p.weight === team.value[index].weight &&
      p.city === team.value[index].city &&
      p.country === team.value[index].country
    );

    if (participantIndex !== -1) {
      participants.value.splice(participantIndex, 1);
      localStorage.setItem('participants', JSON.stringify(participants.value));
      updateTeam();
    }
  }
};

    return {
      user,
      team,
      newMember,
      addMember,
      removeMember,
      logout
    };
  }
};
</script>
