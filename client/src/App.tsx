import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleRoute } from "./components/auth/RoleRoute";
import { AccessPage } from "./pages/access/AccessPage";
import { ForbiddenPage } from "./pages/access/ForbiddenPage";
import { AdminReferenceDataPage } from "./pages/admin/AdminReferenceDataPage";
import { AdminSellerApplicationsPage } from "./pages/admin/AdminSellerApplicationsPage";
import { AdminSellerApplicationDetailPage } from "./pages/admin/AdminSellerApplicationDetailPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { ReferenceDataPage } from "./pages/reference/ReferenceDataPage";
import { SellerRegistrationPage } from "./pages/seller/SellerRegistrationPage";
import { BusinessApplicationPage } from "./pages/seller/BusinessApplicationPage";
import { StudentVerificationPage } from "./pages/seller/StudentVerificationPage";
import { MyBusinessesPage } from "./pages/seller/MyBusinessesPage";
import { ManageBusinessPage } from "./pages/seller/ManageBusinessPage";
import { BusinessesPage } from "./pages/marketplace/BusinessesPage";
import { BusinessStorefrontPage } from "./pages/marketplace/BusinessStorefrontPage";
import { ProductsPage } from "./pages/marketplace/ProductsPage";
import { ProductDetailsPage } from "./pages/marketplace/ProductDetailsPage";
import { ProductListPage } from "./pages/seller/ProductListPage";
import { ProductEditorPage } from "./pages/seller/ProductEditorPage";
import { ProductImagesPage } from "./pages/seller/ProductImagesPage";
import { WishlistPage } from "./pages/customer/WishlistPage";
import { CartPage } from "./pages/customer/CartPage";
import { CheckoutPage } from "./pages/customer/CheckoutPage";
import { MyOrdersPage } from "./pages/customer/MyOrdersPage";
import { OrderDetailsPage } from "./pages/customer/OrderDetailsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reference-data" element={<ReferenceDataPage />} />
      <Route path="/businesses" element={<BusinessesPage />} />
      <Route path="/businesses/:slug" element={<BusinessStorefrontPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id/:slug?" element={<ProductDetailsPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/sell" element={<SellerRegistrationPage />} />
        <Route path="/sell/applications/:id/student-verification" element={<StudentVerificationPage />} />
        <Route path="/sell/applications/:id/business-details" element={<BusinessApplicationPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["CUSTOMER"]} />}>
        <Route path="/customer-test" element={<AccessPage role="CUSTOMER" />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["SELLER"]} />}>
        <Route path="/seller-test" element={<AccessPage role="SELLER" />} />
        <Route path="/seller/businesses" element={<MyBusinessesPage />} />
        <Route path="/seller/businesses/:id" element={<ManageBusinessPage />} />
        <Route path="/seller/businesses/:businessId/products" element={<ProductListPage />} />
        <Route path="/seller/businesses/:businessId/products/new" element={<ProductEditorPage />} />
        <Route path="/seller/businesses/:businessId/products/:productId" element={<ProductEditorPage />} />
        <Route path="/seller/businesses/:businessId/products/:productId/images" element={<ProductImagesPage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin-test" element={<AccessPage role="ADMIN" />} />
        <Route path="/admin/reference-data" element={<AdminReferenceDataPage />} />
        <Route path="/admin/seller-applications" element={<AdminSellerApplicationsPage />} />
        <Route path="/admin/seller-applications/:id" element={<AdminSellerApplicationDetailPage />} />
      </Route>
    </Routes>
  );
}
