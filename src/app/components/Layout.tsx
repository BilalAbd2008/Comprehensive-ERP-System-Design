import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { LayoutDashboard, Sprout, BookOpen, FileText, Scale, TrendingUp, Building2, LogOut, RotateCcw, Play, FolderOpen, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, loadSimulationData, resetData, resetToZero } = useData();
  const [isKertasKerjaOpen, setIsKertasKerjaOpen] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard Investor', href: '/', icon: LayoutDashboard },
    { name: 'Aset Biologis', href: '/assets', icon: Sprout },
    { name: 'Jurnal Umum / GL', href: '/journal', icon: BookOpen },
  ];

  const kertasKerja = [
    { name: 'WBS - Aset (WBSA)', href: '/wbsa', icon: FileText },
    { name: 'WBS - Liab & Ekuitas (WBSL)', href: '/wbsl', icon: FileText },
    { name: 'Working P&L (WPL)', href: '/wpl', icon: FileText },
    { name: 'Backup Bulanan WBS', href: '/wbs-backup', icon: FileText },
  ];

  const laporanKeuangan = [
    { name: 'Neraca Saldo (TB)', href: '/trial-balance', icon: Scale },
    { name: 'Laba Rugi (P&L)', href: '/profit-loss', icon: TrendingUp },
    { name: 'Neraca (Posisi Keuangan)', href: '/balance-sheet', icon: Building2 },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex flex-col" style={{ backgroundColor: '#1B4332', color: 'white' }}>
        <div className="p-6 border-b" style={{ borderColor: '#2D6A4F' }}>
          <h1 className="text-xl">Hers Farm</h1>
          <p className="text-xs mt-1 opacity-80">ERP Peternakan</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-sm"
                style={{
                  backgroundColor: isActive ? '#FFB703' : 'transparent',
                  color: isActive ? '#212529' : 'white',
                }}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t" style={{ borderColor: '#2D6A4F' }}>
            <button
              onClick={() => setIsKertasKerjaOpen(!isKertasKerjaOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors hover:bg-opacity-10 hover:bg-white"
              style={{ color: 'white' }}
            >
              <div className="flex items-center gap-3">
                <FolderOpen size={18} />
                <span>Kertas Kerja</span>
              </div>
              <span style={{ transform: isKertasKerjaOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                ▶
              </span>
            </button>
            {isKertasKerjaOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {kertasKerja.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded transition-colors text-xs"
                      style={{
                        backgroundColor: isActive ? '#FFB703' : 'transparent',
                        color: isActive ? '#212529' : 'white',
                      }}
                    >
                      <Icon size={16} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t" style={{ borderColor: '#2D6A4F' }}>
            <div className="px-3 py-2 text-xs opacity-60" style={{ color: 'white' }}>
              Laporan Keuangan
            </div>
            {laporanKeuangan.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-sm"
                  style={{
                    backgroundColor: isActive ? '#FFB703' : 'transparent',
                    color: isActive ? '#212529' : 'white',
                  }}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 space-y-2 border-t" style={{ borderColor: '#2D6A4F' }}>
          <button
            onClick={loadSimulationData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors hover:opacity-80"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            <Play size={16} />
            Simulasi 2025
          </button>

          <button
            onClick={resetData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors hover:opacity-80"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            <RotateCcw size={16} />
            Reset ke Default
          </button>

          <button
            onClick={resetToZero}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors hover:opacity-80"
            style={{ backgroundColor: '#DC3545', color: 'white' }}
          >
            <Trash size={16} />
            Reset ke 0 (Real Data)
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors hover:opacity-80"
            style={{ backgroundColor: '#495057' }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F8F9FA' }}>
        <Outlet />
      </main>
    </div>
  );
}
