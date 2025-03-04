<template>
  <div class="table-responsive">
    <table class="table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            {{ column.label }}
          </th>
          <th v-if="hasActions">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td v-for="column in columns" :key="column.key">
            {{ item[column.key] }}
          </td>
          <td v-if="hasActions">
            <slot name="actions" :item="item">
              <base-button
                variant="info"
                @click="$emit('edit', item)"
              >
                Редактировать
              </base-button>
              <base-button
                variant="danger"
                @click="$emit('delete', item)"
              >
                Удалить
              </base-button>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import BaseButton from './ui/BaseButton.vue'

export default {
  name: 'DataTable',
  components: {
    BaseButton
  },
  props: {
    columns: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    },
    hasActions: {
      type: Boolean,
      default: true
    }
  }
}
</script> 