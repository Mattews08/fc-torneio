import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyCsI1yBEtze-AWCRyINPYbK_uSmGs-fuFs',
  authDomain: 'fc-tournament-bdbf3.firebaseapp.com',
  projectId: 'fc-tournament-bdbf3',
  storageBucket: 'fc-tournament-bdbf3.firebasestorage.app',
  messagingSenderId: '94647855400',
  appId: '1:94647855400:web:2c5751eeadf877748f481d',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const storage = getStorage(firebaseApp)
export const googleProvider = new GoogleAuthProvider()
