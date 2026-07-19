import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, Edit, Trash2, Save, X, Phone, User, Award, AlertCircle, Sparkles } from 'lucide-react';

interface Speaker {
  id: number;
  name: string;
  role: string;
  phone: string;
}

export default function SpeakersList() {
  const { user } = useAuth();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Sœur');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSpeakers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/speakers');
      if (!res.ok) throw new Error('Impossible de charger les intervenants.');
      const data = await res.json();
      setSpeakers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setRole('Sœur');
    setPhone('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (speaker: Speaker) => {
    setEditingId(speaker.id);
    setName(speaker.name);
    setRole(speaker.role || 'Sœur');
    setPhone(speaker.phone || '');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez renseigner le nom.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      id: editingId || undefined,
      name: name.trim(),
      role,
      phone: phone.trim()
    };

    try {
      const res = await fetch('/api/speakers', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Échec de l\'enregistrement.');

      setShowModal(false);
      fetchSpeakers();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet intervenant ?')) return;

    try {
      const res = await fetch('/api/speakers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!res.ok) throw new Error('Échec de la suppression.');
      fetchSpeakers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-1">
              Pierre et Jean Ministries
            </span>
            <h1 className="text-3xl font-serif font-extrabold text-white">
              Répertoire des Intervenants
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Membres, Prédicateurs, Modérateurs, et Serviteurs de l'œuvre de Dieu.
            </p>
          </div>

          {user && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-blue-950 font-bold rounded-xl shadow-lg transition-all text-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Membre</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Error State */}
        {error && !showModal && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 text-rose-800 mb-8">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : speakers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Aucun intervenant enregistré</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto px-4">
              Ajoutez les membres de l'église pour pouvoir les assigner rapidement dans les programmes de culte.
            </p>
            {user && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                Ajouter le premier membre
              </button>
            )}
          </div>
        ) : (
          /* Speakers Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {speakers.map((speaker) => (
              <div
                key={speaker.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-800 to-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="mb-4">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold uppercase tracking-wider inline-block mb-2">
                    {speaker.role || 'Membre'}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                    {speaker.name}
                  </h3>
                  {speaker.phone && (
                    <p className="text-xs text-slate-500 font-mono mt-1.5 flex items-center space-x-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{speaker.phone}</span>
                    </p>
                  )}
                </div>

                {user && (
                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-50 mt-2">
                    <button
                      onClick={() => handleOpenEdit(speaker)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(speaker.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span>{editingId ? 'Modifier l\'intervenant' : 'Ajouter un intervenant'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom Complet / Titre *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Sr Rachelle, Past. Morace"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rôle / Fonction
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm bg-white"
                >
                  <option value="Sœur">Sœur</option>
                  <option value="Frère">Frère</option>
                  <option value="Pasteur">Pasteur</option>
                  <option value="Évangéliste">Évangéliste</option>
                  <option value="Ancien">Ancien</option>
                  <option value="Diacre">Diacre</option>
                  <option value="Chorale">Chorale</option>
                  <option value="Autre">Autre / Ministère</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Numéro de Téléphone (Optionnel)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +509 3737 3737"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1 px-5 py-2 bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md transition-all text-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
