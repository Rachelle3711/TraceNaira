// Sends phone alerts every 5 minutes: a transfer is late, a refund is due in 2 hours, or a refund is overdue.
// The text comes from lib/alerts.ts, the same as the Notifications screen.
// Needs FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Netlify's environment variables.
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, type DocumentReference } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { caseAlerts, quietNow, wants, type AlertCase, type AlertPrefs } from '../../lib/alerts'

export const config = { schedule: '*/5 * * * *' }

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
const db = getFirestore(app)

type Phone = { ref: DocumentReference; token: string; prefs: AlertPrefs }
const ms = (v: unknown) => (v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : 0)

export default async () => {
  const now = Date.now()
  // 10pm to 7am: send nothing. Anything due waits and goes out at 7am.
  if (quietNow(now)) return new Response('quiet hours')

  // Every phone with alerts on, grouped by account
  const phones = new Map<string, Phone[]>()
  for (const d of (await db.collectionGroup('devices').get()).docs) {
    const uid = d.ref.parent.parent?.id
    const x = d.data()
    if (!uid || !x.token) continue
    const prefs = { notify: x.notify !== false, notifyLate: x.notifyLate !== false, notifyDeadline: x.notifyDeadline !== false }
    phones.set(uid, [...(phones.get(uid) ?? []), { ref: d.ref, token: x.token, prefs }])
  }

  let sent = 0
  for (const [uid, list] of phones) {
    const open = await db.collection('users').doc(uid).collection('cases').where('status', 'in', ['processing', 'awaiting_reversal']).get()
    for (const doc of open.docs) {
      const x = doc.data()
      const c: AlertCase = { id: doc.id, amount: x.amount, from: x.from, to: x.to, type: x.type, status: x.status, sentAt: ms(x.sentAt) }
      if (!c.sentAt) continue
      const done: string[] = x.alerted ?? []
      const fresh = caseAlerts(c, now, undefined, 'Africa/Lagos').filter((a) => !done.includes(a.id))

      // Alerts that were already true when the case was reported are skipped: you were looking at it.
      // Older cases have no report time, so for those, whatever is true the first time we see them.
      const reported = ms(x.createdAt)
      const old = (at: number) => (reported ? at <= reported : !x.alertsSeen)
      if (!reported && !x.alertsSeen) await doc.ref.update({ alertsSeen: true })

      for (const a of fresh) {
        const to = old(a.at) ? [] : list.filter((p) => wants(p.prefs, a.kind))
        if (to.length) {
          const res = await getMessaging(app).sendEachForMulticast({
            tokens: to.map((p) => p.token),
            data: { title: a.title, body: a.body, url: `/case/${c.id}`, tag: c.id },
            webpush: { headers: { Urgency: 'high', TTL: String(6 * 3600) } },
          })
          sent += res.successCount
          // Phones that uninstalled or reset the app: forget them
          await Promise.all(
            res.responses.map((r, i) =>
              !r.success &&
              ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code ?? '')
                ? to[i].ref.delete()
                : null
            )
          )
        }
        // Marked even when nothing was sent, so it isn't sent later
        await doc.ref.update({ alerted: FieldValue.arrayUnion(a.id) })
      }
    }
  }
  return new Response(`sent ${sent}`)
}