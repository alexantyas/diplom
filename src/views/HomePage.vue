<template>
    <div class="container text-center mt-5">
      <!-- Уведомление -->
      <div class="alert alert-success" role="alert">
        User added.
      </div>
  
      <!-- Кнопки управления -->
      <div class="d-flex flex-column align-items-center">
        <!-- Переход через router-link -->
        <router-link to="/create" class="btn btn-success btn-lg">
          Создать соревнование
        </router-link>
  
        <a href="#" class="mt-2 text-danger text-decoration-none">
          > Импортировать соревнование
        </a>
      </div>
    </div>
  </template>
  