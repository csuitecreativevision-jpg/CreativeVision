import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function PortalRouter() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedRole = localStorage.getItem('portal_user_role');
        setRole(storedRole);
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    if (!role) {
        return <Navigate to="/portal" replace />;
    }

    switch (role) {
        case 'admin':
            return <Navigate to="/admin-portal" replace />;
        case 'editor':
            return <Navigate to="/editor-portal" replace />;
        case 'client':
            return <Navigate to="/client-portal" replace />;
        default:
            return <Navigate to="/portal" replace />;
    }
}
