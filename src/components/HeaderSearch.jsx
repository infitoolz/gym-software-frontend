import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import {
  IconSearch,
  IconX,
  IconChevronRight,
  IconArrowRight,
  IconCornerDownLeft,
  IconLayoutDashboard,
  IconSettings,
  IconTargetArrow,
  IconChartBar,
  IconMessageHeart,
  IconUsers,
  IconUserCheck,
  IconUserOff,
  IconSnowflake,
  IconRefresh,
  IconChartPie,
  IconGift,
  IconClipboardList,
  IconBarbell,
  IconBolt,
  IconUserStar,
  IconFileAnalytics,
  IconMoodSmile,
  IconChefHat,
  IconCalendarEvent,
  IconCalendarStats,
  IconCalendar,
  IconFingerprint,
  IconDoorEnter,
  IconReceipt2,
  IconCreditCard,
  IconCrown,
  IconInbox,
  IconUserPlus,
  IconPhone,
  IconTimeline,
  IconBriefcase,
  IconUsersGroup,
  IconBuilding,
  IconRobot,
  IconSparkles,
  IconAward,
  IconMapPin,
  IconStar,
  IconShieldCheck,
  IconBuildingCommunity,
  IconHeartRateMonitor,
  IconTrophy,
  IconReportAnalytics,
  IconBox,
  IconMoon,
  IconSun,
  IconLogout,
} from "@tabler/icons-react";

// Icon components mapping
const ICONS = {
  IconLayoutDashboard,
  IconSettings,
  IconTargetArrow,
  IconChartBar,
  IconMessageHeart,
  IconUsers,
  IconUserCheck,
  IconUserOff,
  IconSnowflake,
  IconRefresh,
  IconChartPie,
  IconGift,
  IconClipboardList,
  IconBarbell,
  IconBolt,
  IconUserStar,
  IconFileAnalytics,
  IconMoodSmile,
  IconChefHat,
  IconCalendarEvent,
  IconCalendarStats,
  IconCalendar,
  IconFingerprint,
  IconDoorEnter,
  IconReceipt2,
  IconCreditCard,
  IconCrown,
  IconInbox,
  IconUserPlus,
  IconPhone,
  IconTimeline,
  IconBriefcase,
  IconUsersGroup,
  IconBuilding,
  IconRobot,
  IconSparkles,
  IconAward,
  IconMapPin,
  IconStar,
  IconShieldCheck,
  IconBuildingCommunity,
  IconHeartRateMonitor,
  IconTrophy,
  IconReportAnalytics,
  IconBox,
  IconMoon,
  IconSun,
  IconLogout,
};

// Comprehensive search catalog across the entire Fitnexa platform
const SEARCH_ITEMS = [
  // ── Core & Personal ──
  {
    id: "dashboard",
    title: "Dashboard Overview",
    category: "Core",
    path: "/",
    keywords: ["home", "stats", "overview", "analytics", "metrics", "kpi", "dashboard"],
    icon: "IconLayoutDashboard",
    color: "#0066ff",
  },
  {
    id: "profile",
    title: "Profile & Account Settings",
    category: "Account",
    path: "/profile",
    keywords: ["profile", "settings", "password", "account", "user", "personal info", "security"],
    icon: "IconSettings",
    color: "#64748b",
  },
  {
    id: "goals",
    title: "Fitness Goals",
    category: "Fitness",
    path: "/goals",
    permissionKey: "goals",
    keywords: ["goals", "target", "weight goal", "fitness targets", "milestones"],
    icon: "IconTargetArrow",
    color: "#00a99d",
  },
  {
    id: "progress",
    title: "Progress Tracking",
    category: "Fitness",
    path: "/progress",
    permissionKey: "progress",
    keywords: ["progress", "tracking", "body measurements", "weight loss", "bmi", "transformation"],
    icon: "IconChartBar",
    color: "#10b981",
  },
  {
    id: "wellness-chat",
    title: "Wellness AI Assistant",
    category: "Fitness",
    path: "/wellness-chat",
    permissionKey: "wellness-chat",
    keywords: ["chat", "ai assistant", "wellness chat", "bot", "help", "support", "advisor"],
    icon: "IconMessageHeart",
    color: "#ec4899",
  },

  // ── Members & Clients ──
  {
    id: "members-all",
    title: "All Members",
    category: "Members",
    path: "/users?filter=all",
    permissionKey: "users",
    keywords: ["members", "all members", "users", "clients", "customers", "directory", "member list"],
    icon: "IconUsers",
    color: "#10b981",
  },
  {
    id: "members-active",
    title: "Active Members",
    category: "Members",
    path: "/users?filter=active",
    permissionKey: "users",
    keywords: ["active members", "current members", "valid membership", "active clients"],
    icon: "IconUserCheck",
    color: "#22c55e",
  },
  {
    id: "members-expired",
    title: "Expired Members",
    category: "Members",
    path: "/users?filter=expired",
    permissionKey: "users",
    keywords: ["expired members", "lapsed", "due renewal", "inactive members"],
    icon: "IconUserOff",
    color: "#ef4444",
  },
  {
    id: "members-freeze",
    title: "Freeze / Paused Members",
    category: "Members",
    path: "/users?filter=freeze",
    permissionKey: "users",
    keywords: ["freeze members", "frozen membership", "pause", "hold"],
    icon: "IconSnowflake",
    color: "#3b82f6",
  },
  {
    id: "renewals",
    title: "Renewal Management",
    category: "Members",
    path: "/renewals",
    permissionKey: "users",
    keywords: ["renewals", "renewal management", "expiring memberships", "extend"],
    icon: "IconRefresh",
    color: "#8b5cf6",
  },
  {
    id: "churn",
    title: "Churn Dashboard",
    category: "Members",
    path: "/churn",
    permissionKey: "users",
    keywords: ["churn", "retention", "drop off", "cancellations", "lost members"],
    icon: "IconChartPie",
    color: "#f59e0b",
  },
  {
    id: "referrals",
    title: "Member Referrals",
    category: "Members",
    path: "/users?filter=referrals",
    permissionKey: "users",
    keywords: ["referrals", "member referrals", "invites", "rewards"],
    icon: "IconGift",
    color: "#ec4899",
  },

  // ── Workouts & Training ──
  {
    id: "workout-plans",
    title: "Workout Plans",
    category: "Workout",
    path: "/workout-plan",
    permissionKey: "workout-plan",
    keywords: ["workout plans", "training plan", "exercise routine", "program", "strength plan"],
    icon: "IconClipboardList",
    color: "#10b981",
  },
  {
    id: "exercise-master",
    title: "Exercise Master",
    category: "Workout",
    path: "/exercise-master",
    permissionKey: "exercise-master",
    keywords: ["exercises", "exercise master", "bench press", "squat", "deadlift", "cardio", "dumbbells", "machines"],
    icon: "IconBarbell",
    color: "#ef4444",
  },
  {
    id: "workout-types",
    title: "Workout Types",
    category: "Workout",
    path: "/workout-type",
    permissionKey: "workout-type",
    keywords: ["workout types", "cardio", "strength", "hiit", "crossfit", "flexibility", "categories"],
    icon: "IconBolt",
    color: "#f97316",
  },
  {
    id: "body-parts",
    title: "Body Parts Master",
    category: "Workout",
    path: "/body-part",
    permissionKey: "body-part",
    keywords: ["body parts", "chest", "back", "legs", "biceps", "triceps", "shoulders", "abs", "muscle groups"],
    icon: "IconUserStar",
    color: "#8b5cf6",
  },
  {
    id: "workout-detail",
    title: "Workout Detail & Daily Log",
    category: "Workout",
    path: "/workout-detail",
    permissionKey: "workout-detail",
    keywords: ["workout detail", "my workout", "daily exercises", "sets and reps", "session log"],
    icon: "IconFileAnalytics",
    color: "#3b82f6",
  },

  // ── Diet & Nutrition ──
  {
    id: "diet-plan",
    title: "Diet Menu & Meal Plans",
    category: "Diet Menu",
    path: "/dietplan",
    permissionKey: "dietplan",
    keywords: ["diet", "diet plan", "diet menu", "nutrition", "meal plan", "food", "calories", "protein", "keto"],
    icon: "IconMoodSmile",
    color: "#22c55e",
  },
  {
    id: "diet-detail",
    title: "Diet Detail & Log",
    category: "Diet Menu",
    path: "/diet-detail",
    permissionKey: "diet-detail",
    keywords: ["diet detail", "daily diet", "nutrition breakdown", "meal log", "food intake"],
    icon: "IconChefHat",
    color: "#10b981",
  },

  // ── Schedules ──
  {
    id: "my-schedule",
    title: "My Schedule",
    category: "Schedule",
    path: "/my-schedule",
    permissionKey: "my-schedule",
    keywords: ["my schedule", "calendar", "classes", "bookings", "sessions", "timetable"],
    icon: "IconCalendarEvent",
    color: "#f59e0b",
  },
  {
    id: "trainer-duty",
    title: "Trainer Duty Schedule",
    category: "Schedule",
    path: "/trainer-duty-schedule",
    permissionKey: "trainer-duty-schedule",
    keywords: ["trainer duty", "duty schedule", "shift", "roster", "trainer hours", "duty roster"],
    icon: "IconCalendarStats",
    color: "#6366f1",
  },
  {
    id: "user-workout-schedule",
    title: "User Workout Schedule",
    category: "Schedule",
    path: "/user-workout-schedule",
    permissionKey: "user-workout-schedule",
    keywords: ["user workout schedule", "member schedule", "class schedule"],
    icon: "IconCalendar",
    color: "#8b5cf6",
  },

  // ── Attendance ──
  {
    id: "attendance",
    title: "Attendance Management",
    category: "Attendance",
    path: "/attendance",
    permissionKey: "attendance",
    keywords: ["attendance", "check-in", "checkin", "daily attendance", "presence", "swipes"],
    icon: "IconFingerprint",
    color: "#0066ff",
  },
  {
    id: "attendance-kiosk",
    title: "Gate Kiosk (QR & Pin Check-in)",
    category: "Attendance",
    path: "/attendance/kiosk",
    permissionKey: "attendance",
    keywords: ["gate kiosk", "kiosk", "qr scanner", "door access", "pin checkin", "gate", "front desk checkin"],
    icon: "IconDoorEnter",
    color: "#0ea5e9",
  },

  // ── Billing & Membership Plans ──
  {
    id: "billing",
    title: "Billing Dashboard",
    category: "Billing",
    path: "/billing",
    permissionKey: "billing",
    keywords: ["billing", "invoices", "revenue", "payments", "receipts", "expenses", "financials"],
    icon: "IconReceipt2",
    color: "#ec4899",
  },
  {
    id: "membership-plans",
    title: "Membership Plans",
    category: "Billing",
    path: "/membership-plans",
    permissionKey: "membership-plans",
    keywords: ["membership plans", "packages", "pricing", "subscriptions", "tiers", "rates"],
    icon: "IconCreditCard",
    color: "#8b5cf6",
  },
  {
    id: "my-membership",
    title: "My Membership Status",
    category: "Billing",
    path: "/membership",
    keywords: ["my membership", "plan details", "subscription card", "validity"],
    icon: "IconCrown",
    color: "#eab308",
  },

  // ── Leads CRM ──
  {
    id: "leads-dashboard",
    title: "Leads Dashboard",
    category: "Leads CRM",
    path: "/leads/dashboard",
    permissionKey: "leads",
    keywords: ["leads", "sales dashboard", "crm overview", "conversion rate", "pipeline stats"],
    icon: "IconLayoutDashboard",
    color: "#6366f1",
  },
  {
    id: "leads-inbox",
    title: "Lead Inbox",
    category: "Leads CRM",
    path: "/leads/inbox",
    permissionKey: "leads",
    keywords: ["lead inbox", "inbox", "inquiries", "messages", "whatsapp leads", "new contacts"],
    icon: "IconInbox",
    color: "#3b82f6",
  },
  {
    id: "leads-walkin",
    title: "Walk-in Register",
    category: "Leads CRM",
    path: "/leads/walkin",
    permissionKey: "leads",
    keywords: ["walk-in", "walkin register", "visitors", "front desk leads", "walk ins"],
    icon: "IconUserPlus",
    color: "#10b981",
  },
  {
    id: "leads-trials",
    title: "Trial Members",
    category: "Leads CRM",
    path: "/leads/trials",
    permissionKey: "leads",
    keywords: ["trial members", "free trials", "demo sessions", "trial passes"],
    icon: "IconCalendarEvent",
    color: "#8b5cf6",
  },
  {
    id: "leads-followup",
    title: "Follow-up Calendar",
    category: "Leads CRM",
    path: "/leads/followup",
    permissionKey: "leads",
    keywords: ["followup", "follow-up calendar", "call reminders", "tasks", "lead followup"],
    icon: "IconPhone",
    color: "#06b6d4",
  },
  {
    id: "leads-pipeline",
    title: "Sales Pipeline",
    category: "Leads CRM",
    path: "/leads/pipeline",
    permissionKey: "leads",
    keywords: ["pipeline", "sales pipeline", "kanban", "stages", "deals", "prospects"],
    icon: "IconTimeline",
    color: "#f97316",
  },
  {
    id: "leads-campaigns",
    title: "Marketing Campaigns",
    category: "Leads CRM",
    path: "/leads/campaigns",
    permissionKey: "leads",
    keywords: ["campaigns", "marketing", "promotions", "sms blasts", "email campaigns"],
    icon: "IconBriefcase",
    color: "#ec4899",
  },
  {
    id: "leads-team",
    title: "Sales Team",
    category: "Leads CRM",
    path: "/leads/team",
    permissionKey: "leads",
    keywords: ["sales team", "counselors", "reps", "commission", "targets"],
    icon: "IconUsersGroup",
    color: "#22c55e",
  },
  {
    id: "leads-corporate",
    title: "Corporate Leads",
    category: "Leads CRM",
    path: "/leads/corporate",
    permissionKey: "leads",
    keywords: ["corporate leads", "b2b leads", "company contracts", "bulk wellness"],
    icon: "IconBuilding",
    color: "#0ea5e9",
  },
  {
    id: "leads-automation",
    title: "Lead Automation",
    category: "Leads CRM",
    path: "/leads/automation",
    permissionKey: "leads",
    keywords: ["automation", "lead automation", "autoresponder", "drip rules", "workflows"],
    icon: "IconRobot",
    color: "#64748b",
  },
  {
    id: "leads-reports",
    title: "CRM Reports",
    category: "Leads CRM",
    path: "/leads/reports",
    permissionKey: "leads",
    keywords: ["crm reports", "sales analytics", "conversion reports", "agent performance"],
    icon: "IconFileAnalytics",
    color: "#f59e0b",
  },
  {
    id: "leads-ai",
    title: "AI Lead Features",
    category: "Leads CRM",
    path: "/leads/ai",
    permissionKey: "leads",
    keywords: ["ai", "ai leads", "smart scoring", "predictive lead analysis"],
    icon: "IconSparkles",
    color: "#f59e0b",
  },

  // ── Organization & Staff ──
  {
    id: "employees",
    title: "Employees & Staff",
    category: "Management",
    path: "/employees",
    permissionKey: "employees",
    keywords: ["employees", "staff", "trainers", "managers", "coaches", "admins", "staff directory"],
    icon: "IconUsersGroup",
    color: "#10b981",
  },
  {
    id: "trainer-performance",
    title: "Trainer Performance",
    category: "Management",
    path: "/trainer-performance",
    permissionKey: "trainer-performance",
    keywords: ["trainer performance", "kpi", "trainer ratings", "client reviews", "trainer stats"],
    icon: "IconAward",
    color: "#f59e0b",
  },
  {
    id: "headoffice",
    title: "Head Office Master",
    category: "Management",
    path: "/headoffice",
    permissionKey: "headoffice",
    keywords: ["head office", "hq", "headquarters", "company master"],
    icon: "IconBuilding",
    color: "#0ea5e9",
  },
  {
    id: "branches",
    title: "Branches Master",
    category: "Management",
    path: "/branches",
    permissionKey: "branches",
    keywords: ["branches", "locations", "gym centers", "facilities"],
    icon: "IconMapPin",
    color: "#f97316",
  },
  {
    id: "departments",
    title: "Departments Master",
    category: "Management",
    path: "/departments",
    permissionKey: "departments",
    keywords: ["departments", "dept", "fitness department", "sales department"],
    icon: "IconBriefcase",
    color: "#ec4899",
  },
  {
    id: "designations",
    title: "Designations Master",
    category: "Management",
    path: "/designations",
    permissionKey: "designations",
    keywords: ["designations", "job titles", "positions", "roles"],
    icon: "IconStar",
    color: "#a855f7",
  },
  {
    id: "teams",
    title: "Teams Master",
    category: "Management",
    path: "/teams",
    permissionKey: "teams",
    keywords: ["teams", "team", "staff teams", "squads"],
    icon: "IconUsers",
    color: "#22c55e",
  },
  {
    id: "role-permissions",
    title: "Role Permissions",
    category: "Management",
    path: "/role-permissions",
    permissionKey: "role-permissions",
    keywords: ["role permissions", "permissions", "access control", "privileges", "security roles"],
    icon: "IconShieldCheck",
    color: "#ef4444",
  },

  // ── Corporate Wellness ──
  {
    id: "corporate-dashboard",
    title: "Corporate Wellness Dashboard",
    category: "Corporate",
    path: "/corporate",
    permissionKey: "corporate-dashboard",
    keywords: ["corporate", "corporate wellness", "b2b clients", "company fitness"],
    icon: "IconBuildingCommunity",
    color: "#0ea5e9",
  },
  {
    id: "corporate-add",
    title: "Add Corporate Client",
    category: "Corporate",
    path: "/corporate/add",
    permissionKey: "corporate-dashboard",
    keywords: ["add corporate", "new company", "corporate partner registration"],
    icon: "IconBuilding",
    color: "#6366f1",
  },
  {
    id: "corporate-bmi",
    title: "Corporate BMI Tracking",
    category: "Corporate",
    path: "/corporate/bmi",
    permissionKey: "corporate-bmi",
    keywords: ["corporate bmi", "bmi tracking", "employee wellness stats"],
    icon: "IconHeartRateMonitor",
    color: "#ef4444",
  },
  {
    id: "corporate-challenges",
    title: "Corporate Wellness Challenges",
    category: "Corporate",
    path: "/corporate/challenges",
    permissionKey: "corporate-challenges",
    keywords: ["challenges", "corporate challenges", "fitness contest", "step challenge"],
    icon: "IconTrophy",
    color: "#f59e0b",
  },
  {
    id: "corporate-reports",
    title: "Corporate Reports",
    category: "Corporate",
    path: "/corporate/reports",
    permissionKey: "corporate-reports",
    keywords: ["corporate reports", "wellness reports", "corporate analytics"],
    icon: "IconFileAnalytics",
    color: "#10b981",
  },

  // ── Reports & Inventory ──
  {
    id: "reports",
    title: "Reports & Analytics",
    category: "Management",
    path: "/reports",
    permissionKey: "reports",
    keywords: ["reports", "analytics", "business reports", "export data", "statistics"],
    icon: "IconReportAnalytics",
    color: "#f59e0b",
  },
  {
    id: "inventory",
    title: "Inventory Management",
    category: "Management",
    path: "/inventory",
    permissionKey: "inventory",
    keywords: ["inventory", "supplements", "equipment stock", "gear", "store"],
    icon: "IconBox",
    color: "#0088ff",
  },

  // ── Quick Actions ──
  {
    id: "action-theme",
    title: "Toggle Dark / Light Theme",
    category: "Actions",
    isAction: true,
    actionType: "TOGGLE_THEME",
    keywords: ["dark mode", "light mode", "theme", "night mode", "toggle theme", "switch theme"],
    icon: "IconMoon",
    color: "#6366f1",
  },
  {
    id: "action-logout",
    title: "Sign Out / Logout",
    category: "Actions",
    isAction: true,
    actionType: "LOGOUT",
    keywords: ["logout", "sign out", "log off", "exit"],
    icon: "IconLogout",
    color: "#ef4444",
  },
];

// Highlight matching text in results
function HighlightMatch({ text, query }) {
  if (!query || !query.trim()) return <span>{text}</span>;

  const parts = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, currentIndex);
    if (matchIndex === -1) {
      parts.push({ match: false, text: text.slice(currentIndex) });
      break;
    }
    if (matchIndex > currentIndex) {
      parts.push({ match: false, text: text.slice(currentIndex, matchIndex) });
    }
    parts.push({ match: true, text: text.slice(matchIndex, matchIndex + lowerQuery.length) });
    currentIndex = matchIndex + lowerQuery.length;
  }

  return (
    <span>
      {parts.map((p, i) =>
        p.match ? (
          <span key={i} className="text-primary fw-bold" style={{ textDecoration: "underline" }}>
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}

export default function HeaderSearch({ theme, toggleTheme, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const isMember = role === "USER";

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Close dropdown on location change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Filter accessible items based on user role and permissions
  const accessibleItems = useMemo(() => {
    return SEARCH_ITEMS.filter((item) => {
      // Direct actions are always allowed
      if (item.isAction) return true;

      // Member restrictions
      if (isMember) {
        // Members only see their permitted views
        const memberAllowed = [
          "dashboard",
          "workout-detail",
          "diet-plan",
          "diet-detail",
          "my-schedule",
          "goals",
          "progress",
          "wellness-chat",
          "attendance",
          "my-membership",
          "profile",
          "action-theme",
          "action-logout",
        ];
        return memberAllowed.includes(item.id);
      }

      // Staff / Admin: check permission key if present
      if (item.permissionKey) {
        return hasPermission ? hasPermission(item.permissionKey, "view") : true;
      }

      return true;
    });
  }, [isMember, hasPermission]);

  // Compute matched items
  const matchedPages = useMemo(() => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) {
      // When empty: return top recommended quick links
      const topIds = [
        "dashboard",
        "members-all",
        "workout-plans",
        "diet-plan",
        "trainer-duty",
        "billing",
        "attendance",
        "leads-dashboard",
        "profile",
      ];
      return accessibleItems.filter((i) => topIds.includes(i.id)).slice(0, 8);
    }

    return accessibleItems
      .map((item) => {
        const title = item.title.toLowerCase();
        const category = item.category.toLowerCase();
        const path = (item.path || "").toLowerCase();
        const keywords = item.keywords || [];

        let score = 0;
        if (title.startsWith(cleanQuery)) score += 100;
        else if (title.includes(cleanQuery)) score += 70;

        if (keywords.some((k) => k.startsWith(cleanQuery))) score += 50;
        else if (keywords.some((k) => k.includes(cleanQuery))) score += 35;

        if (category.includes(cleanQuery)) score += 25;
        if (path.includes(cleanQuery)) score += 15;

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
      .slice(0, 8);
  }, [accessibleItems, query]);

  // Dynamic database search actions when query is present
  const dynamicActions = useMemo(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const actions = [];
    if (!isMember) {
      actions.push({
        id: `search-members-${cleanQuery}`,
        title: `Search Members for "${cleanQuery}"`,
        category: "Database Search",
        path: `/users?filter=all&search=${encodeURIComponent(cleanQuery)}`,
        icon: "IconUsers",
        color: "#10b981",
        isDirectSearch: true,
      });
      actions.push({
        id: `search-leads-${cleanQuery}`,
        title: `Search Leads for "${cleanQuery}"`,
        category: "Database Search",
        path: `/leads/inbox?search=${encodeURIComponent(cleanQuery)}`,
        icon: "IconInbox",
        color: "#3b82f6",
        isDirectSearch: true,
      });
    }
    actions.push({
      id: `search-exercises-${cleanQuery}`,
      title: `Search Exercises for "${cleanQuery}"`,
      category: "Database Search",
      path: `/exercise-master?search=${encodeURIComponent(cleanQuery)}`,
      icon: "IconBarbell",
      color: "#ef4444",
      isDirectSearch: true,
    });

    return actions;
  }, [query, isMember]);

  // Combined list of selectable results
  const allResults = useMemo(() => {
    return [...matchedPages, ...dynamicActions];
  }, [matchedPages, dynamicActions]);

  // Keep active index within bounds
  useEffect(() => {
    if (activeIndex >= allResults.length) {
      setActiveIndex(0);
    }
  }, [allResults.length, activeIndex]);

  // Auto-scroll active item into view
  useEffect(() => {
    if (!resultsRef.current || activeIndex < 0) return;
    const activeEl = resultsRef.current.querySelector(`[data-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Execute selection
  const handleSelect = useCallback(
    (item) => {
      if (!item) return;

      if (item.isAction) {
        if (item.actionType === "TOGGLE_THEME" && toggleTheme) {
          toggleTheme();
        } else if (item.actionType === "LOGOUT" && onLogout) {
          onLogout();
        }
      } else if (item.path) {
        navigate(item.path);
      }

      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    },
    [navigate, toggleTheme, onLogout]
  );

  // Keyboard navigation within search input
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (allResults.length === 0 ? 0 : (prev + 1) % allResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (allResults.length === 0 ? 0 : (prev - 1 + allResults.length) % allResults.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allResults.length > 0) {
        handleSelect(allResults[activeIndex] || allResults[0]);
      } else if (query.trim()) {
        // Fallback default: search in members
        navigate(`/users?filter=all&search=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
    setActiveIndex(0);
  };

  const isDarkMode = theme === "dark";

  return (
    <div
      ref={containerRef}
      className="header-search-container position-relative"
      style={{ width: "100%", maxWidth: "400px" }}
    >
      {/* 
        The Input Group: exact classes and UI preserved as requested:
        "do not change ui and all i want this functional search box i want"
      */}
      <div className="input-group">
        <span className="input-group-text pe-0">
          <IconSearch size={18} />
        </span>
        <Form.Control
          ref={inputRef}
          type="text"
          placeholder="Search Here"
          name="navsearch"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <span
            className="input-group-text ps-0 pe-2"
            style={{
              cursor: "pointer",
              background: "transparent",
              borderLeft: "none",
            }}
            onClick={handleClear}
            title="Clear search"
          >
            <IconX size={15} className="text-muted" />
          </span>
        )}
      </div>

      {/* Floating Active Dropdown Results */}
      {isOpen && (
        <div
          ref={resultsRef}
          className="search-results-dropdown shadow-lg rounded-3"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "100%",
            minWidth: "380px",
            maxWidth: "460px",
            zIndex: 1060,
            backgroundColor: isDarkMode ? "#1a2234" : "#ffffff",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: isDarkMode
              ? "0 14px 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.2)"
              : "0 14px 40px rgba(0, 0, 0, 0.14), 0 0 1px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            maxHeight: "440px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header pill / status */}
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
            style={{
              borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
              backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
            }}
          >
            <span
              className="text-uppercase fw-semibold"
              style={{
                fontSize: "11px",
                letterSpacing: "0.5px",
                color: isDarkMode ? "#94a3b8" : "#64748b",
              }}
            >
              {query.trim() ? "Search Results" : "Quick Navigation"}
            </span>
            <span
              className="badge"
              style={{
                fontSize: "10px",
                padding: "3px 6px",
                backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                color: isDarkMode ? "#cbd5e1" : "#475569",
              }}
            >
              {allResults.length} {allResults.length === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Scrollable list */}
          <div style={{ overflowY: "auto", flex: 1, padding: "6px" }}>
            {allResults.length === 0 ? (
              <div className="text-center py-4 px-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                  style={{
                    width: "44px",
                    height: "44px",
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  }}
                >
                  <IconSearch size={20} className="text-muted" />
                </div>
                <div
                  className="fw-semibold"
                  style={{
                    fontSize: "14px",
                    color: isDarkMode ? "#e2e8f0" : "#1e293b",
                  }}
                >
                  No matching pages found
                </div>
                <div className="text-muted small mt-1">
                  Try searching for members, exercises, or workouts.
                </div>
              </div>
            ) : (
              <>
                {matchedPages.length > 0 && (
                  <div>
                    {matchedPages.map((item, idx) => {
                      const isSelected = activeIndex === idx;
                      const IconComponent = ICONS[item.icon] || IconSearch;

                      return (
                        <div
                          key={item.id}
                          data-index={idx}
                          onClick={() => handleSelect(item)}
                          className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-1"
                          style={{
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            backgroundColor: isSelected
                              ? isDarkMode
                                ? "rgba(0, 102, 255, 0.22)"
                                : "rgba(0, 102, 255, 0.08)"
                              : "transparent",
                            color: isDarkMode ? "#e2e8f0" : "#1e293b",
                          }}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
                            <div
                              className="d-flex align-items-center justify-content-center rounded-2 me-2 flex-shrink-0"
                              style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: isDarkMode
                                  ? `${item.color || "#0066ff"}25`
                                  : `${item.color || "#0066ff"}15`,
                                color: item.color || "#0066ff",
                              }}
                            >
                              <IconComponent size={18} />
                            </div>
                            <div style={{ minWidth: 0, overflow: "hidden" }}>
                              <div
                                className="fw-medium text-truncate"
                                style={{
                                  fontSize: "13.5px",
                                  color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                }}
                              >
                                <HighlightMatch text={item.title} query={query} />
                              </div>
                              <div
                                className="text-muted text-truncate"
                                style={{ fontSize: "11.5px" }}
                              >
                                {item.path || item.category}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center ms-2 flex-shrink-0">
                            <span
                              className="badge me-1"
                              style={{
                                fontSize: "10px",
                                fontWeight: 500,
                                backgroundColor: isDarkMode
                                  ? "rgba(255, 255, 255, 0.08)"
                                  : "rgba(0, 0, 0, 0.05)",
                                color: isDarkMode ? "#94a3b8" : "#64748b",
                              }}
                            >
                              {item.category}
                            </span>
                            <IconChevronRight
                              size={15}
                              className={isSelected ? "text-primary" : "text-muted"}
                              style={{
                                opacity: isSelected ? 1 : 0.4,
                                transform: isSelected ? "translateX(2px)" : "none",
                                transition: "all 0.15s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Database Direct Searches */}
                {dynamicActions.length > 0 && (
                  <div
                    className="pt-2 mt-1 border-top"
                    style={{
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    <div
                      className="px-2 pb-1 text-uppercase fw-semibold"
                      style={{
                        fontSize: "10.5px",
                        letterSpacing: "0.5px",
                        color: isDarkMode ? "#64748b" : "#94a3b8",
                      }}
                    >
                      Search In Records
                    </div>
                    {dynamicActions.map((item, aIdx) => {
                      const overallIdx = matchedPages.length + aIdx;
                      const isSelected = activeIndex === overallIdx;
                      const IconComponent = ICONS[item.icon] || IconSearch;

                      return (
                        <div
                          key={item.id}
                          data-index={overallIdx}
                          onClick={() => handleSelect(item)}
                          className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-1"
                          style={{
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            backgroundColor: isSelected
                              ? isDarkMode
                                ? "rgba(0, 102, 255, 0.22)"
                                : "rgba(0, 102, 255, 0.08)"
                              : "transparent",
                            color: isDarkMode ? "#e2e8f0" : "#1e293b",
                          }}
                          onMouseEnter={() => setActiveIndex(overallIdx)}
                        >
                          <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
                            <div
                              className="d-flex align-items-center justify-content-center rounded-2 me-2 flex-shrink-0"
                              style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: isDarkMode
                                  ? `${item.color || "#0066ff"}25`
                                  : `${item.color || "#0066ff"}15`,
                                color: item.color || "#0066ff",
                              }}
                            >
                              <IconComponent size={18} />
                            </div>
                            <div style={{ minWidth: 0, overflow: "hidden" }}>
                              <div
                                className="fw-medium text-truncate"
                                style={{
                                  fontSize: "13px",
                                  color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                }}
                              >
                                {item.title}
                              </div>
                              <div
                                className="text-muted text-truncate"
                                style={{ fontSize: "11px" }}
                              >
                                Press Enter to view matches
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center ms-2 flex-shrink-0">
                            <span
                              className="badge bg-primary text-white"
                              style={{ fontSize: "10px", padding: "3px 6px" }}
                            >
                              Search
                            </span>
                            <IconArrowRight size={14} className="ms-1 text-primary" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer tips */}
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2 border-top"
            style={{
              borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
              backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
              fontSize: "11px",
              color: isDarkMode ? "#64748b" : "#94a3b8",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <span>
                <kbd
                  style={{
                    backgroundColor: isDarkMode ? "#334155" : "#e2e8f0",
                    color: isDarkMode ? "#f1f5f9" : "#334155",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    fontSize: "10px",
                  }}
                >
                  ↑↓
                </kbd>{" "}
                navigate
              </span>
              <span>
                <kbd
                  style={{
                    backgroundColor: isDarkMode ? "#334155" : "#e2e8f0",
                    color: isDarkMode ? "#f1f5f9" : "#334155",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    fontSize: "10px",
                  }}
                >
                  ↵
                </kbd>{" "}
                select
              </span>
              <span>
                <kbd
                  style={{
                    backgroundColor: isDarkMode ? "#334155" : "#e2e8f0",
                    color: isDarkMode ? "#f1f5f9" : "#334155",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    fontSize: "10px",
                  }}
                >
                  esc
                </kbd>{" "}
                close
              </span>
            </div>
            <div>
              <span className="d-none d-sm-inline">
                <kbd
                  style={{
                    backgroundColor: isDarkMode ? "#334155" : "#e2e8f0",
                    color: isDarkMode ? "#f1f5f9" : "#334155",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    fontSize: "10px",
                  }}
                >
                  Ctrl+K
                </kbd>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
