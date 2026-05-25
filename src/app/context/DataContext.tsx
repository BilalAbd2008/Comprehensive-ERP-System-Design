import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getSimulation2025Bundle } from "../data/simulation2025";

// ============ INTERFACES ============

export interface BiologicalAsset {
  id: string;
  tagId: string;
  type: string;
  age: number;
  ageUpdatedAt?: string;
  weight: number;
  fairValue: number;
  purchasePrice?: number; // Harga beli
  profit?: number; // Untung
  loss?: number; // Rugi
  lastUpdated: string;
  createdBy?: string; // Admin yang membuat
  updatedBy?: string; // Admin yang update
}

export interface ChartOfAccount {
  code: string;
  name: string;
  parentCode?: string | null; // Parent untuk akun anak
  category: "asset" | "liability" | "equity" | "revenue" | "expense";
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface JournalDocument {
  id: string;
  journalEntryId: string;
  documentSide?: "debit" | "credit" | "general";
  fileName: string;
  fileData: string; // Base64 encoded
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
  documentId?: string; // Reference ke JournalDocument
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
  updateBiologicalAsset: (
    id: string,
    asset: Partial<BiologicalAsset>,
  ) => Promise<void>;
  deleteBiologicalAsset: (id: string) => Promise<void>;

  // Journal Entries
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, "id">) => Promise<string>;
  updateJournalEntry: (
    id: string,
    entry: Omit<JournalEntry, "id">,
  ) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Journal Documents
  addJournalDocument: (doc: Omit<JournalDocument, "id">) => Promise<void>;
  getJournalDocuments: (journalEntryId: string) => JournalDocument[];
  deleteJournalDocument: (docId: string) => Promise<void>;

  // Chart of Accounts
  chartOfAccounts: ChartOfAccount[];
  addChartOfAccount: (account: ChartOfAccount) => Promise<void>;
  updateChartOfAccount: (
    code: string,
    account: Partial<ChartOfAccount>,
  ) => Promise<void>;
  deleteChartOfAccount: (code: string) => Promise<void>;
  getAccountsByParent: (parentCode?: string) => ChartOfAccount[];

  // Account Balances
  accountBalances: AccountBalance[];

  // Fair Value
  fairValuePerKg: number;
  setFairValuePerKg: (nextValue: number) => Promise<void>;
  fairValuePerKgByType: Record<string, number>;
  animalTypes: string[];
  setFairValuePerKgForType: (type: string, nextValue: number) => Promise<void>;
  addAnimalType: (type: string, initialFairValuePerKg: number) => Promise<void>;

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
const SIMULATION_MODE_STORAGE_KEY = "hers-farm-simulation-mode";
const FAIR_VALUE_PER_KG_STORAGE_KEY = "hers-farm-fair-value-per-kg";
const FAIR_VALUE_BY_TYPE_STORAGE_KEY = "hers-farm-fair-value-by-type";
const STORAGE_KEY_ASSETS = "hers-farm-assets";
const STORAGE_KEY_ENTRIES = "hers-farm-entries";
const STORAGE_KEY_DOCUMENTS = "hers-farm-documents";
const STORAGE_KEY_COA = "hers-farm-coa";
const STORAGE_KEY_ADMINS = "hers-farm-admins";

const defaultChartOfAccounts: ChartOfAccount[] = [
  // Assets
  { code: "1-1100", name: "Kas", category: "asset", isActive: true },
  {
    code: "1-11001",
    name: "Kas Kecil",
    parentCode: "1-1100",
    category: "asset",
    isActive: true,
  },
  {
    code: "1-11002",
    name: "Kas Besar",
    parentCode: "1-1100",
    category: "asset",
    isActive: true,
  },
  { code: "1-1200", name: "Bank", category: "asset", isActive: true },
  {
    code: "1-12001",
    name: "Bank BCA",
    parentCode: "1-1200",
    category: "asset",
    isActive: true,
  },
  {
    code: "1-12002",
    name: "Bank Mandiri",
    parentCode: "1-1200",
    category: "asset",
    isActive: true,
  },
  {
    code: "1-2100",
    name: "Persediaan Pakan",
    category: "asset",
    isActive: true,
  },
  { code: "1-3000", name: "Aset Biologis", category: "asset", isActive: true },
  {
    code: "1-4100",
    name: "Aset Tetap - Kandang",
    category: "asset",
    isActive: true,
  },
  {
    code: "1-4200",
    name: "Akumulasi Penyusutan",
    category: "asset",
    isActive: true,
  },

  // Liabilities
  {
    code: "2-1000",
    name: "Hutang Usaha",
    category: "liability",
    isActive: true,
  },

  // Equity
  { code: "3-1000", name: "Modal Disetor", category: "equity", isActive: true },
  { code: "3-2000", name: "Laba Ditahan", category: "equity", isActive: true },

  // Revenue
  {
    code: "4-1000",
    name: "Pendapatan Penjualan",
    category: "revenue",
    isActive: true,
  },
  {
    code: "4-2000",
    name: "Keuntungan Nilai Wajar",
    category: "revenue",
    isActive: true,
  },
  {
    code: "4-3000",
    name: "Pendapatan Lain-lain",
    category: "revenue",
    isActive: true,
  },

  // Expenses
  { code: "5-1000", name: "Beban Gaji", category: "expense", isActive: true },
  { code: "5-2000", name: "Beban Pakan", category: "expense", isActive: true },
  {
    code: "5-3000",
    name: "Harga Pokok Penjualan",
    category: "expense",
    isActive: true,
  },
  {
    code: "5-4000",
    name: "Kerugian Nilai Wajar",
    category: "expense",
    isActive: true,
  },
  {
    code: "5-5000",
    name: "Beban Lain-lain",
    category: "expense",
    isActive: true,
  },
  {
    code: "5-6000",
    name: "Beban Penyusutan",
    category: "expense",
    isActive: true,
  },
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
const defaultFairValuePerKgByType: Record<string, number> = {
  Domba: 80000,
  Kambing: 100000,
};
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

function computeAccountBalances(
  entries: JournalEntry[],
  coa: ChartOfAccount[],
): AccountBalance[] {
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
    const debitCOA = coa.find(
      (a) => a.code === entry.debitAccount.split(" ")[0],
    );
    const creditCOA = coa.find(
      (a) => a.code === entry.creditAccount.split(" ")[0],
    );

    ensureBalance(entry.debitAccount, debitCOA).debit += Number(
      entry.debitAmount || 0,
    );
    ensureBalance(entry.creditAccount, creditCOA).credit += Number(
      entry.creditAmount || 0,
    );
  });

  return Array.from(balances.values())
    .map((balance) => ({
      ...balance,
      balance: balance.debit - balance.credit,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatAccount(account: ChartOfAccount) {
  return `${account.code} ${account.name}`;
}

function findAccount(
  coa: ChartOfAccount[],
  code: string,
  fallbackName: string,
) {
  const account = coa.find((item) => item.code === code);
  return account ? formatAccount(account) : `${code} ${fallbackName}`;
}

function getUniqueAnimalTypes(
  assets: BiologicalAsset[],
  priceMap: Record<string, number>,
) {
  return Array.from(
    new Set([
      ...Object.keys(priceMap),
      ...assets.map((asset) => asset.type).filter(Boolean),
    ]),
  ).sort((a, b) => a.localeCompare(b));
}

function normalizeFairValueByType(
  value: unknown,
  assets: BiologicalAsset[],
  fallback: number,
) {
  if (
    value &&
    typeof value === "object" &&
    Object.keys(value as Record<string, unknown>).length === 0 &&
    assets.length === 0
  ) {
    return {};
  }

  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : defaultFairValuePerKgByType;
  const normalized: Record<string, number> = {};

  for (const [type, price] of Object.entries(source)) {
    const parsed = Number(price);
    if (type.trim() && Number.isFinite(parsed) && parsed >= 0) {
      normalized[type.trim()] = parsed;
    }
  }

  for (const asset of assets) {
    if (!asset.type || normalized[asset.type]) continue;
    const inferred = asset.weight > 0 ? Number(asset.fairValue) / asset.weight : fallback;
    normalized[asset.type] =
      Number.isFinite(inferred) && inferred >= 0 ? Math.round(inferred) : fallback;
  }

  return Object.keys(normalized).length > 0
    ? normalized
    : { ...defaultFairValuePerKgByType };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) === "true",
  );
  const [currentUser, setCurrentUser] = useState<AdminUser | undefined>(() => {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!storedUser) return undefined;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return undefined;
    }
  });
  const [biologicalAssets, setBiologicalAssets] =
    useState<BiologicalAsset[]>(initialAssets);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(
    initialJournalEntries,
  );
  const [journalDocuments, setJournalDocuments] = useState<JournalDocument[]>(
    [],
  );
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>(
    defaultChartOfAccounts,
  );
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [fairValuePerKg, setFairValuePerKgState] = useState<number>(100000);
  const [fairValuePerKgByType, setFairValuePerKgByTypeState] =
    useState<Record<string, number>>(defaultFairValuePerKgByType);
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const animalTypes = getUniqueAnimalTypes(
    biologicalAssets,
    fairValuePerKgByType,
  );

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
    nextJournalDocuments = journalDocuments,
    nextChartOfAccounts = chartOfAccounts,
    nextAdmins = admins,
    nextFairValuePerKgByType = fairValuePerKgByType,
    forceBackend = false,
  ) => {
    // Simpan ke localStorage terlebih dahulu (untuk fallback jika backend down)
    try {
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(nextAssets));
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(nextEntries));
      localStorage.setItem(
        STORAGE_KEY_DOCUMENTS,
        JSON.stringify(nextJournalDocuments),
      );
      localStorage.setItem(
        STORAGE_KEY_COA,
        JSON.stringify(nextChartOfAccounts),
      );
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(nextAdmins));
      localStorage.setItem(
        FAIR_VALUE_PER_KG_STORAGE_KEY,
        String(nextFairValuePerKg),
      );
      localStorage.setItem(
        FAIR_VALUE_BY_TYPE_STORAGE_KEY,
        JSON.stringify(nextFairValuePerKgByType),
      );
    } catch (error) {
      console.error("Gagal menyimpan data ke localStorage", error);
    }

    if (isSimulationMode && !forceBackend) {
      console.info("Mode data contoh aktif: perubahan hanya disimpan lokal.");
      return;
    }

    // Coba simpan ke backend juga
    try {
      const response = await fetch(`${API_BASE_URL}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          biologicalAssets: nextAssets,
          journalEntries: nextEntries,
          fairValuePerKg: nextFairValuePerKg,
          chartOfAccounts: nextChartOfAccounts,
          journalDocuments: nextJournalDocuments,
          admins: nextAdmins,
          fairValuePerKgByType: nextFairValuePerKgByType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Backend gagal menyimpan (${response.status})`,
        );
      }
    } catch (error) {
      console.warn(
        "Gagal menyimpan data ke backend, data hanya tersimpan di localStorage",
        error,
      );
      const detail =
        error instanceof Error && error.message
          ? `\n\nDetail: ${error.message}`
          : "";
      alert(
        `Data belum masuk ke database MySQL. Pastikan backend dan MySQL berjalan, lalu simpan ulang.${detail}`,
      );
      throw error;
    }
  };

  const commitState = async (
    nextAssets: BiologicalAsset[],
    nextEntries: JournalEntry[],
    nextFairValuePerKg = fairValuePerKg,
    nextJournalDocuments = journalDocuments,
    nextFairValuePerKgByType = fairValuePerKgByType,
    forceBackend = false,
  ) => {
    await persistState(
      nextAssets,
      nextEntries,
      nextFairValuePerKg,
      nextJournalDocuments,
      chartOfAccounts,
      admins,
      nextFairValuePerKgByType,
      forceBackend,
    );
    applyState(nextAssets, nextEntries);
    setFairValuePerKgState(nextFairValuePerKg);
    setFairValuePerKgByTypeState(nextFairValuePerKgByType);
  };

  const loadStateFromBackend = async () => {
    try {
      const storedSimulationMode =
        localStorage.getItem(SIMULATION_MODE_STORAGE_KEY) === "true";
      if (storedSimulationMode) {
        throw new Error("Mode data contoh aktif");
      }

      const response = await fetch(`${API_BASE_URL}/state`);
      if (!response.ok) {
        throw new Error(`Backend belum siap (${response.status})`);
      }

      const data = await response.json();
      const backendFairValuePerKg = Number(data.fairValuePerKg ?? 100000);
      const storedFairValuePerKg = Number(
        localStorage.getItem(FAIR_VALUE_PER_KG_STORAGE_KEY) || 0,
      );
      const resolvedFairValuePerKg =
        Number.isFinite(backendFairValuePerKg) && backendFairValuePerKg >= 0
          ? backendFairValuePerKg
          : Number.isFinite(storedFairValuePerKg) && storedFairValuePerKg >= 0
            ? storedFairValuePerKg
            : 100000;

      const backendAssets = data.biologicalAssets || initialAssets;
      const { syncedAssets, changed } = syncAgeByMonth(backendAssets);
      const resolvedFairValueByType = normalizeFairValueByType(
        data.fairValuePerKgByType,
        syncedAssets,
        resolvedFairValuePerKg,
      );

      applyState(syncedAssets, data.journalEntries || initialJournalEntries);
      setFairValuePerKgState(resolvedFairValuePerKg);
      setFairValuePerKgByTypeState(resolvedFairValueByType);
      localStorage.setItem(
        FAIR_VALUE_PER_KG_STORAGE_KEY,
        String(resolvedFairValuePerKg),
      );
      localStorage.setItem(
        FAIR_VALUE_BY_TYPE_STORAGE_KEY,
        JSON.stringify(resolvedFairValueByType),
      );

      // Load COA and admin users dari endpoints terpisah
      try {
        const [coaRes, adminsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/chart-of-accounts`),
          fetch(`${API_BASE_URL}/admin-users`),
        ]);

        if (coaRes.ok) {
          const coaData = await coaRes.json();
          if (
            Array.isArray(coaData.chartOfAccounts) &&
            coaData.chartOfAccounts.length > 0
          ) {
            setChartOfAccounts(coaData.chartOfAccounts);
            localStorage.setItem(
              STORAGE_KEY_COA,
              JSON.stringify(coaData.chartOfAccounts),
            );
          }
        }

        if (adminsRes.ok) {
          const adminsData = await adminsRes.json();
          if (
            Array.isArray(adminsData.admins) &&
            adminsData.admins.length > 0
          ) {
            setAdmins(adminsData.admins);
            localStorage.setItem(
              STORAGE_KEY_ADMINS,
              JSON.stringify(adminsData.admins),
            );
          }
        }
      } catch (endpointError) {
        console.warn(
          "Gagal load dari endpoint terpisah, menggunakan data dari /api/state",
          endpointError,
        );
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
      localStorage.setItem(
        STORAGE_KEY_ENTRIES,
        JSON.stringify(data.journalEntries || initialJournalEntries),
      );
      localStorage.setItem(
        STORAGE_KEY_COA,
        JSON.stringify(chartOfAccounts || defaultChartOfAccounts),
      );
      localStorage.setItem(
        STORAGE_KEY_DOCUMENTS,
        JSON.stringify(data.journalDocuments || []),
      );
      localStorage.setItem(
        STORAGE_KEY_ADMINS,
        JSON.stringify(admins || initialAdmins),
      );

      if (changed) {
        void persistState(
          syncedAssets,
          data.journalEntries || initialJournalEntries,
          resolvedFairValuePerKg,
          journalDocuments,
          chartOfAccounts,
          admins,
          resolvedFairValueByType,
        );
      }
    } catch (error) {
      console.warn(
        "Backend tidak tersedia, menggunakan data dari localStorage...",
        error,
      );

      // Coba load dari localStorage
      try {
        const storedAssets = localStorage.getItem(STORAGE_KEY_ASSETS);
        const storedEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
        const storedDocuments = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
        const storedCOA = localStorage.getItem(STORAGE_KEY_COA);
        const storedAdmins = localStorage.getItem(STORAGE_KEY_ADMINS);
        const storedFairValueByType = localStorage.getItem(
          FAIR_VALUE_BY_TYPE_STORAGE_KEY,
        );
        const storedSimulationMode =
          localStorage.getItem(SIMULATION_MODE_STORAGE_KEY) === "true";
        const storedFairValuePerKg = Number(
          localStorage.getItem(FAIR_VALUE_PER_KG_STORAGE_KEY) || 100000,
        );

        const assets = storedAssets ? JSON.parse(storedAssets) : initialAssets;
        const entries = storedEntries
          ? JSON.parse(storedEntries)
          : initialJournalEntries;
        const documents = storedDocuments ? JSON.parse(storedDocuments) : [];
        const coa = storedCOA ? JSON.parse(storedCOA) : defaultChartOfAccounts;
        const admins_list = storedAdmins
          ? JSON.parse(storedAdmins)
          : initialAdmins;

        const { syncedAssets } = syncAgeByMonth(assets);
        const fairValueByType = normalizeFairValueByType(
          storedFairValueByType ? JSON.parse(storedFairValueByType) : null,
          syncedAssets,
          storedFairValuePerKg,
        );

        applyState(syncedAssets, entries);
        setFairValuePerKgState(storedFairValuePerKg);
        setFairValuePerKgByTypeState(fairValueByType);
        setJournalDocuments(documents);
        setChartOfAccounts(coa);
        setAdmins(admins_list);
        setIsSimulationMode(storedSimulationMode);

        console.log("✅ Data dimuat dari localStorage (offline mode)");
      } catch (parseError) {
        console.warn(
          "Gagal load dari localStorage, menggunakan initial data",
          parseError,
        );
        const { syncedAssets } = syncAgeByMonth(initialAssets);
        applyState(syncedAssets, initialJournalEntries);
        setFairValuePerKgState(100000);
        setFairValuePerKgByTypeState(defaultFairValuePerKgByType);
        setIsSimulationMode(false);
      }
    }
  };

  useEffect(() => {
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
        const user: AdminUser = data.user || {
          id: "1",
          username,
          fullName: username,
          role: "admin",
          isActive: true,
          createdAt: new Date().toISOString(),
        };
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
    const adminUser = admins.find((a) => a.username === username);
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

    const purchasePrice = Number(asset.purchasePrice || 0);
    const oldFairValue = Number(asset.fairValue || 0);
    const newFairValue =
      newWeight * (fairValuePerKgByType[asset.type] || fairValuePerKg);
    const oldValuationDifference = oldFairValue - purchasePrice;
    const newValuationDifference = newFairValue - purchasePrice;
    const valuationDifferenceChange =
      newValuationDifference - oldValuationDifference;

    const updatedAssets = biologicalAssets.map((a) =>
      a.id === id
        ? {
            ...a,
            weight: newWeight,
            fairValue: newFairValue,
            profit: Math.max(newValuationDifference, 0),
            loss: Math.max(-newValuationDifference, 0),
            lastUpdated: new Date().toISOString().split("T")[0],
            updatedBy: currentUser?.username,
          }
        : a,
    );

    const updatedEntries =
      valuationDifferenceChange !== 0
        ? [
            ...journalEntries,
            {
              id: String(Date.now()),
              date: new Date().toISOString().split("T")[0],
              description: `Penyesuaian Nilai Wajar ${asset.tagId} (${asset.weight}kg → ${newWeight}kg)`,
              debitAccount:
                valuationDifferenceChange > 0
                  ? "1-3000 Aset Biologis"
                  : "5-4000 Kerugian Nilai Wajar",
              debitAssetId: id,
              debitAmount: Math.abs(valuationDifferenceChange),
              creditAccount:
                valuationDifferenceChange > 0
                  ? "4-2000 Keuntungan Nilai Wajar"
                  : "1-3000 Aset Biologis",
              creditAssetId: valuationDifferenceChange < 0 ? id : undefined,
              creditAmount: Math.abs(valuationDifferenceChange),
              createdBy: currentUser?.username,
            },
          ]
        : journalEntries;

    await commitState(updatedAssets, updatedEntries, fairValuePerKg);
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, "id">) => {
    const id = String(Date.now());
    const nextEntries = [
      ...journalEntries,
      { ...entry, id, createdBy: currentUser?.username },
    ];
    await commitState(biologicalAssets, nextEntries, fairValuePerKg);
    return id;
  };

  const updateJournalEntry = async (
    id: string,
    entry: Omit<JournalEntry, "id">,
  ) => {
    const nextEntries = journalEntries.map((journalEntry) =>
      journalEntry.id === id
        ? {
            ...journalEntry,
            ...entry,
            id,
            createdBy: journalEntry.createdBy,
            createdAt: journalEntry.createdAt,
            updatedBy: currentUser?.username,
          }
        : journalEntry,
    );
    await commitState(biologicalAssets, nextEntries, fairValuePerKg);
  };

  const deleteJournalEntry = async (id: string) => {
    const nextEntries = journalEntries.filter((e) => e.id !== id);
    const nextDocuments = journalDocuments.filter((d) => d.journalEntryId !== id);
    setJournalDocuments(nextDocuments);
    await commitState(
      biologicalAssets,
      nextEntries,
      fairValuePerKg,
      nextDocuments,
    );
  };

  const addBiologicalAsset = async (
    asset: Omit<BiologicalAsset, "id" | "lastUpdated">,
  ) => {
    const today = getTodayDate();
    const purchasePrice = Number(asset.purchasePrice ?? 0);
    const fairValue = Number(asset.fairValue || 0);
    const valuationDifference = fairValue - purchasePrice;
    const profit = Math.max(valuationDifference, 0);
    const loss = Math.max(-valuationDifference, 0);
    const newAsset: BiologicalAsset = {
      ...asset,
      purchasePrice,
      fairValue,
      profit,
      loss,
      id: String(Date.now()),
      ageUpdatedAt: today,
      lastUpdated: today,
      createdBy: currentUser?.username,
      updatedBy: currentUser?.username,
    };

    const purchaseEntry: JournalEntry = {
      id: String(Date.now() + 1),
      date: newAsset.lastUpdated,
      description: `Harga beli ${asset.type} ${asset.tagId}`,
      debitAccount: findAccount(chartOfAccounts, "1-3000", "Aset Biologis"),
      debitAssetId: newAsset.id,
      debitAmount: purchasePrice,
      creditAccount: findAccount(chartOfAccounts, "1-1100", "Kas"),
      creditAmount: purchasePrice,
      createdBy: currentUser?.username,
    };

    const valuationEntry: JournalEntry | null =
      valuationDifference === 0
        ? null
        : {
            id: String(Date.now() + 2),
            date: newAsset.lastUpdated,
            description:
              valuationDifference > 0
                ? `Untung nilai wajar awal ${asset.type} ${asset.tagId}`
                : `Rugi nilai wajar awal ${asset.type} ${asset.tagId}`,
            debitAccount:
              valuationDifference > 0
                ? findAccount(chartOfAccounts, "1-3000", "Aset Biologis")
                : findAccount(
                    chartOfAccounts,
                    "5-4000",
                    "Kerugian Nilai Wajar",
                  ),
            debitAssetId: valuationDifference > 0 ? newAsset.id : undefined,
            debitAmount: Math.abs(valuationDifference),
            creditAccount:
              valuationDifference > 0
                ? findAccount(
                    chartOfAccounts,
                    "4-2000",
                    "Keuntungan Nilai Wajar",
                  )
                : findAccount(chartOfAccounts, "1-3000", "Aset Biologis"),
            creditAssetId: valuationDifference < 0 ? newAsset.id : undefined,
            creditAmount: Math.abs(valuationDifference),
            createdBy: currentUser?.username,
          };

    await commitState(
      [...biologicalAssets, newAsset],
      [
        ...journalEntries,
        purchaseEntry,
        ...(valuationEntry ? [valuationEntry] : []),
      ],
      fairValuePerKg,
    );
  };

  const updateBiologicalAsset = async (
    id: string,
    asset: Partial<BiologicalAsset>,
  ) => {
    const existingAsset = biologicalAssets.find((a) => a.id === id);
    if (!existingAsset) return;

    const updateDate = asset.lastUpdated || getTodayDate();
    const newFairValue = Number(asset.fairValue ?? existingAsset.fairValue);
    const newPurchasePrice = Number(
      asset.purchasePrice ?? existingAsset.purchasePrice ?? newFairValue,
    );
    const oldFairValue = Number(existingAsset.fairValue || 0);
    const oldPurchasePrice = Number(existingAsset.purchasePrice || 0);
    const purchasePriceDifference =
      newPurchasePrice - oldPurchasePrice;
    const oldValuationDifference = oldFairValue - oldPurchasePrice;
    const newValuationDifference = newFairValue - newPurchasePrice;
    const valuationDifferenceChange =
      newValuationDifference - oldValuationDifference;
    const newProfit = Math.max(newValuationDifference, 0);
    const newLoss = Math.max(-newValuationDifference, 0);

    const updatedAssets = biologicalAssets.map((a) =>
      a.id === id
        ? {
            ...a,
            ...asset,
            purchasePrice: newPurchasePrice,
            profit: newProfit,
            loss: newLoss,
            lastUpdated: updateDate,
            updatedBy: currentUser?.username,
          }
        : a,
    );

    const autoEntries: JournalEntry[] = [];
    const baseId = Date.now();

    if (purchasePriceDifference !== 0) {
      autoEntries.push({
        id: String(baseId + autoEntries.length + 1),
        date: updateDate,
        description: `Koreksi harga beli ${existingAsset.tagId}`,
        debitAccount:
          purchasePriceDifference > 0
            ? findAccount(chartOfAccounts, "1-3000", "Aset Biologis")
            : findAccount(chartOfAccounts, "1-1100", "Kas"),
        debitAssetId: purchasePriceDifference > 0 ? id : undefined,
        debitAmount: Math.abs(purchasePriceDifference),
        creditAccount:
          purchasePriceDifference > 0
            ? findAccount(chartOfAccounts, "1-1100", "Kas")
            : findAccount(chartOfAccounts, "1-3000", "Aset Biologis"),
        creditAssetId: purchasePriceDifference < 0 ? id : undefined,
        creditAmount: Math.abs(purchasePriceDifference),
        createdBy: currentUser?.username,
      });
    }

    if (valuationDifferenceChange !== 0) {
      autoEntries.push({
        id: String(baseId + autoEntries.length + 1),
        date: updateDate,
        description: `Penyesuaian nilai wajar ${existingAsset.tagId}`,
        debitAccount:
          valuationDifferenceChange > 0
            ? findAccount(chartOfAccounts, "1-3000", "Aset Biologis")
            : findAccount(chartOfAccounts, "5-4000", "Kerugian Nilai Wajar"),
        debitAssetId: valuationDifferenceChange > 0 ? id : undefined,
        debitAmount: Math.abs(valuationDifferenceChange),
        creditAccount:
          valuationDifferenceChange > 0
            ? findAccount(chartOfAccounts, "4-2000", "Keuntungan Nilai Wajar")
            : findAccount(chartOfAccounts, "1-3000", "Aset Biologis"),
        creditAssetId: valuationDifferenceChange < 0 ? id : undefined,
        creditAmount: Math.abs(valuationDifferenceChange),
        createdBy: currentUser?.username,
      });
    }

    await commitState(
      updatedAssets,
      [...journalEntries, ...autoEntries],
      fairValuePerKg,
    );
  };

  const deleteBiologicalAsset = async (id: string) => {
    const asset = biologicalAssets.find((a) => a.id === id);
    if (!asset) return;

    const today = getTodayDate();
    const fairValue = Number(asset.fairValue || 0);
    const baseId = Date.now();
    const deletionEntries: JournalEntry[] = [];

    if (fairValue !== 0) {
      deletionEntries.push({
        id: String(baseId + deletionEntries.length + 1),
        date: today,
        description: `HPP ${asset.type} ${asset.tagId} berdasarkan nilai wajar`,
        debitAccount: findAccount(chartOfAccounts, "5-3000", "Harga Pokok Penjualan"),
        debitAmount: fairValue,
        creditAccount: findAccount(chartOfAccounts, "1-3000", "Aset Biologis"),
        creditAssetId: id,
        creditAmount: fairValue,
        createdBy: currentUser?.username,
      });
    }

    await commitState(
      biologicalAssets.filter((a) => a.id !== id),
      [...journalEntries, ...deletionEntries],
      fairValuePerKg,
    );
  };

  const setFairValuePerKg = async (nextValue: number) => {
    if (!Number.isFinite(nextValue) || nextValue < 0) return;
    const today = getTodayDate();
    const baseId = Date.now();
    const autoEntries: JournalEntry[] = [];
    const updatedAssets = biologicalAssets.map((asset) => {
      const purchasePrice = Number(asset.purchasePrice || 0);
      const oldFairValue = Number(asset.fairValue || 0);
      const fairValue = asset.weight * nextValue;
      const oldValuationDifference = oldFairValue - purchasePrice;
      const newValuationDifference = fairValue - purchasePrice;
      const valuationDifferenceChange =
        newValuationDifference - oldValuationDifference;

      if (valuationDifferenceChange !== 0) {
        autoEntries.push({
          id: String(baseId + autoEntries.length + 1),
          date: today,
          description: `Penyesuaian nilai wajar ${asset.tagId}`,
          debitAccount:
            valuationDifferenceChange > 0
              ? findAccount(chartOfAccounts, "1-3000", "Aset Biologis")
              : findAccount(chartOfAccounts, "5-4000", "Kerugian Nilai Wajar"),
          debitAssetId: valuationDifferenceChange > 0 ? asset.id : undefined,
          debitAmount: Math.abs(valuationDifferenceChange),
          creditAccount:
            valuationDifferenceChange > 0
              ? findAccount(chartOfAccounts, "4-2000", "Keuntungan Nilai Wajar")
              : findAccount(chartOfAccounts, "1-3000", "Aset Biologis"),
          creditAssetId: valuationDifferenceChange < 0 ? asset.id : undefined,
          creditAmount: Math.abs(valuationDifferenceChange),
          createdBy: currentUser?.username,
        });
      }

      return {
        ...asset,
        fairValue,
        profit: Math.max(newValuationDifference, 0),
        loss: Math.max(-newValuationDifference, 0),
        lastUpdated: today,
        updatedBy: currentUser?.username,
      };
    });
    await commitState(updatedAssets, [...journalEntries, ...autoEntries], nextValue);
  };

  const setFairValuePerKgForType = async (type: string, nextValue: number) => {
    const normalizedType = type.trim();
    if (!normalizedType || !Number.isFinite(nextValue) || nextValue < 0) {
      return;
    }

    const nextFairValueByType = {
      ...fairValuePerKgByType,
      [normalizedType]: nextValue,
    };
    const today = getTodayDate();
    const baseId = Date.now();
    const autoEntries: JournalEntry[] = [];
    const updatedAssets = biologicalAssets.map((asset) => {
      if (asset.type !== normalizedType) return asset;

      const oldFairValue = Number(asset.fairValue || 0);
      const fairValue = asset.weight * nextValue;
      const purchasePrice = Number(asset.purchasePrice || 0);
      const oldValuationDifference = oldFairValue - purchasePrice;
      const newValuationDifference = fairValue - purchasePrice;
      const valuationDifferenceChange =
        newValuationDifference - oldValuationDifference;

      if (valuationDifferenceChange !== 0) {
        autoEntries.push({
          id: String(baseId + autoEntries.length + 1),
          date: today,
          description: `Penyesuaian nilai wajar ${asset.tagId}`,
          debitAccount:
            valuationDifferenceChange > 0
              ? findAccount(chartOfAccounts, "1-3000", "Aset Biologis")
              : findAccount(chartOfAccounts, "5-4000", "Kerugian Nilai Wajar"),
          debitAssetId: valuationDifferenceChange > 0 ? asset.id : undefined,
          debitAmount: Math.abs(valuationDifferenceChange),
          creditAccount:
            valuationDifferenceChange > 0
              ? findAccount(chartOfAccounts, "4-2000", "Keuntungan Nilai Wajar")
              : findAccount(chartOfAccounts, "1-3000", "Aset Biologis"),
          creditAssetId: valuationDifferenceChange < 0 ? asset.id : undefined,
          creditAmount: Math.abs(valuationDifferenceChange),
          createdBy: currentUser?.username,
        });
      }

      return {
        ...asset,
        fairValue,
        profit: Math.max(newValuationDifference, 0),
        loss: Math.max(-newValuationDifference, 0),
        lastUpdated: today,
        updatedBy: currentUser?.username,
      };
    });

    await commitState(
      updatedAssets,
      [...journalEntries, ...autoEntries],
      fairValuePerKg,
      journalDocuments,
      nextFairValueByType,
    );
  };

  const addAnimalType = async (
    type: string,
    initialFairValuePerKg: number,
  ) => {
    const normalizedType = type.trim();
    if (!normalizedType) {
      alert("Jenis hewan wajib diisi");
      return;
    }
    if (!Number.isFinite(initialFairValuePerKg) || initialFairValuePerKg <= 0) {
      alert("Harga per kg harus lebih dari 0");
      return;
    }
    if (Object.prototype.hasOwnProperty.call(fairValuePerKgByType, normalizedType)) {
      alert("Jenis hewan sudah ada");
      return;
    }

    const nextFairValueByType = {
      ...fairValuePerKgByType,
      [normalizedType]: initialFairValuePerKg,
    };
    setFairValuePerKgByTypeState(nextFairValueByType);
    localStorage.setItem(
      FAIR_VALUE_BY_TYPE_STORAGE_KEY,
      JSON.stringify(nextFairValueByType),
    );
    await persistState(
      biologicalAssets,
      journalEntries,
      fairValuePerKg,
      journalDocuments,
      chartOfAccounts,
      admins,
      nextFairValueByType,
    );
  };

  // Journal Documents
  const addJournalDocument = async (doc: Omit<JournalDocument, "id">) => {
    const newDoc: JournalDocument = {
      ...doc,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uploadedBy: currentUser?.username,
    };
    const updatedDocs = [...journalDocuments, newDoc];
    setJournalDocuments(updatedDocs);
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(updatedDocs));
    await persistState(
      biologicalAssets,
      journalEntries,
      fairValuePerKg,
      updatedDocs,
    );
  };

  const getJournalDocuments = (journalEntryId: string): JournalDocument[] => {
    return journalDocuments.filter((d) => d.journalEntryId === journalEntryId);
  };

  const deleteJournalDocument = async (docId: string) => {
    const updatedDocs = journalDocuments.filter((d) => d.id !== docId);
    setJournalDocuments(updatedDocs);
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(updatedDocs));
    await persistState(
      biologicalAssets,
      journalEntries,
      fairValuePerKg,
      updatedDocs,
    );
  };

  // Chart of Accounts
  const addChartOfAccount = async (account: ChartOfAccount) => {
    const existing = chartOfAccounts.find((a) => a.code === account.code);
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
    localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(updatedCOA));

    if (isSimulationMode) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chart-of-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal menyimpan akun");
      }
    } catch (error) {
      console.warn("Gagal menyimpan akun ke database", error);
      alert("Akun belum masuk ke database MySQL. Pastikan backend berjalan.");
    }
  };

  const updateChartOfAccount = async (
    code: string,
    account: Partial<ChartOfAccount>,
  ) => {
    const nextCode = String(account.code || code).trim();
    const nextName = String(account.name || "").trim();
    const previous = chartOfAccounts.find((a) => a.code === code);
    const renameJournalAccount = (accountText: string) => {
      if (!previous || nextCode === code || !accountText.startsWith(`${code} `)) {
        return accountText;
      }
      return `${nextCode} ${nextName || previous.name}`;
    };
    const updatedCOA = chartOfAccounts.map((a) =>
      a.code === code
        ? { ...a, ...account, code: nextCode }
        : {
            ...a,
            parentCode:
              nextCode !== code && a.parentCode === code ? nextCode : a.parentCode,
          },
    );
    const updatedEntries = journalEntries.map((entry) => ({
      ...entry,
      debitAccount: renameJournalAccount(entry.debitAccount),
      creditAccount: renameJournalAccount(entry.creditAccount),
    }));
    setChartOfAccounts(updatedCOA);
    setJournalEntries(updatedEntries);
    localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(updatedCOA));
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updatedEntries));

    if (isSimulationMode) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...account, code: nextCode }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal mengubah akun");
      }
    } catch (error) {
      console.warn("Gagal mengubah akun di database", error);
      alert("Perubahan akun belum masuk ke database MySQL. Pastikan backend berjalan.");
    }
  };

  const deleteChartOfAccount = async (code: string) => {
    // Check if used in journal entries
    const isUsed = journalEntries.some(
      (j) => j.debitAccount.includes(code) || j.creditAccount.includes(code),
    );
    if (isUsed) {
      alert("Tidak bisa hapus akun yang sudah digunakan dalam jurnal");
      return;
    }
    const updatedCOA = chartOfAccounts.filter((a) => a.code !== code);
    setChartOfAccounts(updatedCOA);
    localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(updatedCOA));

    if (isSimulationMode) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chart-of-accounts/${code}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal menghapus akun");
      }
    } catch (error) {
      console.warn("Gagal menghapus akun di database", error);
      alert("Hapus akun belum masuk ke database MySQL. Pastikan backend berjalan.");
    }
  };

  const getAccountsByParent = (parentCode?: string | null): ChartOfAccount[] => {
    return chartOfAccounts.filter((account) => {
      const resolvedParent = account.parentCode || undefined;
      const resolvedRequestedParent = parentCode || undefined;
      return resolvedParent === resolvedRequestedParent;
    });
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
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updatedAdmins));

    if (isSimulationMode) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal menyimpan admin");
      }
    } catch (error) {
      console.warn("Gagal menyimpan admin ke database", error);
      alert("Admin belum masuk ke database MySQL. Pastikan backend berjalan.");
    }
  };

  const updateAdmin = async (id: string, admin: Partial<AdminUser>) => {
    const updatedAdmins = admins.map((a) =>
      a.id === id ? { ...a, ...admin } : a,
    );
    setAdmins(updatedAdmins);
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updatedAdmins));

    if (isSimulationMode) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin-users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(admin),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal mengubah admin");
      }
    } catch (error) {
      console.warn("Gagal mengubah admin di database", error);
      alert("Perubahan admin belum masuk ke database MySQL. Pastikan backend berjalan.");
    }
  };

  const deleteAdmin = async (id: string) => {
    if (id === currentUser?.id) {
      alert("Tidak bisa menghapus admin yang sedang login");
      return;
    }
    const updatedAdmins = admins.filter((a) => a.id !== id);
    setAdmins(updatedAdmins);
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updatedAdmins));

    if (isSimulationMode) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin-users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal menghapus admin");
      }
    } catch (error) {
      console.warn("Gagal menghapus admin di database", error);
      alert("Hapus admin belum masuk ke database MySQL. Pastikan backend berjalan.");
    }
  };

  // Export Functions
  const exportGeneralLedgerCSV = (): string => {
    let csv = "Kode,Nama,Debit,Kredit,Saldo\n";
    accountBalances.forEach((balance) => {
      const code = balance.code || "";
      const name = balance.name || "";
      const debit = balance.debit || 0;
      const credit = balance.credit || 0;
      const saldo = balance.balance || 0;
      csv += `"${code}","${name}",${debit},${credit},${saldo}\n`;
    });

    csv +=
      "\n\nDetail Transaksi,Tanggal,Deskripsi,Akun Debit,Debit,Akun Kredit,Kredit\n";
    journalEntries.forEach((entry) => {
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
    const bundle = getSimulation2025Bundle();
    const mergedCOA = [
      ...chartOfAccounts,
      ...defaultChartOfAccounts.filter(
        (defaultAccount) =>
          !chartOfAccounts.some(
            (account) => account.code === defaultAccount.code,
          ),
      ),
    ].sort((a, b) => a.code.localeCompare(b.code));
    const simulationDocuments: JournalDocument[] = [
      {
        id: "sim25-doc-gaji",
        journalEntryId: "sim25-004",
        documentSide: "credit",
        fileName: "bukti-gaji-juni-2025.txt",
        fileData:
          "data:text/plain;base64,QnVrdGkgZ2FqaSBzaW11bGFzaSBK dW5pIDIwMjU=".replace(
            " ",
            "",
          ),
        fileType: "text/plain",
        uploadedAt: "2025-06-20T10:00:00.000Z",
        uploadedBy: "contoh-data",
      },
      {
        id: "sim25-doc-pakan",
        journalEntryId: "sim25-003",
        documentSide: "credit",
        fileName: "nota-pakan-q1-2025.txt",
        fileData: "data:text/plain;base64,Tm90YSBwYWthbiBzaW11bGFzaSBRMSAyMDI1",
        fileType: "text/plain",
        uploadedAt: "2025-03-15T10:00:00.000Z",
        uploadedBy: "contoh-data",
      },
    ];

    setChartOfAccounts(mergedCOA);
    setJournalDocuments(simulationDocuments);
    setIsSimulationMode(true);
    localStorage.setItem(SIMULATION_MODE_STORAGE_KEY, "true");
    localStorage.setItem(
      STORAGE_KEY_ASSETS,
      JSON.stringify(bundle.biologicalAssets),
    );
    localStorage.setItem(
      STORAGE_KEY_ENTRIES,
      JSON.stringify(bundle.journalEntries),
    );
    localStorage.setItem(
      STORAGE_KEY_DOCUMENTS,
      JSON.stringify(simulationDocuments),
    );
    localStorage.setItem(STORAGE_KEY_COA, JSON.stringify(mergedCOA));
    localStorage.setItem(
      FAIR_VALUE_PER_KG_STORAGE_KEY,
      String(bundle.fairValuePerKg),
    );
    const simulationFairValueByType = normalizeFairValueByType(
      null,
      bundle.biologicalAssets,
      bundle.fairValuePerKg,
    );
    localStorage.setItem(
      FAIR_VALUE_BY_TYPE_STORAGE_KEY,
      JSON.stringify(simulationFairValueByType),
    );
    applyState(bundle.biologicalAssets, bundle.journalEntries);
    setFairValuePerKgState(bundle.fairValuePerKg);
    setFairValuePerKgByTypeState(simulationFairValueByType);
  };

  const resetData = async () => {
    setIsSimulationMode(false);
    localStorage.removeItem(SIMULATION_MODE_STORAGE_KEY);
    const resetAssets = initialAssets.map((asset) => ({
      ...asset,
      ageUpdatedAt: asset.lastUpdated,
    }));
    await commitState(
      resetAssets,
      initialJournalEntries,
      100000,
      [],
      defaultFairValuePerKgByType,
      true,
    );
    setJournalDocuments([]);
  };

  const resetToZero = async () => {
    if (
      window.confirm(
        "⚠️ PERHATIAN: Ini akan menghapus SEMUA data (aset biologis dan jurnal) untuk memulai input data real. Lanjutkan?",
      )
    ) {
      const zeroFairValueByType = Object.fromEntries(
        animalTypes.map((type) => [type, 0]),
      );

      setIsSimulationMode(false);
      localStorage.removeItem(SIMULATION_MODE_STORAGE_KEY);
      await commitState([], [], 0, [], zeroFairValueByType, true);
      setJournalDocuments([]);
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify([]));
      localStorage.setItem(FAIR_VALUE_PER_KG_STORAGE_KEY, "0");
      localStorage.setItem(
        FAIR_VALUE_BY_TYPE_STORAGE_KEY,
        JSON.stringify(zeroFairValueByType),
      );
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
        fairValuePerKgByType,
        animalTypes,
        setFairValuePerKgForType,
        addAnimalType,
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
