import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import PageLoader from './components/ui/PageLoader';

// Code-splitting : chaque page est chargée à la demande
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Houses = lazy(() => import('./pages/houses/Houses'));
const HouseDetail = lazy(() => import('./pages/houses/HouseDetail'));
const HouseForm = lazy(() => import('./pages/houses/HouseForm'));
const Units = lazy(() => import('./pages/units/Units'));
const UnitForm = lazy(() => import('./pages/units/UnitForm'));
const Tenants = lazy(() => import('./pages/tenants/Tenants'));
const TenantDetail = lazy(() => import('./pages/tenants/TenantDetail'));
const TenantForm = lazy(() => import('./pages/tenants/TenantForm'));
const Contracts = lazy(() => import('./pages/contracts/Contracts'));
const ContractForm = lazy(() => import('./pages/contracts/ContractForm'));
const Payments = lazy(() => import('./pages/payments/Payments'));
const Expenses = lazy(() => import('./pages/expenses/Expenses'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Search = lazy(() => import('./pages/Search'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Users = lazy(() => import('./pages/Users'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

const withSuspense = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly>{withSuspense(<Login />)}</PublicOnly>} />
      <Route path="/register" element={<PublicOnly>{withSuspense(<Register />)}</PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly>{withSuspense(<ForgotPassword />)}</PublicOnly>} />
      <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
      <Route path="/verify-email" element={<Protected>{withSuspense(<VerifyEmail />)}</Protected>} />

      <Route element={<Protected><AppLayout /></Protected>}>
        <Route path="/" element={withSuspense(<Dashboard />)} />
        <Route path="/houses" element={withSuspense(<Houses />)} />
        <Route path="/houses/new" element={withSuspense(<HouseForm />)} />
        <Route path="/houses/:id" element={withSuspense(<HouseDetail />)} />
        <Route path="/houses/:id/edit" element={withSuspense(<HouseForm />)} />
        <Route path="/units" element={withSuspense(<Units />)} />
        <Route path="/units/new" element={withSuspense(<UnitForm />)} />
        <Route path="/units/:id/edit" element={withSuspense(<UnitForm />)} />
        <Route path="/tenants" element={withSuspense(<Tenants />)} />
        <Route path="/tenants/new" element={withSuspense(<TenantForm />)} />
        <Route path="/tenants/:id" element={withSuspense(<TenantDetail />)} />
        <Route path="/tenants/:id/edit" element={withSuspense(<TenantForm />)} />
        <Route path="/contracts" element={withSuspense(<Contracts />)} />
        <Route path="/contracts/new" element={withSuspense(<ContractForm />)} />
        <Route path="/contracts/:id" element={withSuspense(<ContractForm />)} />
        <Route path="/payments" element={withSuspense(<Payments />)} />
        <Route path="/expenses" element={withSuspense(<Expenses />)} />
        <Route path="/analytics" element={withSuspense(<Analytics />)} />
        <Route path="/search" element={withSuspense(<Search />)} />
        <Route path="/settings" element={withSuspense(<Settings />)} />
        <Route path="/notifications" element={withSuspense(<Notifications />)} />
        <Route path="/users" element={withSuspense(<Users />)} />
        <Route path="/audit" element={withSuspense(<AuditLogs />)} />
      </Route>

      <Route path="*" element={withSuspense(<NotFound />)} />
    </Routes>
  );
}
