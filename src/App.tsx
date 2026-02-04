import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import Layout from './layout/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleBasedDashboard from './pages/RoleBasedDashboard';

// Admin Pages
import AdminAnalytics from './pages/AdminAnalytics';
import AuditLogs from './pages/AuditLogs';
import Disputes from './pages/Disputes';
import DisputeView from './pages/DisputeView';
import Financials from './pages/Financials';
import LedgerBalances from './pages/LedgerBalances';
import Payables from './pages/Payables';
import SessionView from './pages/SessionView'; // Sessions list for Admin? Or general? 
import Sessions from './pages/Sessions'; // General Sessions
import UserBreakdown from './pages/UserBreakdown';
import Users from './pages/Users';
import WalletLedger from './pages/WalletLedger';
import WithdrawalRequests from './pages/WithdrawalRequests';
import AdminSettings from './pages/admin/AdminSettings';

// Patient Pages
import FindPsychologist from './pages/FindPsychologist';
import MyServices from './pages/MyServices'; // Actually Psychologist
import BookSession from './pages/BookSession';
import SessionRoom from './pages/SessionRoom';

// Psychologist Pages
import Earnings from './pages/Earnings';
import Gallery from './pages/Gallery';
import MyPatients from './pages/MyPatients';
import PsychologistProfile from './pages/PsychologistProfile'; // Public profile? Or own?
import Schedule from './pages/Schedule';
import Testimonials from './pages/Testimonials';

// Shared Pages
import BalanceStatement from './pages/BalanceStatement';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import TransactionHistory from './pages/TransactionHistory';
import Wallet from './pages/Wallet';
import AddFunds from './pages/AddFunds';
import EsewaSuccess from './pages/EsewaSuccess';
import EsewaFailure from './pages/EsewaFailure';
import EsewaRedirect from './pages/EsewaRedirect';
import WithdrawFunds from './pages/WithdrawFunds';
import PaymentMethods from './pages/PaymentMethods';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}


function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<RoleBasedDashboard />} />

                {/* Admin Routes */}
                <Route path="admin-analytics" element={<AdminAnalytics />} />
                <Route path="users" element={<Users />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="withdrawal-requests" element={<WithdrawalRequests />} />
                <Route path="wallet-ledger" element={<WalletLedger />} />
                <Route path="payables" element={<Payables />} />
                <Route path="ledger-balances" element={<LedgerBalances />} />
                <Route path="disputes" element={<Disputes />} />
                <Route path="disputes/:id" element={<DisputeView />} />
                <Route path="financials" element={<Financials />} />
                <Route path="user-breakdown" element={<UserBreakdown />} />
                <Route path="admin-settings" element={<AdminSettings />} />

                {/* Patient Routes */}
                <Route path="find-psychologist" element={<FindPsychologist />} />
                <Route path="book-session/:psychologistId" element={<BookSession />} />

                {/* Psychologist Routes */}
                <Route path="schedule" element={<Schedule />} />
                <Route path="my-services" element={<MyServices />} />
                <Route path="my-patients" element={<MyPatients />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="testimonials" element={<Testimonials />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="psychologist-profile" element={<PsychologistProfile />} />

                {/* Shared Routes */}
                <Route path="sessions" element={<Sessions />} />
                <Route path="sessions/:id" element={<SessionView />} />
                <Route path="session-room/:sessionId" element={<SessionRoom />} />
                <Route path="messages" element={<Messages />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="add-funds" element={<AddFunds />} />
                <Route path="esewa/success" element={<EsewaSuccess />} />
                <Route path="esewa/failure" element={<EsewaFailure />} />
                <Route path="esewa/pay-redirect" element={<EsewaRedirect />} />
                <Route path="withdraw-funds" element={<WithdrawFunds />} />
                <Route path="balance-statement" element={<BalanceStatement />} />
                <Route path="transaction-history" element={<TransactionHistory />} />
                <Route path="profile" element={<Profile />} />
                <Route path="payment-methods" element={<PaymentMethods />} />
                <Route path="settings" element={<Settings />} />

            </Route>

            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
