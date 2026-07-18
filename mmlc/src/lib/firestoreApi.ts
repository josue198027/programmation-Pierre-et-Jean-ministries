// ============================================================
// Backend Firestore : intercepte les appels fetch('/api/...')
// du code existant et les sert depuis Firestore.
// Avantage : aucun composant de l'interface n'a besoin d'être modifié.
// ============================================================
//
// Structure Firestore :
//   programmes/ (collection)
//     - title, type, date (YYYY-MM-DD), moderator, nb_notes, created_at
//     - segments: [{ start_time, end_time, activity, details, responsible, position }]
//   membres/ (collection)
//     - name, role, phone

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------- PROGRAMMES ----------------

async function handlePrograms(method: string, url: URL, body: any): Promise<Response> {
  const colRef = collection(db, COLLECTIONS.programs);

  if (method === 'GET') {
    const id = url.searchParams.get('id');

    if (id) {
      const snap = await getDoc(doc(db, COLLECTIONS.programs, id));
      if (!snap.exists()) return json({ error: 'Program not found' }, 404);
      const data = snap.data();
      const segments = [...(data.segments || [])].sort(
        (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
      );
      return json({ id: snap.id, ...data, segments });
    }

    const snap = await getDocs(query(colRef, orderBy('date', 'desc')));
    const list = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        segments_count: (data.segments || []).length,
      };
    });
    return json(list);
  }

  if (method === 'POST') {
    const { title, type, date, moderator, nb_notes, segments } = body;
    const payload = {
      title,
      type,
      date,
      moderator: moderator || '',
      nb_notes: nb_notes || '',
      created_at: new Date().toISOString(),
      segments: (segments || []).map((seg: any, index: number) => ({
        start_time: seg.start_time,
        end_time: seg.end_time,
        activity: seg.activity,
        details: seg.details || '',
        responsible: seg.responsible || '',
        position: index,
      })),
    };
    const ref = await addDoc(colRef, payload);
    return json({ id: ref.id, ...payload }, 201);
  }

  if (method === 'PUT') {
    const { id, title, type, date, moderator, nb_notes, segments } = body;
    const payload = {
      title,
      type,
      date,
      moderator: moderator || '',
      nb_notes: nb_notes || '',
      segments: (segments || []).map((seg: any, index: number) => ({
        start_time: seg.start_time,
        end_time: seg.end_time,
        activity: seg.activity,
        details: seg.details || '',
        responsible: seg.responsible || '',
        position: index,
      })),
    };
    await updateDoc(doc(db, COLLECTIONS.programs, String(id)), payload);
    return json({ id, ...payload });
  }

  if (method === 'DELETE') {
    const { id } = body;
    await deleteDoc(doc(db, COLLECTIONS.programs, String(id)));
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}

// ---------------- MEMBRES / INTERVENANTS ----------------

async function handleSpeakers(method: string, body: any): Promise<Response> {
  const colRef = collection(db, COLLECTIONS.speakers);

  if (method === 'GET') {
    const snap = await getDocs(query(colRef, orderBy('name')));
    return json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  if (method === 'POST') {
    const { name, role, phone } = body;
    const payload = { name, role: role || '', phone: phone || '' };
    const ref = await addDoc(colRef, payload);
    return json({ id: ref.id, ...payload }, 201);
  }

  if (method === 'PUT') {
    const { id, name, role, phone } = body;
    const payload = { name, role: role || '', phone: phone || '' };
    await updateDoc(doc(db, COLLECTIONS.speakers, String(id)), payload);
    return json({ id, ...payload });
  }

  if (method === 'DELETE') {
    const { id } = body;
    await deleteDoc(doc(db, COLLECTIONS.speakers, String(id)));
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}

// ---------------- INTERCEPTION FETCH ----------------

export function installFirestoreBackend() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (rawUrl.includes('/api/programs') || rawUrl.includes('/api/speakers')) {
      const url = new URL(rawUrl, window.location.origin);
      const method = (init?.method || 'GET').toUpperCase();
      let body: any = null;
      if (init?.body) {
        try { body = JSON.parse(init.body as string); } catch { body = null; }
      }
      try {
        if (url.pathname.endsWith('/api/programs')) return await handlePrograms(method, url, body);
        if (url.pathname.endsWith('/api/speakers')) return await handleSpeakers(method, body);
      } catch (err: any) {
        console.error('[firestore] erreur:', err);
        return json({ error: err?.message || 'Erreur Firestore' }, 500);
      }
    }

    return originalFetch(input as any, init);
  };
}
