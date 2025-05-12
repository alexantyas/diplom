<template>
  <div class="container d-flex justify-content-center align-items-center min-vh-100">
    <div class="col-md-5">
      <h2 class="text-center mb-4">Регистрация тренера</h2>
      <div class="card p-4 shadow-sm">
        <input v-model="user.fullName" class="form-control mb-2" placeholder="ФИО" />
        <input v-model="user.birthDate" class="form-control mb-2" placeholder="Дата рождения" />
        <input v-model="user.city" class="form-control mb-2" placeholder="Город" />
        <input v-model="user.country" class="form-control mb-2" placeholder="Страна" />
        <input v-model="user.phone" class="form-control mb-2" placeholder="Телефон" />
        <input v-model="user.email" class="form-control mb-2" placeholder="Электронная почта" />
        <input v-model="user.organization" class="form-control mb-2" placeholder="Организация" />
        <input v-model="user.username" class="form-control mb-2" placeholder="Логин" required />
        <input v-model="user.password" class="form-control mb-2" placeholder="Пароль" type="password" required />

        <div class="form-check mb-3">
          <input type="checkbox" class="form-check-input" v-model="consent" required />
          <label class="form-check-label">Согласие на обработку персональных данных</label>
        </div>
        <button class="btn btn-success w-100" @click="register">Зарегистрироваться</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();
    const consent = ref(false);
    const user = ref({
      fullName: '',
      birthDate: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      organization: '',
      role: 'coach',
      username: '',
      password: ''
    });

    const register = () => {
      const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
      users.push(user.value);
      localStorage.setItem('registeredUsers', JSON.stringify(users));
      alert('Регистрация участника успешна');
      router.push('/login');
    };

    return { user, register, consent };
  }
};
</script>
