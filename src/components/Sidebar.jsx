import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccess } from "../config/pagePermissions";
import { getMyMembership } from "../api/membershipApi";
import { useSidebarContext } from "../context/useSidebarContext";
import logo from "/src/assets/images/logo/logo.png";
import {
  IconBarbell, IconCalendar, IconCalendarEvent, IconChartBar, IconCrown,
  IconEscalatorDown, IconFingerprint, IconId, IconLayoutDashboard,
  IconMessageHeart, IconTargetArrow, IconUserStar, IconUsers, IconReceipt2,
  IconBox, IconReportAnalytics, IconSettings, IconBuildingCommunity,
  IconHeartRateMonitor, IconTrophy, IconX, IconUserCheck, IconUserOff,
  IconSnowflake, IconRefresh, IconChartPie, IconGift, IconSparkles,
  IconInbox, IconUserPlus, IconPhone, IconBriefcase, IconRobot,
  IconFileAnalytics, IconBuilding, IconAutomation, IconCreditCard,
  IconShieldCheck, IconClipboardList, IconTimeline, IconMapPin,
  IconStar, IconChevronRight, IconBolt, IconAward,
  IconUsersGroup, IconCalendarStats, IconMoodSmile,
  IconAddressBook, IconGitBranch, IconDoorEnter
} from "@tabler/icons-react";

const menuPaths = {
  Dashboards:           { index: 0,  paths: ["/"] },
  Leads:                { index: 14, paths: ["/leads", "/leads/dashboard", "/leads/ai", "/leads/inbox", "/leads/walkin", "/leads/trials", "/leads/followup", "/leads/pipeline", "/leads/campaigns", "/leads/team", "/leads/referral", "/leads/corporate", "/leads/automation", "/leads/reports", "/leads/settings"] },
  Members:              { index: 11, paths: ["/users", "/renewals"] },
  Attendance:           { index: 10, paths: ["/attendance"] },
  Workout:              { index: 2,  paths: ["/workout-type", "/body-part", "/exercise-master", "/workout-plan", "/workout-detail", "/create-workout", "/workout-summary"] },
  DietPlan:             { index: 3,  paths: ["/dietplan", "/diet-detail"] },
  Billing:              { index: 15, paths: ["/billing", "/membership-plans"] },
  Inventory:            { index: 16, paths: ["/inventory"] },
  Reports:              { index: 17, paths: ["/reports"] },
  Settings:             { index: 1,  paths: ["/employees", "/headoffice", "/branches", "/departments", "/designations", "/teams", "/role-permissions"] },
  Goals:                { index: 5,  paths: ["/goals"] },
  Progress:             { index: 6,  paths: ["/progress"] },
  Profile:              { index: 7,  paths: ["/profile"] },
  Step:                 { index: 9,  paths: ["/onboding-step"] },
  "Wellness Chat":      { index: 12, paths: ["/wellness-chat"] },
  Subscription:         { index: 13, paths: ["/membership"] },
  "Corporate Wellness": { index: 18, paths: ["/corporate", "/corporate/add", "/corporate/bmi", "/corporate/challenges", "/corporate/reports"] },
};

// ── Menu section color themes ─────────────────────────────────────────────────
const SECTION_COLORS = {
  0:  { from: "#6366f1", to: "#8b5cf6" },   // Dashboard — indigo/violet
  14: { from: "#f59e0b", to: "#ef4444" },   // Leads     — amber/red
  11: { from: "#10b981", to: "#059669" },   // Members   — emerald
  10: { from: "#3b82f6", to: "#6366f1" },   // Attendance — blue/indigo
  2:  { from: "#f97316", to: "#ef4444" },   // Workout   — orange/red
  3:  { from: "#22c55e", to: "#10b981" },   // Diet      — green
  15: { from: "#8b5cf6", to: "#ec4899" },   // Billing   — purple/pink
  16: { from: "#06b6d4", to: "#3b82f6" },   // Inventory — cyan/blue
  17: { from: "#f59e0b", to: "#f97316" },   // Reports   — amber/orange
  18: { from: "#0ea5e9", to: "#6366f1" },   // Corporate — sky/indigo
  1:  { from: "#64748b", to: "#475569" },   // Settings  — slate
};

export default function Sidebar() {
  const location  = useLocation();
  const [activeIndex, setActiveIndex] = useState(null);
  const { permissionMap, user } = useAuth();
  const { isOpen, closeSidebar } = useSidebarContext();
  const role         = String(user?.role || "").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin      = role === "ADMIN";
  const isManager    = role === "MANAGER";
  const isStaff      = isSuperAdmin || isAdmin || isManager;
  const isCorporateHr = role === "CORPORATE_HR";
  const isMember     = role === "USER";
  const canUseWellnessChat =
    isMember || role === "TRAINER" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "MANAGER";
  const [isPremium, setIsPremium] = useState(true);

  // Flyout state
  const [flyout, setFlyout] = useState(null); // { index, title, items, color }
  const sidebarRef = useRef(null);
  const flyoutRef  = useRef(null);

  useEffect(() => {
    if (!isMember) return undefined;
    let active = true;
    const refresh = () => {
      getMyMembership()
        .then((m) => {
          const code    = String(m?.plan || "").toUpperCase();
          const topTier = code === "PREMIUM" || m?.unlimitedAccess === true || Boolean(m?.premium);
          if (active) setIsPremium(topTier);
        })
        .catch(() => { if (active) setIsPremium(false); });
    };
    refresh();
    window.addEventListener("membership:updated", refresh);
    return () => { active = false; window.removeEventListener("membership:updated", refresh); };
  }, [isMember]);

  useEffect(() => {
    const currentPath = location.pathname;
    const cat = Object.keys(menuPaths).find((k) => menuPaths[k].paths.includes(currentPath));
    setActiveIndex(cat ? menuPaths[cat].index : null);
  }, [location.pathname]);

  useEffect(() => { setFlyout(null); }, [location.pathname]);

  const canView = (pageKey) => canAccess(permissionMap, pageKey, "view");

  // ── Visible item lists ────────────────────────────────────────────────────────
  const visibleSettingsItems = [
    { key: "employees",             label: "Employees",              path: "/employees" },
    { key: "trainer-duty-schedule", label: "Trainer Duty Schedule",  path: "/trainer-duty-schedule" },
    { key: "user-workout-schedule", label: "User Workout Schedule",  path: "/user-workout-schedule" },
    { key: "headoffice",            label: "Head Office",            path: "/headoffice", section: true },
    { key: "branches",              label: "Branches",               path: "/branches" },
    { key: "departments",           label: "Departments",            path: "/departments" },
    { key: "designations",          label: "Designations",           path: "/designations" },
    { key: "teams",                 label: "Teams",                  path: "/teams" },
    { key: "role-permissions",      label: "Role Permissions",       path: "/role-permissions" },
  ].filter((i) => canView(i.key));

  const visibleWorkoutItems = [
    { key: "workout-type",    label: "Workout Types",     path: "/workout-type",    icon: <IconBolt size={16} />,          color: "#f97316" },
    { key: "body-part",       label: "Body Parts",        path: "/body-part",       icon: <IconUserStar size={16} />,      color: "#8b5cf6" },
    { key: "exercise-master", label: "Exercise Master",   path: "/exercise-master", icon: <IconBarbell size={16} />,       color: "#ef4444" },
    { key: "workout-plan",    label: "Workout Plans",     path: "/workout-plan",    icon: <IconClipboardList size={16} />, color: "#10b981" },
    { key: "workout-detail",  label: "Workout Detail",    path: "/workout-detail",  icon: <IconFileAnalytics size={16} />, color: "#3b82f6" },
  ].filter((i) => canView(i.key));

  const visibleDietItems = [
    { key: "dietplan",    label: "Diet Menu",    path: "/dietplan",    icon: <IconMoodSmile size={16} />, color: "#22c55e" },
    { key: "diet-detail", label: "Diet Detail",  path: "/diet-detail", icon: <IconFileAnalytics size={16} />, color: "#10b981" },
  ].filter((i) => canView(i.key) && (i.key !== "diet-detail" || isMember));

  const visibleScheduleItems = [
    { key: "trainer-duty-schedule", label: "Trainer Duty",    path: "/trainer-duty-schedule", icon: <IconCalendarStats size={16} />, color: "#6366f1" },
    { key: "user-workout-schedule", label: "User Schedule",   path: "/user-workout-schedule", icon: <IconCalendar size={16} />,      color: "#8b5cf6" },
    { key: "my-schedule",           label: "My Schedule",     path: "/my-schedule",           icon: <IconCalendarEvent size={16} />, color: "#f59e0b" },
  ].filter((i) => canView(i.key) && (i.key !== "my-schedule" || isMember));

  const showSettings  = visibleSettingsItems.length > 0;
  const showWorkout   = visibleWorkoutItems.length > 0;
  const showDiet      = visibleDietItems.length > 0;
  const showCalendar  = visibleScheduleItems.length > 0;
  const showGoals     = canView("goals");
  const showProgress  = canView("progress");
  const showAttendance = canView("attendance");
  const showMembershipPlans = canView("membership-plans");
  const showUsers     = canView("users");
  const showMembership = showMembershipPlans || showUsers;
  const showWellnessChat = canView("wellness-chat") && canUseWellnessChat;
  const showProfile   = canView("profile");

  // ── Pre-built submenu item lists with icons ───────────────────────────────────
  const membersItems = [
    { key: "all",      label: "All Members",        path: "/users?filter=all",      icon: <IconUsers size={16} />,      color: "#10b981" },
    { key: "active",   label: "Active Members",     path: "/users?filter=active",   icon: <IconUserCheck size={16} />,  color: "#22c55e" },
    { key: "expired",  label: "Expired Members",    path: "/users?filter=expired",  icon: <IconUserOff size={16} />,    color: "#ef4444" },
    { key: "freeze",   label: "Freeze Members",     path: "/users?filter=freeze",   icon: <IconSnowflake size={16} />,  color: "#3b82f6" },
    { key: "renewals", label: "Renewal Management", path: "/renewals",              icon: <IconRefresh size={16} />,    color: "#8b5cf6" },
    { key: "churn",    label: "Churn Dashboard",    path: "/churn",                 icon: <IconChartPie size={16} />,   color: "#f59e0b" },
    { key: "referrals",label: "Referrals",          path: "/users?filter=referrals",icon: <IconGift size={16} />,       color: "#ec4899" },
  ];

  const leadsItems = [
    { key: "dashboard",  label: "Dashboard",          path: "/leads/dashboard", icon: <IconLayoutDashboard size={16} />, color: "#6366f1" },
    { key: "ai",         label: "AI Features",         path: "/leads/ai",        icon: <IconSparkles size={16} />,        color: "#f59e0b" },
    { key: "inbox",      label: "Lead Inbox",          path: "/leads/inbox",     icon: <IconInbox size={16} />,           color: "#3b82f6" },
    { key: "walkin",     label: "Walk-in Register",    path: "/leads/walkin",    icon: <IconUserPlus size={16} />,        color: "#10b981" },
    { key: "trials",     label: "Trial Members",       path: "/leads/trials",    icon: <IconCalendarEvent size={16} />,   color: "#8b5cf6" },
    { key: "followup",   label: "Follow-up Calendar",  path: "/leads/followup",  icon: <IconPhone size={16} />,           color: "#06b6d4" },
    { key: "pipeline",   label: "Sales Pipeline",      path: "/leads/pipeline",  icon: <IconTimeline size={16} />,        color: "#f97316" },
    { key: "campaigns",  label: "Campaign Management", path: "/leads/campaigns", icon: <IconBriefcase size={16} />,       color: "#ec4899" },
    { key: "team",       label: "Sales Team",          path: "/leads/team",      icon: <IconUsersGroup size={16} />,      color: "#22c55e" },
    { key: "referral",   label: "Referral Program",    path: "/leads/referral",  icon: <IconGift size={16} />,            color: "#a855f7" },
    { key: "corporate",  label: "Corporate Leads",     path: "/leads/corporate", icon: <IconBuilding size={16} />,        color: "#0ea5e9" },
    { key: "automation", label: "Automation",          path: "/leads/automation",icon: <IconRobot size={16} />,           color: "#64748b" },
    { key: "reports",    label: "Reports",             path: "/leads/reports",   icon: <IconFileAnalytics size={16} />,   color: "#f59e0b" },
    { key: "settings",   label: "Settings",            path: "/leads/settings",  icon: <IconSettings size={16} />,        color: "#94a3b8" },
  ];

  const billingItems = [
    canView("membership-plans") && { key: "plans",   label: "Membership Plans",  path: "/membership-plans", icon: <IconCreditCard size={16} />, color: "#8b5cf6" },
    canView("billing")          && { key: "billing",  label: "Billing Dashboard", path: "/billing",          icon: <IconChartBar size={16} />,   color: "#ec4899" },
  ].filter(Boolean);

  const corporateItems = [
    { key: "dashboard", label: "Dashboard",     path: "/corporate",            icon: <IconLayoutDashboard size={16} />, color: "#0ea5e9" },
    canView("corporate-dashboard")  && { key: "add",        label: "Add Corporate", path: "/corporate/add",        icon: <IconBuilding size={16} />,        color: "#6366f1" },
    canView("corporate-bmi")        && { key: "bmi",        label: "BMI Tracking",  path: "/corporate/bmi",        icon: <IconHeartRateMonitor size={16} />, color: "#ef4444" },
    canView("corporate-challenges") && { key: "challenges", label: "Challenges",    path: "/corporate/challenges", icon: <IconTrophy size={16} />,           color: "#f59e0b" },
    canView("corporate-reports")    && { key: "reports",    label: "Reports",       path: "/corporate/reports",    icon: <IconFileAnalytics size={16} />,    color: "#10b981" },
  ].filter(Boolean);

  const settingsItems = [
    visibleSettingsItems.some((i) => i.key === "employees")             && { key: "employees",             label: "Employees",              path: "/employees",             icon: <IconUsersGroup size={16} />,     color: "#10b981" },
    visibleSettingsItems.some((i) => i.key === "trainer-duty-schedule") && { key: "trainer-duty-schedule", label: "Trainer Duty Schedule",  path: "/trainer-duty-schedule", icon: <IconCalendarStats size={16} />,  color: "#6366f1" },
    { key: "trainer-performance",                                            label: "Trainer Performance",      path: "/trainer-performance",   icon: <IconAward size={16} />,          color: "#f59e0b" },
    visibleSettingsItems.some((i) => i.key === "user-workout-schedule") && { key: "user-workout-schedule", label: "User Workout Schedule",  path: "/user-workout-schedule", icon: <IconCalendar size={16} />,        color: "#8b5cf6" },
    visibleSettingsItems.some((i) => i.key === "headoffice")            && { key: "headoffice",            label: "Head Office",            path: "/headoffice",            icon: <IconBuilding size={16} />,        color: "#0ea5e9" },
    visibleSettingsItems.some((i) => i.key === "branches")              && { key: "branches",              label: "Branches",               path: "/branches",              icon: <IconMapPin size={16} />,          color: "#f97316" },
    visibleSettingsItems.some((i) => i.key === "departments")           && { key: "departments",           label: "Departments",            path: "/departments",           icon: <IconBriefcase size={16} />,       color: "#ec4899" },
    visibleSettingsItems.some((i) => i.key === "designations")          && { key: "designations",          label: "Designations",           path: "/designations",          icon: <IconStar size={16} />,            color: "#a855f7" },
    visibleSettingsItems.some((i) => i.key === "teams")                 && { key: "teams",                 label: "Teams",                  path: "/teams",                 icon: <IconUsers size={16} />,           color: "#22c55e" },
    visibleSettingsItems.some((i) => i.key === "role-permissions")      && { key: "role-permissions",      label: "Role Permissions",       path: "/role-permissions",      icon: <IconShieldCheck size={16} />,     color: "#ef4444" },
  ].filter(Boolean);

  const membershipItems = [
    showMembershipPlans && { key: "plans",   label: "Membership Plans", path: "/membership-plans", icon: <IconCreditCard size={16} />,  color: "#8b5cf6" },
    showUsers           && { key: "members", label: "Members",          path: "/users",            icon: <IconUsers size={16} />,       color: "#10b981" },
  ].filter(Boolean);

  // ── Flyout open/close ─────────────────────────────────────────────────────────
  const openFlyout = (e, index, title, items) => {
    e.stopPropagation();
    if (flyout && flyout.index === index) { setFlyout(null); return; }
    const color = SECTION_COLORS[index] || { from: "#6366f1", to: "#8b5cf6" };
    setFlyout({ index, title, items, color });
    setActiveIndex(index);
  };
  const closeFlyout = () => setFlyout(null);

  useEffect(() => {
    if (!flyout) return undefined;
    const handleOutside = (e) => {
      if (
        sidebarRef.current && !sidebarRef.current.contains(e.target) &&
        flyoutRef.current  && !flyoutRef.current.contains(e.target)
      ) setFlyout(null);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [flyout]);

  // ── Rail item components ──────────────────────────────────────────────────────
  const DirectItem = ({ index, title, icon, to }) => (
    <li
      className={`sidebar-rail-item ${activeIndex === index ? "active" : ""}`}
      title={title}
      onClick={() => { setActiveIndex(index); closeFlyout(); }}
    >
      <Link to={to}>
        <span className="rail-icon">{icon}</span>
      </Link>
    </li>
  );

  const FlyoutItem = ({ index, title, icon, items }) => (
    <li
      className={`sidebar-rail-item ${activeIndex === index ? "active" : ""} ${flyout?.index === index ? "flyout-open" : ""}`}
      title={title}
      onClick={(e) => openFlyout(e, index, title, items)}
    >
      <span className="rail-icon">{icon}</span>
      <span className="rail-chevron"><IconChevronRight size={10} /></span>
    </li>
  );

  return (
    <>
      {/* ── Narrow Icon Rail ────────────────────────────────────────────────── */}
      <aside className={`sidebar-rail ${isOpen ? 'mobile-open' : ''}`} ref={sidebarRef}>
        <div className="rail-logo">
          <Link to="/"><img src={logo} alt="FitNexus" /></Link>
        </div>

        <nav className="rail-nav custom-scroll">
          <ul className="rail-list">
            {user?.role === "COUNSELOR" || (isStaff && location.pathname.startsWith("/sales-portal")) ? (
                <>
                  <DirectItem index={100} title="CRM Dashboard" icon={<IconLayoutDashboard />} to="/sales-portal" />
                  <DirectItem index={101} title="Lead Registry" icon={<IconAddressBook />} to="/sales-portal/leads" />
                  <DirectItem index={102} title="Follow-up Calendar" icon={<IconCalendarEvent />} to="/sales-portal/followup" />
                  <DirectItem index={103} title="Sales Pipeline" icon={<IconGitBranch />} to="/sales-portal/pipeline" />
                  <DirectItem index={104} title="Walk-in Register" icon={<IconDoorEnter />} to="/sales-portal/walkin" />
                  <DirectItem index={105} title="Trial Members" icon={<IconUsers />} to="/sales-portal/trial" />
                </>
            ) : isStaff ? (
              <>
                <DirectItem index={0}  title="Dashboard"         icon={<IconLayoutDashboard />} to="/" />
                {canView("leads") && (
                  <FlyoutItem index={14} title="Leads CRM"       icon={<IconUserStar />}        items={leadsItems} />
                )}
                {canView("users") && (
                  <FlyoutItem index={11} title="Members"         icon={<IconUsers />}           items={membersItems} />
                )}
                {canView("attendance") && (
                  <DirectItem index={10} title="Attendance"      icon={<IconFingerprint />}     to="/attendance" />
                )}
                {showWorkout && (
                  <FlyoutItem index={2}  title="Workout"         icon={<IconBarbell />}         items={visibleWorkoutItems} />
                )}
                {showDiet && (
                  <FlyoutItem index={3}  title="Diet"            icon={<IconCalendar />}        items={visibleDietItems} />
                )}
                {(canView("billing") || canView("membership-plans")) && (
                  <FlyoutItem index={15} title="Billing"         icon={<IconReceipt2 />}        items={billingItems} />
                )}
                {canView("inventory") && (
                  <DirectItem index={16} title="Inventory"       icon={<IconBox />}             to="/inventory" />
                )}
                {canView("reports") && (
                  <DirectItem index={17} title="Reports"         icon={<IconReportAnalytics />} to="/reports" />
                )}
                {canView("corporate-dashboard") && (
                  <FlyoutItem index={18} title="Corporate"       icon={<IconBuildingCommunity />} items={corporateItems} />
                )}
                {showSettings && (
                  <FlyoutItem index={1}  title="Settings"        icon={<IconSettings />}        items={settingsItems} />
                )}
              </>
            ) : isCorporateHr ? (
              <>
                <DirectItem index={0}  title="Dashboard"         icon={<IconLayoutDashboard />} to="/hr-portal" />
                <DirectItem index={11} title="Employees"         icon={<IconUsers />}           to="/corporate/employees" />
                <DirectItem index={12} title="BMI Tracking"      icon={<IconHeartRateMonitor />}to="/corporate/bmi" />
                <DirectItem index={13} title="Challenges"        icon={<IconTrophy />}          to="/corporate/challenges" />
                <DirectItem index={15} title="Billing"           icon={<IconReceipt2 />}        to="/corporate/billing" />
                <DirectItem index={17} title="Reports"           icon={<IconReportAnalytics />} to="/corporate/reports" />
              </>
            ) : (
              <>
                <DirectItem index={0}  title="Overview"          icon={<IconLayoutDashboard />} to="/" />
                {showWorkout && (
                  <FlyoutItem index={2}  title="Workout"         icon={<IconBarbell />}         items={visibleWorkoutItems} />
                )}
                {showDiet && (
                  <FlyoutItem index={3}  title="Nutrition Plans" icon={<IconCalendar />}        items={visibleDietItems} />
                )}
                {showCalendar && (
                  <FlyoutItem index={4}  title="Schedule"        icon={<IconCalendarEvent />}   items={visibleScheduleItems} />
                )}
                {showGoals && (
                  <DirectItem index={5}  title="Goals"           icon={<IconTargetArrow />}     to="/goals" />
                )}
                {showProgress && (
                  <DirectItem index={6}  title="Progress"        icon={<IconChartBar />}        to="/progress" />
                )}
                {showAttendance && (
                  <DirectItem index={10} title="Attendance"      icon={<IconFingerprint />}     to="/attendance" />
                )}
                {showMembership && (
                  <FlyoutItem index={11} title="Membership"      icon={<IconId />}              items={membershipItems} />
                )}
                {showWellnessChat && (
                  <DirectItem index={12} title="Wellness Chat"   icon={<IconMessageHeart />}    to="/wellness-chat" />
                )}
                {isMember && (
                  <DirectItem index={13} title="Subscription"    icon={<IconCrown />}           to="/membership" />
                )}
                {showProfile && (
                  <DirectItem index={7}  title="Profile"         icon={<IconLayoutDashboard />} to="/profile" />
                )}
                {canView("onboding-step") && (
                  <DirectItem index={9}  title="Step"            icon={<IconEscalatorDown />}   to="/onboding-step" />
                )}
              </>
            )}
          </ul>
        </nav>

        {isMember && !isPremium && (
          <div className="rail-upgrade">
            <Link to="/membership" title="Upgrade to Premium"><IconCrown /></Link>
          </div>
        )}
      </aside>

      {/* ── Flyout Submenu Panel ───────────────────────────────────────────── */}
      {flyout && (
        <>
          <div className="flyout-backdrop" onClick={closeFlyout} />

          <div
            className="sidebar-flyout-panel"
            ref={flyoutRef}
            style={{
              "--flyout-from": flyout.color.from,
              "--flyout-to":   flyout.color.to,
            }}
          >
            {/* Gradient header */}
            <div className="flyout-panel-header">
              <div className="flyout-header-inner">
                <div className="flyout-header-dot" />
                <span className="flyout-panel-title">{flyout.title}</span>
              </div>
              <button className="flyout-panel-close" onClick={closeFlyout} aria-label="Close">
                <IconX size={14} />
              </button>
            </div>

            {/* Items */}
            <ul className="flyout-panel-list">
              {flyout.items.map((item, i) => {
                const isActive = location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "?");
                return (
                  <li
                    key={item.key || item.label}
                    className="flyout-item-wrap"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <Link
                      to={item.path}
                      className={`flyout-item ${isActive ? "active" : ""}`}
                      onClick={closeFlyout}
                    >
                      {item.icon && (
                        <span
                          className="flyout-item-icon"
                          style={{ "--item-color": item.color || "var(--flyout-from)" }}
                        >
                          {item.icon}
                        </span>
                      )}
                      <span className="flyout-item-label">{item.label}</span>
                      <span className="flyout-item-arrow">
                        <IconChevronRight size={13} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
