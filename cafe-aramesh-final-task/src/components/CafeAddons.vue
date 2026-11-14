<template>
  <div>
    <div class="text-subtitle1 text-weight-bold q-mb-sm">پکیج پذیرایی</div>

    <div v-for="item in items" :key="item.id" class="row items-center justify-between q-py-sm">
      <q-checkbox
        :model-value="isSelected(item.id)"
        :label="`${item.title} - ${formatPrice(item.price)}`"
        @update:model-value="toggleItem(item)"
      />

      <div v-if="isSelected(item.id)" class="row items-center">
        <q-btn round dense flat icon="remove" @click="changeQuantity(item, -1)" />
        <span class="q-px-sm">{{ quantity(item.id) }}</span>
        <q-btn
          round
          dense
          flat
          icon="add"
          :disable="quantity(item.id) >= 20"
          @click="changeQuantity(item, 1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

function isSelected(id) {
  return props.modelValue.some((item) => item.id === id)
}

function quantity(id) {
  return props.modelValue.find((item) => item.id === id)?.quantity || 0
}

function toggleItem(item) {
  if (isSelected(item.id)) {
    emit(
      'update:modelValue',
      props.modelValue.filter((selected) => selected.id !== item.id)
    )
  } else {
    emit('update:modelValue', [...props.modelValue, { ...item, quantity: 1 }])
  }
}

function changeQuantity(item, amount) {
  const current = quantity(item.id)
  const next = current + amount

  if (next <= 0) {
    emit(
      'update:modelValue',
      props.modelValue.filter((selected) => selected.id !== item.id)
    )
    return
  }

  emit(
    'update:modelValue',
    props.modelValue.map((selected) =>
      selected.id === item.id ? { ...selected, quantity: next } : selected
    )
  )
}

function formatPrice(value) {
  return `${value.toLocaleString('fa-IR')} تومان`
}
</script>
