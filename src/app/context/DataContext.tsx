import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// ============ INTERFACES ============

export interface BiologicalAsset {
  id: string;
  tagId: string;
  type: "Kambing" | "Domba";
  age: number;
  ageUpdatedAt?: string;
  weight: number;
  fairValue: number;
  purchasePrice?: number;  // Harga beli
  profit?: number;  // Untung
  loss?: number;  // Rugi
  lastUpdated: string;
  updatedBy?: string;  // Admin yang update
}

export interface ChartOfAccount {
  code: string;
  name: string;
  parentCode?: string;  // Parent untuk akun anak
  category: "asset" | "liability" | "equity" | "revenue" | "expense";
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface JournalDocument {
  id: string;
  journalEntryId: string;
  fileName: string;
  fileData: string;  // Base64 encoded
  fileType: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  debitAssetId?: string;
  debitAmount: number;
  creditAccount: string;
  creditAssetId?: string;
  creditAmount: number;
  documentId?: string;  // Reference ke JournalDocument
  createdAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AccountBalance {
  code: string;
  name: string;
  debit: number;
  credit: number;
  category: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance?: number;
  parentCode?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: "admin" | "manager" | "operator";
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

interface DataContextType {
  // Auth
  isAuthenticated: boolean;
  currentUser?: AdminUser;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Biological Assets
  biologicalAssets: BiologicalAsset[];
  updateAssetWeight: (id: string, newWeight: number) => Promise<void>;
  addBiologicalAsset: (
    asset: Omit<BiologicalAsset, "id" | "lastUpdated">,
  ) => Promise<void>;
  updateBiologicalAsset: (id: string, asset: Partial<BiologicalAsset>) => Promise<void>;
  deleteBiologicalAsset: (id: string) => Promise<void>;
  
  // Journal Entries
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, "id">) => Promise<void>;
  updateJournalEntry: (id: string, entry: Omit<JournalEntry, "id">) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  
  // Journal Documents
  addJournalDocument: (doc: Omit<JournalDocument, "id">) => Promise<void>;
  getJournalDocuments: (journalEntryId: string) => JournalDocument[];
  deleteJournalDocument: (docId: string) => Promise<void>;
  
  // Chart of Accounts
  chartOfAccounts: ChartOfAccount[];
  addChartOfAccount: (account: ChartOfAccount) => Promise<void>;
  updateChartOfAccount: (code: string, account: Partial<ChartOfAccount>) => Promise<void>;
  deleteChartOfAccount: (code: string) => Promise<void>;
  getAccountsByParent: (parentCode?: string) => ChartOfAccount[];
  
  // Account Balances
  accountBalances: AccountBalance[];
  
  // Fair Value
  fairValuePerKg: number;
  setFairValuePerKg: (nextValue: number) => Promise<void>;
  
  // Admin Management
  admins: AdminUser[];
  addAdmin: (admin: Omit<AdminUser, "id" | "createdAt">) => Promise<void>;
  updateAdmin: (id: string, admin: Partial<AdminUser>) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  
  // Export
  exportGeneralLedgerCSV: () => string;
  exportGeneralLedgerExcel: () => Uint8Array;
  
  // Data Management
  loadSimulationData: () => Promise<void>;
  resetData: () => Promise<void>;
  resetToZero: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const AUTH_STORAGE_KEY = "hers-farm-authenticated";
const CURRENT_USER_KEY = "hers-farm-current-user";
const FAIR_VALUE_PER_KG_STORAGE_KEY = "hers-farm-fair-value-per-kg";
const STORAGE_KEY_ASSETS = "hers-farm-assets";
const STORAGE_KEY_ENTRIES = "hers-farm-entries";
const STORAGE_KEY_DOCUMENTS = "hers-farm-documents";
const STORAGE_KEY_COA = "hers-farm-coa";
const STORAGE_KEY_ADMINS = "hers-farm-admins";

const defaultChartOfAccounts: ChartOfAccount[] = [
  // Assets
  { code: "1-1100", name: "Kas", category: "asset", isActive: true },
  { code: "1-1200", name: "Bank", category: "asset", isActive: true },
  { code: "1-12001", name: "Bank BCA", parentCode: "1-1200", category: "asset", isActive: true },
  { code: "1-12002", name: "Bank Mandiri", parentCode: "1-1200", category: "asset", isActive: true },
  { code: "1-2100", name: "Persediaan Pakan", category: "asset", isActive: true },
  { code: "1-3000", name: "Aset Biologis", category: "asset", isActive: true },
  { code: "1-4100", name: "Aset Tetap - Kandang", category: "asset", isActive: true },
  { code: "1-4200", name: "Akumulasi Penyusutan", category: "asset", isActive: true },
  
  // Liabilities
  { code: "2-1000", name: "Hutang Usaha", category: "liability", isActive: true },
  
  // Equity
  { code: "3-1000", name: "Modal Disetor", category: "equity", isActive: true },
  { code: "3-2000", name: "Laba Ditahan", category: "equity", isActive: true },
  
  // Revenue
  { code: "4-1000", name: "Pendapatan Penjualan", category: "revenue", isActive: true },
  { code: "4-2000", name: "Keuntungan Nilai Wajar", category: "revenue", isActive: true },
  { code: "4-3000", name: "Pendapatan Lain-lain", category: "revenue", isActive: true },
  
  // Expenses
  { code: "5-1000", name: "Beban Gaji", category: "expense", isActive: true },
  { code: "5-2000", name: "Beban Pakan", category: "expense", isActive: true },
  { code: "5-3000", name: "Harga Pokok Penjualan", category: "expense", isActive: true },
  { code: "5-4000", name: "Kerugian Nilai Wajar", category: "expense", isActive: true },
  { code: "5-5000", name: "Beban Lain-lain", category: "expense", isActive: true },
  { code: "5-6000", name: "Beban Penyusutan", category: "expense", isActive: true },
];

const initialAssets: BiologicalAsset[] = [
  {
    id: "1",
    tagId: "DOM-001",
    type: "Domba",
    age: 8,
    weight: 35,
    fairValue: 3500000,
    purchasePrice: 3500000,
    profit: 0,
    loss: 0,
    lastUpdated: "2025-01-15",
  },
  {
    id: "2",
    tagId: "DOM-002",
    type: "Domba",
    age: 6,
    weight: 32,
    fairValue: 3200000,
    purchasePrice: 3200000,
    profit: 0,
    loss: 0,
    lastUpdated: "2025-01-20",
  },
  {
    id: "3",
    tagId: "KMB-001",
    type: "Kambing",
    age: 12,
    weight: 28,
    fairValue: 2800000,
    purchasePrice: 2800000,
    profit: 0,
    loss: 0,
    lastUpdated: "2025-02-10",
  },
];

const initialJournalEntries: JournalEntry[] = [];
const initialAdmins: AdminUser[] = [
  {
    id: "1",
    username: "admin_hers",
    fullName: "Admin Utama",
    email: "admin@hers.com",
    role: "admin",
    isActive: true,
    createdAt: "2025-01-01",
  },
];

function computeAccountBalances(entries: JournalEntry[], coa: ChartOfAccount[]): AccountBalance[] {
  const balances = new Map<string, AccountBalance>();

  const ensureBalance = (account: string, coaEntry?: ChartOfAccount) => {
    if (!balances.has(account)) {
      balances.set(account, {
        code: account.split(" ")[0] || account,
        name: account,
        debit: 0,
        credit: 0,
        balance: 0,
        category: coaEntry?.category || "expense",
        parentCode: coaEntry?.parentCode,
      });
    }
    return balances.get(account)!;
  };

  entries.forEach((entry) => {
    const debitCOA = coa.find(a => a.code === entry.debitAccount.split(" ")[0]);
    const creditCOA = coa.find(a => a.code === entry.creditAccount.split(" ")[0]);
    
    ensureBalance(entry.debitAccount, debitCOA).debit += Number(entry.debitAmount || 0);
    ensureBalance(entry.creditAccount, creditCOA).credit += Number(entry.creditAmount || 0);
  });

  return Array.from(balances.values())
    .map(balance => ({
      ...balance,
      balance: balance.debit - balance.credit,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | undefined>();
  const [biologicalAssets, setBiologicalAssets] =
    useState<BiologicalAsset[]>(initialAssets);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(
    initialJournalEntries,
  );
  const [journalDocuments, setJournalDocuments] = useState<JournalDocument[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>(defaultChartOfAccounts);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [fairValuePerKg, setFairValuePerKgState] = useState<number>(100000);
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);

  // Calculate balances whenever entries or COA changes
  useEffect(() => {
    setAccountBalances(computeAccountBalances(journalEntries, chartOfAccounts));
  }, [journalEntries, chartOfAccounts]);

  const syncAgeByMonth = (assets: BiologicalAsset[]) => {
    const today = new Date();
    const todayDateString = today.toISOString().split("T")[0];
    let changed = false;

    const syncedAssets = assets.map((asset) => {
      const baseDate = new Date(asset.ageUpdatedAt || asset.lastUpdated);
      if (Number.isNaN(baseDate.getTime())) {
        return { ...asset, ageUpdatedAt: todayDateString };
      }

      const monthDiff =
        (today.getFullYear() - baseDate.getFullYear()) * 12 +
        (today.getMonth() - baseDate.getMonth());

      if (monthDiff <= 0) {
        return {
          ...asset,
          ageUpdatedAt: asset.ageUpdatedAt || asset.lastUpdated,
        };
      }

      const nextBaseDate = new Date(baseDate);
      nextBaseDate.setMonth(nextBaseDate.getMonth() + monthDiff);
      changed = true;
      return {
        ...asset,
        age: asset.age + monthDiff,
        ageUpdatedAt: nextBaseDate.toISOString().split("T")[0],
      };
    });

    return { syncedAssets, changed };
  };

  const applyState = (
    nextAssets: BiologicalAsset[],
    nextEntries: JournalEntry[],
  ) => {
    setBiologicalAssets(nextAssets);
    setJournalEntries(nextEntries);
  };

  const persistState = async (
    nextAssets: BiologicalAsset[],
    nextEntries: JournalEntry[],
    nextFairValuePerKg: number,
  ) => {
    // Simpan ke localStorage terlebih dahulu (untuk fallback jika backend down)
    try {
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(nextAssets));
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(nextEntries));
      localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(journalDocuments));
      localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(chartOfAccounts));
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
      localStorage.setItem(FAIR_VALUE_PER_KG_STORAGE_KEY, String(nextFairValuePerKg));
    } catch (error) {
      console.error("Gagal menyimpan data ke localStorage", error);
    }

    // Coba simpan ke backend juga
    try {
      await fetch(`${API_BASE_URL}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          biologicalAssets: nextAssets,
          journalEntries: nextEntries,
          fairValuePerKg: nextFairValuePerKg,
          chartOfAccounts,
          journalDocuments,
          admins,
        }),
      });
    } catch (error) {
      console.warn("Gagal menyimpan data ke backend, menggunakan localStorage", error);
    }
  };

  const commitState = (
    nextAssets: BiologicalAsset[],
    nextEntries: JournalEntry[],
    nextFairValuePerKg = fairValuePerKg,
  ) => {
    applyState(nextAssets, nextEntries);
    setFairValuePerKgState(nextFairValuePerKg);
    localStorage.setItem(FAIR_VALUE_PER_KG_STORAGE_KEY, String(nextFairValuePerKg));
    void persistState(nextAssets, nextEntries, nextFairValuePerKg);
  };

  const loadStateFromBackend = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/state`);
      if (!response.ok) {
        throw new Error(`Backend belum siap (${response.status})`);
      }

      const data = await response.json();
      const backendFairValuePerKg = Number(data.fairValuePerKg || 100000);
      const storedFairValuePerKg = Number(localStorage.getItem(FAIR_VALUE_PER_KG_STORAGE_KEY) || 0);
      const resolvedFairValuePerKg = Number.isFinite(backendFairValuePerKg) && backendFairValuePerKg > 0
        ? backendFairValuePerKg
        : Number.isFinite(storedFairValuePerKg) && storedFairValuePerKg > 0
          ? storedFairValuePerKg
          : 100000;

      const backendAssets = data.biologicalAssets || initialAssets;
      const { syncedAssets, changed } = syncAgeByMonth(backendAssets);

      applyState(syncedAssets, data.journalEntries || initialJournalEntries);
      setFairValuePerKgState(resolvedFairValuePerKg);
      localStorage.setItem(FAIR_VALUE_PER_KG_STORAGE_KEY, String(resolvedFairValuePerKg));

      // Load COA and admin users dari endpoints terpisah
      try {
        const [coaRes, adminsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/chart-of-accounts`),
          fetch(`${API_BASE_URL}/admin-users`),
        ]);

        if (coaRes.ok) {
          const coaData = await coaRes.json();
          if (Array.isArray(coaData.chartOfAccounts) && coaData.chartOfAccounts.length > 0) {
            setChartOfAccounts(coaData.chartOfAccounts);
            localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(coaData.chartOfAccounts));
          }
        }

        if (adminsRes.ok) {
          const adminsData = await adminsRes.json();
          if (Array.isArray(adminsData.admins) && adminsData.admins.length > 0) {
            setAdmins(adminsData.admins);
            localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(adminsData.admins));
          }
        }
      } catch (endpointError) {
        console.warn("Gagal load dari endpoint terpisah, menggunakan data dari /api/state", endpointError);
        if (data.chartOfAccounts && Array.isArray(data.chartOfAccounts)) {
          setChartOfAccounts(data.chartOfAccounts);
        }
        if (data.admins && Array.isArray(data.admins)) {
          setAdmins(data.admins);
        }
      }

      if (data.journalDocuments && Array.isArray(data.journalDocuments)) {
        setJournalDocuments(data.journalDocuments);
      }

      // Simpan ke localStorage juga
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(syncedAssets));
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(data.journalEntries || initialJournalEntries));
      localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(chartOfAccounts || defaultChartOfAccounts));
      localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(data.journalDocuments || []));
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins || initialAdmins));

      if (changed) {
        void persistState(syncedAssets, data.journalEntries || initialJournalEntries, resolvedFairValuePerKg);
      }
    } catch (error) {
      console.warn("Backend tidak tersedia, menggunakan data dari localStorage...", error);
      
      // Coba load dari localStorage
      try {
        const storedAssets = localStorage.getItem(STORAGE_KEY_ASSETS);
        const storedEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
        const storedDocuments = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
        const storedCOA = localStorage.getItem(STORAGE_KEY_COA);
        const storedAdmins = localStorage.getItem(STORAGE_KEY_ADMINS);
        const storedFairValuePerKg = Number(localStorage.getItem(FAIR_VALUE_PER_KG_STORAGE_KEY) || 100000);

        const assets = storedAssets ? JSON.parse(storedAssets) : initialAssets;
        const entries = storedEntries ? JSON.parse(storedEntries) : initialJournalEntries;
        const documents = storedDocuments ? JSON.parse(storedDocuments) : [];
        const coa = storedCOA ? JSON.parse(storedCOA) : defaultChartOfAccounts;
        const admins_list = storedAdmins ? JSON.parse(storedAdmins) : initialAdmins;

        const { syncedAssets } = syncAgeByMonth(assets);
        
        applyState(syncedAssets, entries);
        setFairValuePerKgState(storedFairValuePerKg);
        setJournalDocuments(documents);
        setChartOfAccounts(coa);
        setAdmins(admins_list);

        console.log("✅ Data dimuat dari localStorage (offline mode)");
      } catch (parseError) {
        console.warn("Gagal load dari localStorage, menggunakan initial data", parseError);
        const { syncedAssets } = syncAgeByMonth(initialAssets);
        applyState(syncedAssets, initialJournalEntries);
        setFairValuePerKgState(100000);
      }
    }
  };

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          // fallback
        }
      }
    }

    void loadStateFromBackend();
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const user: AdminUser = data.user || { id: "1", username, fullName: username, role: "admin", isActive: true, createdAt: new Date().toISOString() };
        setIsAuthenticated(true);
        setCurrentUser(user);
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return true;
      }
    } catch (error) {
      console.warn("Backend login gagal, memakai validasi lokal", error);
    }

    // Local fallback
    const adminUser = admins.find(a => a.username === username);
    if (adminUser && password === "admin123") {
      setIsAuthenticated(true);
      setCurrentUser(adminUser);
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(undefined);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateAssetWeight = async (id: string, newWeight: number) => {
    const asset = biologicalAssets.find((a) => a.id === id);
    if (!asset) return;

    const updatedAssets = biologicalAssets.map((a) =>
      a.id === id
        ? {
            ...a,
            weight: newWeight,
            fairValue: newWeight * fairValuePerKg,
            lastUpdated: new Date().toISOString().split("T")[0],
            updatedBy: currentUser?.username,
          }
        : a,
    );

    const oldFairValue = asset.fairValue;
    const newFairValue = newWeight * fairValuePerKg;
    const difference = newFairValue - oldFairValue;

    const updatedEntries =
      difference !== 0
        ? [
            ...journalEntries,
            {
              id: String(Date.now()),
              date: new Date().toISOString().split("T")[0],
              description: `Penyesuaian Nilai Wajar ${asset.tagId} (${asset.weight}kg → ${newWeight}kg)`,
              debitAccount:
                difference > 0
                  ? "1-3000 Aset Biologis"
                  : "5-4000 Kerugian Nilai Wajar",
              debitAssetId: id,
              debitAmount: Math.abs(difference),
              creditAccount:
                difference > 0
                  ? "4-2000 Keuntungan Nilai Wajar"
                  : "1-3000 Aset Biologis",
              creditAssetId: difference < 0 ? id : undefined,
              creditAmount: Math.abs(difference),
              createdBy: currentUser?.username,
            },
          ]
        : journalEntries;

    commitState(updatedAssets, updatedEntries, fairValuePerKg);
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, "id">) => {
    const nextEntries = [
      ...journalEntries,
      { ...entry, id: String(Date.now()), createdBy: currentUser?.username },
    ];
    commitState(biologicalAssets, nextEntries, fairValuePerKg);
  };

  const updateJournalEntry = async (id: string, entry: Omit<JournalEntry, "id">) => {
    const nextEntries = journalEntries.map((journalEntry) =>
      journalEntry.id === id ? { ...entry, id, updatedBy: currentUser?.username } : journalEntry,
    );
    commitState(biologicalAssets, nextEntries, fairValuePerKg);
  };

  const deleteJournalEntry = async (id: string) => {
    const nextEntries = journalEntries.filter(e => e.id !== id);
    setJournalDocuments(docs => docs.filter(d => d.journalEntryId !== id));
    commitState(biologicalAssets, nextEntries, fairValuePerKg);
  };

  const addBiologicalAsset = async (
    asset: Omit<BiologicalAsset, "id" | "lastUpdated">,
  ) => {
    const newAsset: BiologicalAsset = {
      ...asset,
      id: String(Date.now()),
      ageUpdatedAt: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      updatedBy: currentUser?.username,
    };

    const newEntry: JournalEntry = {
      id: String(Date.now() + 1),
      date: newAsset.lastUpdated,
      description: `Pembelian ${asset.type} ${asset.tagId}`,
      debitAccount: "1-3000 Aset Biologis",
      debitAssetId: newAsset.id,
      debitAmount: asset.fairValue,
      creditAccount: "1-1100 Kas",
      creditAmount: asset.fairValue,
      createdBy: currentUser?.username,
    };

    commitState([...biologicalAssets, newAsset], [...journalEntries, newEntry], fairValuePerKg);
  };

  const updateBiologicalAsset = async (id: string, asset: Partial<BiologicalAsset>) => {
    const updatedAssets = biologicalAssets.map((a) =>
      a.id === id
        ? {
            ...a,
            ...asset,
            lastUpdated: new Date().toISOString().split("T")[0],
            updatedBy: currentUser?.username,
          }
        : a,
    );
    commitState(updatedAssets, journalEntries, fairValuePerKg);
  };

  const deleteBiologicalAsset = async (id: string) => {
    const asset = biologicalAssets.find((a) => a.id === id);
    if (!asset) return;

    const newEntry: JournalEntry = {
      id: String(Date.now()),
      date: new Date().toISOString().split("T")[0],
      description: `Penghapusan ${asset.type} ${asset.tagId} (Penjualan/Kematian)`,
      debitAccount: "5-3000 Harga Pokok Penjualan",
      debitAmount: asset.fairValue,
      creditAccount: "1-3000 Aset Biologis",
      creditAssetId: id,
      creditAmount: asset.fairValue,
      createdBy: currentUser?.username,
    };

    commitState(
      biologicalAssets.filter((a) => a.id !== id),
      [...journalEntries, newEntry],
      fairValuePerKg,
    );
  };

  const setFairValuePerKg = async (nextValue: number) => {
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;
    const updatedAssets = biologicalAssets.map((asset) => ({
      ...asset,
      fairValue: asset.weight * nextValue,
    }));
    commitState(updatedAssets, journalEntries, nextValue);
  };

  // Journal Documents
  const addJournalDocument = async (doc: Omit<JournalDocument, "id">) => {
    const newDoc: JournalDocument = {
      ...doc,
      id: String(Date.now()),
      uploadedBy: currentUser?.username,
    };
    const updatedDocs = [...journalDocuments, newDoc];
    setJournalDocuments(updatedDocs);
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(updatedDocs));
  };

  const getJournalDocuments = (journalEntryId: string): JournalDocument[] => {
    return journalDocuments.filter(d => d.journalEntryId === journalEntryId);
  };

  const deleteJournalDocument = async (docId: string) => {
    const updatedDocs = journalDocuments.filter(d => d.id !== docId);
    setJournalDocuments(updatedDocs);
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(updatedDocs));
  };

  // Chart of Accounts
  const addChartOfAccount = async (account: ChartOfAccount) => {
    const existing = chartOfAccounts.find(a => a.code === account.code);
    if (existing) {
      alert("Akun dengan kode ini sudah ada");
      return;
    }
    const newAccount: ChartOfAccount = {
      ...account,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.username,
    };
    const updatedCOA = [...chartOfAccounts, newAccount];
    setChartOfAccounts(updatedCOA);
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(updatedCOA));
  };

  const updateChartOfAccount = async (code: string, account: Partial<ChartOfAccount>) => {
    const updatedCOA = chartOfAccounts.map(a => a.code === code ? { ...a, ...account } : a);
    setChartOfAccounts(updatedCOA);
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(updatedCOA));
  };

  const deleteChartOfAccount = async (code: string) => {
    // Check if used in journal entries
    const isUsed = journalEntries.some(j =>
      j.debitAccount.includes(code) || j.creditAccount.includes(code)
    );
    if (isUsed) {
      alert("Tidak bisa hapus akun yang sudah digunakan dalam jurnal");
      return;
    }
    const updatedCOA = chartOfAccounts.filter(a => a.code !== code);
    setChartOfAccounts(updatedCOA);
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(updatedCOA));
  };

  const getAccountsByParent = (parentCode?: string): ChartOfAccount[] => {
    return chartOfAccounts.filter(a => a.parentCode === parentCode);
  };

  // Admin Management
  const addAdmin = async (admin: Omit<AdminUser, "id" | "createdAt">) => {
    const newAdmin: AdminUser = {
      ...admin,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.username,
    };
    const updatedAdmins = [...admins, newAdmin];
    setAdmins(updatedAdmins);
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updatedAdmins));
  };

  const updateAdmin = async (id: string, admin: Partial<AdminUser>) => {
    const updatedAdmins = admins.map(a => a.id === id ? { ...a, ...admin } : a);
    setAdmins(updatedAdmins);
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updatedAdmins));
  };

  const deleteAdmin = async (id: string) => {
    if (id === currentUser?.id) {
      alert("Tidak bisa menghapus admin yang sedang login");
      return;
    }
    const updatedAdmins = admins.filter(a => a.id !== id);
    setAdmins(updatedAdmins);
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updatedAdmins));
  };

  // Export Functions
  const exportGeneralLedgerCSV = (): string => {
    let csv = "Kode,Nama,Debit,Kredit,Saldo\n";
    accountBalances.forEach(balance => {
      const code = balance.code || "";
      const name = balance.name || "";
      const debit = balance.debit || 0;
      const credit = balance.credit || 0;
      const saldo = balance.balance || 0;
      csv += `"${code}","${name}",${debit},${credit},${saldo}\n`;
    });
    
    csv += "\n\nDetail Transaksi,Tanggal,Deskripsi,Akun Debit,Debit,Akun Kredit,Kredit\n";
    journalEntries.forEach(entry => {
      csv += `"${entry.date}","${entry.description}","${entry.debitAccount}",${entry.debitAmount},"${entry.creditAccount}",${entry.creditAmount}\n`;
    });
    
    return csv;
  };

  const exportGeneralLedgerExcel = (): Uint8Array => {
    // Simple Excel generation (would need a library like xlsx in production)
    // For now, returning CSV as UTF-8 bytes
    const csv = exportGeneralLedgerCSV();
    const encoder = new TextEncoder();
    return encoder.encode(csv);
  };

  // Data Management
  const loadSimulationData = async () => {
    // Using existing simulation data from old context
    const simulationAssets: BiologicalAsset[] = [
      {
        id: "1",
        tagId: "DOM-001",
        type: "Domba",
        age: 8,
        weight: 38,
        fairValue: 3800000,
        purchasePrice: 3500000,
        profit: 300000,
        loss: 0,
        lastUpdated: "2025-12-31",
      },
      {
        id: "2",
        tagId: "DOM-002",
        type: "Domba",
        age: 7,
        weight: 36,
        fairValue: 3600000,
        purchasePrice: 3200000,
        profit: 400000,
        loss: 0,
        lastUpdated: "2025-12-31",
      },
    ];

    commitState(simulationAssets, initialJournalEntries, fairValuePerKg);
  };

  const resetData = async () => {
    const resetAssets = initialAssets.map((asset) => ({
      ...asset,
      ageUpdatedAt: asset.lastUpdated,
    }));
    commitState(resetAssets, initialJournalEntries, fairValuePerKg);
  };

  const resetToZero = async () => {
    if (
      window.confirm(
        "⚠️ PERHATIAN: Ini akan menghapus SEMUA data (aset biologis dan jurnal) untuk memulai input data real. Lanjutkan?",
      )
    ) {
      commitState([], [], fairValuePerKg);
      // Clear localStorage juga
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify([]));
    }
  };

  return (
    <DataContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        biologicalAssets,
        updateAssetWeight,
        addBiologicalAsset,
        updateBiologicalAsset,
        deleteBiologicalAsset,
        journalEntries,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        addJournalDocument,
        getJournalDocuments,
        deleteJournalDocument,
        chartOfAccounts,
        addChartOfAccount,
        updateChartOfAccount,
        deleteChartOfAccount,
        getAccountsByParent,
        accountBalances,
        fairValuePerKg,
        setFairValuePerKg,
        admins,
        addAdmin,
        updateAdmin,
        deleteAdmin,
        exportGeneralLedgerCSV,
        exportGeneralLedgerExcel,
        loadSimulationData,
        resetData,
        resetToZero,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData harus digunakan dalam DataProvider");
  }
  return context;
}
