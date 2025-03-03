<template>
  <div class="container-fluid mt-3">
    <!-- Фильтр по весовой категории -->
    <div class="row mb-4">
      <div class="col-md-6">
        <label class="form-label">Выберите весовую категорию</label>
        <select v-model="selectedCategory" class="form-select">
          <option value="">Выберите категорию</option>
          <option v-for="category in uniqueCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
    </div>

    <!-- Отображение сетки -->
    <div v-if="selectedCategory" class="bracket-container">
      <h4 class="mb-3">Сетка соревнований: {{ selectedCategory }}</h4>
      
      <!-- Заглушка для будущей сетки -->
      <div class="bracket-placeholder">
        <div class="alert alert-info">
          <h5>🏆 Сетка соревнований</h5>
          <p>Здесь будет отображаться турнирная сетка для выбранной весовой категории.</p>
          <ul>
            <li>Количество участников: {{ participantsInCategory.length }}</li>
            <li>Количество схваток: {{ matchesInCategory.length }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Сообщение, если категория не выбрана -->
    <div v-else class="alert alert-warning">
      Пожалуйста, выберите весовую категорию для отображения сетки
    </div>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { computed, ref } from 'vue';

export default {
  name: 'BracketPage',
  
  setup() {
    const store = useStore();
    const selectedCategory = ref('');

    // Получаем данные из store
    const participants = computed(() => store.state.participants || []);
    const schedule = computed(() => store.state.schedule || []);

    // Получаем уникальные категории
    const uniqueCategories = computed(() => {
      const categories = new Set(participants.value.map(p => p.weight + ' кг'));
      return Array.from(categories).sort((a, b) => 
        parseFloat(a) - parseFloat(b)
      );
    });

    // Фильтруем участников по выбранной категории
    const participantsInCategory = computed(() => {
      if (!selectedCategory.value) return [];
      return participants.value.filter(p => 
        p.weight + ' кг' === selectedCategory.value
      );
    });

    // Фильтруем схватки по выбранной категории
    const matchesInCategory = computed(() => {
      if (!selectedCategory.value) return [];
      return schedule.value.filter(m => 
        m.category === selectedCategory.value
      );
    });

    // Будущие методы для работы с сеткой
    const generateBracket = () => {
      // Здесь будет логика генерации сетки
      console.log('Генерация сетки для категории:', selectedCategory.value);
    };

    const updateBracket = () => {
      // Здесь будет логика обновления сетки
      console.log('Обновление сетки для категории:', selectedCategory.value);
    };

    return {
      selectedCategory,
      uniqueCategories,
      participantsInCategory,
      matchesInCategory,
      generateBracket,
      updateBracket
    };
  }
};
</script>

<style scoped>
.bracket-container {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  min-height: 500px;
}

.bracket-placeholder {
  border: 2px dashed #dee2e6;
  padding: 20px;
  border-radius: 8px;
  background-color: white;
}

/* Будущие стили для сетки */
.tournament-bracket {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.round {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.match {
  margin: 10px;
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: white;
}

.winner {
  font-weight: bold;
  color: #28a745;
}
</style> 