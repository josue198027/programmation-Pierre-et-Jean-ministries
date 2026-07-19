import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Clock, User, Award, ArrowLeft, Edit, Copy, Check, Printer, 
  Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle, Sparkles, BookOpen, FileText
} from 'lucide-react';
import { LOGO_DATA_URI } from '../assets/logo';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Segment {
  id: number;
  start_time: string;
  end_time: string;
  activity: string;
  details: string;
  responsible: string;
  position: number;
}

interface Program {
  id: number;
  title: string;
  date: string;
  moderator: string;
  type: string;
  nb_notes: string;
  segments: Segment[];
}

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tabs: 'view' | 'live' | 'share'
  const [activeTab, setActiveTab] = useState<'view' | 'live' | 'share'>('view');
  const [copied, setCopied] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Live Mode states
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState<number>(-1);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [timeIsUp, setTimeIsUp] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/programs?id=${id}`);
      if (!res.ok) throw new Error('Impossible de charger les détails du programme.');
      const data = await res.json();
      setProgram(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgram();
  }, [id]);

  // Handle Timer ticking
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            setTimeIsUp(true);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timerSeconds]);

  // Audio helper for Beep
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (err) {
      console.warn('Audio play failed:', err);
    }
  };

  const calculateDurationInSeconds = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      
      const startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;
      
      if (endMin < startMin) {
        // Over midnight
        endMin += 24 * 60;
      }
      
      return (endMin - startMin) * 60;
    } catch {
      return 300; // default 5 mins
    }
  };

  const formatTimer = (totalSecs: number) => {
    const min = Math.floor(totalSecs / 60);
    const sec = totalSecs % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const startLiveSegment = (idx: number) => {
    if (!program || !program.segments[idx]) return;
    setCurrentSegmentIdx(idx);
    setTimeIsUp(false);
    const seg = program.segments[idx];
    const duration = calculateDurationInSeconds(seg.start_time, seg.end_time);
    setTimerSeconds(duration);
    setTimerActive(true);
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    if (!program || currentSegmentIdx === -1) return;
    setTimeIsUp(false);
    const seg = program.segments[currentSegmentIdx];
    const duration = calculateDurationInSeconds(seg.start_time, seg.end_time);
    setTimerSeconds(duration);
    setTimerActive(false);
  };

  const getWhatsAppFormat = () => {
    if (!program) return '';
    
    let text = `*Pierre et Jean Ministries*\n`;
    text += `Lève-toi et marche au nom de Jésus-Christ !\n\n`;
    text += `*Programme pr ${program.date}*\n`;
    text += `*Type:* ${program.type}\n`;
    text += `*Modérateur/trice:* ${program.moderator || 'Non assigné'}\n\n`;

    program.segments.forEach((seg) => {
      text += ` ${seg.start_time} - ${seg.end_time} : ${seg.activity}`;
      if (seg.details) {
        text += `\n ${seg.details}`;
      }
      if (seg.responsible) {
        text += ` ( *${seg.responsible}* )`;
      }
      text += `\n\n`;
    });

    if (program.nb_notes) {
      text += `N.B: ${program.nb_notes}`;
    }

    return text;
  };

  const copyToClipboard = () => {
    const text = getWhatsAppFormat();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = () => {
    if (!program) return;
    setPdfDownloading(true);
    try {
      const doc = new jsPDF();
      
      // Church Header
      doc.setFillColor(30, 58, 138); // Navy Blue
      doc.rect(0, 0, 210, 42, 'F');

      doc.addImage(LOGO_DATA_URI, 'PNG', 10, 6, 31, 30);

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Pierre et Jean Ministries', 105, 18, { align: 'center' });
      
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(245, 158, 11); // Gold
      doc.text('Lève-toi et marche au nom de Jésus-Christ !', 105, 26, { align: 'center' });
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`Type de Culte : ${program.type}`, 105, 34, { align: 'center' });

      // Program Metadata
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(program.title, 15, 55);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Date : ${formatDate(program.date)}`, 15, 62);
      doc.text(`Modérateur/trice : ${program.moderator || 'Non assigné'}`, 15, 68);

      // Table of Segments
      const tableData = program.segments.map((seg, idx) => [
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

      // Notes (N.B.)
      if (program.nb_notes) {
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFillColor(254, 243, 199); // Amber 100
        doc.rect(15, finalY, 180, 20, 'F');
        doc.setDrawColor(245, 158, 11); // Amber 500
        doc.rect(15, finalY, 180, 20, 'S');
        
        doc.setTextColor(146, 64, 14); // Amber 800
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Note Importante (N.B.) :', 20, finalY + 7);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(program.nb_notes, 20, finalY + 14);
      }

      // Footer
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
      setPdfDownloading(false);
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
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="mt-4 text-slate-600 font-medium">Chargement des détails...</p>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-serif font-bold text-slate-900">Programme introuvable</h2>
        <p className="text-slate-600 mt-2">{error || "Le programme demandé n'existe pas ou a été supprimé."}</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-800 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour à la liste</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header Banner - hidden on print */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <Link to="/" className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-400 hover:text-amber-300 mb-3">
              <ArrowLeft className="h-4 w-4" />
              <span>Tous les programmes</span>
            </Link>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-blue-950 text-xs font-bold uppercase tracking-wide">
                {program.type}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-white">
              {program.title}
            </h1>
            <p className="text-slate-300 text-sm mt-1 flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>{formatDate(program.date)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {user && (
              <Link
                to={`/admin/program/edit/${program.id}`}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm transition-all"
              >
                <Edit className="h-4 w-4 text-amber-400" />
                <span>Modifier</span>
              </Link>
            )}

            <button
              onClick={generatePDF}
              disabled={pdfDownloading}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span>{pdfDownloading ? 'Téléchargement...' : 'Télécharger PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-amber-400" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Navigation Tabs - hidden on print */}
        <div className="flex border-b border-slate-200 mb-8 print:hidden overflow-x-auto">
          <button
            onClick={() => setActiveTab('view')}
            className={`py-3.5 px-6 font-semibold text-sm border-b-2 shrink-0 cursor-pointer transition-all ${
              activeTab === 'view'
                ? 'border-blue-800 text-blue-900 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            📋 Déroulement du Culte
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`py-3.5 px-6 font-semibold text-sm border-b-2 shrink-0 cursor-pointer transition-all flex items-center space-x-1.5 ${
              activeTab === 'live'
                ? 'border-amber-500 text-blue-900 bg-amber-500/5 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block"></span>
            <span>⏱️ Mode Modérateur / Live</span>
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`py-3.5 px-6 font-semibold text-sm border-b-2 shrink-0 cursor-pointer transition-all ${
              activeTab === 'share'
                ? 'border-blue-800 text-blue-900 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            📲 Formater pour WhatsApp
          </button>
        </div>

        {/* Tab 1: Standard View */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {/* Church Branding Header - visible in print and view */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none print:hidden">
                <Award className="h-32 w-32 text-blue-900" />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-amber-700 text-xs font-bold uppercase tracking-wider mb-3">
                Culte Solennel
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-blue-950">
                Pierre et Jean Ministries
              </h2>
              <p className="text-amber-600 font-semibold italic text-sm mt-1">
                Lève-toi et marche au nom de Jésus-Christ !
              </p>
              
              <div className="w-16 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-600 my-4" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full max-w-2xl mt-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Date de Célébration</span>
                  <strong className="text-slate-900 font-serif text-base">{formatDate(program.date)}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Modérateur / Trice</span>
                  <strong className="text-slate-900 text-base flex items-center space-x-1">
                    <User className="h-4 w-4 text-blue-900 shrink-0" />
                    <span>{program.moderator || 'Non assigné'}</span>
                  </strong>
                </div>
              </div>
            </div>

            {/* Timeline Segments */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h3 className="text-lg font-serif font-bold text-slate-900 mb-6 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-900" />
                <span>Déroulement Chronologique ({program.segments.length} étapes)</span>
              </h3>

              <div className="relative border-l-2 border-slate-100 ml-4 sm:ml-6 space-y-8 pb-4">
                {program.segments.map((seg, idx) => (
                  <div key={seg.id} className="relative pl-6 sm:pl-8 group">
                    {/* Timeline dot */}
                    <span className="absolute -left-2.5 top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border-2 border-white group-hover:bg-amber-500 group-hover:scale-110 transition-all">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-800 group-hover:bg-blue-950"></span>
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        {/* Time block */}
                        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md mb-2">
                          <Clock className="h-3 w-3" />
                          <span>{seg.start_time} - {seg.end_time}</span>
                        </div>

                        {/* Title & details */}
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                          {seg.activity}
                        </h4>
                        
                        {seg.details && (
                          <p className="text-sm text-slate-600 mt-1 flex items-start space-x-1">
                            <BookOpen className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="italic">{seg.details}</span>
                          </p>
                        )}
                      </div>

                      {/* Responsible */}
                      {seg.responsible && (
                        <div className="shrink-0 flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-xs text-slate-600 font-semibold uppercase tracking-wider">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{seg.responsible}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NB notes */}
            {program.nb_notes && (
              <div className="bg-amber-50 rounded-3xl border border-amber-200/50 p-6 flex items-start space-x-3.5">
                <Sparkles className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-1">Note Importante (N.B.)</h4>
                  <p className="text-sm text-amber-800 font-medium whitespace-pre-wrap">{program.nb_notes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Moderator Mode */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Segment details & timer */}
            <div className="lg:col-span-2 space-y-6">
              {currentSegmentIdx === -1 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center py-16">
                  <Play className="h-14 w-14 text-amber-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-xl font-serif font-bold text-slate-900">Prêt pour le Culte ?</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 mb-6">
                    Activez le Mode Live pour suivre le temps restant pour chaque activité et être alerté par un signal sonore.
                  </p>
                  <button
                    onClick={() => startLiveSegment(0)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-800 to-indigo-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    Démarrer le culte (1ère étape)
                  </button>
                </div>
              ) : (
                <>
                  {/* Current Active Segment Board */}
                  <div className={`bg-white rounded-3xl border shadow-lg p-6 sm:p-8 transition-colors duration-300 relative overflow-hidden ${
                    timeIsUp 
                      ? 'border-rose-300 bg-rose-50/20' 
                      : 'border-amber-400 bg-gradient-to-b from-amber-500/5 to-transparent'
                  }`}>
                    {/* Time progress bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                      <div 
                        className={`h-full transition-all duration-1000 ${timeIsUp ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ 
                          width: `${
                            timerSeconds > 0 && program
                              ? (timerSeconds / calculateDurationInSeconds(
                                  program.segments[currentSegmentIdx].start_time,
                                  program.segments[currentSegmentIdx].end_time
                                )) * 100
                              : 0
                          }%` 
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        timeIsUp 
                          ? 'bg-rose-100 text-rose-800 animate-pulse' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {timeIsUp ? "⚠️ TEMPS ÉCOULÉ" : "🔥 EN COURS"}
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            soundEnabled ? 'text-blue-900 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                          }`}
                          title={soundEnabled ? "Désactiver le son d'alerte" : "Activer le son d'alerte"}
                        >
                          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Segment Details */}
                    <div className="mb-8">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Étape courante</span>
                      <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900">
                        {program.segments[currentSegmentIdx].activity}
                      </h2>
                      
                      {program.segments[currentSegmentIdx].details && (
                        <p className="text-slate-600 italic text-base mt-2 flex items-start space-x-1.5">
                          <BookOpen className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{program.segments[currentSegmentIdx].details}</span>
                        </p>
                      )}

                      {program.segments[currentSegmentIdx].responsible && (
                        <div className="mt-4 inline-flex items-center space-x-2 bg-slate-100 text-slate-800 px-3.5 py-1.5 rounded-xl text-sm font-bold">
                          <User className="h-4 w-4 text-blue-900" />
                          <span>Intervenant: {program.segments[currentSegmentIdx].responsible}</span>
                        </div>
                      )}
                    </div>

                    {/* Timer Circle/Display */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Temps restant</span>
                        <div className={`text-5xl font-mono font-black mt-1 ${timeIsUp ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatTimer(timerSeconds)}
                        </div>
                        <span className="text-xs text-slate-500 font-medium block mt-1">
                          Prévu : {program.segments[currentSegmentIdx].start_time} - {program.segments[currentSegmentIdx].end_time}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleTimer}
                          className={`flex items-center space-x-1.5 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                            timerActive 
                              ? 'bg-amber-500 hover:bg-amber-400 text-blue-950' 
                              : 'bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-700 hover:to-indigo-800 text-white'
                          }`}
                        >
                          {timerActive ? (
                            <>
                              <Pause className="h-4 w-4" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              <span>Reprendre</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={resetTimer}
                          className="p-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                          title="Réinitialiser le minuteur"
                        >
                          <RotateCcw className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Navigation buttons */}
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <button
                        disabled={currentSegmentIdx === 0}
                        onClick={() => startLiveSegment(currentSegmentIdx - 1)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
                      >
                        ◀ Précédent
                      </button>

                      <span className="text-xs font-bold text-slate-500">
                        {currentSegmentIdx + 1} / {program.segments.length}
                      </span>

                      {currentSegmentIdx === program.segments.length - 1 ? (
                        <button
                          onClick={() => {
                            setCurrentSegmentIdx(-1);
                            setTimerActive(false);
                            setTimeIsUp(false);
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors"
                        >
                          Terminer le culte 🏁
                        </button>
                      ) : (
                        <button
                          onClick={() => startLiveSegment(currentSegmentIdx + 1)}
                          className="px-4 py-2 text-xs font-bold text-white bg-blue-800 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
                        >
                          Suivant ▶
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right side: Interactive playlist/schedule */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center space-x-1.5">
                <Calendar className="h-4 w-4 text-blue-900" />
                <span>Déroulement du Culte</span>
              </h3>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {program.segments.map((seg, idx) => (
                  <button
                    key={seg.id}
                    onClick={() => startLiveSegment(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      idx === currentSegmentIdx
                        ? 'border-amber-400 bg-amber-500/10 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          idx === currentSegmentIdx ? 'bg-amber-500 text-blue-950' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {seg.start_time} - {seg.end_time}
                        </span>
                        {seg.responsible && (
                          <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[100px]">
                            • {seg.responsible}
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs font-bold truncate ${
                        idx === currentSegmentIdx ? 'text-blue-950 font-extrabold' : 'text-slate-800'
                      }`}>
                        {seg.activity}
                      </h4>
                    </div>
                    
                    {idx === currentSegmentIdx && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block shrink-0"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Format for WhatsApp */}
        {activeTab === 'share' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Formatage Réseau Social</h3>
                <p className="text-xs text-slate-500">Prêt à être copié-collé sur WhatsApp, Telegram ou Facebook.</p>
              </div>

              <button
                onClick={copyToClipboard}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  copied 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                    : 'bg-blue-800 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copier le texte</span>
                  </>
                )}
              </button>
            </div>

            {/* WhatsApp Text Preview Box */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 whitespace-pre-wrap select-all leading-relaxed shadow-inner max-h-[500px] overflow-y-auto">
              {getWhatsAppFormat()}
            </div>

            <div className="mt-4 flex items-start space-x-2 text-slate-500 text-xs italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Astuce : Le texte est formaté avec des étoiles (<code>*</code>) pour que les titres et les noms d'intervenants s'affichent automatiquement en <strong>gras</strong> sur WhatsApp !
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
