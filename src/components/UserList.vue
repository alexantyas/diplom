<template>
  <div class="user-list">
    <h2>Список пользователей</h2>
    
    <div v-if="loading" class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <template v-else>
      <data-table
        :columns="columns"
        :items="users"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </template>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import DataTable from './DataTable.vue'

export default {
  name: 'UserList',
  components: {
    DataTable
  },
  setup() {
    const store = useStore()

    const columns = [
      { key: 'name', label: 'Имя' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Роль' }
    ]

    const users = computed(() => store.getters.getUsers)
    const loading = computed(() => store.getters.isLoading)
    const error = computed(() => store.getters.getError)

    const handleEdit = (user) => {
      store.dispatch('updateUser', {
        id: user.id,
        userData: user
      })
    }

    const handleDelete = (user) => {
      if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        store.dispatch('deleteUser', user.id)
      }
    }

    // Загружаем данные при монтировании компонента
    store.dispatch('fetchUsers')

    return {
      columns,
      users,
      loading,
      error,
      handleEdit,
      handleDelete
    }
  }
}
</script> 