import React from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GuestRoute: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-text-muted">
        Memuat...
      </div>
    );
  }

  if (user) {
    const redirect = searchParams.get('redirect');
    if (redirect && redirect.startsWith('/')) {
      return <Navigate to={redirect} replace />;
    }
    return <Navigate to={isAdmin ? '/admin/orders' : '/'} replace />;
  }

  return <Outlet />;
};
