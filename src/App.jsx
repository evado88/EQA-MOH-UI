import "./App.css";
import "devextreme/dist/css/dx.greenmist.compact.css";
import MainLayout from "./components/MainLayout";
import AuthLayout from "./components/AuthLayout";
import PrivateRoute from "./auth/PrivateRoute";
import { Routes, Route } from "react-router-dom";
import {
  MemberDashboardPage,
  //Error
  NotFoundPage,
  //Auth
  LoginPage,
  SignupPage,
  // Provider
  AdminProviderListPage,
  AdminProviderEditPage,
  AdminProviderViewPage,
  // PTCycle
  AdminPTCycleListPage,
  AdminPTCycleEditPage,
  AdminPTCycleViewPage,
  // User
  AdminUserListPage,
  // Stage
  AdminStageListPage,
  // Status
  AdminStatusListPage,
  // Audit
  AdminAuditListPage,
  // Province
  AdminProvinceListPage,
  AdminProvinceEditPage,
  AdminProvinceViewPage,
  // District
  AdminDistrictListPage,
  AdminDistrictEditPage,
  AdminDistrictViewPage,
  // PTCycleStatus
  AdminPTCycleStatusListPage,
  AdminPTCycleStatusEditPage,
  AdminPTCycleStatusViewPage,
  // Scheme
  AdminSchemeListPage,
  AdminSchemeEditPage,
  AdminSchemeViewPage,
  // LabType
  AdminLabTypeListPage,
  AdminLabTypeEditPage,
  AdminLabTypeViewPage,
  // Laboratory
  AdminLaboratoryListPage,
  AdminLaboratoryEditPage,
  AdminLaboratoryViewPage,
  // Service
  AdminServiceListPage,
  AdminServiceEditPage,
  AdminServiceViewPage,
  // Method
  AdminMethodListPage,
  AdminMethodEditPage,
  AdminMethodViewPage,
  // MethodSample
  AdminMethodSampleListPage,
  AdminMethodSampleEditPage,
  AdminMethodSampleViewPage,
  // TBXpertUltraResult
  AdminTBXpertUltraResultListPage,
  AdminTBXpertUltraResultEditPage,
  AdminTBXpertUltraResultViewPage,
  // Enrollment
  AdminEnrollmentListPage,
  AdminEnrollmentEditPage,
  AdminEnrollmentViewPage,
  // Applications
  AdminApplicationsListPage,
  AdminApplicationsEditPage,
  AdminApplicationsViewPage,
  // Role
  AdminRoleListPage,
  AdminRoleEditPage,
  AdminRoleViewPage,
  FacilityEnrollmentListPage,
  FacilityTBXpertUltraResultListPage,
  FacilityTBXpertUltraResultEditPage,
  FacilityTBXpertUltraResultViewPage,

} from "./pages";
import { BrowserRouter } from "react-router-dom";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          {/* ADMIN */}
          {/* Provider */}
          <Route path="/admin/providers/list" element={<AdminProviderListPage/>} />
          <Route path="/admin/providers/edit/:eId" element={<AdminProviderEditPage/>} />
          <Route path="/admin/providers/add" element={<AdminProviderEditPage/>} />
          <Route path="/admin/providers/view/:eId" element={<AdminProviderViewPage/>} />
          {/* PT Cycle */}
          <Route path="/admin/pt-cycles/list" element={<AdminPTCycleListPage/>} />
          <Route path="/admin/pt-cycles/edit/:eId" element={<AdminPTCycleEditPage/>} />
          <Route path="/admin/pt-cycles/add" element={<AdminPTCycleEditPage/>} />
          <Route path="/admin/pt-cycles/view/:eId" element={<AdminPTCycleViewPage/>} />
          {/* User */}
          <Route path="/admin/user/list" element={<AdminUserListPage/>} />
          {/* Stage */}
          <Route path="/admin/stages/list" element={<AdminStageListPage/>} />
          {/* Status */}
          <Route path="/admin/statuses/list" element={<AdminStatusListPage/>} />
          {/* Audit */}
          <Route path="/admin/audit/list" element={<AdminAuditListPage/>} />
          {/* Province */}
          <Route path="/admin/provinces/list" element={<AdminProvinceListPage/>} />
          <Route path="/admin/provinces/edit/:eId" element={<AdminProvinceEditPage/>} />
          <Route path="/admin/provinces/add" element={<AdminProvinceEditPage/>} />
          <Route path="/admin/provinces/view/:eId" element={<AdminProvinceViewPage/>} />
          {/* District */}
          <Route path="/admin/districts/list" element={<AdminDistrictListPage/>} />
          <Route path="/admin/districts/edit/:eId" element={<AdminDistrictEditPage/>} />
          <Route path="/admin/districts/add" element={<AdminDistrictEditPage/>} />
          <Route path="/admin/districts/view/:eId" element={<AdminDistrictViewPage/>} />
          {/* PT Cycle Status */}
          <Route path="/admin/pt-cycle-statuses/list" element={<AdminPTCycleStatusListPage/>} />
          <Route path="/admin/pt-cycle-statuses/edit/:eId" element={<AdminPTCycleStatusEditPage/>} />
          <Route path="/admin/pt-cycle-statuses/add" element={<AdminPTCycleStatusEditPage/>} />
          <Route path="/admin/pt-cycle-statuses/view/:eId" element={<AdminPTCycleStatusViewPage/>} />
          {/* Scheme */}
          <Route path="/admin/schemes/list" element={<AdminSchemeListPage/>} />
          <Route path="/admin/schemes/edit/:eId" element={<AdminSchemeEditPage/>} />
          <Route path="/admin/schemes/add" element={<AdminSchemeEditPage/>} />
          <Route path="/admin/schemes/view/:eId" element={<AdminSchemeViewPage/>} />
          {/* Lab Type */}
          <Route path="/admin/lab-types/list" element={<AdminLabTypeListPage/>} />
          <Route path="/admin/lab-types/edit/:eId" element={<AdminLabTypeEditPage/>} />
          <Route path="/admin/lab-types/add" element={<AdminLabTypeEditPage/>} />
          <Route path="/admin/lab-types/view/:eId" element={<AdminLabTypeViewPage/>} />
          {/* Laboratory */}
          <Route path="/admin/laboratorys/list" element={<AdminLaboratoryListPage/>} />
          <Route path="/admin/laboratorys/edit/:eId" element={<AdminLaboratoryEditPage/>} />
          <Route path="/admin/laboratorys/add" element={<AdminLaboratoryEditPage/>} />
          <Route path="/admin/laboratorys/view/:eId" element={<AdminLaboratoryViewPage/>} />
          {/* Service */}
          <Route path="/admin/services/list" element={<AdminServiceListPage/>} />
          <Route path="/admin/services/edit/:eId" element={<AdminServiceEditPage/>} />
          <Route path="/admin/services/add" element={<AdminServiceEditPage/>} />
          <Route path="/admin/services/view/:eId" element={<AdminServiceViewPage/>} />
          {/* Method */}
          <Route path="/admin/methods/list" element={<AdminMethodListPage/>} />
          <Route path="/admin/methods/edit/:eId" element={<AdminMethodEditPage/>} />
          <Route path="/admin/methods/add" element={<AdminMethodEditPage/>} />
          <Route path="/admin/methods/view/:eId" element={<AdminMethodViewPage/>} />
          {/* Method Sample */}
          <Route path="/admin/method-samples/list" element={<AdminMethodSampleListPage/>} />
          <Route path="/admin/method-samples/edit/:eId" element={<AdminMethodSampleEditPage/>} />
          <Route path="/admin/method-samples/add" element={<AdminMethodSampleEditPage/>} />
          <Route path="/admin/method-samples/view/:eId" element={<AdminMethodSampleViewPage/>} />
          {/* TB Xpert Ultra Result */}
          <Route path="/admin/tb-xpert-ultra-results/list" element={<AdminTBXpertUltraResultListPage/>} />
          <Route path="/admin/tb-xpert-ultra-results/edit/:eId" element={<AdminTBXpertUltraResultEditPage/>} />
          <Route path="/admin/tb-xpert-ultra-results/add" element={<AdminTBXpertUltraResultEditPage/>} />
          <Route path="/admin/tb-xpert-ultra-results/view/:eId" element={<AdminTBXpertUltraResultViewPage/>} />
          {/* Enrollment */}
          <Route path="/admin/enrollments/list" element={<AdminEnrollmentListPage/>} />
          <Route path="/admin/enrollments/edit/:eId" element={<AdminEnrollmentEditPage/>} />
          <Route path="/admin/enrollments/add" element={<AdminEnrollmentEditPage/>} />
          <Route path="/admin/enrollments/view/:eId" element={<AdminEnrollmentViewPage/>} />
          {/* Application */}
          <Route path="/admin/applications/list" element={<AdminApplicationsListPage/>} />
          <Route path="/admin/applications/edit/:eId" element={<AdminApplicationsEditPage/>} />
          <Route path="/admin/applications/add" element={<AdminApplicationsEditPage/>} />
          <Route path="/admin/applications/view/:eId" element={<AdminApplicationsViewPage/>} />
          {/* Role */}
          <Route path="/admin/role/list" element={<AdminRoleListPage/>} />
          <Route path="/admin/role/edit/:eId" element={<AdminRoleEditPage/>} />
          <Route path="/admin/role/add" element={<AdminRoleEditPage/>} />
          <Route path="/admin/role/view/:eId" element={<AdminRoleViewPage/>} />
          {/* Dashboards */}
          <Route path="/" element={<MemberDashboardPage></MemberDashboardPage>} />

         {/* facility Enrollment */}
          <Route path="/facility/enrollments/list" element={<FacilityEnrollmentListPage/>} />

         {/* facility TB Xpert Ultra Result */}
          <Route path="/facility/tb-xpert-ultra-results/list" element={<FacilityTBXpertUltraResultListPage/>} />
          <Route path="/facility/tb-xpert-ultra-results/edit/:eId" element={<FacilityTBXpertUltraResultEditPage/>} />
          <Route path="/facility/tb-xpert-ultra-results/add" element={<FacilityTBXpertUltraResultEditPage/>} />
          <Route path="/facility/tb-xpert-ultra-results/view/:eId" element={<FacilityTBXpertUltraResultViewPage/>} />

          {/* Error */}   
          <Route path="*" element={<NotFoundPage></NotFoundPage>} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage></LoginPage>} />
          <Route path="/signup" element={<SignupPage></SignupPage>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;