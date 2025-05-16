<template>
  <div class="container d-flex justify-content-center align-items-center min-vh-100">
    <div class="col-md-4">
      <h2 class="text-center mb-4">Вход</h2>
      <div class="card p-4 shadow-sm">
        <div class="mb-3">
          <label class="form-label">Логин</label>
          <input v-model="username" type="text" class="form-control" placeholder="Введите логин">
        </div>
        <div class="mb-3">
          <label class="form-label">Пароль</label>
          <input v-model="password" type="password" class="form-control" placeholder="Введите пароль">
        </div>
        <button @click="login" class="btn btn-primary w-100">Войти</button>
        <div v-if="errorMessage" class="alert alert-danger mt-3">
          {{ errorMessage }}
        </div>
        <p class="text-center mt-3">
          Вы участник?
          <router-link to="/register-participant" class="btn btn-link">Зарегистрироваться</router-link>
        </p>
        <p class="text-center">
          Вы тренер?
          <router-link to="/register-coach" class="btn btn-link">Зарегистрироваться</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { loginUser } from '@/api';

export default {
  setup() {
    const router = useRouter();
    const store = useStore(); // используем useStore
    const username = ref('');
    const password = ref('');
    const errorMessage = ref('');

    const login = async () => {
      errorMessage.value = '';
      try {
        // Получение токена
        const response = await loginUser(username.value, password.value);
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);

        // Получение пользователя
        const userResponse = await fetch('http://127.0.0.1:8000/users/me', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const user = await userResponse.json();
        store.commit('setUser', user); // <<< ОБЯЗАТЕЛЬНО!

        // Редирект по роли
        if (user.role_id === 1) {
          router.push('/create');
        } else if (user.role_id === 2) {
          router.push('/profile-coach');
        } else if (user.role_id === 3) {
          router.push('/profile-participant');
        } else {
          router.push('/');
        }
      } catch (err) {
        errorMessage.value = 'Неверный логин или пароль';
      }
    };

    return { username, password, errorMessage, login };
  }
};
</script>

