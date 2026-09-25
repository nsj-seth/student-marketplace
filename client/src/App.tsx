import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleRoute } from "./components/auth/RoleRoute";
import { AccessPage } from "./pages/access/AccessPage";
import { ForbiddenPage } from "./pages/access/ForbiddenPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/profile/ProfilePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["CUSTOMER"]} />}>
        <Route path="/customer-test" element={<AccessPage role="CUSTOMER" />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["SELLER"]} />}>
        <Route path="/seller-test" element={<AccessPage role="SELLER" />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin-test" element={<AccessPage role="ADMIN" />} />
      </Route>
    </Routes>
  );
}
