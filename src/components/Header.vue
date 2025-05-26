<template>
  <!-- ... existing template ... -->
</template>

<script>
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useBracketStore } from '@/store/bracket'

export default {
  name: 'Header',
  setup() {
    const store = useStore()
    const router = useRouter()
    const bracketStore = useBracketStore()

    const logout = async () => {
      try {
        // Очищаем все данные через bracketStore
        await bracketStore.clearAllData()
        
        // Перенаправляем на страницу входа
        router.push('/login')
      } catch (error) {
        console.error('Ошибка при выходе:', error)
      }
    }

    return {
      logout
    }
  }
}
</script>

<style scoped>
/* ... existing styles ... */
</style> 