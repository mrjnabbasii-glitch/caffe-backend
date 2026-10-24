<template>
  <MainLayout>
    <q-page class="cafe-bg">
      <section class="hero-section flex flex-center text-center q-pa-xl">
        <div class="page-width">
          <div class="text-overline text-brown-8">کافه آرامش</div>
          <h1 class="hero-title text-h2 text-weight-bold q-my-md">
            «هر فنجان، یک حال خوب»
          </h1>
          <p class="text-subtitle1">
            جایی برای یک نوشیدنی خوش‌طعم، غذای دلچسب و چند ساعت آرامش.
          </p>

          <div class="row justify-center q-gutter-md q-mt-lg">
            <q-btn
              label="رزرو میز"
              icon="event_seat"
              class="cafe-btn text-white"
              unelevated
              to="/reservation"
            />
            <q-btn
              label="مشاهده منو"
              icon="restaurant_menu"
              color="brown-4"
              unelevated
              to="/menu"
            />
          </div>
        </div>
      </section>

      <q-page-sticky position="bottom-right" :offset="[18, 18]" />

      <section class="page-width q-py-xl">
        <div class="text-h5 text-center text-weight-bold cafe-brown q-mb-lg">
          پیشنهادهای کافه
        </div>

        <div class="row q-col-gutter-lg">
          <div v-for="item in suggestions" :key="item.title" class="col-12 col-sm-4">
            <q-card class="cafe-card text-center" flat bordered>
              <q-card-section>
                <div class="text-h2">{{ item.icon }}</div>
                <div class="text-h6 q-mt-sm">{{ item.title }}</div>
                <p>{{ item.description }}</p>
              </q-card-section>
              <q-card-actions align="center">
                <q-btn flat color="brown" label="مشاهده منو" to="/menu" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </section>
    </q-page>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../layouts/MainLayout.vue'

const suggestions = [
  { icon: '☕', title: 'کاپوچینو', description: 'قهوه‌ای خوش‌عطر با فوم شیر نرم و لطیف.' },
  { icon: '🍰', title: 'کیک شکلاتی', description: 'یک انتخاب شیرین برای کامل کردن لحظه‌های شما.' },
  { icon: '🍝', title: 'پاستا', description: 'غذایی گرم و دلچسب برای یک دورهمی خوب.' }
]
</script>