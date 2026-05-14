# CHANGELOG - HERS FARM ERP System

## [1.0.1] - May 8, 2026

### 🎯 Major Changes

#### Renamed Components & Routes

- **WBSA** → **BS-A** (Balance Sheet - Asset)
  - Route: `/wbsa` → `/bs-a`
  - Component: `WorkingBalanceSheetAsset.tsx` (unchanged)
- **WBSL** → **BS-L** (Balance Sheet - Liability & Equity)
  - Route: `/wbsl` → `/bs-l`
  - Component: `WorkingBalanceSheetLiability.tsx` (unchanged)
- **WPL** → **PL** (Profit & Loss)
  - Route: `/wpl` → `/pl`
  - Component: `WorkingProfitLoss.tsx` (unchanged)

#### Removed Features

- ❌ Backup Bulanan WBS (Monthly Backup)
  - Deleted: `WbsMonthlyBackup.tsx`
  - Deleted: Route `/wbs-backup`
  - Deleted: DB table `monthly_backups`
  - Rationale: Data sudah ada di Buku Besar, tidak perlu backup terpisah

### ✨ New Features

#### 1. Buku Besar (General Ledger) Component

- **File**: `src/app/components/BukuBesar.tsx`
- **Features**:
  - Tampilkan semua akun dengan running balance
  - Expandable per-akun untuk lihat transaksi detail
  - Hitung balance direction per account type
  - Format: Tanggal | Transaksi | Debit | Kredit | Saldo
- **Route**: `/ledger`

#### 2. Print/Preview/Download untuk Laporan

Added to: BalanceSheet, ProfitLoss, TrialBalance

**Features**:

- 👁️ **Preview PDF**: Tampilkan PDF di tab baru
- 💾 **Download PDF**: Unduh sebagai file PDF dengan timestamp
- 🖨️ **Cetak**: Print langsung ke printer (browser print dialog)
- 📋 **Copy**: Copy teks laporan ke clipboard

**File**: `src/app/utils/reportPrinter.ts`

```typescript
-downloadPDF(elementId, filename) -
  previewPDF(elementId) -
  printReport(elementId, reportTitle) -
  copyToClipboard(elementId);
```

#### 3. Updated Balance Sheet Format

- Changed from grid layout to table layout
- **Format**: Dua kolom side-by-side
  - Kolom Kiri: ASET | JUMLAH
  - Kolom Kanan: LIABILITAS DAN EKUITAS | JUMLAH
- Match dengan format Pertashop
- Lebih mudah dibaca dan dicetak

### 📚 Documentation

#### New Files Created

1. **SYSTEM_FLOW.md**
   - Diagram alur data sistem
   - Component & file mapping
   - Data flow visualization
   - Validation rules
   - Testing checklist

2. **SETUP_GUIDE.md**
   - Quick start instructions
   - Feature overview
   - Chart of accounts reference
   - Troubleshooting guide
   - Project structure

3. **API_DOCUMENTATION.md**
   - API endpoint reference
   - Data structure definitions
   - Calculation formulas
   - Security considerations
   - Integration examples

4. **CHANGELOG.md** (this file)
   - Track version history
   - Document changes

### 🔧 Technical Updates

#### Dependencies Added

```json
{
  "html2canvas": "^1.4.1",
  "jspdf": "^2.5.1"
}
```

Used for: PDF generation, preview, dan export

#### File Structure Changes

```
✓ src/app/components/BukuBesar.tsx (NEW)
✓ src/app/utils/reportPrinter.ts (NEW)
✓ src/app/routes.tsx (UPDATED - added /ledger)
✓ src/app/components/Layout.tsx (UPDATED - menu Buku Besar)
✓ src/app/components/BalanceSheet.tsx (UPDATED - print toolbar)
✓ src/app/components/ProfitLoss.tsx (UPDATED - print toolbar)
✓ src/app/components/TrialBalance.tsx (UPDATED - print toolbar)
✓ server/database.js (UPDATED - removed monthly_backups table)
✓ package.json (UPDATED - new dependencies)
✗ src/app/components/WbsMonthlyBackup.tsx (DELETED)
```

#### UI/UX Improvements

- Added print toolbar dengan 4 tombol (Preview, Download, Cetak, Copy)
- Icons dari lucide-react (Eye, Download, Printer, Copy)
- Loading state saat generate PDF
- Consistent button styling dengan tema Hers Farm
- Responsive button layout

### 🔄 Data Flow Summary

**Sebelum:**

```
GL → BS-A, BS-L, PL → Neraca, P&L, TB
        ↓
    WBS Backup (terpisah)
```

**Sesudah:**

```
GL → Buku Besar → BS-A, BS-L, PL → Neraca, P&L, TB
     (per-akun)   (Kertas Kerja)   (Laporan Formal)
                                         ↓
                                  Print/Download/Preview
```

### ✅ Testing Completed

- [x] Routes updated and working
- [x] Buku Besar component displays correctly
- [x] Balance Sheet format matches Pertashop layout
- [x] Print button triggers browser print dialog
- [x] Download creates PDF file
- [x] Preview opens PDF in new tab
- [x] Copy to clipboard works
- [x] Database sync removed monthly_backups
- [x] Navigation menu updated
- [x] No console errors
- [x] All laporan calculations correct

### 🐛 Bug Fixes

- Fixed: Balance Sheet grid layout → table layout untuk better printing
- Fixed: PDF filename includes timestamp
- Fixed: Print preview maintains formatting
- Fixed: Copy to clipboard handles special characters

### ⚠️ Known Issues

- None at this time

### 🚀 Deployment Notes

1. **Database Migration**:

   ```sql
   -- Remove if exists from old installations
   DROP TABLE IF EXISTS monthly_backups;
   ```

2. **Dependencies**:

   ```bash
   npm install html2canvas jspdf
   ```

3. **Backward Compatibility**:
   - Old routes `/wbsa`, `/wbsl`, `/wpl` should be redirected or deprecated
   - Update any bookmarks/links to new routes

### 📝 Breaking Changes

- Route `/wbsa` → `/bs-a`
- Route `/wbsl` → `/bs-l`
- Route `/wpl` → `/pl`
- Route `/wbs-backup` (REMOVED)
- Table `monthly_backups` removed from database

### 🎯 Next Version Plans [v1.1.0]

- [ ] Export to Excel
- [ ] Multi-year comparison
- [ ] Approve workflow
- [ ] User roles (Admin, Accountant, Viewer)
- [ ] Audit trail logging
- [ ] Email report scheduling
- [ ] Mobile responsive improvements
- [ ] Dark mode support

### 📚 Documentation References

- See [SYSTEM_FLOW.md](./SYSTEM_FLOW.md) for system architecture
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for installation & usage
- See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API details

---

## [1.0.0] - Initial Release

### Features

- ✅ Dashboard dengan metrics
- ✅ Aset Biologis management
- ✅ Jurnal Umum (GL) entry
- ✅ Buku Besar view
- ✅ Working Sheets (WBSA, WBSL, WPL)
- ✅ Trial Balance
- ✅ Neraca (Balance Sheet)
- ✅ Laporan Laba Rugi (P&L)
- ✅ Monthly WBS Backup
- ✅ MySQL database integration
- ✅ React + TypeScript frontend
- ✅ Express backend

---

## Version History Summary

| Version | Date        | Status   | Focus                            |
| ------- | ----------- | -------- | -------------------------------- |
| 1.0.1   | May 8, 2026 | Current  | Print/Export, Docs, Route Rename |
| 1.0.0   | -           | Released | Initial Feature Set              |

---

**Last Updated**: May 8, 2026  
**Maintained by**: HERS FARM Dev Team  
**Project**: HERS FARM ERP System
