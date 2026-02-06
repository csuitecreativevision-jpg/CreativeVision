import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { UserManagement } from '../../components/admin/UserManagement';

export default function AdminUserManagement() {
    return (
        <AdminPageLayout
            title="User Management"
            subtitle="Manage your platform access, team roles, and permissions."
        >
            <div className="max-w-7xl mx-auto">
                <UserManagement />
            </div>
        </AdminPageLayout>
    );
}
