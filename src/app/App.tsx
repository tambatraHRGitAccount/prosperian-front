import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { MainLayout } from "@layouts/MainLayout";
import { SearchLayout } from "@layouts/SearchLayout";

import Entreprises from "@pages/Recherche/Entreprises";
import Contact from "@pages/Recherche/Contact";
import Lists from "@pages/Recherche/Lists";
import Export from "@pages/Recherche/Export";
import MySearches from "@pages/Recherche/MySearches";
import SocieteDetails from "@pages/Recherche/Societe/SocieteDetails";

import Enrichment from "@pages/Enrichissement";
import FileUploadResult from "@pages/Enrichissement/FileUploadResult";
import ProntoLeadsForm from "@pages/Enrichissement/ProntoLeadsForm";

import Login from "@pages/Auth/Login";
import Register from "@pages/Auth/Register";
import UserProfile from "@pages/Profile/UserProfile";
import SubscriptionPage from "@pages/Subscription/SubscriptionPage";
import PaymentPage from "@pages/Payment/PaymentPage";
import SuccessPage from "@pages/Payment/SuccessPage";
import PricingPage from "@pages/Pricing/PricingPage";

// Admin components
import AdminDashboard from "@pages/Admin";
import AdminDashboardHome from "@pages/Admin/Dashboard";
import AdminEnrichments from "@pages/Admin/Enrichments";
import AdminUsers from "@pages/Admin/Users";
import AdminSubscriptions from "@pages/Admin/Subscriptions";
import AdminRoute from "@components/AdminRoute";
/* import Surveillance   from "@pages/Surveillance";
import Veille         from "@pages/Veille"; */

export const App = () => {
  return (
    <Routes>
      {/* Routes d'authentification (sans layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="recherche" replace />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="payment/success" element={<SuccessPage />} />

        <Route path="recherche" element={<SearchLayout />}>
          <Route index element={<Entreprises />} />
          <Route path="entreprises" element={<Entreprises />} />
          <Route path="contact" element={<Contact />} />
          <Route path="listes" element={<Lists />} />
          <Route path="export" element={<Export />} />
          <Route path="mes-recherches" element={<MySearches />} />
        </Route>

        <Route path="recherche/societes/:id" element={<SocieteDetails />} />

        <Route path="enrichissement" element={<Enrichment />} />
        <Route path="enrichissement/pronto-leads" element={<ProntoLeadsForm />} />
        <Route path="file-upload-result" element={<FileUploadResult />} />
        
        {/* Admin Routes */}
        <Route path="admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboardHome />} />
          <Route path="enrichments" element={<AdminEnrichments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
        </Route>
        
        {/* <Route path="surveillance"   element={<Surveillance />} />
        <Route path="veille"         element={<Veille />} /> */}
      </Route>
    </Routes>
  );
};

export default App;
