import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ClusterProvider } from './contexts/ClusterContext';
import { UserLayout, AdminLayout } from './components/layout/Layouts';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './hooks/useToast';

// Auth
import LoginPage from './pages/auth/LoginPage';

// User pages
import UserDashboard from './pages/user/dashboard';
import UserDatasets from './pages/user/datasets';
import DatasetDetail from './pages/user/datasets/DatasetDetail';
import UploadDataset from './pages/user/datasets/UploadDataset';
import UserModels from './pages/user/models';
import ModelDetail from './pages/user/models/ModelDetail';
import Development from './pages/user/development';
import Training from './pages/user/training';
import TrainingDetail from './pages/user/training/TrainingDetail';
import Inference from './pages/user/inference';
import CreateService from './pages/user/inference/CreateService';
import BatchInference from './pages/user/inference/BatchInference';
import AppStore from './pages/user/appstore';
import UserStorage from './pages/user/storage';
import UserSettings from './pages/user/settings';

// New sub-pages (user)
import CreateInstance from './pages/user/development/CreateInstance';
import SubmitTraining from './pages/user/training/SubmitTraining';
import ImportModel from './pages/user/models/ImportModel';
import CreateBatch from './pages/user/inference/CreateBatch';
import CreateApiKey from './pages/user/settings/CreateApiKey';

// New sub-pages (admin)
import CreateTenant from './pages/admin/business/CreateTenant';
import UserManagement from './pages/admin/users';
import CreateUser from './pages/admin/users/CreateUser';
import CreateBucket from './pages/admin/storage/CreateBucket';
import RegisterImage from './pages/admin/images/RegisterImage';
import CreateCluster from './pages/admin/kubernetes/CreateCluster';

// Admin pages
import AdminDashboard from './pages/admin/dashboard';
import ComputeManagement from './pages/admin/compute';
import AdminStorage from './pages/admin/storage';
import ImageRegistry from './pages/admin/images';
import K8sManagement from './pages/admin/kubernetes';
import ResourceManagement from './pages/admin/resources';
import Monitoring from './pages/admin/monitoring';
import AdminApiKeys from './pages/admin/apikeys';
import SensitiveWordsManagement from './pages/admin/sensitive';
import AuditLogs from './pages/admin/operations';
import Permissions from './pages/admin/permissions';
import QuotaManagement from './pages/admin/quota';
import BusinessManagement from './pages/admin/business';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactElement; requiredRole?: string }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
}

function AppInner() {
  const { toasts, dismiss } = useToast();
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* User Portal */}
          <Route
            path="/user"
            element={
              <ProtectedRoute requiredRole="user">
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="datasets" element={<UserDatasets />} />
            <Route path="datasets/upload" element={<UploadDataset />} />
            <Route path="datasets/:id" element={<DatasetDetail />} />
            <Route path="models" element={<UserModels />} />
            <Route path="models/:id" element={<ModelDetail />} />
            <Route path="development" element={<Development />} />
            <Route path="development/create" element={<CreateInstance />} />
            <Route path="training" element={<Training />} />
            <Route path="training/create" element={<SubmitTraining />} />
            <Route path="training/:id" element={<TrainingDetail />} />
            <Route path="models/import" element={<ImportModel />} />
            <Route path="inference" element={<Inference />} />
            <Route path="inference/batch" element={<BatchInference />} />
            <Route path="inference/create" element={<CreateService />} />
            <Route path="inference/batch/create" element={<CreateBatch />} />
            <Route path="appstore" element={<AppStore />} />
            <Route path="storage" element={<UserStorage />} />
            <Route path="settings" element={<UserSettings />} />
            <Route path="settings/create-key" element={<CreateApiKey />} />
          </Route>

          {/* Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="compute" element={<ComputeManagement />} />
            <Route path="storage" element={<AdminStorage />} />
            <Route path="images" element={<ImageRegistry />} />
            <Route path="kubernetes" element={<K8sManagement />} />
            <Route path="kubernetes/create" element={<CreateCluster />} />
            <Route path="resources" element={<ResourceManagement />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="apikeys" element={<AdminApiKeys />} />
            <Route path="sensitive" element={<SensitiveWordsManagement />} />
            <Route path="operations" element={<AuditLogs />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="quota" element={<QuotaManagement />} />
            <Route path="business" element={<BusinessManagement />} />
            <Route path="business/create-tenant" element={<CreateTenant />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/create" element={<CreateUser />} />
            <Route path="storage/create-bucket" element={<CreateBucket />} />
            <Route path="images/register" element={<RegisterImage />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ClusterProvider>
          <AppInner />
        </ClusterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

