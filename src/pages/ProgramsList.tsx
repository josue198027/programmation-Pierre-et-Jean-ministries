import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Search, Filter, Plus, Clock, User, ArrowRight, BookOpen, AlertCircle, 
  FileText, Download 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LOGO_DATA_URI } from '../assets/logo';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Program {
  id: number;
  title: string;
  date: string;
  moderator: string;
  type: string;
  nb_notes: string;
  created_at: string;
  segments_count?: number;
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

const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

export default function ProgramsList() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Tous');

  // Filtres par date (jour exact, mois, annee)
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [cardPdfId, setCardPdfId] = useState<number | null>(null);

  // Month download state
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [monthDownloading, setMonthDownloading] = useState(false);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/programs');
      if (!res.ok) throw new Error('Impossible de charger les programmes.');
      const data = await res.json();
      setPrograms(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

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
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = 
      program.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.moderator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.nb_notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.date?.includes(searchTerm);
    
    const matchesType = selectedType === 'Tous' || program.type === selectedType;

    const progDate = (program.date || '').split('T')[0];
    const matchesDate = !filterDate || progDate === filterDate;
    const matchesMonth = !filterMonth || progDate.slice(5, 7) === filterMonth;
    const matchesYear = !filterYear || progDate.slice(0, 4) === filterYear;

    return matchesSearch && matchesType && matchesDate && matchesMonth && matchesYear;
  });

  const hasActiveFilters = searchTerm || selectedType !== 'Tous' || filterDate || filterMonth || filterYear;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('Tous');
    setFilterDate('');
    setFilterMonth('');
    setFilterYear('');
  };

  // Telecharger le PDF d'un culte directement depuis sa carte
  const downloadProgramPDF = async (programId: number) => {
    setCardPdfId(programId);
    try {
      const res = await fetch(`/api/programs?id=${programId}`);
      if (!res.ok) throw new Error('Impossible de charger le programme.');
      const program = await res.json();

      const doc = new jsPDF();

      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 42, 'F');

      doc.addImage(LOGO_DATA_URI, 'PNG', 10, 6, 31, 30);

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Pierre et Jean Ministries', 105, 18, { align: 'center' });

      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(245, 158, 11);
      doc.text('Lève-toi et marche au nom de Jésus-Christ !', 105, 26, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`Type de Culte : ${program.type}`, 105, 34, { align: 'center' });

      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(program.title, 15, 55);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Date : ${formatDate(program.date)}`, 15, 62);
      doc.text(`Modérateur/trice : ${program.moderator || 'Non assigné'}`, 15, 68);

      const tableData = program.segments.map((seg: any, idx: number) => [
        `${idx + 1}`,
        `${seg.start_time} - ${seg.end_time}`,
        seg.activity,
        seg.details || '',
        seg.responsible || ''
      ]);

      autoTable(doc, {
        startY: 75,
        head: [['#', 'Horaire', 'Activité', 'Détails / Lecture', 'Responsable']],
        body: tableData,
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 30, fontStyle: 'bold' },
          2: { cellWidth: 55, fontStyle: 'bold' },
          3: { cellWidth: 65 },
          4: { cellWidth: 30 }
        }
      });

      if (program.nb_notes) {
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFillColor(254, 243, 199);
        doc.rect(15, finalY, 180, 20, 'F');
        doc.setDrawColor(245, 158, 11);
        doc.rect(15, finalY, 180, 20, 'S');

        doc.setTextColor(146, 64, 14);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Note Importante (N.B.) :', 20, finalY + 7);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(program.nb_notes, 20, finalY + 14);
      }

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Généré par Pierre et Jean Ministries - Lève-toi et marche !', 105, 287, { align: 'center' });
      }

      const filename = `${program.title.replace(/[\s/]+/g, '_')}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert('Une erreur est survenue lors de la génération du PDF.');
    } finally {
      setCardPdfId(null);
    }
  };

  // Download all programs of a specific month
  const downloadMonthPDF = async () => {
    if (!selectedMonth) {
      alert('Veuillez sélectionner un mois.');
      return;
    }

    setMonthDownloading(true);
    try {
      // Filter programs matching selected month and year
      const prefix = `${selectedYear}-${selectedMonth}`;
      const monthPrograms = programs.filter(p => p.date.startsWith(prefix));

      if (monthPrograms.length === 0) {
        alert("Aucun programme n'a été trouvé pour le mois sélectionné.");
        setMonthDownloading(false);
        return;
      }

      const doc = new jsPDF();
      const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label;

      // Generate pages for each program (sans page de couverture)
      for (let pIdx = 0; pIdx < monthPrograms.length; pIdx++) {
        const prog = monthPrograms[pIdx];

        // Fetch detailed program with its segments
        const res = await fetch(`/api/programs?id=${prog.id}`);
        if (!res.ok) continue;
        const detailedProg = await res.json();

        if (pIdx > 0) doc.addPage();
        
        // Header
        doc.setFillColor(30, 58, 138);
        doc.rect(0, 0, 210, 35, 'F');

        doc.addImage(LOGO_DATA_URI, 'PNG', 8, 4, 28, 27);

        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Pierre et Jean Ministries', 105, 12, { align: 'center' });
        
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(245, 158, 11);
        doc.text('Lève-toi et marche au nom de Jésus-Christ !', 105, 18, { align: 'center' });

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(`${detailedProg.type} - ${formatDate(detailedProg.date)}`, 105, 26, { align: 'center' });

        // Metadata
        doc.setTextColor(30, 41, 59);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(detailedProg.title, 15, 48);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Modérateur/trice : ${detailedProg.moderator || 'Non assigné'}`, 15, 54);

        // Segments Table
        const tableData = detailedProg.segments.map((seg: any, idx: number) => [
          `${idx + 1}`,
          `${seg.start_time} - ${seg.end_time}`,
          seg.activity,
          seg.details || '',
          seg.responsible || ''
        ]);

        autoTable(doc, {
          startY: 60,
          head: [['#', 'Horaire', 'Activité', 'Détails / Lecture', 'Responsable']],
          body: tableData,
          headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 8.5, cellPadding: 3.5 },
          columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 28, fontStyle: 'bold' },
            2: { cellWidth: 55, fontStyle: 'bold' },
            3: { cellWidth: 65 },
            4: { cellWidth: 28 }
          }
        });

        // Notes (N.B.)
        if (detailedProg.nb_notes) {
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFillColor(254, 243, 199);
          doc.rect(15, finalY, 180, 18, 'F');
          doc.setDrawColor(245, 158, 11);
          doc.rect(15, finalY, 180, 18, 'S');
          
          doc.setTextColor(146, 64, 14);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text('Note Importante (N.B.) :', 20, finalY + 6);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.text(detailedProg.nb_notes, 20, finalY + 12);
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page de Programme ${pIdx + 1} de ${monthPrograms.length} - ${monthLabel} ${selectedYear}`, 105, 287, { align: 'center' });
      }

      const filename = `Programmes_${monthLabel}_${selectedYear}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Erreur téléchargement mois PDF:', err);
      alert('Une erreur est survenue lors de la génération du PDF mensuel.');
    } finally {
      setMonthDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-900 via-blue-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden border-b border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-800/30 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <img
            src={LOGO_DATA_URI}
            alt="Logo Pierre et Jean Ministries"
            className="h-36 w-auto mx-auto mb-5 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]"
          />
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest inline-block mb-4">
            Pierre et Jean Ministries
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-extrabold tracking-tight mb-4">
            Programmes de Culte
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed italic">
            "Lève-toi et marche au nom de Jésus-Christ !"
          </p>
          <p className="mt-2 text-sm text-amber-400 font-medium">
            Planifiez, suivez et partagez les moments de communion fraternelle.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Month PDF Downloader Bar */}
        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-2xl p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-amber-500 text-blue-950 rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Télécharger le livret mensuel</h3>
              <p className="text-xs text-slate-500 mt-0.5">Générez un cahier PDF complet de tous les cultes programmés pour un mois spécifique.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-950 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-800 cursor-pointer"
            >
              <option value="">Sélectionner un mois</option>
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-950 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-800 cursor-pointer"
            >
              {['2025', '2026', '2027', '2028'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={downloadMonthPDF}
              disabled={monthDownloading || !selectedMonth}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{monthDownloading ? 'Génération...' : 'Télécharger'}</span>
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un culte, modérateur, chant, texte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm"
              />
            </div>

            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-slate-400" />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-950 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm appearance-none cursor-pointer"
              >
                <option value="Tous">Tous les types de culte</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Create Button (Admin only) */}
          {user && (
            <Link
              to="/admin/program/new"
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Programme</span>
            </Link>
          )}
        </div>

        {/* Filtres par date : jour exact, mois, annee */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold shrink-0">
            <Calendar className="h-4 w-4 text-blue-800" />
            <span>Filtrer par date :</span>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date exacte</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-950 bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mois</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-950 bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm cursor-pointer"
              >
                <option value="">Tous les mois</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Année</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-950 bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm cursor-pointer"
              >
                <option value="">Toutes les années</option>
                {['2025', '2026', '2027', '2028'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Réinitialiser
            </button>
          )}
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

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse space-y-4 shadow-sm">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Aucun programme trouvé</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto px-4">
              Nous n'avons trouvé aucun programme correspondant à vos critères de recherche.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          /* Programs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Accent Header */}
                <div className="h-1.5 bg-gradient-to-r from-blue-800 to-indigo-900" />
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold">
                      {program.type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{program.segments_count || 0} étapes</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-slate-900 group-hover:text-blue-900 transition-colors mb-2 line-clamp-2">
                    {program.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-4">
                    {formatDate(program.date)}
                  </p>

                  <div className="space-y-2 mb-6 text-sm text-slate-600 flex-1">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        Modérateur: <strong className="text-slate-800">{program.moderator || 'Non assigné'}</strong>
                      </span>
                    </div>

                    {program.nb_notes && (
                      <div className="flex items-start space-x-2 mt-2 pt-2 border-t border-slate-50">
                        <BookOpen className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-500 italic line-clamp-2">
                          {program.nb_notes}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/program/${program.id}`}
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-50 group-hover:bg-amber-500 group-hover:text-blue-950 text-slate-700 font-semibold rounded-xl text-sm transition-all duration-200"
                    >
                      <span>Voir le programme</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <button
                      onClick={() => downloadProgramPDF(program.id)}
                      disabled={cardPdfId === program.id}
                      title="Télécharger le PDF de ce culte"
                      className="flex items-center justify-center px-3.5 py-2.5 bg-blue-800 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {cardPdfId === program.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
