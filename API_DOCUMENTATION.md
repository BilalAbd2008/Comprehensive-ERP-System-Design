# API Documentation & Data Structures

## 🔗 Backend API Endpoints

### Authentication

```
POST /api/users/auth
- Desc: User login
- Request: { username, password }
- Response: { success, userId, token }
```

### Users

```
GET /api/users/:userId
- Desc: Get user profile

POST /api/users
- Desc: Create new user
- Request: { username, email, password, role }
```

### Journal Entries (Jurnal Umum)

```
GET /api/journal
- Desc: Get all journal entries
- Query: ?userId=XX
- Response: [{ id, date, description, debitAccount, debitAmount, creditAccount, creditAmount }]

POST /api/journal
- Desc: Create new journal entry
- Request: { date, description, debitAccount, debitAmount, creditAccount, creditAmount }

PATCH /api/journal/:id
- Desc: Update journal entry
- Request: { date, description, debitAccount, debitAmount, creditAccount, creditAmount }

DELETE /api/journal/:id
- Desc: Delete journal entry
```

### Biological Assets

```
GET /api/assets
- Desc: Get all biological assets
- Response: [{ id, type, weight, fairValue, tagId, dateAdded, ageMonths }]

POST /api/assets
- Desc: Add new biological asset
- Request: { type, weight, fairValue, tagId, dateAdded }

PATCH /api/assets/:id
- Desc: Update asset (usually fair value)
- Request: { fairValue, weight, ageMonths }

DELETE /api/assets/:id
- Desc: Remove asset (sold/died)
```

---

## 📦 Data Structures

### JournalEntry

```typescript
{
  id: string; // UUID
  userId: string; // Foreign key to users
  date: string; // YYYY-MM-DD format
  description: string; // Transaction description
  debitAccount: string; // Format: "[1-9XXX] Account Name"
  debitAmount: number; // Must equal creditAmount
  creditAccount: string; // Format: "[1-9XXX] Account Name"
  creditAmount: number; // Must equal debitAmount
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**

```json
{
  "id": "uuid-123",
  "date": "2025-01-01",
  "description": "Penjualan Bensin 1/1/25 (Jurnal Umum)",
  "debitAccount": "[1100] Kas",
  "debitAmount": 17041032,
  "creditAccount": "[6100] Penjualan",
  "creditAmount": 17041032
}
```

### BiologicalAsset

```typescript
{
  id: string;                    // UUID
  userId: string;                // Foreign key to users
  type: "Domba" | "Kambing";     // Animal type
  tagId: string;                 // Tag/ID untuk identifikasi
  weight: number;                // kg
  fairValue: number;             // Nilai wajar (Rp) per PSAK 241
  dateAdded: Date;               // Tanggal pembelian/lahir
  ageMonths?: number;            // Umur dalam bulan
  healthStatus?: string;         // Kondisi kesehatan
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**

```json
{
  "id": "uuid-456",
  "type": "Domba",
  "tagId": "DSH-2025-001",
  "weight": 45,
  "fairValue": 2000000,
  "dateAdded": "2025-01-01"
}
```

### TrialBalanceEntry

```typescript
{
  code: string; // Account code (e.g., "1-1100")
  name: string; // Account name (e.g., "Kas")
  debit: number; // Sum of all debits for account
  credit: number; // Sum of all credits for account
}
```

### BalanceSheetItem

```typescript
{
  kas: number;
  bank: number;
  persediaanPakan: number;
  asetBiologis: number;
  asetTetap: number;
  akumulasiPenyusutan: number;
  hutangUsaha: number;
  modalDisetor: number;
  labaDitahan: number;
  totalAsetLancar: number;
  totalAsetTidakLancar: number;
  totalAset: number;
  totalLiabilitas: number;
  totalEkuitas: number;
}
```

### ProfitLossItem

```typescript
{
  pendapatanPenjualan: number;
  hpp: number;
  labaKotor: number;
  bebanGaji: number;
  bebanPakan: number;
  bebanPenyusutan: number;
  totalBebanOperasional: number;
  labaOperasional: number;
  keuntunganNilaiWajar: number;
  pendapatanLain: number;
  kerugianNilaiWajar: number;
  bebanLain: number;
  totalOIOE: number;
  labaBersih: number;
}
```

---

## 🔄 Data Flow dalam Context

### DataContext Structure

```typescript
{
  // Auth
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username, password) => void;
  logout: () => void;

  // Journal Entries
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;

  // Biological Assets
  biologicalAssets: BiologicalAsset[];
  addBiologicalAsset: (asset: BiologicalAsset) => void;
  updateBiologicalAsset: (id: string, asset: BiologicalAsset) => void;
  deleteBiologicalAsset: (id: string) => void;

  // Simulation
  loadSimulationData: () => void;
  resetData: () => void;
  resetToZero: () => void;
}
```

---

## 🧮 Calculation Formulas

### Buku Besar (GL) Balance Calculation

```
For each account:
- Asset & Expense accounts: Balance = Sum(Debits) - Sum(Credits)
- Liability, Equity, Revenue: Balance = Sum(Credits) - Sum(Debits)

Running Balance: Cumulative balance after each transaction (sorted by date)
```

### Trial Balance Verification

```
Total Debit = Sum of all account debits
Total Credit = Sum of all account credits
Balanced = (Total Debit === Total Credit)
```

### Balance Sheet Calculation

```
Total Assets = Current Assets + Fixed Assets
- Current Assets = Kas + Bank + Persediaan
- Fixed Assets = Aset Biologis + (Aset Tetap - Depreciation)

Total Liabilities & Equity = Liabilities + Equity
- Liabilities = Hutang Usaha
- Equity = Modal Disetor + Retained Earnings

Balance Check: Assets === Liabilities + Equity
```

### Profit & Loss Calculation

```
Revenue = Penjualan + Keuntungan Nilai Wajar + Lain-lain
Gross Profit = Penjualan - HPP
Operating Profit = Gross Profit - Operating Expenses
- Operating Expenses = Gaji + Pakan + Penyusutan

Net Profit = Operating Profit + Other Income/Expense
- OIOE = Keuntungan Nilai Wajar + Lain-lain - Kerugian Nilai Wajar - Beban Lain
```

---

## 📊 Validasi Rules

### Journal Entry Validation

```javascript
// Must have:
✓ debitAmount === creditAmount
✓ date is valid ISO date
✓ description is not empty
✓ accounts are valid (format: [1-9XXX] Name)

// Auto-validation:
✓ Debit account must exist in Chart of Accounts
✓ Credit account must exist in Chart of Accounts
```

### Biological Asset Validation

```javascript
// Must have:
✓ type is "Domba" or "Kambing"
✓ weight > 0
✓ fairValue > 0
✓ tagId is unique
✓ dateAdded is valid

// PSAK 241 Rules:
✓ Fair value updated every period
✓ Changes recorded as revaluation
```

### Balance Sheet Validation

```javascript
// Core Equation:
Assets === Liabilities + Equity

// Sub-equations:
Current Assets + Fixed Assets === Assets
Current Liabilities + Equity === Liabilities + Equity
```

---

## 🔐 Security Considerations

### Implemented

- ✓ Password hashing (SHA-256)
- ✓ User authentication via login
- ✓ Database transactions for consistency

### Recommended

- [ ] JWT tokens for API authentication
- [ ] Input sanitization for SQL injection prevention
- [ ] Rate limiting on API endpoints
- [ ] Audit logging for all transactions
- [ ] Role-based access control (RBAC)
- [ ] Two-factor authentication (2FA)

---

## 🧪 Testing Scenarios

### Happy Path

```
1. Login as user
2. Add 2-3 biological assets
3. Create 5-10 journal entries with balanced debits/credits
4. Verify Trial Balance (Debit = Kredit)
5. Check Balance Sheet (Assets = Liabilities + Equity)
6. Check P&L (Revenue - Expense = Net Income)
7. Print all reports
```

### Edge Cases

```
1. Zero balance accounts (should still appear in Trial Balance)
2. Negative balances (check if allowed per account type)
3. Large numbers (> 1 billion)
4. Decimal precision (Rp vs cents)
5. Month-end/Year-end closing
6. Multi-asset transactions
```

---

## 📱 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    /* depends on endpoint */
  },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### Pagination (if implemented)

```json
{
  "success": true,
  "data": [
    /* items */
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 150,
    "hasMore": true
  }
}
```

---

## 🔄 Integration Examples

### React Component Integration

```typescript
import { useData } from '../context/DataContext';

export function MyComponent() {
  const { journalEntries, addJournalEntry } = useData();

  const handleAddEntry = (entry) => {
    addJournalEntry(entry);
    // Component re-renders automatically
  };

  return (
    <div>
      {journalEntries.map(entry => (
        <div key={entry.id}>{entry.description}</div>
      ))}
    </div>
  );
}
```

### Print/Export Integration

```typescript
import { downloadPDF, printReport } from "../utils/reportPrinter";

// Download as PDF
await downloadPDF("report-id", "filename");

// Print to printer
printReport("report-id", "Report Title");

// Preview in new tab
await previewPDF("report-id");
```

---

**API Version**: 1.0.0  
**Last Updated**: May 8, 2026
