<template>
  <div class="container d-flex justify-content-center align-items-center min-vh-100">
    <div class="col-md-5">
      <h2 class="text-center mb-4">Регистрация тренера</h2>
      <div class="card p-4 shadow-sm">
        <input v-model="form.last_name" class="form-control mb-2" placeholder="Фамилия" />
        <input v-model="form.first_name" class="form-control mb-2" placeholder="Имя" />
        <input v-model="form.middle_name" class="form-control mb-2" placeholder="Отчество" />
        <input v-model="form.birth_date" class="form-control mb-2" placeholder="Дата рождения (YYYY-MM-DD)" />
        <input v-model="form.phone" class="form-control mb-2" placeholder="Телефон" />
        <input v-model="form.email" class="form-control mb-2" placeholder="Электронная почта" />
        <input v-model="form.organization" class="form-control mb-2" placeholder="Организация" />
        <input v-model="form.username" class="form-control mb-2" placeholder="Логин" required />
        <input v-model="form.password" class="form-control mb-2" placeholder="Пароль" type="password" required />

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
import { createUser } from '@/api/userService';
import { createAdditionalInfo } from '@/api/additionalInfoService';

export default {
  setup() {
    const router = useRouter();
    const consent = ref(false);

    const form = ref({
      last_name: '',
      first_name: '',
      middle_name: '',
      birth_date: '',
      phone: '',
      email: '',
      organization: '',
      username: '',
      password: '',
      city_id: 1,
      country_id: 1,
    });

    const register = async () => {
      if (!consent.value) {
        alert('Подтвердите согласие на обработку данных!');
        return;
      }
      try {
        // Создать пустую дополнительную информацию
        const infoRes = await createAdditionalInfo({
          height: null,
          weight: null,
          rank: null,
          gender: null
        });
        const additional_info_id = infoRes.data.id;

        await createUser({
          first_name: form.value.first_name,
          last_name: form.value.last_name,
          middle_name: form.value.middle_name,
          birth_date: form.value.birth_date,
          phone: form.value.phone,
          email: form.value.email,
          organization: form.value.organization,
          login: form.value.username,
          password: form.value.password,
          role_id: 2, // Coach
          city_id: Number(form.value.city_id),
          country_id: Number(form.value.country_id),
          additional_info_id
        });

        alert('Регистрация успешна!');
        router.push('/login');
      } catch (error) {
        alert('Ошибка регистрации: ' + (error.response?.data?.detail || 'ошибка сети'));
      }
    };

    return { form, register, consent };
  }
};
</script>
