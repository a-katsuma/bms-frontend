import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import App from "./App";
import ClientList from "./pages/client/ClientList";
import ClientDetail from "./pages/client/ClientDetail";
import ClientRegister from "./pages/client/ClientRegister";
import ClientEdit from "./pages/client/ClientEdit";
import ProjectList from "./pages/project/ProjectList";
import ProjectDetail from "./pages/project/ProjectDetail";
import QuoteEdit from "./pages/quote/QuoteEdit";
import ProjectRegister from "./pages/project/ProjectRegister";
import ProjectEdit from "./pages/project/ProjectEdit";
import CompanyList from "./pages/company/CompanyList";
import CompanyRegister from "./pages/company/CompanyRegister";
import CompanyEdit from "./pages/company/CompanyEdit";
import CompanyDetail from "./pages/company/CompanyDetail";
import User from "./pages/User";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountEdit from "./pages/AccountEdit";
import CompanyUsers from "./pages/company/CompanyUsers";
import BusinessPolicy from "./pages/company/BusinessPolicy";
import FacilitySurvey from "./pages/survey/FacilitySurvey";
import MasterSettings from "./pages/master/MasterSettings";
import BillingBase from "./pages/base/BillingBase";
import StatementList from "./pages/statement/StatementList";
import StatementDetail from "./pages/statement/StatementDetail";
import DeletedProjectList from "./pages/project/DeletedProjectList";
import ClientDocuments from "./pages/client/ClientDocument";
import ExtraWorkList from "./pages/extraWork/ExtraWorkList";
import ExtraWorkEdit from "./pages/extraWork/ExtraWorkEdit";
import ExtraWorkPreview from './pages/extraWork/ExtraWorkPreview';
import ExtraWorkNew from "./pages/extraWork/ExtraWorkNew";

const router = createBrowserRouter([
  // --- ログイン ---
  {
    path: "/login",
    Component: User,
  },
  // パスワードを忘れた（未ログイン）
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  // メールのリンクから新パスワード設定（未ログイン）
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/",
    Component: App,
    children: [
      // --- ホーム ---
      {
        index: true,
        Component: Home,
      },
      // アカウント編集（ログイン後、本人用）
      {
        path: "account",
        Component: AccountEdit,
      },
      // --- 顧客管理 ---
      {
        path: "clients",
        Component: ClientList,
      },
      {
        path: "clients/add",
        Component: ClientRegister,
      },
      {
        path: "clients/:id",
        Component: ClientDetail,
      },
      {
        path: "clients/edit/:id",
        Component: ClientEdit,
      },
      {
        path: "clients/:id/documents",
        Component: ClientDocuments,
      },
      // --- 案件管理 ---
      {
        path: "projects",
        Component: ProjectList,
      },
      {
        path: "projects/add",
        Component: ProjectRegister,
      },
      {
        path: "projects/deleted",
        Component: DeletedProjectList,
      },
      {
        path: "projects/edit/:id",
        Component: ProjectEdit,
      },
      {
        path: "projects/:id",
        Component: ProjectDetail,
      },
      {
        path: "projects/:pid/quotes/edit/:id",
        Component: QuoteEdit,
      },
      // --- 現状確認表 ---
      {
        path: "projects/:id/survey",
        Component: FacilitySurvey,
      },
      // --- ベース ---
      {
        path: "projects/:id/base",
        Component: BillingBase,
      },
      // --- 毎次明細 ---
      {
        path: "projects/:id/statements",
        Component: StatementList,
      },
      {
        path: "projects/:id/statements/:statementId",
        Component: StatementDetail,
      },
            // --- 緊急・追加作業 ---
      {
        path: "extra-works",
        Component: ExtraWorkList,
      },
            {
        path: "extra-works/new",
        Component: ExtraWorkNew,
      },

      {
        path: "projects/:id/extra-works/new",
        Component: ExtraWorkEdit,
      },
      {
        path: "projects/:id/extra-works/:workId",
        Component: ExtraWorkEdit,
      },
      {
        path: "projects/:id/extra-works/:workId/preview",
        Component: ExtraWorkPreview,
        handle: { fullScreen: true }, // サイドバーなしの全画面
      },

      // --- 常用項目管理 ---
      {
        path: "masters",
        Component: MasterSettings,
      },
      // --- 業者管理 ---
      {
        path: "companys",
        Component: CompanyList,
      },
      {
        path: "companys/add",
        Component: CompanyRegister,
      },
      {
        path: "companys/edit/:id",
        Component: CompanyEdit,
      },
      {
        path: "companys/:id",
        Component: CompanyDetail,
      },
      {
        path: "company/users",
        Component: CompanyUsers,
      },
      // ★追加: ビジネスポリシー画面のルート定義
      {
        path: "company/business-policy",
        Component: BusinessPolicy,
      },
    ],
  },
]);

export default router;
