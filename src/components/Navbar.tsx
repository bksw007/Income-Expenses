import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';

interface NavbarProps {
  avatarUrl?: string;
  displayName: string;
  email?: string;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ avatarUrl, displayName, email, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : '?';

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-[#E8DFCF] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo + name */}
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="logo" className="h-7 w-7" />
          <span className="hidden font-black text-[#1A1818] sm:block">
            บัญชีรายรับ-รายจ่าย
          </span>
        </div>

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-2xl border border-[#E8DFCF] bg-white px-2.5 py-1.5 text-sm transition hover:bg-[#FAF7F2]"
          >
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-7 w-7 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D97757] text-xs font-bold text-white">
                {initials}
              </div>
            )}
            <span className="hidden max-w-[120px] truncate font-semibold text-[#1A1818] sm:block">
              {displayName}
            </span>
            <ChevronDown size={14} className="text-[#8C8074]" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E8DFCF] bg-white py-2 shadow-lg">
              <div className="border-b border-[#E8DFCF] px-4 py-3">
                <p className="text-sm font-semibold text-[#1A1818] truncate">{displayName}</p>
                {email && <p className="mt-0.5 text-xs text-[#8C8074] truncate">{email}</p>}
              </div>
              <button
                onClick={() => { setMenuOpen(false); onLogout(); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#5A5248] transition hover:bg-[#FAF7F2] hover:text-[#1A1818]"
              >
                <LogOut size={15} />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
