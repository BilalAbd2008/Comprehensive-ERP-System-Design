# 📊 HERS FARM ERP SYSTEM - Setup & Usage Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
# atau
npm install
```

### 2. Setup Backend

Pastikan MySQL sudah berjalan dan buat database:

```sql
CREATE DATABASE IF NOT EXISTS hers_farm;
```

Update `.env` dengan kredensial database:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=hers_farm
BACKEND_PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
```

### 3. Run Development Server

**Terminal 1 - Backend:**

```bash
npm run dev:server
```

**Terminal 2 - Frontend:**

```bash
npm run dev:client
```

Atau keduanya sekaligus:

```bash
npm run dev:full
```

---

## 📱 Fitur Utama

### 1. **Dashboard Investor**

- Overview metrics (Populasi, Fair Value, Kas, Burn Rate)
- Chart transaksi bulanan
- Recent transactions

### 2. **Data Entry**

- **Aset Biologis**: Catat domba/kambing dengan tipe, berat, fair value
- **Jurnal Umum**: Input transaksi dengan metode debit-kredit

### 3. **Buku Besar (GL)**

- Lihat detail per-akun dengan running balance
- Expandable per-akun untuk melihat transaksi detail
- Format: Tanggal | Transaksi | Debit | Kredit | Saldo

### 4. **Kertas Kerja (Working Sheets)**

- **BS-A** (Balance Sheet - Asset): Aset Lancar & Tidak Lancar
- **BS-L** (Balance Sheet - Liability & Equity): Hutang & Modal
- **PL** (Profit & Loss): Pendapatan & Beban

### 5. **Laporan Keuangan Formal**

- **Neraca Saldo (Trial Balance)**: Verifikasi Debit = Kredit
- **Neraca (Balance Sheet)**: Format dua kolom (Aset | Liab+Ekuitas)
- **Laporan Laba Rugi (P&L)**: Revenue - Expense = Laba Bersih

### 6. **Print/Preview/Download**

Setiap laporan memiliki toolbar dengan:

- 👁️ **Preview**: Lihat PDF di tab baru
- 💾 **Download**: Unduh sebagai file PDF
- 🖨️ **Cetak**: Cetak langsung ke printer
- 📋 **Copy**: Salin teks ke clipboard

---

## 🔄 Alur Data Sistem

```
INPUT → BUKU BESAR → KERTAS KERJA → LAPORAN FORMAL → OUTPUT

1. Aset Biologis + Jurnal Umum
   ↓
2. Buku Besar (Per-Akun Ledger)
   ↓
3. Working Sheets (BS-A, BS-L, PL)
   ↓
4. Trial Balance (Verifikasi)
   ↓
5. Balance Sheet + P&L (Final Reports)
   ↓
6. PDF/Print/Preview
```

---

## 📊 Chart of Accounts

| Kode | Kategori   | Deskripsi                                    |
| ---- | ---------- | -------------------------------------------- |
| 1xxx | ASET       | Kas, Bank, Persediaan, Aset Bio, Aset Tetap  |
| 2xxx | LIABILITAS | Hutang Usaha                                 |
| 3xxx | EKUITAS    | Modal Disetor, Laba Ditahan                  |
| 4xxx | REVENUE    | Penjualan, Keuntungan Nilai Wajar, Lain-lain |
| 5xxx | EXPENSE    | Gaji, Pakan, HPP, Penyusutan, Lain-lain      |

---

## ✅ Checklist Implementasi

### ✅ Selesai

- [x] Rename routes: wbsa→bs-a, wbsl→bs-l, wpl→pl
- [x] Hapus fitur backup bulanan
- [x] Buat Buku Besar (GL) component
- [x] Update Balance Sheet format dua kolom
- [x] Print/Preview/Download untuk laporan
- [x] Dokumentasi alur sistem
- [x] Database integration

### 📋 Todo (Optional Enhancements)

- [ ] Export data ke Excel
- [ ] Multi-tahun reporting
- [ ] Budget vs Actual comparison
- [ ] Approval workflow untuk transaksi
- [ ] User roles & permissions
- [ ] SMS notifications untuk anomali
- [ ] Mobile app version
- [ ] Financial analytics dashboard

---

## 📋 Structure File

```
src/
├── app/
│   ├── components/
│   │   ├── Dashboard.tsx              # Overview metrics
│   │   ├── BiologicalAssets.tsx       # Input aset biologis
│   │   ├── GeneralLedger.tsx          # Input jurnal
│   │   ├── BukuBesar.tsx              # Ledger per-akun
│   │   ├── WorkingBalanceSheetAsset.tsx
│   │   ├── WorkingBalanceSheetLiability.tsx
│   │   ├── WorkingProfitLoss.tsx
│   │   ├── TrialBalance.tsx           # Neraca Saldo + Print
│   │   ├── BalanceSheet.tsx           # Neraca + Print
│   │   ├── ProfitLoss.tsx             # Laba Rugi + Print
│   │   └── Layout.tsx                 # Navigation sidebar
│   ├── context/
│   │   └── DataContext.tsx            # Global state management
│   ├── utils/
│   │   └── reportPrinter.ts           # Print/PDF utilities
│   └── routes.tsx                     # Router configuration
│
server/
├── index.js                           # Express API
├── database.js                        # MySQL connection
└── defaultState.js                    # Seed data

SYSTEM_FLOW.md                         # Dokumentasi alur
README.md                              # File ini
```

---

## 🔧 Troubleshooting

### "Database connection failed"

- Pastikan MySQL sudah running
- Update .env dengan kredensial yang benar
- Buat database: `CREATE DATABASE hers_farm;`

### "PDF download tidak berfungsi"

- Pastikan libraries sudah ter-install: `npm install html2canvas jspdf`
- Clear browser cache
- Coba gunakan browser lain

### "Data tidak muncul di laporan"

- Pastikan sudah input transaksi di Jurnal Umum
- Verifikasi di Buku Besar apakah balance sudah benar
- Check Trial Balance apakah Debit = Kredit

### "Printing tidak bekerja"

- Pastikan browser tidak memblokir popups
- Check print preview untuk format
- Gunakan Ctrl+P manual jika fitur tidak berfungsi

---

## 📞 Support

Untuk pertanyaan atau issue:

1. Check dokumentasi di [SYSTEM_FLOW.md](./SYSTEM_FLOW.md)
2. Lihat example data di server/defaultState.js
3. Cek browser console untuk error messages
4. Review API responses di Network tab

---

## 📝 Catatan PSAK 241

Sistem ini mengikuti PSAK 241 (Akuntansi Pertanian):

- **Aset Biologis** dinilai dengan **Fair Value** setiap periode
- **Keuntungan/Kerugian Nilai Wajar** diakui di P&L
- **Biological Transformation** diperlakukan sebagai perubahan nilai wajar
- Report bulanan untuk tracking perubahan aset

---

## 🎯 Next Steps

1. **Production Deployment**
   - Setup proper database backups
   - Configure SSL certificates
   - Setup monitoring & logging

2. **User Management**
   - Implement role-based access control (RBAC)
   - Add audit trail untuk semua transaksi
   - Two-factor authentication

3. **Integration**
   - Connect ke payment gateway
   - Setup automatic bank reconciliation
   - Email reminders untuk close period

4. **Reporting**
   - Custom report builder
   - Scheduled email reports
   - Financial analysis dashboard

---

**Version**: 1.0.0  
**Last Updated**: May 8, 2026  
**Maintained by**: HERS FARM ERP Team
