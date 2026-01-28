import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import Layout from './layout/Layout';

// Lazy load pages
const AddFunds = lazy(() => import('./pages/AddFunds'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const BalanceStatement = lazy(() => import('./pages/BalanceStatement'));
const BookSession = lazy(() => import('./pages/BookSession'));
const Disputes = lazy(() => import('./pages/Disputes'));
const DisputeView = lazy(() => import('./pages/DisputeView'));
const Earnings = lazy(() => import('./pages/Earnings'));
const Financials = lazy(() => import('./pages/Financials'));
const FindPsychologist = lazy(() => import('./pages/FindPsychologist'));
const UserBreakdown = lazy(() => import('./pages/UserBreakdown'));
const Gallery = lazy(() => import('./pages/Gallery'));
const LedgerBalances = lazy(() => import('./pages/LedgerBalances'));
const Login = lazy(() => import('./pages/Login'));
// const Messages = lazy(() => import('./pages/Messages'));
const MyPatients = lazy(() => import('./pages/MyPatients'));
const MyServices = lazy(() => import('./pages/MyServices'));
const Patients = lazy(() => import('./pages/Patients'));
const Payables = lazy(() => import('./pages/Payables'));
const PaymentMethods = lazy(() => import('./pages/PaymentMethods'));
const Profile = lazy(() => import('./pages/Profile'));
const Psychologists = lazy(() => import('./pages/Psychologists'));
const PsychologistProfile = lazy(() => import('./pages/PsychologistProfile'));
const RoleBasedDashboard = lazy(() => import('./pages/RoleBasedDashboard'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Sessions = lazy(() => import('./pages/Sessions'));
const SessionRoom = lazy(() => import('./pages/SessionRoom'));
const SessionView = lazy(() => import('./pages/SessionView'));
const Settings = lazy(() => import('./pages/Settings'));
const Signup = lazy(() => import('./pages/Signup'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'));
const Users = lazy(() => import('./pages/Users'));
const Wallet = lazy(() => import('./pages/Wallet'));
const WalletLedger = lazy(() => import('./pages/WalletLedger'));
const WithdrawalRequests = lazy(() => import('./pages/WithdrawalRequests'));
const WithdrawFunds = lazy(() => import('./pages/WithdrawFunds'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background text-primary">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  // Global Protection: Disable Right Click
  React.useEffect(() => {
    const handleContext = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);

    // Disable generic dragstart
    const handleDrag = (e: Event) => e.preventDefault();
    document.addEventListener('dragstart', handleDrag);

    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('dragstart', handleDrag);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<RoleBasedDashboard />} />
              <Route path="admin-analytics" element={<AdminAnalytics />} />
              <Route path="psychologists" element={<Psychologists />} />
              <Route path="find-psychologist" element={<FindPsychologist />} />
              <Route path="psychologist/:id" element={<PsychologistProfile />} />
              <Route path="book-session/:id" element={<BookSession />} />
              <Route path="patient-list" element={<Patients />} />
              <Route path="financials" element={<Financials />} />
              <Route path="disputes" element={<Disputes />} />
              <Route path="disputes/:id" element={<DisputeView />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="sessions/:sessionId" element={<SessionView />} />
              <Route path="sessions/:sessionId/room" element={<SessionRoom />} />
              <Route path="users" element={<Users />} />
              <Route path="user-breakdown" element={<UserBreakdown />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="withdrawal-requests" element={<WithdrawalRequests />} />
              <Route path="wallet-ledger" element={<WalletLedger />} />
              <Route path="payables" element={<Payables />} />
              <Route path="ledger-balances" element={<LedgerBalances />} />
              <Route path="transaction-history/:userId" element={<TransactionHistory />} />
              {/* <Route path="messages" element={<Messages />} /> */}
              <Route path="wallet" element={<Wallet />} />
              <Route path="withdraw-funds" element={<WithdrawFunds />} />
              <Route path="payment-methods" element={<PaymentMethods />} />
              <Route path="add-funds" element={<AddFunds />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="my-services" element={<MyServices />} />
              <Route path="my-patients" element={<MyPatients />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="testimonials" element={<Testimonials />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="balance-statement" element={<BalanceStatement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
