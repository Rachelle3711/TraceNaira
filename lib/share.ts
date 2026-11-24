// Opens the phone's share sheet, or copies the text if sharing isn't available.
export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed' // the person closed the share sheet, or copying was blocked
  }
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Downloads a calendar file with a reminder. Phones open it in their calendar app,
// so the reminder works even without internet or notifications.
export function downloadReminder(title: string, details: string, at: number) {
  const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TraceNaira//EN', 'BEGIN:VEVENT',
    `UID:${at}-${Math.random().toString(36).slice(2)}@tracenaira`,
    `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(at)}`, `DTEND:${stamp(at + 15 * 60000)}`,
    `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(details)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'tracenaira-reminder.ics'
  a.click()
  URL.revokeObjectURL(url)
}
