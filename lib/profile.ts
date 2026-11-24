import { deleteUser, updateProfile, type User } from 'firebase/auth'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { getDb } from './firebase'
import { clearCases } from './case'

const ref = (uid: string) => doc(getDb(), 'users', uid)

export async function getPhone(uid: string): Promise<string> {
  const snap = await getDoc(ref(uid))
  return snap.exists() ? snap.data().phone ?? '' : ''
}

// Name lives on the login account, phone lives in Firestore.
export async function saveProfile(user: User, name: string, phone: string) {
  await updateProfile(user, { displayName: name })
  await setDoc(ref(user.uid), { name, phone }, { merge: true }) // merge keeps the other fields
}

// Deletes the cases, then the profile document, then the login itself.
export async function removeAccount(user: User) {
  await clearCases(user.uid)
  const phones = await getDocs(collection(getDb(), 'users', user.uid, 'devices')) // phones with alerts on
await Promise.all(phones.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(ref(user.uid))
  await deleteUser(user)
}