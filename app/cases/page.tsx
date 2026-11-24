import { redirect } from 'next/navigation'

// Old tab: "Cases" is split back into Track and History
export default function Cases() {
  redirect('/history')
}