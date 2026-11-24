'use client'
import { useEffect, useState } from 'react'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { app, getDb } from './firebase'
import type { Settings } from './settings'

// Phone alerts (web push). Each phone that turns them on is saved at users/{uid}/devices/{id}
// with its push token and its own Profile switches. netlify/functions/send-alerts.mts sends to it.

export type PushState = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on'

const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
const LOCAL = 'tn_push' // { uid, id } once this phone is turned on
const EVENT = 'tn-push-change'

type Saved = { uid: string; id: string }

function saved(): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(LOCAL) || 'null')
  } catch {
    return null
  }
}
function remember(v: Saved | null) {
  try {
    if (v) localStorage.setItem(LOCAL, JSON.stringify(v))
    else localStorage.removeItem(LOCAL)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

async function supported() {
  if (!VAPID || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false
  const { isSupported } = await import('firebase/messaging')
  return isSupported().catch(() => false)
}

export async function pushState(uid: string): Promise<PushState> {
  if (isIos() && !isInstalled()) return 'ios-install' // Apple only allows alerts for Home Screen apps
  if (!(await supported())) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const s = saved()
  return Notification.permission === 'granted' && s?.uid === uid ? 'on' : 'off'
}

const prefsOf = (s: Settings) => ({ notify: s.notify, notifyLate: s.notifyLate, notifyDeadline: s.notifyDeadline })

async function register(uid: string, s: Settings) {
  const { getMessaging, getToken } = await import('firebase/messaging')
  const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' })
  const token = await getToken(getMessaging(app()), { vapidKey: VAPID, serviceWorkerRegistration: reg })
  const id = saved()?.id || crypto.randomUUID()
  await setDoc(doc(getDb(), 'users', uid, 'devices', id), {
    token,
    ...prefsOf(s),
    ua: navigator.userAgent.slice(0, 160),
    updatedAt: serverTimestamp(),
  })
  remember({ uid, id })
}

// Call straight from a button tap: phones only show the permission question after a tap.
export async function enablePush(uid: string, s: Settings): Promise<PushState> {
  const answer = await Notification.requestPermission()
  if (answer !== 'granted') return answer === 'denied' ? 'denied' : 'off'
  await register(uid, s)
  return 'on'
}

// On log out: stop alerts for this account on this phone
export async function disablePush(uid: string) {
  const s = saved()
  if (!s || s.uid !== uid) return
  try {
    await deleteDoc(doc(getDb(), 'users', uid, 'devices', s.id))
    const { deleteToken, getMessaging } = await import('firebase/messaging')
    await deleteToken(getMessaging(app()))
  } catch {}
  remember(null)
}

// Live state for a screen. Re-checks when alerts are turned on or off anywhere in the app.
export function usePush(uid: string | undefined): [PushState, (s: PushState) => void] {
  const [state, setState] = useState<PushState>('loading')
  useEffect(() => {
    if (!uid) return
    const check = () => pushState(uid).then(setState).catch(() => setState('unsupported'))
    check()
    window.addEventListener(EVENT, check)
    return () => window.removeEventListener(EVENT, check)
  }, [uid])
  return [state, setState]
}

// Keeps the saved phone up to date: a fresh token now and then, and the Profile switches.
export function useKeepPushFresh(uid: string | undefined, s: Settings, ready: boolean) {
  const key = `${s.notify}${s.notifyLate}${s.notifyDeadline}`
  useEffect(() => {
    if (!uid || !ready || saved()?.uid !== uid) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    register(uid, s).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key, ready])
}

// "Not now" on a case: don't ask again on that case
const SKIP = 'tn_alert_skip'
export function skippedAsk(caseId: string) {
  try {
    return (JSON.parse(localStorage.getItem(SKIP) || '[]') as string[]).includes(caseId)
  } catch {
    return false
  }
}
export function skipAsk(caseId: string) {
  try {
    const ids = JSON.parse(localStorage.getItem(SKIP) || '[]') as string[]
    localStorage.setItem(SKIP, JSON.stringify([...ids, caseId].slice(-100)))
  } catch {}
}