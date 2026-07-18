import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, User, Clock, Plus, Trash2, Save, Sparkles, 
  BookOpen, HelpCircle, AlertCircle, RefreshCw, ArrowUp, ArrowDown 
} from 'lucide-react';

interface SegmentInput {
  id?: number;
  start_time: string;
  end_time: string;
  activity: string;
  details: string;
  responsible: string;
}

interface Speaker {
  id: number;
  name: string;
  role: string;
}

const SERVICE_TYPES = [
  "Culte d'adoration",
  "Jeûne matinale",
  "Nuit de prière",
  "Service de lavement des pieds",
  "Sainte Cène",
  "Funérailles",
  "Mariage",
  "Rencontre de prière",
  "École dominicale",
  "Autre"
];

const ACTIVITY_OPTIONS = [
  "Prière d'invocation",
  "Prière d'intercession",
  "Prière pastorale",
  "Prière d'action de grâce",
  "Lecture de la Bible",
  "Témoignage",
  "Communication",
  "Présentation des visiteurs",
  "Chant",
  "Sermon",
  "Enseignement"
];

// Pre-fill templates based on service types
const TEMPLATES: Record<string, SegmentInput[]> = {
  "Culte d'adoration": [
    { start_time: "06:30", end_time: "06:35", activity: "Prière d'invocation", details: "Prière d'ouverture solennelle", responsible: "" },
    { start_time: "06:35", end_time: "06:55", activity: "Lecture de la Bible", details: "Lecture d'un psaume ou passage d'édification", responsible: "" },
    { start_time: "06:55", end_time: "07:05", activity: "Prière pour tous les hommes", details: "1Tim 2:1-3", responsible: "" },
    { start_time: "07:05", end_time: "07:30", activity: "Chants avec l'assemblée", details: "Chants de louange et d'adoration", responsible: "" },
    { start_time: "07:30", end_time: "07:35", activity: "Lecture", details: "Héb 1:1-14", responsible: "" },
    { start_time: "07:35", end_time: "07:40", activity: "Prière Pastorale", details: "Prière pour l'église et les requêtes", responsible: "" },
    { start_time: "07:40", end_time: "07:55", activity: "Communions / Annonces", details: "Nouvelles de la communauté", responsible: "" },
    { start_time: "07:55", end_time: "08:00", activity: "Prière pour le message", details: "Prière d'onction pour le prédicateur", responsible: "" },
    { start_time: "08:00", end_time: "08:30", activity: "Prédication", details: "Message de la parole de Dieu", responsible: "" },
    { start_time: "08:30", end_time: "09:10", activity: "Lavement des pieds, administration Sainte cène", details: "Moment d'obéissance et de communion", responsible: "" },
    { start_time: "09:10", end_time: "09:15", activity: "Prière finale", details: "Prière de clôture", responsible: "" },
    { start_time: "09:15", end_time: "09:20", activity: "Propos de bénédiction", details: "Bénédiction apostolique", responsible: "" }
  ],
  "Jeûne matinale": [
    { start_time: "05:00", end_time: "05:15", activity: "Action de grâces", details: "Remercier Dieu pour le nouveau jour", responsible: "" },
    { start_time: "05:15", end_time: "05:45", activity: "Lecture de la Parole", details: "Méditation matinale", responsible: "" },
    { start_time: "05:45", end_time: "06:30", activity: "Sujets de prière & Intercession", details: "Requêtes de prière individuelles et collectives", responsible: "" },
    { start_time: "06:30", end_time: "07:00", activity: "Chants d'adoration", details: "Cantiques inspirés", responsible: "" },
    { start_time: "07:00", end_time: "07:30", activity: "Exhortation spirituelle", details: "Brève parole d'encouragement", responsible: "" },
    { start_time: "07:30", end_time: "08:00", activity: "Prière de consécration & Clôture", details: "Remettre la journée entre les mains de Dieu", responsible: "" }
  ],
  "Nuit de prière": [
    { start_time: "22:00", end_time: "22:30", activity: "Louange et Accueil", details: "Entrer dans ses parvis avec reconnaissance", responsible: "" },
    { start_time: "22:30", end_time: "23:15", activity: "Première série de prières", details: "Combat spirituel et délivrance", responsible: "" },
    { start_time: "23:15", end_time: "23:45", activity: "Méditation biblique", details: "Parole de foi", responsible: "" },
    { start_time: "23:45", end_time: "01:00", activity: "Intercession intensive", details: "Prière pour les familles, l'église et les nations", responsible: "" },
    { start_time: "01:00", end_time: "01:30", activity: "Chants de réveil", details: "Chants de victoire", responsible: "" },
    { start_time: "01:30", end_time: "02:30", activity: "Prière d'onction & Témoignages", details: "Partage des bienfaits de Dieu", responsible: "" },
    { start_time: "02:30", end_time: "03:00", activity: "Prière finale & Propos de bénédiction", details: "Bénédiction pour le retour à la maison", responsible: "" }
  ]
};

export default function ProgramEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [type, setType] = useState("Culte d'adoration");
  const [date, setDate] = useState('');
  const [moderator, setModerator] = useState('');
  const [nbNotes, setNbNotes] = useState('Série de lecture: Actes...');
  const [segments, setSegments] = useState<SegmentInput[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // Fetch speakers and program details if edit mode
  useEffect(() => {
    const fetchSpeakersList = async () => {
      try {
        const res = await fetch('/api/speakers');
        if (res.ok) {
          const data = await res.json();
          setSpeakers(data);
        }
      } catch (err) {
        console.error('Error fetching speakers:', err);
      }
    };

    const fetchProgramDetails = async () => {
      if (!isEditMode) {
        // Pre-fill date with today (heure locale, pas UTC)
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setDate(today);
        // Pre-fill template
        applyTemplate("Culte d'adoration");
        return;
      }

      try {
        setFetching(true);
        const res = await fetch(`/api/programs?id=${id}`);
        if (!res.ok) throw new Error('Impossible de charger le programme.');
        const data = await res.json();
        
        setTitle(data.title);
        setType(data.type);
        setDate(data.date);
        setModerator(data.moderator || '');
        setNbNotes(data.nb_notes || '');
        setSegments(data.segments.map((s: any) => ({
          start_time: s.start_time,
          end_time: s.end_time,
          activity: s.activity,
          details: s.details || '',
          responsible: s.responsible || ''
        })));
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement.');
      } finally {
        setFetching(false);
      }
    };

    fetchSpeakersList();
    fetchProgramDetails();
  }, [id, isEditMode]);

  const applyTemplate = (selectedType: string) => {
    const template = TEMPLATES[selectedType];
    if (template) {
      setSegments([...template]);
      if (!title) {
        setTitle(`Programme du ${selectedType}`);
      }
    } else {
      // Clear or set default
      setSegments([{ start_time: "08:00", end_time: "08:15", activity: "Accueil & Prière", details: "", responsible: "" }]);
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (window.confirm(`Voulez-vous charger le modèle par défaut pour "${newType}" ? Cela remplacera les étapes actuelles.`)) {
      applyTemplate(newType);
      setTitle(`Programme - ${newType}`);
    }
  };

  const handleAddSegment = () => {
    let lastEndTime = "08:00";
    if (segments.length > 0) {
      lastEndTime = segments[segments.length - 1].end_time;
    }
    
    // Add 15 minutes automatically for the next segment
    let nextEndTime = "08:15";
    try {
      const [h, m] = lastEndTime.split(':').map(Number);
      const nextMin = (h * 60 + m + 15) % 1440;
      const nextH = Math.floor(nextMin / 60).toString().padStart(2, '0');
      const nextM = (nextMin % 60).toString().padStart(2, '0');
      nextEndTime = `${nextH}:${nextM}`;
    } catch {}

    setSegments([...segments, {
      start_time: lastEndTime,
      end_time: nextEndTime,
      activity: '',
      details: '',
      responsible: ''
    }]);
  };

  const handleRemoveSegment = (idx: number) => {
    setSegments(segments.filter((_, i) => i !== idx));
  };

  const handleSegmentChange = (idx: number, field: keyof SegmentInput, value: string) => {
    const updated = [...segments];
    updated[idx] = { ...updated[idx], [field]: value };
    setSegments(updated);
  };

  const moveSegment = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === segments.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...segments];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSegments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !type) {
      setError('Veuillez remplir le titre, la date et le type de culte.');
      return;
    }

    if (segments.length === 0) {
      setError('Veuillez ajouter au moins une étape au déroulement du culte.');
      return;
    }

    // Validate times
    for (let i = 0; i < segments.length; i++) {
      if (!segments[i].start_time || !segments[i].end_time || !segments[i].activity) {
        setError(`Étape #${i + 1} incomplète. Veuillez renseigner l'horaire de début, de fin, et l'activité.`);
        return;
      }
    }

    setLoading(true);
    setError('');

    const payload = {
      id: isEditMode ? Number(id) : undefined,
      title,
      type,
      date,
      moderator,
      nb_notes: nbNotes,
      segments
    };

    try {
      const res = await fetch('/api/programs', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Une erreur est survenue lors de l\'enregistrement.');
      }

      const savedData = await res.json();
      navigate(`/program/${isEditMode ? id : savedData.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur de sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="mt-4 text-slate-600 font-medium">Chargement du programme...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/admin" className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-400 hover:text-amber-300 mb-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Tableau de bord</span>
            </Link>
            <h1 className="text-2xl font-serif font-extrabold">
              {isEditMode ? 'Modifier le Programme' : 'Créer un Programme'}
            </h1>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
              Pierre et Jean Ministries
            </span>
            <span className="text-xs text-slate-300 italic font-medium">Lève-toi et marche !</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Information Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-serif font-bold text-slate-900 mb-6 pb-2 border-b border-slate-50 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Informations Générales</span>
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-800 text-sm">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Titre du Programme *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Programme pr 05/06/26"
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Type de Culte *
                </label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm bg-white"
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Date du programme *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Modérateur / Modératrice
                </label>
                <input
                  type="text"
                  value={moderator}
                  onChange={(e) => setModerator(e.target.value)}
                  placeholder="Ex: Sr Rachelle"
                  list="moderators-datalist"
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm"
                />
                <datalist id="moderators-datalist">
                  {speakers.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Notes de fin (N.B.)
                </label>
                <input
                  type="text"
                  value={nbNotes}
                  onChange={(e) => setNbNotes(e.target.value)}
                  placeholder="Ex: Série de lecture: Acte 15,16,17( Sr Rachelle)"
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Timeline / Segments Dynamic List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-2 border-b border-slate-50">
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-900" />
                  <span>Déroulement Chronologique ({segments.length} étapes)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Organisez l'horaire, l'activité, les versets ou détails, et le responsable de chaque étape.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSegment}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter une étape</span>
              </button>
            </div>

            {segments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">Aucune étape définie</p>
                <button
                  type="button"
                  onClick={handleAddSegment}
                  className="mt-3 px-4 py-2 bg-blue-800 text-white font-bold rounded-xl text-xs hover:bg-blue-700"
                >
                  Ajouter la première étape
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {segments.map((seg, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/60 relative group flex flex-col md:flex-row gap-4 items-start"
                  >
                    {/* Position Label & Reordering */}
                    <div className="flex md:flex-col items-center gap-1.5 shrink-0 self-stretch justify-between md:justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-4">
                      <span className="w-7 h-7 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex md:flex-col gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSegment(idx, 'up')}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                          title="Monter"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === segments.length - 1}
                          onClick={() => moveSegment(idx, 'down')}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                          title="Descendre"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Form Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 flex-1 w-full">
                      {/* Start Time */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Début</label>
                        <input
                          type="text"
                          required
                          value={seg.start_time}
                          onChange={(e) => handleSegmentChange(idx, 'start_time', e.target.value)}
                          placeholder="06:30"
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm"
                        />
                      </div>

                      {/* End Time */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fin</label>
                        <input
                          type="text"
                          required
                          value={seg.end_time}
                          onChange={(e) => handleSegmentChange(idx, 'end_time', e.target.value)}
                          placeholder="06:35"
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm"
                        />
                      </div>

                      {/* Activity Name */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Activité</label>
                        <input
                          type="text"
                          required
                          list="activity-options"
                          value={seg.activity}
                          onChange={(e) => handleSegmentChange(idx, 'activity', e.target.value)}
                          placeholder="Choisir ou écrire une activité"
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-950 bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm"
                        />
                        <datalist id="activity-options">
                          {ACTIVITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} />
                          ))}
                        </datalist>
                      </div>

                      {/* Responsible */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Responsable</label>
                        <input
                          type="text"
                          value={seg.responsible}
                          onChange={(e) => handleSegmentChange(idx, 'responsible', e.target.value)}
                          placeholder="Ex: Sr Rachelle"
                          list="speakers-datalist"
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm"
                        />
                        <datalist id="speakers-datalist">
                          {speakers.map(s => (
                            <option key={s.id} value={s.name} />
                          ))}
                        </datalist>
                      </div>

                      {/* Details / Bible verses */}
                      <div className="sm:col-span-12">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Détails supplémentaires</label>
                        <input
                          type="text"
                          value={seg.details}
                          onChange={(e) => handleSegmentChange(idx, 'details', e.target.value)}
                          placeholder="Ex: Chants d'adoration, Remarques"
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm"
                        />
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSegment(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0 self-center md:self-auto cursor-pointer"
                      title="Supprimer cette étape"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              to="/admin"
              className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors"
            >
              Annuler
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-6 py-3 bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Enregistrer le Programme</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
