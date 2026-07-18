// Connexion Google via Firebase Auth (popup natif)
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

export async function signInWithGoogle(_appName = 'Pierre et Jean Ministries') {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  } catch (err: any) {
    if (err?.code !== 'auth/popup-closed-by-user') {
      console.error('[google-auth] échec :', err?.message || err);
    }
  }
}

// Plus nécessaire avec Firebase (conservé pour compatibilité avec App.tsx)
export async function handleGoogleRedirect() {}
