import {
    AlertCircle,
    BarChart3,
    Calendar,
    Camera,
    Clock,
    DollarSign,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Search,
    Settings,
    Star,
    UserCircle,
    Users,
    Wallet,
    X
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import NotificationBell from '../components/NotificationBell';
import { useUIStore } from '../store/useUIStore';

// Define nav structure
type NavItem = {
    label: string;
    path: string;
    icon: any;
    roles: string[];
};

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useUIStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const allNavItems: NavItem[] = [
        // ADMIN Routes
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
        { label: 'Analytics', path: '/admin-analytics', icon: BarChart3, roles: ['ADMIN'] },
        { label: 'Users', path: '/users', icon: Users, roles: ['ADMIN'] },
        { label: 'Audit Logs', path: '/audit-logs', icon: Clock, roles: ['ADMIN'] },
        { label: 'Withdrawal Requests', path: '/withdrawal-requests', icon: DollarSign, roles: ['ADMIN'] },
        { label: 'Wallet Ledger', path: '/wallet-ledger', icon: Wallet, roles: ['ADMIN'] },
        { label: 'Payables', path: '/payables', icon: DollarSign, roles: ['ADMIN'] },
        { label: 'Ledger Balances', path: '/ledger-balances', icon: Wallet, roles: ['ADMIN'] },
        { label: 'Disputes', path: '/disputes', icon: AlertCircle, roles: ['ADMIN'] },
        { label: 'Sessions', path: '/sessions', icon: Calendar, roles: ['ADMIN'] },
        { label: 'Financials', path: '/financials', icon: DollarSign, roles: ['ADMIN'] },
        { label: 'Profile', path: '/profile', icon: UserCircle, roles: ['ADMIN'] },
        { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },

        // PATIENT Routes
        { label: 'Home', path: '/dashboard', icon: LayoutDashboard, roles: ['PATIENT'] },
        { label: 'Find Psychologist', path: '/find-psychologist', icon: Search, roles: ['PATIENT'] },
        { label: 'My Sessions', path: '/sessions', icon: Calendar, roles: ['PATIENT'] },
        // { label: 'Messages', path: '/messages', icon: MessageSquare, roles: ['PATIENT'] },
        { label: 'Wallet', path: '/wallet', icon: Wallet, roles: ['PATIENT', 'PSYCHOLOGIST'] },
        { label: 'Balance Statement', path: '/balance-statement', icon: FileText, roles: ['PATIENT', 'PSYCHOLOGIST'] },
        { label: 'Profile', path: '/profile', icon: UserCircle, roles: ['PATIENT'] }, // Added for Patient
        { label: 'Settings', path: '/settings', icon: Settings, roles: ['PATIENT'] },

        // PSYCHOLOGIST Routes
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['PSYCHOLOGIST'] },
        { label: 'My Sessions', path: '/sessions', icon: Calendar, roles: ['PSYCHOLOGIST'] },
        { label: 'My Schedule', path: '/schedule', icon: Clock, roles: ['PSYCHOLOGIST'] },
        { label: 'My Services', path: '/my-services', icon: Package, roles: ['PSYCHOLOGIST'] },
        { label: 'My Patients', path: '/my-patients', icon: Users, roles: ['PSYCHOLOGIST'] },
        { label: 'Earnings', path: '/earnings', icon: DollarSign, roles: ['PSYCHOLOGIST'] },
        { label: 'Testimonials', path: '/testimonials', icon: Star, roles: ['PSYCHOLOGIST'] },
        { label: 'Gallery', path: '/gallery', icon: Camera, roles: ['PSYCHOLOGIST'] },
        { label: 'Profile', path: '/profile', icon: UserCircle, roles: ['PSYCHOLOGIST'] },
    ];

    // Filter by Role
    let navItems = allNavItems.filter(item => user && item.roles.includes(user.role));

    // SORTING LOGIC:
    // 1. Dashboard (Top)
    // 2. Users (Second for Admin)
    // 3. Alphabetical (Middle)
    // 4. Settings (Bottom)

    const dashboard = navItems.find(i => i.label === 'Dashboard' || i.label === 'Home');
    const settings = navItems.find(i => i.label === 'Settings');
    const users = navItems.find(i => i.label === 'Users');

    const others = navItems
        .filter(i => i !== dashboard && i !== settings && i !== users)
        .sort((a, b) => a.label.localeCompare(b.label));

    navItems = [
        ...(dashboard ? [dashboard] : []),
        ...(users ? [users] : []), // Users strictly second for Admin
        ...others,
        ...(settings ? [settings] : [])
    ];

    // Render Helper for Nav Items
    const renderNavItem = (item: NavItem) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
            <Link
                key={item.label}
                to={item.path}
                onClick={closeMobileSidebar}
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-textMuted hover:text-text hover:bg-background'
                    }
                `}
            >
                <Icon size={20} />
                {item.label}
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen bg-background text-text">
            {/* Security Enforcements */}
            {/* Security Enforcements */}
            {/* Watermark removed per user request - moved to specific media views */}


            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:hidden z-50">
                <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
                <button
                    onClick={toggleMobileSidebar}
                    className="p-2 text-text hover:bg-background rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 bg-surface border-r border-border
                    transform transition-transform duration-200 ease-in-out
                    ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="w-8 h-8 bg-primary rounded-lg mr-3 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">A</span>
                    </div>
                    <span className="text-xl font-bold text-text">AdminPanel</span>

                    <button
                        onClick={closeMobileSidebar}
                        className="lg:hidden ml-auto text-textMuted hover:text-text"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user?.alias?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-text truncate">{user?.alias || 'User'}</p>
                            <p className="text-xs text-textMuted truncate capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>

                    <NotificationBell />
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map(item => renderNavItem(item))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-border mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 lg:hidden z-30"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 pt-16 lg:pt-0 overflow-y-auto bg-background">
                <div className="p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
