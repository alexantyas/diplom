<template>
  <div class="category-selector">
    <h2>Турнирная сетка</h2>
    <div class="weight-selector">
      <span>Выберите весовую категорию:</span>
      <div class="weight-buttons">
        <base-button
          v-for="weight in categories"
          :key="weight"
          :variant="selectedCategory === weight ? 'primary' : 'outline-primary'"
          @click="$emit('select', weight)"
        >
          {{ weight }}
        </base-button>
      </div>
    </div>
  </div>
</template>

<script>
import BaseButton from '@/components/ui/BaseButton.vue'

export default {
  name: 'CategorySelector',
  components: {
    BaseButton
  },
  props: {
    categories: {
      type: Array,
      required: true
    },
    selectedCategory: {
      type: String,
      default: ''
    }
  },
  emits: ['select']
}
</script>

<style scoped>
.category-selector {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.weight-selector {
  margin-top: 20px;
}

.weight-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}
</style> 