import { computed, onUnmounted, ref } from 'vue'

export function useBookingTimer(onExpired) {
  const remainingSeconds = ref(300)
  let timer = null

  const formattedTime = computed(() => {
    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = remainingSeconds.value % 60

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function start(expiresAt) {
    stop()
    const deadline = expiresAt ? new Date(expiresAt).getTime() : Date.now() + 300000
    remainingSeconds.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))

    timer = setInterval(() => {
      remainingSeconds.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))

      if (remainingSeconds.value === 0) {
        stop()
        onExpired?.()
      }
    }, 1000)
  }

  onUnmounted(stop)

  return {
    remainingSeconds,
    formattedTime,
    start,
    stop
  }
}
