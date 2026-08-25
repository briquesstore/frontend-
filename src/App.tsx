import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import OrdersListPage from "@/features/orders/OrdersListPage";
import OrderDetailPage from "@/features/orders/OrderDetailPage";
import PreordersListPage from "@/features/preorders/PreordersListPage";
import PreorderDetailPage from "@/features/preorders/PreorderDetailPage";
import ProductsListPage from "@/features/products/ProductsListPage";
import ProductFormPage from "@/features/products/ProductFormPage";
import StockPage from "@/features/stock/StockPage";
import StockEntryPage from "@/features/stock/StockEntryPage";
import StockHistoryPage from "@/features/stock/StockHistoryPage";
import LogisticsPage from "@/features/logistics/LogisticsPage";
import DriversPage from "@/features/drivers/DriversPage";
import CustomersListPage from "@/features/customers/CustomersListPage";
import CustomerDetailPage from "@/features/customers/CustomerDetailPage";
import ClaimsListPage from "@/features/claims/ClaimsListPage";
import ClaimDetailPage from "@/features/claims/ClaimDetailPage";
import RefundsListPage from "@/features/refunds/RefundsListPage";
import RefundDetailPage from "@/features/refunds/RefundDetailPage";
import ReportsPage from "@/features/reports/ReportsPage";
import SettingsPage from "@/features/settings/SettingsPage";
import ProfilePage from "@/features/auth/ProfilePage";
import ChangePasswordPage from "@/features/auth/ChangePasswordPage";
import PaymentsPage from "@/features/payments/PaymentsPage";
import PromotionsPage from "@/features/promotions/PromotionsPage";
import InvoicesPage from "@/features/invoices/InvoicesPage";
import InventoryPage from "@/features/stock/InventoryPage";
import PushNotificationsPage from "@/features/notifications/PushNotificationsPage";
import WhatsAppPage from "@/features/whatsapp/WhatsAppPage";
import { useAuthStore } from "@/core/stores/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AppContent() {
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    // Restaurer la session au démarrage via le cookie httpOnly bo_refresh_token
    // refreshSession utilise axios directement (pas d'interceptor) → pas de boucle
    refreshSession();
  }, [refreshSession]);

  // Afficher un loader pendant l'initialisation pour éviter une redirection prématurée vers /login
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<ProtectedRoute module="dashboard"><DashboardPage /></ProtectedRoute>} />

        <Route path="orders" element={<ProtectedRoute module="orders"><OrdersListPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute module="orders"><OrderDetailPage /></ProtectedRoute>} />

        <Route path="preorders" element={<ProtectedRoute module="preorders"><PreordersListPage /></ProtectedRoute>} />
        <Route path="preorders/:id" element={<ProtectedRoute module="preorders"><PreorderDetailPage /></ProtectedRoute>} />

        <Route path="products" element={<ProtectedRoute module="products"><ProductsListPage /></ProtectedRoute>} />
        <Route path="products/new" element={<ProtectedRoute module="products"><ProductFormPage /></ProtectedRoute>} />
        <Route path="products/:id/edit" element={<ProtectedRoute module="products"><ProductFormPage /></ProtectedRoute>} />

        <Route path="stock" element={<ProtectedRoute module="stock"><StockPage /></ProtectedRoute>} />
        <Route path="stock/entry" element={<ProtectedRoute module="stock"><StockEntryPage /></ProtectedRoute>} />
        <Route path="stock/history" element={<ProtectedRoute module="stock"><StockHistoryPage /></ProtectedRoute>} />
        <Route path="stock/inventory" element={<ProtectedRoute module="stock"><InventoryPage /></ProtectedRoute>} />

        <Route path="logistics" element={<ProtectedRoute module="logistics"><LogisticsPage /></ProtectedRoute>} />
        <Route path="drivers" element={<ProtectedRoute module="logistics"><DriversPage /></ProtectedRoute>} />

        <Route path="customers" element={<ProtectedRoute module="customers"><CustomersListPage /></ProtectedRoute>} />
        <Route path="customers/:id" element={<ProtectedRoute module="customers"><CustomerDetailPage /></ProtectedRoute>} />

        <Route path="claims" element={<ProtectedRoute module="claims"><ClaimsListPage /></ProtectedRoute>} />
        <Route path="claims/:id" element={<ProtectedRoute module="claims"><ClaimDetailPage /></ProtectedRoute>} />

        <Route path="refunds" element={<ProtectedRoute module="refunds"><RefundsListPage /></ProtectedRoute>} />
        <Route path="refunds/:id" element={<ProtectedRoute module="refunds"><RefundDetailPage /></ProtectedRoute>} />

        <Route path="reports" element={<ProtectedRoute module="reports"><ReportsPage /></ProtectedRoute>} />

        <Route path="payments" element={<ProtectedRoute module="orders"><PaymentsPage /></ProtectedRoute>} />
        <Route path="promotions" element={<ProtectedRoute module="products"><PromotionsPage /></ProtectedRoute>} />
        <Route path="invoices" element={<ProtectedRoute module="orders"><InvoicesPage /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute module="settings"><PushNotificationsPage /></ProtectedRoute>} />
        <Route path="whatsapp" element={<ProtectedRoute module="settings"><WhatsAppPage /></ProtectedRoute>} />

        <Route path="profile" element={<ProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />

        <Route path="settings" element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />

        {/* Default redirect */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
