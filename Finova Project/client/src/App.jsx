import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import BusinessDetails from './pages/BusinessDetails';
import Items from './pages/Items';
import AddOrder from './pages/AddOrder';
import Drafts from './pages/Drafts';
import PrintPreview from './pages/PrintPreview';
import OrderReports from './pages/reports/OrderReports';
import ItemReports from './pages/reports/ItemReports';
import PSG from './pages/PSG';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Protected Routes Component
const ProtectedRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="business-details" element={<BusinessDetails />} />
        <Route path="items" element={<Items />} />
        <Route path="add-order" element={<AddOrder />} />
        <Route path="add-order/:orderId" element={<AddOrder />} />
        <Route path="drafts" element={<Drafts />} />
        <Route path="print-preview/:id" element={<PrintPreview />} />
        <Route path="reports/orders" element={<OrderReports />} />
        <Route path="reports/items" element={<ItemReports />} />
        <Route path="psg" element={<PSG />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <ProtectedRoutes />
    </AuthProvider>
  );
}

export default App;
