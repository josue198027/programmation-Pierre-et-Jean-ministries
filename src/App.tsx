import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { handleGoogleRedirect } from './lib/googleAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import ProgramsList from './pages/ProgramsList';
import ProgramDetail from './pages/ProgramDetail';
import SpeakersList from './pages/SpeakersList';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProgramEditor from './pages/ProgramEditor';

// Handle Google Oauth Redirect logic on startup
handleGoogleRedirect();

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800 selection:bg-amber-500/30 selection:text-blue-950">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<ProgramsList />} />
              <Route path="/program/:id" element={<ProgramDetail />} />
              <Route path="/speakers" element={<SpeakersList />} />
              <Route path="/login" element={<Login />} />

              {/* Admin Protected Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/program/new" element={
                <ProtectedRoute>
                  <ProgramEditor />
                </ProtectedRoute>
              } />

              <Route path="/admin/program/edit/:id" element={
                <ProtectedRoute>
                  <ProgramEditor />
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-xs sm:text-sm print:hidden">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-serif font-bold text-amber-400 tracking-wide mb-1">
                Pierre et Jean Ministries
              </p>
              <p className="italic mb-4 text-slate-500">"Lève-toi et marche au nom de Jésus-Christ !"</p>
              <p className="text-slate-600">
                &copy; {new Date().getFullYear()} Pierre et Jean Ministries. Tous droits réservés.
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
