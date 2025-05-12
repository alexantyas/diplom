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
  
          <button @click="login" class="btn btn-primary w-100">
            Войти
          </button>
          <p class="text-center mt-3">
            Вы участник?
           <router-link to="/register-participant">Зарегистрироваться</router-link>
          </p>
          <p class="text-center">
             Вы тренер?
          <router-link to="/register-coach">Зарегистрироваться</router-link>
          </p>

          <div v-if="errorMessage" class="alert alert-danger mt-3">
            {{ errorMessage }}
          </div>
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
      const store = useStore(); // ✅ Vuex-хранилище
      const router = useRouter(); // ✅ Роутер
      const username = ref('');
      const password = ref('');
      const errorMessage = ref('');
  
      const login = () => {
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

        const user = users.find(u => u.username === username.value && u.password === password.value);

        if (user) {
          store.commit('setUser', user);
            // Роутинг по ролям
        switch (user.role) {
            case 'organizer':
            case 'admin':
            router.push('/create');
            break;
            case 'participant':
            case 'coach':
            router.push('/competitions'); // 🔜 нужно создать такую страницу
            break;
            default:
            errorMessage.value = 'Неизвестная роль';
          }
        } else {
          errorMessage.value = 'Неверный логин или пароль';
        }
      };
  
      return { username, password, errorMessage, login };
    }
  };
  </script>
  