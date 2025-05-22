<template>
  <div style="background-color: #e0dcd5; min-height: 100vh;">
  <div class="container d-flex justify-content-center align-items-center min-vh-100">
    <div class="col-md-5">
      <h2 class="text-center mb-4">Регистрация участника</h2>
      <div class="card p-4 shadow-sm">
        <input v-model="form.fullName" class="form-control mb-2" placeholder="ФИО" />
        <input v-model="form.birthDate" class="form-control mb-2" placeholder="Дата рождения" />
        <input v-model="form.city_id" class="form-control mb-2" placeholder="ID города" />
        <input v-model="form.country_id" class="form-control mb-2" placeholder="ID страны" />
        <input v-model="form.weight" class="form-control mb-2" placeholder="Весовая категория" />
        <input v-model="form.rank" class="form-control mb-2" placeholder="Ранг" />
        <input v-model="form.gender" class="form-control mb-2" placeholder="Пол" />
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
      fullName: '',
      birthDate: '',
      city_id: 1,
      country_id: 1,
      weight: '',
      rank: '',
      gender: '',
      phone: '',
      email: '',
      organization: '',
      username: '',
      password: ''
    });

    const register = async () => {
      if (!consent.value) {
        alert("Подтвердите согласие на обработку данных");
        return;
      }

      const nameParts = form.value.fullName.trim().split(' ');
      const [last_name, first_name, middle_name = ''] = nameParts;

      try {
        const infoRes = await createAdditionalInfo({
          height: null, // если появится — добавишь поле
          weight: form.value.weight || null,
          rank: form.value.rank || null,
          gender: form.value.gender || null
        });
        const additional_info_id = infoRes.data.id;

        await createUser({
          first_name,
          last_name,
          middle_name,
          birth_date: form.value.birthDate,
          phone: form.value.phone,
          email: form.value.email,
          organization: form.value.organization,
          login: form.value.username,
          password: form.value.password,
          role_id: 3, // Participant
          city_id: Number(form.value.city_id),
          country_id: Number(form.value.country_id),
          additional_info_id
        });

        alert('Регистрация успешна!');
        router.push('/login');
      } catch (err) {
        alert('Ошибка регистрации: ' + (err.response?.data?.detail || 'ошибка сети'));
      }
    };

    return { form, register, consent };
  }
};
</script>
