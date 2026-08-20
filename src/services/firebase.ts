import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
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
// ignoreUndefinedProperties: campos opcionais como apiFootballTeamId e squad ficam
// undefined ate o time ser sincronizado com a API-Futebol. Sem essa opcao o
// Firestore rejeita o setDoc/updateDoc com "Unsupported field value: undefined".
export const db = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true })
export const storage = getStorage(firebaseApp)
export const googleProvider = new GoogleAuthProvider()
