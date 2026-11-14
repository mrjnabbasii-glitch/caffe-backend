<template>
  <form class="auth-form" dir="rtl" @submit.prevent="submit">
    <h1>{{ registering ? 'ثبت‌نام' : 'ورود' }}</h1>
    <p class="auth-description">
      {{
        registering
          ? 'برای رزرو میز در کافه آرامش ثبت‌نام کنید.'
          : 'برای دیدن رزروها و رزرو میز وارد شوید.'
      }}
    </p>
    <template v-if="registering">
      <label for="auth-username">نام کاربری</label>
      <input
        id="auth-username"
        v-model="username"
        name="username"
        autocomplete="username"
        dir="auto"
        required
        minlength="3"
        maxlength="30"
        aria-describedby="username-hint"
        :disabled="auth.busy"
      />
      <small id="username-hint">۳ تا ۳۰ حرف، عدد یا زیرخط؛ شروع با حرف</small>
      <label for="auth-email">ایمیل</label>
      <input
        id="auth-email"
        v-model="email"
        name="email"
        type="email"
        dir="ltr"
        autocomplete="email"
        required
        maxlength="254"
        :disabled="auth.busy"
      />
    </template>
    <template v-else>
      <label for="auth-identifier">نام کاربری یا ایمیل</label>
      <input
        id="auth-identifier"
        v-model="identifier"
        name="username"
        autocomplete="username"
        dir="auto"
        required
        maxlength="254"
        :disabled="auth.busy"
      />
    </template>
    <label for="auth-password">رمز عبور</label>
    <div class="password-field">
      <input
        id="auth-password"
        v-model="password"
        name="password"
        :type="visible ? 'text' : 'password'"
        dir="ltr"
        :autocomplete="registering ? 'new-password' : 'current-password'"
        required
        minlength="8"
        maxlength="128"
        :disabled="auth.busy"
      />
      <button
        type="button"
        class="password-toggle"
        :aria-label="visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        {{ visible ? 'پنهان' : 'نمایش' }}
      </button>
    </div>
    <template v-if="registering">
      <label for="auth-confirm">تکرار رمز عبور</label>
      <input
        id="auth-confirm"
        v-model="confirmation"
        name="confirmation"
        type="password"
        dir="ltr"
        autocomplete="new-password"
        required
        minlength="8"
        maxlength="128"
        :disabled="auth.busy"
      />
      <small>رمز عبور باید حداقل ۸ نویسه داشته باشد.</small>
    </template>
    <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
    <p v-if="!registering" class="auth-switch recovery-link">
      <router-link to="/forgot-password">رمز عبور را فراموش کرده‌اید؟</router-link>
    </p>
    <button class="auth-submit" type="submit" :disabled="auth.busy">
      {{ auth.busy ? 'لطفاً صبر کنید…' : registering ? 'ساخت حساب' : 'ورود به حساب' }}
    </button>
    <p class="auth-switch">
      {{ registering ? 'حساب دارید؟' : 'حساب ندارید؟' }}
      <router-link :to="{ path: registering ? '/login' : '/register', query: route.query }">{{
        registering ? 'وارد شوید' : 'ثبت‌نام کنید'
      }}</router-link>
    </p>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useBookingStore } from '../stores/bookingStore'
import { safeRedirect } from '../router'

const props = defineProps({ registering: Boolean })
const auth = useAuthStore()
const booking = useBookingStore()
const route = useRoute()
const router = useRouter()
const email = ref('')
const username = ref('')
const identifier = ref('')
const password = ref('')
const confirmation = ref('')
const visible = ref(false)
const error = ref('')

async function submit() {
  if (auth.busy) return
  error.value = ''
  if (props.registering && password.value !== confirmation.value) {
    error.value = 'تکرار رمز عبور با رمز عبور یکسان نیست.'
    return
  }
  try {
    await auth.authenticate(props.registering ? 'signup' : 'login', {
      ...(props.registering
        ? { username: username.value, email: email.value }
        : { identifier: identifier.value }),
      password: password.value
    })
    password.value = ''
    confirmation.value = ''
    booking.clearPrivateData()
    await router.replace(safeRedirect(route.query.redirect))
  } catch (cause) {
    error.value = cause.message
  }
}
</script>

<style scoped src="../assets/auth-form.css"></style>
