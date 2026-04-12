import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BiologicalAssets from './components/BiologicalAssets';
import GeneralLedger from './components/GeneralLedger';
import WorkingBalanceSheetAsset from './components/WorkingBalanceSheetAsset';
import WorkingBalanceSheetLiability from './components/WorkingBalanceSheetLiability';
import WorkingProfitLoss from './components/WorkingProfitLoss';
import WbsMonthlyBackup from './components/WbsMonthlyBackup';
import AuditWork from './components/AuditWork';
import TrialBalance from './components/TrialBalance';
import ProfitLoss from './components/ProfitLoss';
import BalanceSheet from './components/BalanceSheet';
import Login from './components/Login';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'assets', element: <BiologicalAssets /> },
      { path: 'journal', element: <GeneralLedger /> },
      { path: 'wbsa', element: <WorkingBalanceSheetAsset /> },
      { path: 'wbsl', element: <WorkingBalanceSheetLiability /> },
      { path: 'wpl', element: <WorkingProfitLoss /> },
      { path: 'wbs-backup', element: <WbsMonthlyBackup /> },
      { path: 'audit', element: <AuditWork /> },
      { path: 'trial-balance', element: <TrialBalance /> },
      { path: 'profit-loss', element: <ProfitLoss /> },
      { path: 'balance-sheet', element: <BalanceSheet /> },
    ],
  },
]);
