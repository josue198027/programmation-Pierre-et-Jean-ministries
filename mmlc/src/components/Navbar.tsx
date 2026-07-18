import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { Menu, X, Calendar, Users, LogOut, LogIn, Award, Sparkles, Heart } from 'lucide-react';
import { LOGO_DATA_URI } from '../assets/logo';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-xl sticky top-0 z-50 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo / Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src={LOGO_DATA_URI}
                alt="Logo Pierre et Jean Ministries"
                className="h-12 w-auto group-hover:scale-105 transition-transform duration-200 drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]"
              />
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
                  Pierre et Jean Ministries
                </span>
                <span className="text-[10px] sm:text-xs text-amber-400/90 font-medium tracking-wider italic font-sans">
                  Lève-toi et marche au nom de Jésus-Christ !
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                isActive('/') 
                  ? 'bg-amber-500 text-blue-950 shadow-md shadow-amber-500/20' 
                  : 'hover:bg-white/10 text-slate-100 hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Programmes</span>
            </Link>

            <Link
              to="/speakers"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                isActive('/speakers') 
                  ? 'bg-amber-500 text-blue-950 shadow-md shadow-amber-500/20' 
                  : 'hover:bg-white/10 text-slate-100 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Membres & Intervenants</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive('/admin') 
                      ? 'bg-amber-500 text-blue-950 shadow-md shadow-amber-500/20' 
                      : 'hover:bg-white/10 text-slate-100 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Tableau de Bord</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-blue-950 hover:bg-amber-400 active:bg-amber-600 transition-all duration-200 shadow-lg shadow-amber-500/10 flex items-center space-x-1.5"
              >
                <LogIn className="h-4 w-4" />
                <span>Connexion Admin</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-amber-400 hover:text-white hover:bg-white/10 focus:outline-none transition-all duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-blue-950/98 backdrop-blur-md border-b border-amber-500/10 px-2 pt-2 pb-4 space-y-1 sm:px-3">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 rounded-lg text-base font-medium flex items-center space-x-3 ${
              isActive('/') ? 'bg-amber-500 text-blue-950 font-semibold' : 'text-slate-100 hover:bg-white/5'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span>Programmes</span>
          </Link>

          <Link
            to="/speakers"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 rounded-lg text-base font-medium flex items-center space-x-3 ${
              isActive('/speakers') ? 'bg-amber-500 text-blue-950 font-semibold' : 'text-slate-100 hover:bg-white/5'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Membres & Intervenants</span>
          </Link>

          {user ? (
            <>
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium flex items-center space-x-3 ${
                  isActive('/admin') ? 'bg-amber-500 text-blue-950 font-semibold' : 'text-slate-100 hover:bg-white/5'
                }`}
              >
                <Sparkles className="h-5 w-5" />
                <span>Tableau de Bord</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full text-left block px-4 py-3 rounded-lg text-base font-medium text-rose-300 hover:bg-rose-500/10 flex items-center space-x-3 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span>Déconnexion</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block mx-4 my-2 px-4 py-3 rounded-lg text-center text-base font-semibold bg-amber-500 text-blue-950 hover:bg-amber-400 shadow-md"
            >
              Connexion Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
