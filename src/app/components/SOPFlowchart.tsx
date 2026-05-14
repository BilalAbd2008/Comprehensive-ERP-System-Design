import { FileText, ArrowRight } from "lucide-react";

export default function SOPFlowchart() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1
          className="text-2xl mb-2 flex items-center gap-2"
          style={{ color: "#1B4332" }}
        >
          <FileText size={28} />
          Alur Kerja Sistem (SOP Flowchart)
        </h1>
        <p className="text-sm" style={{ color: "#6C757D" }}>
          Dokumentasi alur kerja operasional di sistem Hers Farm ERP
        </p>
      </div>

      <div className="space-y-8">
        {/* Main Flow */}
        <div
          className="bg-white p-8 rounded-lg border"
          style={{ borderColor: "#DEE2E6" }}
        >
          <h2
            className="text-lg font-semibold mb-6"
            style={{ color: "#1B4332" }}
          >
            📊 Alur Kerja Utama Sistem
          </h2>

          <div className="space-y-4">
            <FlowItem
              number="1"
              title="Login & Autentikasi"
              description="Admin/User login dengan username & password. Sistem menyimpan session dan tracking user untuk audit trail."
              color="#E7F5E9"
            />

            <FlowArrow />

            <FlowItem
              number="2"
              title="Dashboard Investor"
              description="Tampilan ringkas kondisi farm: Total aset, pendapatan, beban, neraca sederhana."
              color="#E3F2FD"
            />

            <FlowArrow />

            <FlowItem
              number="3"
              title="Input Aset Biologis"
              description="Catat aset baru atau perubahan aset (weight, fair value). Sistem auto-create jurnal untuk fair value adjustment."
              color="#FFF3CD"
            />

            <FlowArrow />

            <FlowItem
              number="4"
              title="Recording Profit/Loss (P&L)"
              description="Input nilai beli, keuntungan, kerugian aset. Sistem auto-create jurnal entry ke akun pendapatan/beban."
              color="#FFF3CD"
            />

            <FlowArrow />

            <FlowItem
              number="5"
              title="Catat Transaksi di Jurnal Umum"
              description="Input jurnal manual (non-aset). Support upload dokumen pendukung (bukti, invoice, kwitansi)."
              color="#E7F5E9"
            />

            <FlowArrow />

            <FlowItem
              number="6"
              title="Manajemen Chart of Accounts"
              description="Setup/maintain hierarki akun dengan parent-child (Contoh: 1-1200 Bank → 1-12001 Bank BCA). Tracking: siapa yang create/update akun."
              color="#FFE5CC"
            />

            <FlowArrow />

            <FlowItem
              number="7"
              title="Buku Besar & Laporan"
              description="Lihat detail transaksi per akun. Download Buku Besar dalam format CSV atau Excel. Running balance calculation per akun."
              color="#E7D5F5"
            />

            <FlowArrow />

            <FlowItem
              number="8"
              title="Financial Reports"
              description="Generate: Neraca Saldo, Laba Rugi, Neraca (Balance Sheet) berdasarkan fair value standard PSAK 241/69."
              color="#F5E7D5"
            />

            <FlowArrow />

            <FlowItem
              number="9"
              title="Admin & Audit Tracking"
              description="Lihat list admin users, roles (Admin Utama/Manager/Operator), tracking siapa update data. Support multi-admin environment."
              color="#FFE5E5"
            />
          </div>
        </div>

        {/* Process Details */}
        <div className="grid grid-cols-2 gap-6">
          {/* Asset Biological Flow */}
          <div
            className="bg-white p-6 rounded-lg border"
            style={{ borderColor: "#DEE2E6" }}
          >
            <h3
              className="text-base font-semibold mb-4"
              style={{ color: "#1B4332" }}
            >
              🐑 Proses Aset Biologis
            </h3>
            <div className="space-y-3 text-sm">
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#E7F5E9" }}
              >
                <strong>1. Add Asset</strong>
                <p style={{ color: "#6C757D" }} className="mt-1">
                  Input: nama, quantity, jenis, tgl masuk, purchase price
                </p>
              </div>
              <div style={{ textAlign: "center", color: "#FFB703" }}>
                <ArrowRight size={20} className="mx-auto" />
              </div>
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#FFF3CD" }}
              >
                <strong>2. Update Weight & Price</strong>
                <p style={{ color: "#6C757D" }} className="mt-1">
                  Fair value adjustment based on weight/price
                </p>
              </div>
              <div style={{ textAlign: "center", color: "#FFB703" }}>
                <ArrowRight size={20} className="mx-auto" />
              </div>
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#E7D5F5" }}
              >
                <strong>3. Auto-Journal Created</strong>
                <p style={{ color: "#6C757D" }} className="mt-1">
                  Fair Value ↔ Aset Bio | P&L ↔ Income/Expense
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Flow */}
          <div
            className="bg-white p-6 rounded-lg border"
            style={{ borderColor: "#DEE2E6" }}
          >
            <h3
              className="text-base font-semibold mb-4"
              style={{ color: "#1B4332" }}
            >
              📝 Proses Transaksi
            </h3>
            <div className="space-y-3 text-sm">
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#E3F2FD" }}
              >
                <strong>1. Create Journal Entry</strong>
                <p style={{ color: "#6C757D" }} className="mt-1">
                  Select Account (COA), Debit/Credit, Amount, Note
                </p>
              </div>
              <div style={{ textAlign: "center", color: "#FFB703" }}>
                <ArrowRight size={20} className="mx-auto" />
              </div>
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#FFE5CC" }}
              >
                <strong>2. Upload Document</strong>
                <p style={{ color: "#6C757D" }} className="mt-1">
                  Optional: bukti, invoice, kwitansi (base64 stored)
                </p>
              </div>
              <div style={{ textAlign: "center", color: "#FFB703" }}>
                <ArrowRight size={20} className="mx-auto" />
              </div>
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#E7F5E9" }}
              >
                <strong>3. Save & Track</strong>
                <p style={{ color: "#6C757D" }} className="mt-1">
                  Record: debit, credit, createdBy, createdAt, document ID
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reporting & Analytics */}
        <div
          className="bg-white p-6 rounded-lg border"
          style={{ borderColor: "#DEE2E6" }}
        >
          <h3
            className="text-base font-semibold mb-4"
            style={{ color: "#1B4332" }}
          >
            📊 Proses Pelaporan
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded" style={{ backgroundColor: "#E7D5F5" }}>
              <strong>1. Trial Balance</strong>
              <p style={{ color: "#6C757D" }} className="mt-2">
                Aggregate debit/credit semua akun untuk verifikasi balanced
              </p>
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: "#FFE5E5" }}>
              <strong>2. P&L Statement</strong>
              <p style={{ color: "#6C757D" }} className="mt-2">
                Revenue - Expenses berdasarkan PSAK 241/69
              </p>
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: "#E7F5E9" }}>
              <strong>3. Balance Sheet</strong>
              <p style={{ color: "#6C757D" }} className="mt-2">
                Assets = Liabilities + Equity at period end
              </p>
            </div>
          </div>
        </div>

        {/* Data Integrity & Security */}
        <div
          className="bg-white p-6 rounded-lg border"
          style={{ borderColor: "#DEE2E6" }}
        >
          <h3
            className="text-base font-semibold mb-4"
            style={{ color: "#1B4332" }}
          >
            🔐 Data Integrity & Audit Trail
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div
                style={{
                  color: "#1B4332",
                  fontWeight: "bold",
                  minWidth: "80px",
                }}
              >
                ✅ Tracking:
              </div>
              <div style={{ color: "#495057" }}>
                Setiap aset, transaksi, dan akun mencatat: createdBy, createdAt,
                updatedBy, updatedAt
              </div>
            </div>
            <div className="flex gap-3">
              <div
                style={{
                  color: "#1B4332",
                  fontWeight: "bold",
                  minWidth: "80px",
                }}
              >
                📎 Documents:
              </div>
              <div style={{ color: "#495057" }}>
                Support dokumen pendukung dalam base64 format (PDF, JPG, PNG),
                linked ke journal entry
              </div>
            </div>
            <div className="flex gap-3">
              <div
                style={{
                  color: "#1B4332",
                  fontWeight: "bold",
                  minWidth: "80px",
                }}
              >
                👥 Multi-Admin:
              </div>
              <div style={{ color: "#495057" }}>
                Role-based access: Admin (full), Manager (view+create), Operator
                (input only)
              </div>
            </div>
            <div className="flex gap-3">
              <div
                style={{
                  color: "#1B4332",
                  fontWeight: "bold",
                  minWidth: "80px",
                }}
              >
                ⚙️ Data Reset:
              </div>
              <div style={{ color: "#495057" }}>
                3 options: Load Simulation (demo), Reset to Default (prev
                month), Reset to Zero (clean start)
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div
          className="bg-white p-6 rounded-lg border"
          style={{ borderColor: "#DEE2E6" }}
        >
          <h3
            className="text-base font-semibold mb-4"
            style={{ color: "#1B4332" }}
          >
            ⚡ Quick Reference
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong style={{ color: "#1B4332" }}>Default User:</strong>
              <p style={{ color: "#495057" }} className="mt-1">
                Username: <code>admin_hers</code>
                <br />
                Password: <code>admin123</code>
              </p>
            </div>
            <div>
              <strong style={{ color: "#1B4332" }}>COA Example:</strong>
              <p style={{ color: "#495057" }} className="mt-1">
                1-1200 Bank (parent)
                <br />
                └─ 1-12001 Bank BCA (child)
              </p>
            </div>
            <div>
              <strong style={{ color: "#1B4332" }}>Fair Value Measure:</strong>
              <p style={{ color: "#495057" }} className="mt-1">
                PSAK 241/69 untuk aset biologis farm
              </p>
            </div>
            <div>
              <strong style={{ color: "#1B4332" }}>Export Format:</strong>
              <p style={{ color: "#495057" }} className="mt-1">
                CSV, Excel (TSV) untuk Buku Besar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowItem({ number, title, description, color }: any) {
  return (
    <div
      className="p-4 rounded-lg border-l-4"
      style={{
        backgroundColor: color,
        borderColor: "#1B4332",
        borderWidth: "4px",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
          style={{ backgroundColor: "#1B4332" }}
        >
          {number}
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: "#212529" }}>
            {title}
          </h3>
          <p className="text-sm mt-1" style={{ color: "#495057" }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-2">
      <div className="flex flex-col items-center" style={{ color: "#FFB703" }}>
        <div style={{ fontSize: "24px" }}>↓</div>
        <div style={{ fontSize: "12px", opacity: 0.6 }}>next step</div>
      </div>
    </div>
  );
}
