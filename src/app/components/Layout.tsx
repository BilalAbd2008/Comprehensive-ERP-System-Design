import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useData } from "../context/DataContext";
import {
  LayoutDashboard,
  Sprout,
  BookOpen,
  FileText,
  Scale,
  TrendingUp,
  Building2,
  LogOut,
  RotateCcw,
  Play,
  FolderOpen,
  Trash,
  Settings,
  ChevronDown,
  Users,
  Workflow,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    currentUser,
    logout,
    loadSimulationData,
    resetData,
    resetToZero,
  } = useData();
  const [isKertasKerjaOpen, setIsKertasKerjaOpen] = useState(true);
  const [isDataToolsOpen, setIsDataToolsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Aset Biologis", href: "/assets", icon: Sprout },
    { name: "Jurnal Umum / GL", href: "/journal", icon: BookOpen },
    { name: "Buku Besar", href: "/ledger", icon: BookOpen },
  ];

  const kertasKerja = [
    { name: "Balance Sheet - Aset", href: "/bs-a", icon: FileText },
    { name: "Balance Sheet - Liabilitas & Ekuitas", href: "/bs-l", icon: FileText },
    { name: "Profit & Loss", href: "/pl", icon: FileText },
  ];

  const laporanKeuangan = [
    { name: "Neraca Saldo (TB)", href: "/trial-balance", icon: Scale },
    { name: "Laba Rugi (P&L)", href: "/profit-loss", icon: TrendingUp },
    {
      name: "Neraca (Posisi Keuangan)",
      href: "/balance-sheet",
      icon: Building2,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${isSidebarCollapsed ? "w-20" : "w-64"} flex flex-col transition-all duration-200`}
        style={{ backgroundColor: "#1B4332", color: "white" }}
      >
        <div className={`${isSidebarCollapsed ? "p-3" : "p-6"} border-b`} style={{ borderColor: "#2D6A4F" }}>
          <div className="flex items-center justify-between gap-2">
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-xl">Hers Farm</h1>
                <p className="text-xs mt-1 opacity-80">ERP Peternakan</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded transition-colors hover:bg-white hover:bg-opacity-10"
              title={isSidebarCollapsed ? "Lebarkan sidebar" : "Kecilkan sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          {currentUser && !isSidebarCollapsed && (
            <div
              className="mt-3 pt-3 border-t"
              style={{ borderColor: "#2D6A4F" }}
            >
              <p className="text-xs opacity-60">Logged in as:</p>
              <p className="text-sm font-semibold">{currentUser.fullName}</p>
              <p className="text-xs opacity-60">@{currentUser.username}</p>
            </div>
          )}
        </div>

        <nav className={`${isSidebarCollapsed ? "p-2" : "p-4"} flex-1 space-y-1 overflow-y-auto`}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded transition-colors text-sm`}
                style={{
                  backgroundColor: isActive ? "#FFB703" : "transparent",
                  color: isActive ? "#212529" : "white",
                }}
                title={item.name}
              >
                <Icon size={18} />
                {!isSidebarCollapsed && item.name}
              </Link>
            );
          })}

          <div
            className="pt-3 mt-3 border-t"
            style={{ borderColor: "#2D6A4F" }}
          >
            <button
              onClick={() => setIsKertasKerjaOpen(!isKertasKerjaOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors hover:bg-opacity-10 hover:bg-white"
              style={{ color: "white" }}
            >
              <div className="flex items-center gap-3">
                <FolderOpen size={18} />
                {!isSidebarCollapsed && <span>Balance Sheet</span>}
              </div>
              {!isSidebarCollapsed && <span
                style={{
                  transform: isKertasKerjaOpen
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                ▶
              </span>}
            </button>
            {isKertasKerjaOpen && !isSidebarCollapsed && (
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
                        backgroundColor: isActive ? "#FFB703" : "transparent",
                        color: isActive ? "#212529" : "white",
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

          <div
            className="pt-3 mt-3 border-t"
            style={{ borderColor: "#2D6A4F" }}
          >
            <div
              className="px-3 py-2 text-xs opacity-60"
              style={{ color: "white" }}
            >
              {!isSidebarCollapsed && "Laporan Keuangan"}
            </div>
            {laporanKeuangan.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded transition-colors text-sm`}
                  style={{
                    backgroundColor: isActive ? "#FFB703" : "transparent",
                    color: isActive ? "#212529" : "white",
                  }}
                  title={item.name}
                >
                  <Icon size={18} />
                  {!isSidebarCollapsed && item.name}
                </Link>
              );
            })}
          </div>

          <div
            className="pt-3 mt-3 border-t"
            style={{ borderColor: "#2D6A4F" }}
          >
            <div
              className="px-3 py-2 text-xs opacity-60"
              style={{ color: "white" }}
            >
              {!isSidebarCollapsed && "Admin & Manajemen"}
            </div>
            <Link
              to="/admin-users"
              className={`flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded transition-colors text-sm`}
              style={{
                backgroundColor:
                  location.pathname === "/admin-users"
                    ? "#FFB703"
                    : "transparent",
                color:
                  location.pathname === "/admin-users" ? "#212529" : "white",
              }}
              title="User Admin"
            >
              <Users size={18} />
              {!isSidebarCollapsed && "User Admin"}
            </Link>
            <Link
              to="/sop-flowchart"
              className={`flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded transition-colors text-sm`}
              style={{
                backgroundColor:
                  location.pathname === "/sop-flowchart"
                    ? "#FFB703"
                    : "transparent",
                color:
                  location.pathname === "/sop-flowchart" ? "#212529" : "white",
              }}
              title="SOP Flowchart"
            >
              <Workflow size={18} />
              {!isSidebarCollapsed && "SOP Flowchart"}
            </Link>
          </div>
        </nav>

        <div
          className={`${isSidebarCollapsed ? "p-2" : "p-4"} space-y-2 border-t`}
          style={{ borderColor: "#2D6A4F" }}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDataToolsOpen(!isDataToolsOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-sm transition-colors hover:opacity-80"
              style={{ backgroundColor: "#2D6A4F" }}
            >
              <span className="flex items-center gap-2">
                <Settings size={16} />
                {!isSidebarCollapsed && "Data & Reset"}
              </span>
              {!isSidebarCollapsed && <ChevronDown
                size={16}
                style={{
                  transform: isDataToolsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />}
            </button>

            {isDataToolsOpen && !isSidebarCollapsed && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border p-2 space-y-2 shadow-xl"
                style={{ backgroundColor: "#1B4332", borderColor: "#2D6A4F" }}
              >
                <button
                  onClick={() => {
                    void loadSimulationData();
                    setIsDataToolsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#2D6A4F" }}
                >
                  <Play size={16} />
                  Data Contoh
                </button>

                <button
                  onClick={() => {
                    void resetData();
                    setIsDataToolsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#2D6A4F" }}
                >
                  <RotateCcw size={16} />
                  Reset ke Default
                </button>

                <button
                  onClick={() => {
                    void resetToZero();
                    setIsDataToolsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#DC3545", color: "white" }}
                >
                  <Trash size={16} />
                  Reset ke 0 (Real Data)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "gap-2 px-3"} py-2 rounded text-sm transition-colors hover:opacity-80`}
            style={{ backgroundColor: "#495057" }}
          >
            <LogOut size={16} />
            {!isSidebarCollapsed && "Keluar"}
          </button>
        </div>
      </aside>

      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: "#F8F9FA" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
