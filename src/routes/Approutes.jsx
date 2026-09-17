import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// Public Pages (kept eager — small, and the sign-in screen is the first paint)
import Signin from "../pages/auth/Signin";

// Lazily-loaded pages: each becomes its own JS chunk that only downloads when
// the route is visited, so heavy libs (charts, calendar, sliders) no longer
// load up front on the login screen.
const Signup = lazy(() => import("../pages/auth/Signup"));
const Forgotpassword = lazy(() => import("../pages/auth/Forgotpassword"));
const Newpassword = lazy(() => import("../pages/auth/Newpassword"));
const Verifyemail = lazy(() => import("../pages/auth/Verifyemail"));
const Verifypin = lazy(() => import("../pages/auth/Verifypin"));
const Landing = lazy(() => import("../pages/public/Landing"));
const Onbodingstep = lazy(() => import("../pages/public/Onbodingstep"));
const Errorpage = lazy(() => import("../pages/public/Errorpage"));
const LeadFeedback = lazy(() => import("../pages/public/LeadFeedback"));

const Index = lazy(() => import("../pages/dashboard/Index"));
const WorkoutTypeMaster = lazy(() => import("../pages/workout/WorkoutTypeMaster"));
const BodyPartMaster = lazy(() => import("../pages/workout/BodyPartMaster"));
const ExerciseMaster = lazy(() => import("../pages/workout/ExerciseMaster"));
const WorkoutPlanMaster = lazy(() => import("../pages/workout/WorkoutPlanMaster"));
const WorkoutPlanDetail = lazy(() => import("../pages/workout/WorkoutPlanDetail"));
const WorkoutDetail = lazy(() => import("../pages/workout/WorkoutDetail"));
const TrainerDutySchedule = lazy(() => import("../pages/schedule/TrainerDutySchedule"));
const UserWorkoutSchedule = lazy(() => import("../pages/schedule/UserWorkoutSchedule"));
const MySchedule = lazy(() => import("../pages/schedule/MySchedule"));
const Dietplan = lazy(() => import("../pages/diet/Dietplan"));
const Dietdetail = lazy(() => import("../pages/diet/Dietdetail"));
const Goals = lazy(() => import("../pages/goals/Goals"));
const Progress = lazy(() => import("../pages/progress/Progress"));
const Profile = lazy(() => import("../pages/profile/Profile"));

const Attendance = lazy(() => import("../pages/attendance/Attendance"));
const GateKiosk = lazy(() => import("../pages/attendance/GateKiosk"));
const Membership = lazy(() => import("../pages/membership/Membership"));
const MembershipPlans = lazy(() => import("../pages/membership/MembershipPlans"));
const WellnessChat = lazy(() => import("../pages/chat/WellnessChat"));

const User = lazy(() => import("../pages/usersmanagement/user"));
const HeadOffice = lazy(() => import("../pages/usersmanagement/headoffice"));
const Branch = lazy(() => import("../pages/usersmanagement/branch"));
const DepartmentPage = lazy(() => import("../pages/usersmanagement/department"));
const DesignationPage = lazy(() => import("../pages/usersmanagement/designation"));
const Team = lazy(() => import("../pages/usersmanagement/team"));
const RolePermissions = lazy(() => import("../pages/permissions/RolePermissions"));

const LeadsCRM = lazy(() => import("../pages/crm/LeadsCRM"));
const BillingDashboard = lazy(() => import("../pages/billing/BillingDashboard"));
const InventoryCRUD = lazy(() => import("../pages/inventory/InventoryCRUD"));
const ReportsDashboard = lazy(() => import("../pages/reports/ReportsDashboard"));
const RenewalManagement = lazy(() => import("../pages/membership/RenewalManagement"));
const ChurnDashboard = lazy(() => import("../pages/membership/ChurnDashboard"));
const TrainerPerformanceDashboard = lazy(() => import("../pages/staff/TrainerPerformanceDashboard"));
const Integrations = lazy(() => import("../pages/settings/Integrations"));

// Corporate Wellness
const CorporateDashboard = lazy(() => import("../pages/corporate/CorporateDashboard"));
const BmiTracking = lazy(() => import("../pages/corporate/BmiTracking"));
const CorporateChallenges = lazy(() => import("../pages/corporate/Challenges"));
const CorporateReports = lazy(() => import("../pages/corporate/CorporateReports"));
const AddCorporate = lazy(() => import("../pages/corporate/AddCorporate"));
const CorporateEmployees = lazy(() => import("../pages/corporate/CorporateEmployees"));
const CorporateAttendance = lazy(() => import("../pages/corporate/CorporateAttendance"));
const CorporateBilling = lazy(() => import("../pages/corporate/CorporateBilling"));

// Corporate Login & Layout
const CorporateLogin = lazy(() => import("../pages/auth/CorporateLogin"));
const CorporateLayout = lazy(() => import("../components/CorporateLayout"));

// Sales Team Login
const SalesLogin = lazy(() => import("../pages/auth/SalesLogin"));

// CRM pages (reused inside sales portal)
const CrmDashboard = lazy(() => import("../pages/crm/CrmDashboard"));
const LeadRegistry = lazy(() => import("../pages/crm/LeadRegistry"));
const FollowupCalendar = lazy(() => import("../pages/crm/FollowupCalendar"));
const SalesPipeline = lazy(() => import("../pages/crm/SalesPipeline"));
const WalkinRegister = lazy(() => import("../pages/crm/WalkinRegister"));
const TrialMembers = lazy(() => import("../pages/crm/TrialMembers"));

const Invoices = lazy(() => import("../pages/billing/Invoices"));
const Receipts = lazy(() => import("../pages/billing/Receipts"));
const TrainerPayments = lazy(() => import("../pages/billing/TrainerPayments"));
const Expenses = lazy(() => import("../pages/billing/Expenses"));

function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/sign-in" element={<Signin />} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/forgot-password" element={<Forgotpassword />} />
        <Route path="/new-password" element={<Newpassword />} />
        <Route path="/verify-email" element={<Verifyemail />} />
        <Route path="/verify-pin" element={<Verifypin />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/onboding-step" element={<Onbodingstep />} />
        <Route path="/error-page" element={<Errorpage />} />
        <Route path="/feedback/:id" element={<LeadFeedback />} />
        <Route path="/corporate-login" element={<CorporateLogin />} />
        <Route path="/sales-login"     element={<SalesLogin />} />

        {/* Dedicated Corporate HR Portal */}
        <Route path="/hr-portal" element={<CorporateLayout />}>
          <Route index element={<CorporateDashboard />} />
          <Route path="employees" element={<CorporateEmployees />} />
          <Route path="attendance" element={<CorporateAttendance />} />
          <Route path="bmi" element={<BmiTracking />} />
          <Route path="challenges" element={<CorporateChallenges />} />
          <Route path="billing" element={<CorporateBilling />} />
          <Route path="reports" element={<CorporateReports />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* ─── Sales Team CRM Portal ─────────────────────── */}
          <Route path="/sales-portal">
            <Route index                   element={<CrmDashboard />} />
            <Route path="leads"            element={<LeadRegistry />} />
            <Route path="followup"         element={<FollowupCalendar />} />
            <Route path="pipeline"         element={<SalesPipeline />} />
            <Route path="walkin"           element={<WalkinRegister />} />
            <Route path="trial"            element={<TrialMembers />} />
          </Route>
          
          <Route path="/" element={<Index />} />
          {/* Legacy/template workout pages superseded by the master pages below — redirect. */}
          <Route path="/workout-filter" element={<Navigate to="/exercise-master" replace />} />
          <Route path="/workout-topfilter" element={<Navigate to="/exercise-master" replace />} />
          <Route path="/upperbody-workout" element={<Navigate to="/exercise-master" replace />} />
          <Route path="/create-workout" element={<Navigate to="/workout-plan" replace />} />
          <Route path="/workout-summary" element={<Navigate to="/workout-plan" replace />} />
          <Route path="/workout-type" element={<WorkoutTypeMaster />} />
          <Route path="/body-part" element={<BodyPartMaster />} />
          <Route path="/exercise-master" element={<ExerciseMaster />} />
          <Route path="/workout-plan" element={<WorkoutPlanMaster />} />
          <Route path="/workout-plan/:id" element={<WorkoutPlanDetail />} />
          <Route path="/workout-detail" element={<WorkoutDetail />} />
          <Route path="/workout-detail/:id" element={<WorkoutDetail />} />
          <Route path="/trainer-duty-schedule" element={<TrainerDutySchedule />} />
          <Route path="/user-workout-schedule" element={<UserWorkoutSchedule />} />
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/dietplan" element={<Dietplan />} />
          <Route path="/diet-detail" element={<Dietdetail />} />
          <Route path="/diet-detail/:id" element={<Dietdetail />} />
          <Route path="/goals" element={<Goals />} />
          {/* Old static calendar page superseded by My Schedule — redirect. */}
          <Route path="/schedule" element={<Navigate to="/my-schedule" replace />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/attendance/kiosk" element={<GateKiosk />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/membership-plans" element={<MembershipPlans />} />
          <Route path="/wellness-chat" element={<WellnessChat />} />

          {/* CRM, Billing, Inventory, Reports */}
          <Route path="/leads/*" element={<LeadsCRM />} />
          <Route path="/billing" element={<BillingDashboard />} />
          <Route path="/inventory" element={<InventoryCRUD />} />
          <Route path="/reports" element={<ReportsDashboard />} />
          <Route path="/renewals" element={<RenewalManagement />} />
          <Route path="/churn" element={<ChurnDashboard />} />
          <Route path="/trainer-performance" element={<TrainerPerformanceDashboard />} />
          <Route path="/integrations" element={<Integrations />} />

          {/* Users Management */}
          <Route path="/employees" element={<User />} />
          <Route path="/users" element={<User />} />
          <Route path="/headoffice" element={<HeadOffice />} />
          <Route path="/branches" element={<Branch />} />
          <Route path="/departments" element={<DepartmentPage />} />
          <Route path="/designations" element={<DesignationPage />} />
          <Route path="/teams" element={<Team />} />
          <Route path="/role-permissions" element={<RolePermissions />} />

          {/* Corporate Wellness */}
          <Route path="/corporate" element={<CorporateDashboard />} />
          <Route path="/corporate/add" element={<AddCorporate />} />
          <Route path="/corporate/bmi" element={<BmiTracking />} />
          <Route path="/corporate/challenges" element={<CorporateChallenges />} />
          <Route path="/corporate/reports" element={<CorporateReports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/error-page" replace />} />
      </Routes>
    </Suspense>
  );
}
