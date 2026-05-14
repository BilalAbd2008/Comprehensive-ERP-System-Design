# Alur Sistem ERP Hers Farm

## 📊 Diagram Alur Data

```
┌─────────────────────────────────────────────────────────────────┐
│                    HERS FARM ERP SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

1. ENTRY POINT
   ↓
   ┌─────────────────────────────┐
   │   Dashboard Investor        │
   │  (Overview, Metrics)        │
   └─────────────────────────────┘

2. DATA ENTRY
   ├─ Aset Biologis
   │  (Input: Jenis, Berat, Fair Value per PSAK 241)
   │
   └─ Jurnal Umum / GL
      (Input: Transaksi dengan Debit-Kredit)
      └─→ Stored in journalEntries[]

3. BUKU BESAR (General Ledger)
   │ Source: journalEntries[]
   ├─ Tampilkan per-akun
   ├─ Hitung running balance
   ├─ Sortir by tanggal
   └─→ Calculated balances

4. KERTAS KERJA (Working Sheet)
   │ Source: Running balances dari GL
   │
   ├─ BS-A (Balance Sheet - Asset)
   │  ├─ Aset Lancar
   │  │  ├─ Kas
   │  │  ├─ Bank
   │  │  └─ Persediaan Pakan
   │  └─ Aset Tidak Lancar
   │     ├─ Aset Biologis (PSAK 241)
   │     ├─ Aset Tetap - Kandang
   │     └─ Akumulasi Penyusutan
   │
   ├─ BS-L (Balance Sheet - Liability & Equity)
   │  ├─ Liabilitas Lancar
   │  │  └─ Hutang Usaha
   │  └─ Ekuitas
   │     ├─ Modal Disetor
   │     └─ Laba Ditahan
   │
   └─ PL (Profit & Loss)
      ├─ Pendapatan
      │  ├─ Pendapatan Penjualan
      │  ├─ Keuntungan Nilai Wajar
      │  └─ Pendapatan Lain-lain
      └─ Beban
         ├─ HPP
         ├─ Beban Gaji
         ├─ Beban Pakan
         ├─ Beban Penyusutan
         └─ Beban Lain-lain

5. LAPORAN KEUANGAN FORMAL
   │ Source: GL + Working Sheets
   │
   ├─ Neraca Saldo (Trial Balance)
   │  └─ Verifikasi Debit = Kredit
   │
   ├─ Neraca (Balance Sheet)
   │  └─ Format: Aset | Liabilitas & Ekuitas
   │
   └─ Laporan Laba Rugi (P&L)
      └─ Format: Pendapatan - Biaya = Laba Bersih

6. OUTPUT (Print/Preview/Download)
   ├─ PDF Export
   ├─ Screen Preview
   └─ Print to Printer
```

---

## 🔄 Data Flow Diagram

```
┌──────────────────┐
│  Input Aset      │
│  Biologis        │
└────────┬─────────┘
         │
         ↓
    ┌────────────────┐
    │ biologicalAssets│
    │    Context     │
    └────────┬───────┘
             │
    ┌────────────────────────────────────────┐
    │     Jurnal Umum (General Ledger)       │
    │  Input Debit-Kredit untuk setiap akun  │
    └────────┬──────────────────────────────┘
             │
             ↓
    ┌────────────────────────────────────────┐
    │    journalEntries Context Array        │
    │  [{date, description, debit/credit...}]
    └────────┬──────────────────────────────┘
             │
             ├─────────────┬────────────────┬──────────────┐
             │             │                │              │
             ↓             ↓                ↓              ↓
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  Buku Besar  │ │   BS-A       │ │   BS-L       │ │    PL        │
      │  (Calc Per   │ │  (Calc       │ │  (Calc       │ │  (Calc       │
      │   Account)   │ │  Assets)     │ │  Liab+Equity)│ │  Income-Exp) │
      └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
             │                │                │              │
             └────────────────┼────────────────┼──────────────┘
                              │                │
                              ↓                ↓
                        ┌──────────────────────────────────┐
                        │   Trial Balance (Neraca Saldo)   │
                        │ Verification: Debit = Kredit?    │
                        └──────────┬───────────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                        ↓                     ↓
                  ┌────────────────┐   ┌────────────────┐
                  │  Balance Sheet │   │  P&L Statement │
                  │  (Neraca)      │   │  (Laba Rugi)   │
                  └────────┬───────┘   └────────┬───────┘
                           │                    │
                           └────────────┬───────┘
                                        │
                                        ↓
                        ┌──────────────────────────────┐
                        │   OUTPUT / REPORTING         │
                        │ ✓ PDF Download               │
                        │ ✓ Print Preview              │
                        │ ✓ Screen Display             │
                        └──────────────────────────────┘
```

---

## 📋 Komponen & File

| File                                 | Fungsi                                       | Input                                 | Output                           |
| ------------------------------------ | -------------------------------------------- | ------------------------------------- | -------------------------------- |
| **GeneralLedger.tsx**                | Input jurnal & chart of accounts             | Date, Description, Akun, Debit/Kredit | journalEntries array             |
| **BukuBesar.tsx**                    | Tampilkan GL per-akun dengan running balance | journalEntries                        | Balance per akun                 |
| **WorkingBalanceSheetAsset.tsx**     | Kertas kerja aset                            | journalEntries + biologicalAssets     | BS-A                             |
| **WorkingBalanceSheetLiability.tsx** | Kertas kerja liabilitas & ekuitas            | journalEntries                        | BS-L                             |
| **WorkingProfitLoss.tsx**            | Kertas kerja P&L                             | journalEntries                        | PL                               |
| **TrialBalance.tsx**                 | Neraca saldo (verifikasi)                    | journalEntries                        | Trial Balance + Verification     |
| **BalanceSheet.tsx**                 | Laporan Posisi Keuangan                      | journalEntries + biologicalAssets     | Neraca Formal                    |
| **ProfitLoss.tsx**                   | Laporan Laba Rugi                            | journalEntries                        | P&L Statement                    |
| **DataContext.tsx**                  | State management                             | -                                     | journalEntries, biologicalAssets |
| **server/index.js**                  | API Backend                                  | HTTP requests                         | JSON responses                   |
| **server/database.js**               | Database connections                         | -                                     | MySQL pool                       |

---

## 🔗 Koneksi Antar Komponen

```javascript
// Context: DataContext.tsx
{
  journalEntries: [
    {
      id, date, description,
      debitAccount, debitAmount,
      creditAccount, creditAmount
    },
    ...
  ],
  biologicalAssets: [
    { id, type, weight, fairValue, tagId, ... },
    ...
  ]
}

// Alur perhitungan di setiap komponen:
1. Ambil journalEntries dari Context
2. Filter/loop untuk hitung balances
3. Tampilkan hasil dengan format accounting
```

---

## ✅ Validasi Sistem

```
Asumsi yang harus terpenuhi:

1. JURNAL UMUM (GL Entry)
   ✓ Setiap transaksi: Debit Amount = Kredit Amount
   ✓ Format Akun: "[1-9XXX] Nama Akun"

2. BUKU BESAR (GL Balance)
   ✓ Running balance akurat per-akun
   ✓ Assets & Expenses: Debit Balance
   ✓ Liab, Equity, Revenue: Kredit Balance

3. NERACA SALDO (Trial Balance)
   ✓ Total Debit = Total Kredit
   ✓ Semua akun terdaftar

4. NERACA (Balance Sheet)
   ✓ Total Aset = Total Liab + Ekuitas
   ✓ Aset Biologis @ Fair Value (PSAK 241)

5. LABA RUGI (P&L)
   ✓ Revenue > 0 (credits)
   ✓ Expense > 0 (debits)
   ✓ Laba Bersih = Valid (tidak negatif tanpa alasan)
```

---

## 📱 Integrasi dengan Backend

```
API Endpoints (server/index.js):

GET  /api/users/:userId
POST /api/users/auth
GET  /api/journal
POST /api/journal (create entry)
PATCH /api/journal/:id
DELETE /api/journal/:id
GET  /api/assets
POST /api/assets
PATCH /api/assets/:id
DELETE /api/assets/:id
```

---

## 🖨️ Print/Preview Feature

```
Untuk setiap laporan (BalanceSheet, ProfitLoss, TrialBalance):

1. Preview PDF
   └─ Tampilkan snapshot laporan

2. Download PDF
   └─ Generate PDF file → Download

3. Print to Printer
   └─ Format print-friendly → Send to printer

Library yang digunakan:
- html2canvas (capture HTML)
- jsPDF (generate PDF)
- print API (browser print)
```

---

## 🎯 Testing Checklist

- [ ] Input transaksi di GL → muncul di Buku Besar
- [ ] Buku Besar balance akurat per-akun
- [ ] BS-A menjumlahkan dengan benar
- [ ] BS-L menjumlahkan dengan benar
- [ ] PL menghitung laba bersih dengan benar
- [ ] Trial Balance: Debit = Kredit
- [ ] Balance Sheet: Aset = Liab + Ekuitas
- [ ] PDF download berfungsi
- [ ] PDF preview berfungsi
- [ ] Print function berfungsi

---

## 📌 Catatan

- **PSAK 241**: Aset biologis dinilai dengan fair value setiap periode
- **Double Entry Bookkeeping**: Setiap transaksi harus balanced
- **Chart of Accounts**:
  - 1xxx: Asset
  - 2xxx: Liability
  - 3xxx: Equity
  - 4xxx: Revenue
  - 5xxx: Expense
