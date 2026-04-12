import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface BiologicalAsset {
  id: string;
  tagId: string;
  type: "Kambing" | "Domba";
  age: number;
  ageUpdatedAt?: string;
  weight: number;
  fairValue: number;
  lastUpdated: string;
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
}

export interface AccountBalance {
  code: string;
  name: string;
  debit: number;
  credit: number;
  category: "asset" | "liability" | "equity" | "revenue" | "expense";
}

interface DataContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  biologicalAssets: BiologicalAsset[];
  updateAssetWeight: (id: string, newWeight: number) => Promise<void>;
  addBiologicalAsset: (
    asset: Omit<BiologicalAsset, "id" | "lastUpdated">,
  ) => Promise<void>;
  deleteBiologicalAsset: (id: string) => Promise<void>;
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, "id">) => Promise<void>;
  updateJournalEntry: (id: string, entry: Omit<JournalEntry, "id">) => Promise<void>;
  accountBalances: AccountBalance[];
  fairValuePerKg: number;
  setFairValuePerKg: (nextValue: number) => Promise<void>;
  loadSimulationData: () => Promise<void>;
  resetData: () => Promise<void>;
  resetToZero: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const AUTH_STORAGE_KEY = "hers-farm-authenticated";
const FAIR_VALUE_PER_KG_STORAGE_KEY = "hers-farm-fair-value-per-kg";

const initialAssets: BiologicalAsset[] = [
  {
    id: "1",
    tagId: "DOM-001",
    type: "Domba",
    age: 8,
    weight: 35,
    fairValue: 3500000,
    lastUpdated: "2025-01-15",
  },
  {
    id: "2",
    tagId: "DOM-002",
    type: "Domba",
    age: 6,
    weight: 32,
    fairValue: 3200000,
    lastUpdated: "2025-01-20",
  },
  {
    id: "3",
    tagId: "KMB-001",
    type: "Kambing",
    age: 12,
    weight: 28,
    fairValue: 2800000,
    lastUpdated: "2025-02-10",
  },
  {
    id: "4",
    tagId: "DOM-003",
    type: "Domba",
    age: 10,
    weight: 38,
    fairValue: 3800000,
    lastUpdated: "2025-02-15",
  },
  {
    id: "5",
    tagId: "KMB-002",
    type: "Kambing",
    age: 9,
    weight: 26,
    fairValue: 2600000,
    lastUpdated: "2025-03-01",
  },
];

const initialJournalEntries: JournalEntry[] = [];

function computeAccountBalances(entries: JournalEntry[]): AccountBalance[] {
  const balances = new Map<string, AccountBalance>();

  const getCategory = (account: string): AccountBalance["category"] => {
    const code = account.split(" ")[0] || account;
    switch (code.charAt(0)) {
      case "1":
        return "asset";
      case "2":
        return "liability";
      case "3":
        return "equity";
      case "4":
        return "revenue";
      default:
        return "expense";
    }
  };

  const ensureBalance = (account: string) => {
    if (!balances.has(account)) {
      balances.set(account, {
        code: account.split(" ")[0] || account,
        name: account,
        debit: 0,
        credit: 0,
        category: getCategory(account),
      });
    }
    return balances.get(account)!;
  };

  entries.forEach((entry) => {
    ensureBalance(entry.debitAccount).debit += Number(entry.debitAmount || 0);
    ensureBalance(entry.creditAccount).credit += Number(
      entry.creditAmount || 0,
    );
  });

  return Array.from(balances.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [biologicalAssets, setBiologicalAssets] =
    useState<BiologicalAsset[]>(initialAssets);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(
    initialJournalEntries,
  );
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [fairValuePerKg, setFairValuePerKgState] = useState<number>(100000);

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
    setAccountBalances(computeAccountBalances(nextEntries));
  };

  const persistState = async (
    nextAssets: BiologicalAsset[],
    nextEntries: JournalEntry[],
    nextFairValuePerKg: number,
  ) => {
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
        }),
      });
    } catch (error) {
      console.error("Gagal menyimpan data ke backend", error);
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

      if (changed) {
        void persistState(syncedAssets, data.journalEntries || initialJournalEntries, resolvedFairValuePerKg);
      }
    } catch (error) {
      console.warn(
        "Menggunakan data lokal karena backend belum tersedia",
        error,
      );
      const storedFairValuePerKg = Number(localStorage.getItem(FAIR_VALUE_PER_KG_STORAGE_KEY) || 100000);
      setFairValuePerKgState(
        Number.isFinite(storedFairValuePerKg) && storedFairValuePerKg > 0
          ? storedFairValuePerKg
          : 100000,
      );
      const { syncedAssets } = syncAgeByMonth(initialAssets);
      applyState(syncedAssets, initialJournalEntries);
    }
  };

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
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
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
        return true;
      }
    } catch (error) {
      console.warn("Backend login gagal, memakai validasi lokal", error);
    }

    if (username === "admin_hers" && password === "admin123") {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
                  : "5-2000 Kerugian Nilai Wajar",
              debitAssetId: id,
              debitAmount: Math.abs(difference),
              creditAccount:
                difference > 0
                  ? "4-2000 Keuntungan Nilai Wajar"
                  : "1-3000 Aset Biologis",
              creditAssetId: difference < 0 ? id : undefined,
              creditAmount: Math.abs(difference),
            },
          ]
        : journalEntries;

    commitState(updatedAssets, updatedEntries, fairValuePerKg);
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, "id">) => {
    const nextEntries = [
      ...journalEntries,
      { ...entry, id: String(Date.now()) },
    ];
    commitState(biologicalAssets, nextEntries, fairValuePerKg);
  };

  const updateJournalEntry = async (id: string, entry: Omit<JournalEntry, "id">) => {
    const nextEntries = journalEntries.map((journalEntry) =>
      journalEntry.id === id ? { ...entry, id } : journalEntry,
    );
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
    };

    commitState([...biologicalAssets, newAsset], [...journalEntries, newEntry], fairValuePerKg);
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

  const loadSimulationData = async () => {
    const simulationAssets: BiologicalAsset[] = [
      {
        id: "1",
        tagId: "DOM-001",
        type: "Domba",
        age: 8,
        weight: 38,
        fairValue: 3800000,
        lastUpdated: "2025-12-31",
      },
      {
        id: "2",
        tagId: "DOM-002",
        type: "Domba",
        age: 7,
        weight: 36,
        fairValue: 3600000,
        lastUpdated: "2025-12-31",
      },
      {
        id: "3",
        tagId: "KMB-001",
        type: "Kambing",
        age: 13,
        weight: 30,
        fairValue: 3000000,
        lastUpdated: "2025-12-31",
      },
      {
        id: "4",
        tagId: "DOM-003",
        type: "Domba",
        age: 11,
        weight: 42,
        fairValue: 4200000,
        lastUpdated: "2025-12-31",
      },
      {
        id: "5",
        tagId: "KMB-002",
        type: "Kambing",
        age: 10,
        weight: 29,
        fairValue: 2900000,
        lastUpdated: "2025-12-31",
      },
      {
        id: "6",
        tagId: "DOM-004",
        type: "Domba",
        age: 4,
        weight: 25,
        fairValue: 2500000,
        lastUpdated: "2025-12-31",
      },
      {
        id: "7",
        tagId: "DOM-005",
        type: "Domba",
        age: 5,
        weight: 28,
        fairValue: 2800000,
        lastUpdated: "2025-12-31",
      },
      {
        id: "8",
        tagId: "KMB-003",
        type: "Kambing",
        age: 6,
        weight: 24,
        fairValue: 2400000,
        lastUpdated: "2025-12-31",
      },
    ];

    const simulationEntries: JournalEntry[] = [
      // Modal Awal
      {
        id: "1",
        date: "2025-01-01",
        description: "Modal Awal Disetor",
        debitAccount: "1-1100 Kas",
        debitAmount: 150000000,
        creditAccount: "3-1000 Modal Disetor",
        creditAmount: 150000000,
      },
      {
        id: "2",
        date: "2025-01-02",
        description: "Transfer Kas ke Bank",
        debitAccount: "1-1200 Bank",
        debitAmount: 50000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 50000000,
      },

      // Pembelian Aset Tetap
      {
        id: "3",
        date: "2025-01-03",
        description: "Pembelian Kandang dan Bangunan",
        debitAccount: "1-4100 Aset Tetap - Kandang",
        debitAmount: 25000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 25000000,
      },

      // Pembelian Aset Biologis Awal
      {
        id: "4",
        date: "2025-01-05",
        description: "Pembelian Domba DOM-001",
        debitAccount: "1-3000 Aset Biologis",
        debitAssetId: "1",
        debitAmount: 3500000,
        creditAccount: "1-1100 Kas",
        creditAmount: 3500000,
      },
      {
        id: "5",
        date: "2025-01-10",
        description: "Pembelian Domba DOM-002",
        debitAccount: "1-3000 Aset Biologis",
        debitAssetId: "2",
        debitAmount: 3200000,
        creditAccount: "1-1100 Kas",
        creditAmount: 3200000,
      },
      {
        id: "6",
        date: "2025-02-05",
        description: "Pembelian Kambing KMB-001",
        debitAccount: "1-3000 Aset Biologis",
        debitAssetId: "3",
        debitAmount: 2800000,
        creditAccount: "1-1100 Kas",
        creditAmount: 2800000,
      },
      {
        id: "7",
        date: "2025-02-20",
        description: "Pembelian Domba DOM-003",
        debitAccount: "1-3000 Aset Biologis",
        debitAssetId: "4",
        debitAmount: 3800000,
        creditAccount: "1-1100 Kas",
        creditAmount: 3800000,
      },
      {
        id: "8",
        date: "2025-03-10",
        description: "Pembelian Kambing KMB-002",
        debitAccount: "1-3000 Aset Biologis",
        debitAssetId: "5",
        debitAmount: 2600000,
        creditAccount: "1-1100 Kas",
        creditAmount: 2600000,
      },

      // Hutang untuk operasional
      {
        id: "9",
        date: "2025-03-15",
        description: "Hutang Pakan ke Supplier A",
        debitAccount: "1-2100 Persediaan Pakan",
        debitAmount: 15000000,
        creditAccount: "2-1000 Hutang Usaha",
        creditAmount: 15000000,
      },

      // OPEX - Pakan (12 bulan) - dikurangi untuk buat rugi
      {
        id: "10",
        date: "2025-01-15",
        description: "Pembelian Pakan Januari",
        debitAccount: "1-2100 Persediaan Pakan",
        debitAmount: 8000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 8000000,
      },
      {
        id: "11",
        date: "2025-01-31",
        description: "Konsumsi Pakan Januari - Kapitalisasi",
        debitAccount: "1-3000 Aset Biologis",
        debitAmount: 6000000,
        creditAccount: "1-2100 Persediaan Pakan",
        creditAmount: 6000000,
      },
      {
        id: "12",
        date: "2025-02-15",
        description: "Pembelian Pakan Februari",
        debitAccount: "1-2100 Persediaan Pakan",
        debitAmount: 8000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 8000000,
      },
      {
        id: "13",
        date: "2025-02-28",
        description: "Konsumsi Pakan Februari - Kapitalisasi",
        debitAccount: "1-3000 Aset Biologis",
        debitAmount: 6500000,
        creditAccount: "1-2100 Persediaan Pakan",
        creditAmount: 6500000,
      },
      {
        id: "14",
        date: "2025-03-15",
        description: "Pembelian Pakan Maret",
        debitAccount: "1-2100 Persediaan Pakan",
        debitAmount: 8000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 8000000,
      },
      {
        id: "15",
        date: "2025-03-31",
        description: "Konsumsi Pakan Maret - Kapitalisasi",
        debitAccount: "1-3000 Aset Biologis",
        debitAmount: 6200000,
        creditAccount: "1-2100 Persediaan Pakan",
        creditAmount: 6200000,
      },
      {
        id: "16",
        date: "2025-04-15",
        description: "Pembelian Pakan April",
        debitAccount: "1-2100 Persediaan Pakan",
        debitAmount: 8000000,
        creditAccount: "1-1200 Bank",
        creditAmount: 8000000,
      },
      {
        id: "17",
        date: "2025-05-15",
        description: "Pembelian Pakan Mei",
        debitAccount: "1-2100 Persediaan Pakan",
        debitAmount: 8000000,
        creditAccount: "1-1200 Bank",
        creditAmount: 8000000,
      },
      {
        id: "18",
        date: "2025-06-15",
        description: "Pembelian Pakan Juni",
        debitAccount: "1-2100 Persediaan Pakan",
        debitAmount: 8000000,
        creditAccount: "1-1200 Bank",
        creditAmount: 8000000,
      },

      // OPEX - Gaji (12 bulan @ 15 juta) - dinaikkan untuk buat rugi
      {
        id: "19",
        date: "2025-01-31",
        description: "Gaji 3 Karyawan Januari",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 15000000,
      },
      {
        id: "20",
        date: "2025-02-28",
        description: "Gaji 3 Karyawan Februari",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 15000000,
      },
      {
        id: "21",
        date: "2025-03-31",
        description: "Gaji 3 Karyawan Maret",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 15000000,
      },
      {
        id: "22",
        date: "2025-04-30",
        description: "Gaji 3 Karyawan April",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 15000000,
      },
      {
        id: "23",
        date: "2025-05-31",
        description: "Gaji 3 Karyawan Mei",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1200 Bank",
        creditAmount: 15000000,
      },
      {
        id: "24",
        date: "2025-06-30",
        description: "Gaji 3 Karyawan Juni",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1200 Bank",
        creditAmount: 15000000,
      },
      {
        id: "25",
        date: "2025-07-31",
        description: "Gaji 3 Karyawan Juli",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1200 Bank",
        creditAmount: 15000000,
      },
      {
        id: "26",
        date: "2025-08-31",
        description: "Gaji 3 Karyawan Agustus",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1200 Bank",
        creditAmount: 15000000,
      },
      {
        id: "27",
        date: "2025-09-30",
        description: "Gaji 3 Karyawan September",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 15000000,
      },
      {
        id: "28",
        date: "2025-10-31",
        description: "Gaji 3 Karyawan Oktober",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 15000000,
      },
      {
        id: "29",
        date: "2025-11-30",
        description: "Gaji 3 Karyawan November",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 15000000,
      },
      {
        id: "30",
        date: "2025-12-31",
        description: "Gaji 3 Karyawan Desember",
        debitAccount: "5-1000 Beban Gaji",
        debitAmount: 15000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 15000000,
      },

      // Penjualan Kurban (rendah)
      {
        id: "31",
        date: "2025-06-15",
        description: "Penjualan Kurban 3 Domba @ Rp 4.500.000",
        debitAccount: "1-1100 Kas",
        debitAmount: 13500000,
        creditAccount: "4-1000 Pendapatan Penjualan",
        creditAmount: 13500000,
      },
      {
        id: "32",
        date: "2025-06-15",
        description: "HPP Penjualan Kurban",
        debitAccount: "5-3000 Harga Pokok Penjualan",
        debitAmount: 11000000,
        creditAccount: "1-3000 Aset Biologis",
        creditAmount: 11000000,
      },

      // Penjualan Aqiqah
      {
        id: "33",
        date: "2025-09-10",
        description: "Penjualan Aqiqah 2 Domba @ Rp 4.000.000",
        debitAccount: "1-1100 Kas",
        debitAmount: 8000000,
        creditAccount: "4-1000 Pendapatan Penjualan",
        creditAmount: 8000000,
      },
      {
        id: "34",
        date: "2025-09-10",
        description: "HPP Penjualan Aqiqah",
        debitAccount: "5-3000 Harga Pokok Penjualan",
        debitAmount: 6500000,
        creditAccount: "1-3000 Aset Biologis",
        creditAmount: 6500000,
      },

      // OIOE - Pendapatan Lain (rendah)
      {
        id: "35",
        date: "2025-08-20",
        description: "Pendapatan Penjualan Kotoran Ternak",
        debitAccount: "1-1100 Kas",
        debitAmount: 1500000,
        creditAccount: "4-3000 Pendapatan Lain-lain",
        creditAmount: 1500000,
      },
      {
        id: "36",
        date: "2025-11-15",
        description: "Pendapatan Sewa Kandang",
        debitAccount: "1-1100 Kas",
        debitAmount: 2000000,
        creditAccount: "4-3000 Pendapatan Lain-lain",
        creditAmount: 2000000,
      },

      // OIOE - Beban Lain (tinggi)
      {
        id: "37",
        date: "2025-04-10",
        description: "Biaya Pemeliharaan Kandang",
        debitAccount: "5-5000 Beban Lain-lain",
        debitAmount: 3500000,
        creditAccount: "1-1100 Kas",
        creditAmount: 3500000,
      },
      {
        id: "38",
        date: "2025-05-15",
        description: "Biaya Listrik & Air 5 Bulan",
        debitAccount: "5-5000 Beban Lain-lain",
        debitAmount: 2500000,
        creditAccount: "1-1200 Bank",
        creditAmount: 2500000,
      },
      {
        id: "39",
        date: "2025-07-20",
        description: "Biaya Transportasi Pakan",
        debitAccount: "5-5000 Beban Lain-lain",
        debitAmount: 1800000,
        creditAccount: "1-1100 Kas",
        creditAmount: 1800000,
      },
      {
        id: "40",
        date: "2025-10-05",
        description: "Biaya Pengobatan Ternak",
        debitAccount: "5-5000 Beban Lain-lain",
        debitAmount: 4000000,
        creditAccount: "1-1100 Kas",
        creditAmount: 4000000,
      },
      {
        id: "41",
        date: "2025-12-10",
        description: "Biaya Administrasi & Perizinan",
        debitAccount: "5-5000 Beban Lain-lain",
        debitAmount: 2200000,
        creditAccount: "1-1200 Bank",
        creditAmount: 2200000,
      },

      // Penyusutan Aset Tetap
      {
        id: "42",
        date: "2025-12-31",
        description: "Penyusutan Kandang Tahun 2025 (10%)",
        debitAccount: "5-6000 Beban Penyusutan",
        debitAmount: 2500000,
        creditAccount: "1-4200 Akumulasi Penyusutan",
        creditAmount: 2500000,
      },

      // Keuntungan Nilai Wajar (kecil, tidak cukup untuk cover rugi)
      {
        id: "43",
        date: "2025-12-31",
        description: "Penyesuaian Nilai Wajar Aset Biologis",
        debitAccount: "1-3000 Aset Biologis",
        debitAmount: 5000000,
        creditAccount: "4-2000 Keuntungan Nilai Wajar",
        creditAmount: 5000000,
      },

      // Pembayaran Hutang
      {
        id: "44",
        date: "2025-06-20",
        description: "Pembayaran Hutang Usaha Sebagian",
        debitAccount: "2-1000 Hutang Usaha",
        debitAmount: 5000000,
        creditAccount: "1-1200 Bank",
        creditAmount: 5000000,
      },
    ];

    const simulationWithAgeBase = simulationAssets.map((asset) => ({
      ...asset,
      ageUpdatedAt: asset.lastUpdated,
    }));
    commitState(simulationWithAgeBase, simulationEntries, fairValuePerKg);
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
    }
  };

  return (
    <DataContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        biologicalAssets,
        updateAssetWeight,
        addBiologicalAsset,
        deleteBiologicalAsset,
        journalEntries,
        addJournalEntry,
        updateJournalEntry,
        accountBalances,
        fairValuePerKg,
        setFairValuePerKg,
        loadSimulationData,
        resetData,
        resetToZero,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
