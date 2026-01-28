import { useAuth } from '../auth/useAuth';
import Dashboard from './Dashboard'; // Admin Dashboard
import PatientDashboard from './PatientDashboard';
import PsychologistDashboard from './PsychologistDashboard';

const RoleBasedDashboard = () => {
    const { user } = useAuth();

    console.log('RoleBasedDashboard User:', user);

    if (!user) return <div>No User Found</div>;

    switch (user.role) {
        case 'ADMIN':
            return <Dashboard />;
        case 'PATIENT':
            return <PatientDashboard />;
        case 'PSYCHOLOGIST':
            return <PsychologistDashboard />;
        default:
            return <div className="p-10 text-center">Unknown Role</div>;
    }
};

export default RoleBasedDashboard;
