import type {
  BiologicalAsset,
  ChartOfAccount,
  JournalEntry,
} from "../context/DataContext";

export function accountCode(account: string) {
  return account.split(" ")[0] || account;
}

export function accountNameFromJournal(account: string) {
  return account.split(" ").slice(1).join(" ").trim();
}

export function buildCoaMaps(chartOfAccounts: ChartOfAccount[]) {
  const byCode = new Map<string, ChartOfAccount>();
  const childrenByParent = new Map<string, ChartOfAccount[]>();

  chartOfAccounts.forEach((account) => {
    byCode.set(account.code, account);
    const parentCode = account.parentCode || "";
    const children = childrenByParent.get(parentCode) || [];
    children.push(account);
    childrenByParent.set(parentCode, children);
  });

  childrenByParent.forEach((children) => {
    children.sort((a, b) => a.code.localeCompare(b.code));
  });

  return { byCode, childrenByParent };
}

export function calculateBalancesByCode(journalEntries: JournalEntry[]) {
  const balances: Record<string, number> = {};

  journalEntries.forEach((entry) => {
    const debitCode = accountCode(entry.debitAccount);
    const creditCode = accountCode(entry.creditAccount);
    balances[debitCode] = (balances[debitCode] || 0) + Number(entry.debitAmount || 0);
    balances[creditCode] =
      (balances[creditCode] || 0) - Number(entry.creditAmount || 0);
  });

  return balances;
}

export function createBalanceReader(
  journalEntries: JournalEntry[],
  chartOfAccounts: ChartOfAccount[],
) {
  const balances = calculateBalancesByCode(journalEntries);
  const { byCode, childrenByParent } = buildCoaMaps(chartOfAccounts);

  const childrenOf = (parentCode: string) => childrenByParent.get(parentCode) || [];
  const topAccountsByCategory = (category: ChartOfAccount["category"]) =>
    (childrenByParent.get("") || []).filter(
      (account) => account.category === category,
    );
  const accountLabel = (code: string, fallback = code) =>
    byCode.get(code)?.name || fallback;
  const balanceByCode = (code: string) => balances[code] || 0;
  const balanceIncludingChildren = (code: string): number =>
    balanceByCode(code) +
    childrenOf(code).reduce(
      (sum, child) => sum + balanceIncludingChildren(child.code),
      0,
    );

  const debitBalance = (code: string) => balanceIncludingChildren(code);
  const creditBalance = (code: string) => Math.abs(Math.min(balanceIncludingChildren(code), 0));

  return {
    balances,
    byCode,
    childrenOf,
    topAccountsByCategory,
    accountLabel,
    balanceByCode,
    balanceIncludingChildren,
    debitBalance,
    creditBalance,
  };
}

export function calculateProfitLossSummary(
  journalEntries: JournalEntry[],
  chartOfAccounts: ChartOfAccount[],
  biologicalAssets?: BiologicalAsset[],
) {
  const reader = createBalanceReader(journalEntries, chartOfAccounts);
  const fairValueGainFromAssets =
    biologicalAssets?.reduce((sum, asset) => sum + Number(asset.profit || 0), 0);
  const fairValueLossFromAssets =
    biologicalAssets?.reduce((sum, asset) => sum + Number(asset.loss || 0), 0);

  const pendapatanPenjualan = reader.creditBalance("4-1000");
  const keuntunganNilaiWajar =
    fairValueGainFromAssets ?? reader.creditBalance("4-2000");
  const pendapatanLain = reader.creditBalance("4-3000");
  const hpp = reader.debitBalance("5-3000");
  const bebanGaji = reader.debitBalance("5-1000");
  const bebanPakan = reader.debitBalance("5-2000");
  const bebanPenyusutan = reader.debitBalance("5-6000");
  const kerugianNilaiWajar =
    fairValueLossFromAssets ?? reader.debitBalance("5-4000");
  const bebanLain = reader.debitBalance("5-5000");

  const jumlahPendapatanUsaha =
    pendapatanPenjualan + keuntunganNilaiWajar + pendapatanLain;
  const jumlahBebanPokokPendapatan = hpp;
  const labaKotor = pendapatanPenjualan - hpp;
  const jumlahBebanUsaha = bebanGaji + bebanPakan + bebanPenyusutan;
  const labaUsaha = labaKotor - jumlahBebanUsaha;
  const jumlahPendapatanBebanLainLain =
    keuntunganNilaiWajar + pendapatanLain - kerugianNilaiWajar - bebanLain;
  const labaBersih = labaUsaha + jumlahPendapatanBebanLainLain;

  return {
    pendapatanPenjualan,
    keuntunganNilaiWajar,
    pendapatanLain,
    hpp,
    bebanGaji,
    bebanPakan,
    bebanPenyusutan,
    kerugianNilaiWajar,
    bebanLain,
    jumlahPendapatanUsaha,
    jumlahBebanPokokPendapatan,
    labaKotor,
    jumlahBebanUsaha,
    labaUsaha,
    jumlahPendapatanBebanLainLain,
    labaBersih,
  };
}
