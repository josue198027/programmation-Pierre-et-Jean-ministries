// ============================================================
// CONFIGURATION FIREBASE - Pierre et Jean Ministries
// ============================================================
// Pour obtenir ces valeurs :
// 1. Console Firebase (https://console.firebase.google.com)
// 2. Votre projet -> Paramètres du projet (roue dentée)
// 3. Section "Vos applications" -> Application Web (</>) 
// 4. Copier l'objet firebaseConfig ici
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCkWTsz2KcjWcsQ0CQjWcNaUboNenDuA3E",
  authDomain: "programmation-culte-db5e1.firebaseapp.com",
  projectId: "programmation-culte-db5e1",
  storageBucket: "programmation-culte-db5e1.firebasestorage.app",
  messagingSenderId: "969336948242",
  appId: "1:969336948242:web:5f2fc0fc6b93045c25bacb",
  measurementId: "G-XSL9KNFKPP"
};

// Noms des collections Firestore
// (modifiables si votre projet existant utilise d'autres noms)
export const COLLECTIONS = {
  programs: 'programmes',
  speakers: 'membres',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
