import { redirect } from 'next/navigation'

// Edit details is now a sheet on the Profile screen
export default function EditProfile() {
  redirect('/profile')
}