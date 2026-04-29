import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { MastersPage } from "./pages/MastersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/admin" element={<AdminPage />} />
      <Route path="/masters" element={<MastersPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
