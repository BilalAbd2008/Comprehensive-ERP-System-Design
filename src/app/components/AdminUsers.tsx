import { useState } from "react";
import { useData, AdminUser } from "../context/DataContext";
import { Plus, Pencil, Check, X, Trash2, Shield } from "lucide-react";

export default function AdminUsers() {
  const { admins, addAdmin, updateAdmin, deleteAdmin, currentUser } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    role: "operator" as "admin" | "manager" | "operator",
  });

  const [editData, setEditData] = useState({
    username: "",
    fullName: "",
    email: "",
    role: "operator" as "admin" | "manager" | "operator",
    isActive: true,
  });

  const isAdminUser = currentUser?.role === "admin";

  const handleAddAdmin = async () => {
    if (!formData.username || !formData.fullName) {
      alert("Username dan nama lengkap wajib diisi");
      return;
    }

    await addAdmin({
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email || undefined,
      role: formData.role,
      isActive: true,
    });

    setFormData({
      username: "",
      fullName: "",
      email: "",
      role: "operator",
    });
    setShowForm(false);
  };

  const handleEditAdmin = async (id: string, admin: AdminUser) => {
    if (editingId === id) {
      // Save
      if (!editData.username || !editData.fullName) {
        alert("Username dan nama lengkap wajib diisi");
        return;
      }

      await updateAdmin(id, {
        username: editData.username,
        fullName: editData.fullName,
        email: editData.email,
        role: editData.role,
        isActive: editData.isActive,
      });

      setEditingId(null);
    } else {
      // Start edit
      setEditingId(id);
      setEditData({
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email || "",
        role: admin.role,
        isActive: admin.isActive,
      });
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (id === currentUser?.id) {
      alert("Tidak bisa menghapus akun admin yang sedang digunakan");
      return;
    }

    if (window.confirm(`Hapus admin ${username}?`)) {
      await deleteAdmin(id);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin Utama";
      case "manager":
        return "Manager";
      case "operator":
        return "Operator";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return { bg: "#E7F5E9", text: "#1B4332" };
      case "manager":
        return { bg: "#E3F2FD", text: "#1565C0" };
      case "operator":
        return { bg: "#FFF3CD", text: "#856404" };
      default:
        return { bg: "#F0F0F0", text: "#495057" };
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1 flex items-center gap-2" style={{ color: "#1B4332" }}>
            <Shield size={28} />
            Manajemen Admin Users
          </h1>
          <p className="text-sm" style={{ color: "#6C757D" }}>
            Kelola akun admin, manager, dan operator. Admin Utama: {admins.filter(a => a.role === "admin").length}
          </p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1B4332" }}
          >
            <Plus size={18} />
            Tambah Admin
          </button>
        )}
      </div>

      {!isAdminUser && (
        <div
          className="p-4 rounded-lg mb-6 border"
          style={{ backgroundColor: "#FFF3CD", borderColor: "#FFE69C", color: "#856404" }}
        >
          <p className="text-sm">
            ⚠️ Anda tidak memiliki izin untuk mengelola admin users. Hubungi admin utama.
          </p>
        </div>
      )}

      {showForm && isAdminUser && (
        <div className="bg-white p-6 rounded-lg border mb-6" style={{ borderColor: "#DEE2E6" }}>
          <h2 className="text-base mb-4" style={{ color: "#1B4332" }}>
            Tambah Admin Baru
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: "#495057" }}>
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Contoh: admin_budi"
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: "#DEE2E6" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "#495057" }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: "#DEE2E6" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "#495057" }}>
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="budi@example.com"
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: "#DEE2E6" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "#495057" }}>
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: "#DEE2E6" }}
                >
                  <option value="operator">Operator</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin Utama</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: "#F8F9FA" }}>
              <p className="text-xs mb-2" style={{ color: "#495057" }}>
                <strong>Password Default:</strong> admin123
              </p>
              <p className="text-xs" style={{ color: "#495057" }}>
                Admin baru dapat login dengan username dan password default ini. Mereka dapat mengubah password setelah login.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddAdmin}
                className="px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1B4332" }}
              >
                Simpan Admin Baru
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded transition-colors"
                style={{ backgroundColor: "#E9ECEF", color: "#495057" }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {admins.map((admin) => {
          const roleColor = getRoleColor(admin.role);
          const isEditing = editingId === admin.id;
          const isCurrent = currentUser?.id === admin.id;

          return (
            <div
              key={admin.id}
              className="bg-white p-4 rounded-lg border"
              style={{
                borderColor: isCurrent ? "#1B4332" : "#DEE2E6",
                borderWidth: isCurrent ? "2px" : "1px",
              }}
            >
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      className="px-3 py-2 border rounded text-sm"
                      style={{ borderColor: "#DEE2E6" }}
                    />
                    <input
                      type="text"
                      value={editData.fullName}
                      onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                      className="px-3 py-2 border rounded text-sm"
                      style={{ borderColor: "#DEE2E6" }}
                    />
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="px-3 py-2 border rounded text-sm"
                      style={{ borderColor: "#DEE2E6" }}
                    />
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value as any })}
                      className="px-3 py-2 border rounded text-sm"
                      style={{ borderColor: "#DEE2E6" }}
                    >
                      <option value="operator">Operator</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditAdmin(admin.id, admin)}
                      className="p-2 rounded text-white"
                      style={{ backgroundColor: "#28A745" }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded text-white"
                      style={{ backgroundColor: "#DC3545" }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: "#212529" }}>
                          {admin.fullName}
                          {isCurrent && (
                            <span
                              className="ml-2 text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: "#E7F5E9", color: "#1B4332" }}
                            >
                              (You)
                            </span>
                          )}
                        </h3>
                        <p className="text-xs mt-1" style={{ color: "#6C757D" }}>
                          @{admin.username}
                          {admin.email && ` • ${admin.email}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2 py-1 rounded font-medium"
                      style={{
                        backgroundColor: roleColor.bg,
                        color: roleColor.text,
                      }}
                    >
                      {getRoleLabel(admin.role)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium`}
                      style={{
                        backgroundColor: admin.isActive ? "#E7F5E9" : "#F8D7DA",
                        color: admin.isActive ? "#1B4332" : "#721C24",
                      }}
                    >
                      {admin.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    {isAdminUser && !isCurrent && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAdmin(admin.id, admin)}
                          className="p-2 rounded transition-colors"
                          style={{ backgroundColor: "#FFB703", color: "#212529" }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                          className="p-2 rounded transition-colors"
                          style={{ backgroundColor: "#DC3545", color: "white" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 rounded-lg border" style={{ backgroundColor: "#F8F9FA", borderColor: "#DEE2E6" }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "#1B4332" }}>
          📋 Penjelasan Role
        </h3>
        <div className="space-y-2 text-xs" style={{ color: "#495057" }}>
          <div>
            <strong>Admin Utama:</strong> Akses penuh ke semua fitur dan manajemen admin lainnya
          </div>
          <div>
            <strong>Manager:</strong> Akses ke semua data dan laporan, tapi tidak bisa mengelola admin
          </div>
          <div>
            <strong>Operator:</strong> Akses terbatas untuk input data aset dan jurnal saja
          </div>
        </div>
      </div>

      <div className="mt-4 p-6 rounded-lg border" style={{ backgroundColor: "#E7F5E9", borderColor: "#B8E6C9" }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "#1B4332" }}>
          ✅ Tracking User di Semua Data
        </h3>
        <p className="text-xs" style={{ color: "#495057" }}>
          Setiap aset, transaksi, dan perubahan akan mencatat username admin yang melakukan update.
          Ini membantu tracking audit trail untuk compliance dan akuntabilitas.
        </p>
      </div>
    </div>
  );
}
