import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { StorefrontLayout } from './layouts/StorefrontLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { GuestRoute } from './routes/GuestRoute';

import { HomePage } from './pages/public/HomePage';
import { CatalogPage } from './pages/public/CatalogPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { WishlistPage } from './pages/public/WishlistPage';
import { AboutPage } from './pages/public/AboutPage';
import { CartPage } from './pages/public/CartPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';

const CheckoutPage = lazy(() =>
  import('./pages/checkout/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const OrderPaymentPage = lazy(() =>
  import('./pages/checkout/OrderPaymentPage').then((m) => ({ default: m.OrderPaymentPage }))
);
const OrderInvoicePage = lazy(() =>
  import('./pages/checkout/OrderInvoicePage').then((m) => ({ default: m.OrderInvoicePage }))
);
const ProfilePage = lazy(() =>
  import('./pages/account/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const OrderHistoryPage = lazy(() =>
  import('./pages/account/OrderHistoryPage').then((m) => ({ default: m.OrderHistoryPage }))
);

const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage }))
);
const AdminReportsPage = lazy(() =>
  import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage }))
);
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage }))
);
const AdminProductFormPage = lazy(() =>
  import('./pages/admin/AdminProductFormPage').then((m) => ({ default: m.AdminProductFormPage }))
);
const AdminPromosPage = lazy(() =>
  import('./pages/admin/AdminPromosPage').then((m) => ({ default: m.AdminPromosPage }))
);
const AdminSubscribersPage = lazy(() =>
  import('./pages/admin/AdminSubscribersPage').then((m) => ({ default: m.AdminSubscribersPage }))
);
const AdminAccountPage = lazy(() =>
  import('./pages/admin/AdminAccountPage').then((m) => ({ default: m.AdminAccountPage }))
);

const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="text-center space-y-2">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="font-label-uppercase text-[10px] uppercase tracking-widest text-secondary">
        Memuat halaman...
      </p>
    </div>
  </div>
);

export function App() {
  return (
    <StoreProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Storefront & Customer Flows */}
          <Route element={<StorefrontLayout />}>
            <Route index element={<HomePage />} />
            <Route path="women" element={<CatalogPage categoryPage="women" />} />
            <Route path="men" element={<CatalogPage categoryPage="men" />} />
            <Route path="bags" element={<CatalogPage categoryPage="bags" />} />
            <Route path="shoes" element={<CatalogPage categoryPage="shoes" />} />
            <Route path="curated-drops" element={<CatalogPage categoryPage="curated-drops" />} />
            <Route path="product/:productId" element={<ProductDetailPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="about" element={<AboutPage />} />

            {/* Checkout, Payment & Invoice Routes */}
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders/:orderNumber/payment" element={<OrderPaymentPage />} />
            <Route path="orders/:orderNumber/invoice" element={<OrderInvoicePage />} />

            {/* Customer Account Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="account" element={<ProfilePage />} />
            </Route>
            <Route path="account/orders" element={<OrderHistoryPage />} />
          </Route>

          {/* Guest Auth Routes */}
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>
          </Route>

          {/* Google OAuth Callback Route */}
          <Route element={<AuthLayout />}>
            <Route path="auth/callback" element={<AuthCallbackPage />} />
          </Route>

          {/* Isolated Admin Console Routes */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/new" element={<AdminProductFormPage />} />
              <Route path="products/:productId/edit" element={<AdminProductFormPage />} />
              <Route path="promos" element={<AdminPromosPage />} />
              <Route path="subscribers" element={<AdminSubscribersPage />} />
              <Route path="account" element={<AdminAccountPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </StoreProvider>
  );
}

export default App;
