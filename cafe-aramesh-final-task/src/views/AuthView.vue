<template>
  <AuthLayout>
    <PasswordRecoveryForm
      v-if="mode === 'forgot-password' || mode === 'reset-password'"
      :key="mode"
      :reset="mode === 'reset-password'"
    />
    <AuthForm v-else :key="mode" :registering="mode === 'register'" />
  </AuthLayout>
</template>

<script setup>
import AuthLayout from '../layouts/AuthLayout.vue'
import AuthForm from '../components/AuthForm.vue'
import PasswordRecoveryForm from '../components/PasswordRecoveryForm.vue'

defineProps({ mode: { type: String, required: true } })
</script>
