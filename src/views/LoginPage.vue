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

        <!-- Ссылки на регистрацию -->
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
import { useStore } from 'vuex';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
    const username = ref('');
    const password = ref('');
    const errorMessage = ref('');

    const login = () => {
      // Получаем динамически зарегистрированных пользователей
      const registered = JSON.parse(localStorage.getItem('registeredUsers')) || [];

      // Статически встроенные пользователи
      const staticUsers = [
        {
          username: 'admin',
          password: 'admin123',
          role: 'organizer',
          fullName: 'Администратор',
          city: 'Москва',
          country: 'Россия',
          email: 'admin@arena.ru'
        },
        {
          username: 'judge',
          password: 'judge123',
          role: 'judge',
          fullName: 'Судья',
          city: 'Сочи',
          country: 'Россия',
          email: 'judge@arena.ru'
        }
      ];

      // Объединяем всех
      const users = [...staticUsers, ...registered];

      // Поиск пользователя
      const user = users.find(
        u => u.username === username.value && u.password === password.value
      );

      if (user) {
        store.commit('setUser', user);

        // Перенаправление по роли
        switch (user.role) {
          case 'organizer':
          case 'admin':
            router.push('/create');
            break;
          case 'participant':
            router.push('/profile-participant');
            break;
          case 'coach':
            router.push('/profile-coach');
            break;
          default:
            errorMessage.value = 'Неизвестная роль';
        }
      } else {
        errorMessage.value = 'Неверный логин или пароль';
      }
    };

    return {
      username,
      password,
      errorMessage,
      login
    };
  }
};
</script>
