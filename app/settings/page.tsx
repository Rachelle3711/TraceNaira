import { redirect } from 'next/navigation'

// Settings now live on the Profile screen
export default function Settings() {
  redirect('/profile')
}