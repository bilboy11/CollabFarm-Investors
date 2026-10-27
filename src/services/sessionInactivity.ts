import type { Router } from 'vue-router'

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart'] as const

let inactivityTimer: ReturnType<typeof setTimeout> | undefined
let isTracking = false

function clearInactivityTimer() {
  if (inactivityTimer !== undefined) {
    clearTimeout(inactivityTimer)
    inactivityTimer = undefined
  }
}

function resetInactivityTimer(router: Router) {
  clearInactivityTimer()
  if (!localStorage.getItem('access_token')) return

  inactivityTimer = setTimeout(() => {
    localStorage.removeItem('access_token')
    clearInactivityTimer()
    void router.replace('/login')
  }, INACTIVITY_TIMEOUT_MS)
}

function onUserActivity(router: Router) {
  resetInactivityTimer(router)
}

export function startSessionInactivityTracking(router: Router) {
  if (isTracking) return () => stopSessionInactivityTracking()

  const handleActivity = () => onUserActivity(router)
  for (const event of ACTIVITY_EVENTS) {
    window.addEventListener(event, handleActivity, { passive: true })
  }
  isTracking = true

  return () => {
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, handleActivity)
    }
    isTracking = false
    clearInactivityTimer()
  }
}

export function setSessionInactivityActive(router: Router, active: boolean) {
  if (active) resetInactivityTimer(router)
  else clearInactivityTimer()
}

export function stopSessionInactivityTracking() {
  clearInactivityTimer()
}
