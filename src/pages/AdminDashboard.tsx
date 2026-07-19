import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, Award, Plus, Edit, Trash2, ArrowRight, Eye, Search, AlertCircle, RefreshCw } from 'lucide-react';

interface Program {
  id: number;
  title: string;
  date: string;
  moderator: string;
  type: string;
  created_at: string;
}

interface Speaker {
  id: number;
  name: string;
  role: string;
  phone: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [progRes, speakRes] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/speakers')
      ]);

      if (!progRes.ok || !speakRes.ok) throw new Error('Impossible de charger les données.');

      const progData = await progRes.json();
      const speakData = await speakRes.json();

      setPrograms(progData);
      setSpeakers(speakData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteProgram = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce programme de culte ?')) return;
    
    try {
      setDeleting(true);
      const res = await fetch('/api/programs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!res.ok) throw new Error('Échec de la suppression du programme.');
      
      // Refresh list
      setPrograms(programs.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      // Parser la date en heure locale pour eviter le decalage UTC
      // (new Date('2026-07-12') recule d'un jour dans les fuseaux negatifs)
      const parts = dateStr.split('T')[0].split('-');
      const date = parts.length === 3
        ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        : new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-1">
              Portail d'Administration
            </span>
            <h1 className="text-3xl font-serif font-extrabold text-white">
              Gestion de la programmation
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Créez, modifiez et organisez les cultes de Pierre et Jean Ministries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <Link
              to="/admin/program/new"
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-blue-950 font-bold rounded-xl shadow-lg transition-all text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Programme</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center space-x-4">
            <div className="p-3.5 bg-blue-50 rounded-xl text-blue-800">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">Total Programmes</span>
              <strong className="text-2xl text-slate-900">{programs.length}</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center space-x-4">
            <div className="p-3.5 bg-amber-50 rounded-xl text-amber-700">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">Membres Actifs</span>
              <strong className="text-2xl text-slate-900">{speakers.length}</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center space-x-4">
            <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-700">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase">Slogan Actif</span>
              <strong className="text-xs text-emerald-800 font-bold block mt-1">Lève-toi et marche !</strong>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 text-rose-800 mb-8">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erreur de chargement</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Tables section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Programs Management Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif font-bold text-slate-900">
                Programmes Récents
              </h3>
              <Link
                to="/"
                className="text-xs font-bold text-blue-800 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>Voir le site public</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">Aucun programme enregistré</p>
                <Link
                  to="/admin/program/new"
                  className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-lg hover:bg-blue-100"
                >
                  <span>Créer le premier programme</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead>
                    <tr className="text-slate-400 font-semibold text-left">
                      <th className="pb-3">Culte / Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Modérateur</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {programs.slice(0, 8).map((program) => (
                      <tr key={program.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 font-medium text-slate-900">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{program.title}</span>
                            <span className="text-xs text-slate-400 font-semibold">{formatDate(program.date)}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-xs font-bold">
                            {program.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-600 font-medium">
                          {program.moderator || 'Non assigné'}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/program/${program.id}`}
                              className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Voir en direct"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </Link>
                            <Link
                              to={`/admin/program/edit/${program.id}`}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProgram(program.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Members / Speakers Directory Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-50">
              <h3 className="text-lg font-serif font-bold text-slate-900">
                Intervenants
              </h3>
              <Link
                to="/speakers"
                className="text-xs font-bold text-blue-800 hover:text-blue-700"
              >
                Gérer tout ({speakers.length})
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : speakers.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl flex-1 flex flex-col justify-center">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-semibold">Aucun membre enregistré</p>
                <Link
                  to="/speakers"
                  className="mt-2 text-xs text-blue-800 font-bold hover:underline"
                >
                  Ajouter un membre
                </Link>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 flex-1">
                {speakers.slice(0, 6).map((speaker) => (
                  <div
                    key={speaker.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{speaker.name}</h4>
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                        {speaker.role || 'Membre'}
                      </span>
                    </div>
                    {speaker.phone && (
                      <span className="text-xs text-slate-500 font-mono">{speaker.phone}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/speakers"
              className="mt-6 w-full text-center py-2.5 bg-slate-50 hover:bg-amber-500 hover:text-blue-950 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Voir tous les intervenants
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
