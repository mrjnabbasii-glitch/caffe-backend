<template>
  <q-card
    flat
    bordered
    class="table-card cafe-card"
    :class="{ 'is-reserved': table.isReserved || table.isLocked }"
    @click="handleClick"
  >
    <q-card-section class="text-center">
      <div class="text-h6 cafe-brown">{{ table.title }}</div>
      <div class="text-body2 q-mt-sm">ظرفیت: {{ table.capacity }} نفر</div>

      <q-badge
        v-if="table.isReserved"
        color="negative"
        class="q-mt-md q-pa-sm"
      >
        رزرو شده
      </q-badge>

      <q-badge
        v-else-if="table.isLocked"
        color="orange"
        class="q-mt-md q-pa-sm"
      >
        رزرو موقت
      </q-badge>

      <q-badge
        v-else
        color="positive"
        class="q-mt-md q-pa-sm"
      >
        آماده رزرو
      </q-badge>
    </q-card-section>

    <q-card-actions align="center">
      <q-btn
        :disable="table.isReserved || table.isLocked"
        class="cafe-btn text-white"
        label="رزرو این میز"
        unelevated
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
const props = defineProps({
  table: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select'])

function handleClick() {
  if (!props.table.isReserved && !props.table.isLocked) {
    emit('select', props.table)
  }
}
</script>