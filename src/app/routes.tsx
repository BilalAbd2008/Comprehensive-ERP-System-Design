import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import BiologicalAssets from "./components/BiologicalAssets";
import GeneralLedger from "./components/GeneralLedger";
import BukuBesar from "./components/BukuBesar";
import WorkingBalanceSheetAsset from "./components/WorkingBalanceSheetAsset";
import WorkingBalanceSheetLiability from "./components/WorkingBalanceSheetLiability";
import WorkingProfitLoss from "./components/WorkingProfitLoss";
import AuditWork from "./components/AuditWork";
import TrialBalance from "./components/TrialBalance";
import ProfitLoss from "./components/ProfitLoss";
import BalanceSheet from "./components/BalanceSheet";
import AdminUsers from "./components/AdminUsers";
import SOPFlowchart from "./components/SOPFlowchart";
import Login from "./components/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "assets", element: <BiologicalAssets /> },
      { path: "journal", element: <GeneralLedger /> },
      { path: "ledger", element: <BukuBesar /> },
      { path: "bs-a", element: <WorkingBalanceSheetAsset /> },
      { path: "bs-l", element: <WorkingBalanceSheetLiability /> },
      { path: "pl", element: <WorkingProfitLoss /> },
      { path: "audit", element: <AuditWork /> },
      { path: "trial-balance", element: <TrialBalance /> },
      { path: "profit-loss", element: <ProfitLoss /> },
      { path: "balance-sheet", element: <BalanceSheet /> },
      { path: "admin-users", element: <AdminUsers /> },
      { path: "sop-flowchart", element: <SOPFlowchart /> },
    ],
  },
]);
