<template>
  <div class="container d-flex justify-content-center align-items-center min-vh-100">
    <div class="col-md-6">
      <h2 class="text-center mb-4">Создание соревнования</h2>

      <div class="card p-4 shadow-sm">
        <h4 class="mb-3">Основная информация</h4>

        <div class="mb-3">
          <label class="form-label">Название</label>
          <input v-model="competition.name" type="text" class="form-control" placeholder="Введите название">
        </div>

        <div class="mb-3">
          <label class="form-label">Город</label>
          <input v-model="competition.city" type="text" class="form-control" placeholder="Введите город">
        </div>

        <div class="mb-3">
          <label class="form-label">Страна</label>
          <select v-model="competition.country" class="form-select">
            <option>Швейцария</option>
            <option>Россия</option>
            <option>США</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Дата начала</label>
          <input v-model="competition.startDate" type="date" class="form-control">
        </div>

        <div class="mb-3">
          <label class="form-label">Тип соревнования</label>
          <select v-model="competition.type" class="form-select">
            <option>Чемпионат континента</option>
            <option>Международный турнир</option>
            <option>Национальный турнир</option>
          </select>
        </div>

        <div class="d-flex justify-content-between mt-3">
          <router-link to="/" class="btn btn-secondary btn-lg">Назад</router-link>
          <button @click="saveCompetition" class="btn btn-primary btn-lg">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      competition: {
        name: '',
        city: '',
        country: '',
        startDate: '',
        type: ''
      }
    };
  },
  methods: {
    saveCompetition() {
      if (this.competition.name && this.competition.city && this.competition.startDate) {
        console.log("Создано соревнование:", this.competition);
        this.$router.push('/dashboard');
      } else {
        alert('Пожалуйста, заполните все поля!');
      }
    }
  }
};
</script>
