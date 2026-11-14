<template>
  <form class="auth-form" dir="rtl" @submit.prevent="submit">
    <h1>{{ reset ? 'رمز جدید' : 'بازیابی رمز' }}</h1>
    <p class="auth-description">
      {{ reset ? 'رمز جدیدی برای حساب خود انتخاب کنید.' : 'ایمیل ثبت‌شدهٔ حساب را وارد کنید.' }}
    </p>
    <template v-if="!message">
      <template v-if="!reset">
        <label for="recovery-email">ایمیل</label>
        <input
          id="recovery-email"
          v-model="email"
          name="email"
          type="email"
          dir="ltr"
          autocomplete="email"
          maxlength="254"
          required
          :disabled="busy"
        />
      </template>
      <template v-else>
        <label for="recovery-password">رمز عبور جدید</label>
        <input
          id="recovery-password"
          v-model="password"
          name="password"
          type="password"
          dir="ltr"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          :disabled="busy"
        />
        <label for="recovery-confirm">تکرار رمز عبور</label>
        <input
          id="recovery-confirm"
          v-model="confirmation"
          name="confirmation"
          type="password"
          dir="ltr"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          :disabled="busy"
        />
        <small>حداقل ۸ نویسه وارد کنید. بعد از تغییر رمز، دوباره وارد شوید.</small>
      </template>
      <p v-if="error || (reset && !token)" class="auth-error" role="alert">
        {{ error || 'لینک بازیابی نامعتبر است. درخواست تازه‌ای ثبت کنید.' }}
      </p>
      <button class="auth-submit" type="submit" :disabled="busy || (reset && !token)">
        {{ busy ? 'لطفاً صبر کنید…' : reset ? 'ذخیرهٔ رمز جدید' : 'دریافت لینک بازیابی' }}
      </button>
    </template>
    <p v-else class="auth-message" role="status">{{ message }}</p>
    <p v-if="reset" class="auth-switch">
      <router-link to="/forgot-password">درخواست لینک تازه</router-link>
    </p>
    <p class="auth-switch"><router-link to="/login">بازگشت به ورود</router-link></p>
  </form>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useBookingStore } from '../stores/bookingStore'
const props = defineProps({ reset: Boolean })
const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const confirmation = ref('')
const busy = ref(false)
const error = ref('')
const message = ref('')
const token = computed(() => new URLSearchParams(route.hash.slice(1)).get('token') || '')
async function submit() {
  if (busy.value || (props.reset && !token.value)) return
  error.value = ''
  if (props.reset && password.value !== confirmation.value) {
    error.value = 'تکرار رمز عبور یکسان نیست.'
    return
  }
  busy.value = true
  try {
    const data = await request(
      'post',
      props.reset ? '/auth/reset-password' : '/auth/forgot-password',
      props.reset ? { token: token.value, password: password.value } : { email: email.value }
    )
    message.value = data.message
    if (props.reset) {
      password.value = ''
      confirmation.value = ''
      useAuthStore().clear()
      useBookingStore().clearPrivateData()
      await router.replace('/reset-password')
    }
  } catch (cause) {
    error.value = cause.message
  } finally {
    busy.value = false
  }
}
</script>
<style scoped src="../assets/auth-form.css"></style>
<style scoped>
.auth-message {
  color: #c8e7ff;
  background: #102b48;
  padding: 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 2;
}
</style>
