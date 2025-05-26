<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
  <div class="container d-flex justify-content-center align-items-center min-vh-100">
    <div class="col-md-4">
      
      <div class="card p-4 shadow-sm">
        <h2 class="text-center mb-4">Вход</h2>
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
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import api, { loginUser, getProfile } from '@/api'

export default {
  setup() {
    const router = useRouter();
    const store = useStore();
    const username = ref('');
    const password = ref('');
    const errorMessage = ref('');

    const login = async () => {
      errorMessage.value = '';
      console.log('НАЖАЛИ ЛОГИН');

      try {
        const response = await loginUser(username.value, password.value);
        console.log('Получили ответ на логин:', response.data);
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);

        const userResponse = await api.get('/users/me');
        console.log('Получили пользователя:', userResponse.data);
        const user = userResponse.data;
        store.commit('setUser', user);
        localStorage.setItem('user', JSON.stringify(user));

        // ---- Редиректим по роли ----
        if (user.role_id === 1) {
          router.push('/create'); // Админ/организатор
        } else if (user.role_id === 2) {
          router.push('/profile-coach'); // Тренер
        } else if (user.role_id === 3) {
          router.push('/profile-participant'); // Участник
        } else {
          router.push('/'); // fallback
        }
      } catch (err) {
        console.error('Ошибка логина:', err);
        errorMessage.value = 'Неверный логин или пароль';
      }
    };

    return { username, password, errorMessage, login };
  }
};
</script>
