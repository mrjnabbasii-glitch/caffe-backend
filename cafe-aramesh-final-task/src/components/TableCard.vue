<template>
  <article class="table-card" :class="{ 'table-card-preferred': preferred }">
    <img
      v-if="tablePhotos[table.id]"
      class="table-card-photo"
      :src="tablePhotos[table.id]"
      alt=""
      loading="lazy"
      width="500"
      height="330"
    />
    <div class="table-card-details">
      <div class="table-card-content">
        <div class="table-card-icon"><q-icon name="event_seat" size="25px" /></div>
        <div>
          <h2>{{ table.title }}</h2>
          <p class="table-card-meta">
            <span>{{ table.capacity.toLocaleString('fa-IR') }} نفر</span>
            <span aria-hidden="true">·</span>
            <span>{{ table.price.toLocaleString('fa-IR') }} تومان</span>
          </p>
        </div>
      </div>
      <div class="table-card-actions">
        <span class="table-status" :class="{ 'table-status-unavailable': unavailable }">{{
          status
        }}</span>
        <q-btn
          :disable="unavailable || busy"
          class="cafe-btn text-white"
          :label="preferred ? 'ادامهٔ رزرو' : 'انتخاب میز'"
          unelevated
          @click="$emit('select', table)"
        />
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { tablePhotos } from '../assets/cafePhotos'

const props = defineProps({
  table: { type: Object, required: true },
  busy: Boolean,
  preferred: Boolean
})

defineEmits(['select'])

const unavailable = computed(() => props.table.isReserved || props.table.isLocked)
const status = computed(() =>
  props.table.isReserved ? 'رزرو شده' : props.table.isLocked ? 'قفل موقت' : 'آمادهٔ رزرو'
)
</script>
