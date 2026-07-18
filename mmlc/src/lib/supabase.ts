// ============================================================
// Adaptateur d'authentification : expose la même interface que
// supabase.auth mais utilise Firebase Auth en arrière-plan.
// AuthContext, Login et Navbar fonctionnent sans modification.
// ============================================================

import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';

function toSession(user: FirebaseUser | null) {
  if (!user) return null;
  return {
    access_token: 'firebase',
    refresh_token: 'firebase',
    user: {
      id: user.uid,
      email: user.email,
      user_metadata: { full_name: user.displayName || user.email },
    },
  };
}

export const supabase = {
  auth: {
    async getSession() {
      // Attendre que Firebase restaure la session persistée
      const session = await new Promise<any>((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
          unsub();
          resolve(toSession(user));
        });
      });
      return { data: { session }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', toSession(user));
      });
      return { data: { subscription: { unsubscribe } } };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return { data: { session: toSession(cred.user), user: toSession(cred.user)!.user }, error: null };
      } catch (err: any) {
        const msg = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found']
          .includes(err?.code)
          ? 'Invalid login credentials'
          : err?.message || 'Erreur de connexion';
        return { data: { session: null, user: null }, error: { message: msg } };
      }
    },

    async signOut() {
      await fbSignOut(auth);
      return { error: null };
    },

    // Conservés pour compatibilité avec googleAuth.ts
    async setSession(_tokens: any) {
      return { data: { session: null }, error: null };
    },
    async signInWithIdToken(_args: any) {
      return { data: { session: null }, error: null };
    },
  },
};

export default supabase;
