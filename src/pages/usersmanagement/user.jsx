import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { IconHome, IconEdit, IconTrash, IconPlus, IconChefHat, IconBarbell, IconEye, IconEyeOff, IconCamera, IconUpload, IconUserCircle } from "@tabler/icons-react";
import api from "../../utils/api";
import {
  getAllHeadOffices,
  getAllBranches,
  getAllDepartments,
  getAllTeams,
  getAllDesignations,
} from "../../api/orgHierarchyApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import {
  COUNTRY_CODE_OPTIONS,
  ensureCountryCodeValue,
  getCountryAllowedLengths,
  getCountryOptionByValue,
  sanitizePhoneDigits,
  validatePhoneNumber,
} from "../../utils/phoneUtils";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import PhoneField from "../../components/PhoneField";
import { getWorkoutPlans, assignWorkoutPlan } from "../../api/workoutApi";
import { getMemberProgressEntries } from "../../api/progressApi";
import { normalizeWorkoutPlan } from "../workout/workoutUtils";
import { getMembershipPlans } from "../../api/membershipPlansApi";
import { assignMembership } from "../../api/membershipApi";
import adminAvatar from "/src/assets/images/avtar/profile.png";
import superAdminAvatar from "/src/assets/images/avtar/profile-img.png";
import userAvatar from "/src/assets/images/avtar/samantha-lee.png";
import managerAvatar from "/src/assets/images/trainer/trainer1-avtar.png";
import trainerAvatar from "/src/assets/images/trainer/trainer2-avtar.png";
import { formatMemberCode } from "../../utils/memberCode";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "TRAINER", label: "Trainer" },
  { value: "USER", label: "Member" },
];

const USER_MODAL_STEPS = [
  { key: "identity", label: "Identity" },
  { key: "organization", label: "Organization" },
  { key: "details", label: "Role Details" },
  { key: "personal", label: "Personal Details" },
  { key: "documents", label: "Documents" },
];

function getModalStepsForRole(role) {
  if (normalizeRole(role) === "USER") {
    return USER_MODAL_STEPS.slice(0, 4);
  }

  return USER_MODAL_STEPS;
}

function getOrganizationVisibility(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ADMIN") {
    return {
      headOffice: true,
      branch: true,
      department: false,
      team: false,
      designation: false,
    };
  }

  if (normalizedRole === "MANAGER") {
    return {
      headOffice: true,
      branch: true,
      department: true,
      team: false,
      designation: false,
    };
  }

  if (normalizedRole === "TRAINER") {
    return {
      headOffice: true,
      branch: true,
      department: true,
      team: true,
      designation: false,
    };
  }

  if (normalizedRole === "USER") {
    // Members skip the Department step — they're assigned straight to a Team
    // (whose department/branch is derived automatically) plus its trainer.
    return {
      headOffice: true,
      branch: true,
      department: false,
      team: true,
      designation: false,
    };
  }

  return {
    headOffice: true,
    branch: true,
    department: true,
    team: true,
    designation: false,
  };
}

function generateEmployeeCode(role, existingCode = "") {
  const cleaned = String(existingCode || "").trim();
  if (cleaned) return cleaned;

  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "USER") {
    return `USR${Date.now()}`;
  }

  return `EMP${Date.now()}`;
}

const ROLE_COLORS = {
  SUPER_ADMIN: "bg-dark",
  ADMIN: "bg-primary",
  MANAGER: "bg-info",
  TRAINER: "bg-success",
  USER: "bg-secondary",
};

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const EMPLOYMENT_TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Intern", "Consultant"];
const WORK_LOCATION_OPTIONS = ["On-site", "Remote", "Hybrid", "Branch-based"];
const QUALIFICATION_OPTIONS = ["SSLC", "HSC", "Diploma", "UG", "PG", "Doctorate", "Professional Certification", "Others"];
const MARITAL_STATUS_OPTIONS = ["Single", "Married"];
const SOURCE_PLATFORM_OPTIONS = ["Friend Refer", "Local App", "Direct Interview", "Job Fair"];
const EMPTY_ADDRESS = { street: "", city: "", state: "", pincode: "" };
const STAFF_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

const ROLE_AVATARS = {
  SUPER_ADMIN: superAdminAvatar,
  ADMIN: adminAvatar,
  MANAGER: managerAvatar,
  TRAINER: trainerAvatar,
  USER: userAvatar,
};

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function normalizeDietPlan(plan) {
  if (!plan) return null;
  return {
    id: plan.id,
    name: plan.name || plan.title || "Untitled menu item",
  };
}

const DIET_ASSIGN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER", "TRAINER"]);
const WORKOUT_ASSIGN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER", "TRAINER"]);

function normalizeLookupText(value) {
  return String(value || "").trim().toLowerCase();
}

function splitTeamLeadToken(value) {
  const raw = String(value || "").trim();
  if (!raw) return { id: "", name: "" };

  const [id, ...rest] = raw.split("::");
  if (rest.length) {
    return { id: id.trim(), name: rest.join("::").trim() };
  }

  return { id: "", name: raw };
}

function getTeamTrainerIdentity(team) {
  if (!team) return { id: "", name: "" };

  const rawTrainer =
    team.teamLead ??
    team.teamLeadName ??
    team.trainer ??
    team.trainerName ??
    team.reportingManagerName ??
    team.reportsToName ??
    "";

  if (rawTrainer && typeof rawTrainer === "object") {
    return {
      id: String(rawTrainer.id ?? rawTrainer.userId ?? rawTrainer.value ?? ""),
      name: String(rawTrainer.name ?? rawTrainer.fullName ?? rawTrainer.label ?? "").trim(),
    };
  }

  const encoded = splitTeamLeadToken(rawTrainer);
  if (encoded.id || encoded.name) {
    return {
      id: encoded.id,
      name: encoded.name,
    };
  }

  return {
    id: String(team.teamLeadId ?? team.trainerId ?? team.reportsToId ?? "").trim(),
    name: String(rawTrainer || "").trim(),
  };
}

function resolveTeamTrainerOption(team, reportingOptions = []) {
  const identity = getTeamTrainerIdentity(team);
  if (!team) return { identity, option: null };

  if (identity.id) {
    const byId = reportingOptions.find((item) => String(item.id) === String(identity.id));
    if (byId) return { identity: { ...identity, name: byId.name || identity.name }, option: byId };
  }

  if (identity.name) {
    const byName = reportingOptions.find((item) => normalizeLookupText(item.name) === normalizeLookupText(identity.name));
    if (byName) return { identity: { ...identity, id: String(byName.id), name: byName.name || identity.name }, option: byName };
  }

  return { identity, option: null };
}

function getTeamTrainerLabel(team) {
  const identity = getTeamTrainerIdentity(team);
  return identity.name || "No trainer assigned to this team";
}

function getTrainerForTeam(team, userRows = []) {
  if (!team) return null;
  const teamId = String(team.id ?? "").trim();
  if (!teamId) return null;

  const matched = userRows.find((row) => {
    if (normalizeRole(row?.role) !== "TRAINER") return false;
    const rowTeamId = row?.teamId ?? row?.raw?.teamId ?? row?.raw?.team?.id;
    return String(rowTeamId ?? "").trim() === teamId;
  });

  if (!matched) return null;

  return {
    id: String(matched.id ?? matched.raw?.id ?? "").trim(),
    name: String(matched.name || [matched.raw?.firstName, matched.raw?.lastName].filter(Boolean).join(" ") || "").trim(),
    role: "TRAINER",
  };
}

function getCurrentUserId(user) {
  const raw = user?.userId ?? user?.id ?? localStorage.getItem("userId");
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function splitPhoneWithCountryCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return { countryCode: "+91", phone: "" };
  if (!raw.startsWith("+")) return { countryCode: "+91", phone: raw.replace(/\D/g, "") };

  const match = [...COUNTRY_CODE_OPTIONS]
    .sort((a, b) => b.value.length - a.value.length)
    .find((opt) => raw.startsWith(opt.value));

  if (match) {
    return {
      countryCode: match.value,
      phone: raw.slice(match.value.length).replace(/\D/g, ""),
    };
  }

  return { countryCode: "+91", phone: raw.replace(/\D/g, "") };
}

function formatPhoneWithCode(value, code = "+91") {
  const phone = String(value || "").trim();
  if (!phone) return "-";
  if (phone.startsWith("+")) return phone;
  return `${ensureCountryCodeValue(code)}${phone}`;
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function unwrapData(response) {
  return response?.data?.data ?? null;
}

function isActiveRecord(item) {
  const status = String(item?.status || "").toUpperCase();
  if (!status) return true;
  return status === "ACTIVE";
}

function getDefaultCreateRole(currentRole) {
  switch (normalizeRole(currentRole)) {
    case "SUPER_ADMIN":
      return "ADMIN";
    case "ADMIN":
      return "MANAGER";
    case "MANAGER":
      return "TRAINER";
    case "TRAINER":
      return "USER";
    default:
      return "ADMIN";
  }
}

function getCreateRoleAvailability(currentRole) {
  const role = normalizeRole(currentRole);
  const availability = {
    SUPER_ADMIN: false,
    ADMIN: false,
    MANAGER: false,
    TRAINER: false,
    USER: false,
  };

  if (role === "SUPER_ADMIN") {
    availability.ADMIN = true;
    availability.MANAGER = true;
    availability.TRAINER = true;
    availability.USER = true;
  } else if (role === "ADMIN") {
    availability.MANAGER = true;
    availability.TRAINER = true;
    availability.USER = true;
  } else if (role === "MANAGER") {
    availability.TRAINER = true;
    availability.USER = true;
  } else if (role === "TRAINER") {
    availability.USER = true;
  }

  return availability;
}

function createEmptyForm(role = "ADMIN") {
  return {
    role,
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    name: "",
    phone: "",
    countryCode: "+91",
    employeeCode: "",
    departmentText: "",
    qualification: "",
    specialization: "",
    experienceYears: "",
    certification: "",
    ratePerHour: "",
    weight: "",
    height: "",
    bloodGroup: "",
    age: "",
    gender: "",
    address: "",
    city: "",
    medicalConditions: "",
    emergencyContact: "",
    emergencyPhone: "",
    status: "ACTIVE",
    joinDate: "",
    bio: "",
    languages: "",
    rating: "",
    totalClientsTrained: "",
    headOfficeId: "",
    branchId: "",
    departmentId: "",
    teamId: "",
    designationId: "",
    permanentAddress: "",
    currentAddress: "",
    dateOfBirth: "",
    state: "",
    pincode: "",
    employmentType: "",
    workLocation: "",
    reportingManagerName: "",
    reportsToId: "",
    assignedTrainerId: "",
    fatherName: "",
    motherName: "",
    maritalStatus: "",
    spouseName: "",
    location: "",
    probationEndDate: "",
    alternatePhone: "",
    personalEmail: "",
    panNumber: "",
    aadharNumber: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountType: "",
    bankAccountHolderName: "",
    bankBranch: "",
    qualificationDocumentPath: "",
    certificationDocumentPath: "",
    idProofDocumentPath: "",
    addressProofDocumentPath: "",
    resumeDocumentPath: "",
    offerLetterDocumentPath: "",
    candidatePhotoPath: "",
    aadharCardDocumentPath: "",
    panCardDocumentPath: "",
    bankDocumentPath: "",
    previousEmployment1: "",
    previousEmployment2: "",
    experienceCertificateDocumentPath: "",
    courseCertificatePath: "",
    educationCertificatePath: "",
    emergencyContactRelationship: "",
    emergencyContactName2: "",
    emergencyContactRelationship2: "",
    emergencyPhone2: "",
    referenceName1: "",
    referencePhone1: "",
    referenceName2: "",
    referencePhone2: "",
    joiningBranchName: "",
    sourcePlatform: "",
    pfUan: "",
    esiNumber: "",
    declarationDate: "",
    declarationPlace: "",
    membershipPlanId: "",
    membershipAccessStartTime: "06:00",
    membershipAccessEndTime: "22:00",
    membershipMonths: "",
    workoutPlanId: "",
    img: ROLE_AVATARS[normalizeRole(role)] || userAvatar,
  };
}

function splitName(fullName = "") {
  const normalized = String(fullName)
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const parts = normalized.split(" ");
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function buildOrgLabel(item, orgLists, role) {
  if (!item) return "-";
  const parts = [];

  // Members aren't assigned a department (it's derived from their team), so keep
  // it out of their org-scope label.
  const isMember = normalizeRole(role) === "USER";

  const headOfficeId = item.headOfficeId ?? item.headOffice?.id;
  const branchId = item.branchId ?? item.branch?.id;
  const departmentId = isMember ? null : (item.departmentId ?? item.department?.id);
  const teamId = item.teamId ?? item.team?.id;
  const designationId = isMember ? null : (item.designationId ?? item.designation?.id);

  if (headOfficeId) {
    const headOffice = orgLists.headOffices.find((entry) => String(entry.id) === String(headOfficeId));
    if (headOffice?.name) parts.push(headOffice.name);
  }

  if (branchId) {
    const branch = orgLists.branches.find((entry) => String(entry.id) === String(branchId));
    if (branch?.name) parts.push(branch.name);
  }

  if (departmentId) {
    const department = orgLists.departments.find((entry) => String(entry.id) === String(departmentId));
    if (department?.name) parts.push(department.name);
  }

  if (teamId) {
    const team = orgLists.teams.find((entry) => String(entry.id) === String(teamId));
    if (team?.name) parts.push(team.name);
  }

  if (designationId) {
    const designation = orgLists.designations.find((entry) => String(entry.id) === String(designationId));
    if (designation?.name) parts.push(designation.name);
  }

  if (parts.length) return parts.join(" > ");
  return (isMember ? item.branch : (item.department || item.branch || item.designation)) || "-";
}

function mapAdminRow(item) {
  const { countryCode, phone } = splitPhoneWithCountryCode(item?.phone);
  return {
    id: item?.id ?? null,
    role: "ADMIN",
    name: [item?.firstName, item?.lastName].filter(Boolean).join(" "),
    email: item?.email || "",
    phone,
    countryCode,
    employeeCode: item?.employeeId || "",
    department: item?.department || "",
    qualification: item?.qualification || "",
    status: item?.isActive ? "ACTIVE" : "INACTIVE",
    createdByName: item?.createdByName || "",
    img: ROLE_AVATARS.ADMIN,
    raw: item,
  };
}

function mapSuperAdminRow(item) {
  return {
    id: item?.id ?? null,
    role: "SUPER_ADMIN",
    name: [item?.firstName, item?.lastName].filter(Boolean).join(" "),
    email: item?.email || "",
    phone: "",
    countryCode: "+91",
    employeeCode: "",
    department: "Super Admin",
    qualification: "",
    status: item?.isActive ? "ACTIVE" : "INACTIVE",
    createdByName: "",
    img: ROLE_AVATARS.SUPER_ADMIN,
    raw: item,
  };
}

function mapManagerRow(item) {
  const row = mapAdminRow(item);
  return {
    ...row,
    role: "MANAGER",
  img: ROLE_AVATARS.MANAGER,
  };
}

function mapTrainerRow(item) {
  const { countryCode, phone } = splitPhoneWithCountryCode(item?.phone);
  return {
    id: item?.id ?? null,
    role: "TRAINER",
    name: [item?.firstName, item?.lastName].filter(Boolean).join(" "),
    email: item?.email || "",
    phone,
    countryCode,
    employeeCode: "",
    department: item?.specialization || "",
    qualification: item?.qualification || "",
    status: item?.isActive ? "ACTIVE" : "INACTIVE",
    createdByName: item?.createdByName || "",
    img: ROLE_AVATARS.TRAINER,
    raw: item,
  };
}

function mapCustomerRow(item) {
  const { countryCode, phone } = splitPhoneWithCountryCode(item?.phone);
  return {
    id: item?.id ?? null,
    role: "USER",
    name: [item?.firstName, item?.lastName].filter(Boolean).join(" "),
    email: item?.email || "",
    phone,
    countryCode,
    employeeCode: "",
    department: item?.assignedTrainerName || "",
    assignedTrainerName: item?.assignedTrainerName || "",
    assignedDietPlanId: item?.assignedDietPlanId ?? "",
    assignedDietPlanName: item?.assignedDietPlanName || "",
    assignedWorkoutPlanId: item?.assignedWorkoutPlanId ?? "",
    assignedWorkoutPlanName: item?.assignedWorkoutPlanName || "",
    qualification: "",
    status: item?.isActive ? "ACTIVE" : "INACTIVE",
    createdByName: item?.assignedTrainerName || "",
    headOfficeId: item?.headOfficeId ?? "",
    branchId: item?.branchId ?? "",
    departmentId: item?.departmentId ?? "",
    teamId: item?.teamId ?? "",
    designationId: item?.designationId ?? "",
    assignedTrainerId: item?.assignedTrainerId ?? "",
    img: ROLE_AVATARS.USER,
    raw: item,
  };
}

function getCountryOptions(search) {
  const term = String(search || "").trim().toLowerCase();
  const base = [...COUNTRY_CODE_OPTIONS].sort((a, b) => String(a.label).localeCompare(String(b.label)));
  if (!term) return base;
  return base.filter(
    (opt) => String(opt.label).toLowerCase().includes(term) || String(opt.value).toLowerCase().includes(term),
  );
}

function getRoleBadgeClass(role) {
  return ROLE_COLORS[normalizeRole(role)] || "bg-secondary";
}

// The USER role represents gym members/customers — show "MEMBER" in the UI while
// keeping the underlying role value ("USER") unchanged everywhere else.
function roleDisplay(role) {
  return normalizeRole(role) === "USER" ? "MEMBER" : String(role || "").toUpperCase();
}

function toSafeId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getActiveByIds(list) {
  return (Array.isArray(list) ? list : []).filter(isActiveRecord);
}

function SectionHeader({ label }) {
  return (
    <div className="col-12 avm-section-col">
      <p className="avm-section-title">{label}</p>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="col-md-3">
      <div className="card h-100">
        <div className="card-body text-center">
          <h3 className="mb-0">{value}</h3>
          <p className="text-muted small mb-0">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Member photo field: lets staff either upload an image file or capture one live
// from the device camera (getUserMedia). On capture the frame is encoded to a JPEG
// File and handed to onFile, which uploads it the same way as a file selection.
function PhotoCaptureField({ label, required, value, href, uploading, onFile }) {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser. Please upload a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch {
      setCameraError("Unable to access the camera. Check permissions or use Upload instead.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onFile(new File([blob], `member-photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
        }
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="col-12">
      <label className="form-label">{label}{required ? " *" : ""}</label>
      <div className="d-flex align-items-start gap-3 flex-wrap">
        <div
          className="border rounded-3 d-flex align-items-center justify-content-center bg-light overflow-hidden"
          style={{ width: 96, height: 96, flex: "0 0 auto" }}
        >
          {value ? (
            <img src={href} alt="Member" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <IconUserCircle size={44} className="text-muted" />
          )}
        </div>
        <div className="flex-grow-1" style={{ minWidth: 220 }}>
          {cameraOn ? (
            <div>
              <video ref={videoRef} playsInline muted style={{ width: "100%", maxWidth: 280, borderRadius: 8, background: "#000" }} />
              <div className="d-flex gap-2 mt-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={capturePhoto}>
                  <IconCamera size={16} className="me-1" /> Capture
                </button>
                <button type="button" className="btn btn-light btn-sm" onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                  e.target.value = "";
                }}
              />
              <button type="button" className="btn btn-outline-primary btn-sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <IconUpload size={16} className="me-1" /> Upload Photo
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" disabled={uploading} onClick={startCamera}>
                <IconCamera size={16} className="me-1" /> Take Photo
              </button>
            </div>
          )}
          <small className="text-muted d-block mt-1">
            {uploading ? "Uploading…" : value ? <a href={href} target="_blank" rel="noreferrer">View photo</a> : "Upload an image or capture one from your camera."}
          </small>
          {cameraError && <small className="text-danger d-block">{cameraError}</small>}
        </div>
      </div>
    </div>
  );
}

export default function User() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const filterQuery = searchParams.get("filter") || "all";
  const [memberFilterTab, setMemberFilterTab] = useState(filterQuery);

  useEffect(() => {
    setMemberFilterTab(filterQuery);
  }, [filterQuery]);

  const currentRole = normalizeRole(currentUser?.role);
  const currentUserId = getCurrentUserId(currentUser);
  const gridView = location.pathname.endsWith("/users-grid");
  const routeViewMode = location.pathname.endsWith("/employees") ? "employees" : "users";
  // The /users route is the members-management page: it only deals with members,
  // so the Employees/Users view switch and the "Add Employee" affordance are hidden
  // there. The /employees page (under Organization Management) keeps both.
  const isMembersPage = routeViewMode === "users";

  const [rows, setRows] = useState([]);
  const [viewMode, setViewMode] = useState(routeViewMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [uploadingField, setUploadingField] = useState("");
  const [dietPlans, setDietPlans] = useState([]);
  const [dietPlansLoading, setDietPlansLoading] = useState(false);
  const [dietAssignTarget, setDietAssignTarget] = useState(null);
  const [dietAssignPlanId, setDietAssignPlanId] = useState("");
  const [dietAssignError, setDietAssignError] = useState("");
  const [dietAssignSaving, setDietAssignSaving] = useState(false);
  const [showDietAssignModal, setShowDietAssignModal] = useState(false);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [workoutPlansLoading, setWorkoutPlansLoading] = useState(false);
  const [workoutAssignTarget, setWorkoutAssignTarget] = useState(null);
  const [workoutAssignPlanId, setWorkoutAssignPlanId] = useState("");
  const [workoutAssignError, setWorkoutAssignError] = useState("");
  const [workoutAssignSaving, setWorkoutAssignSaving] = useState(false);
  const [showWorkoutAssignModal, setShowWorkoutAssignModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileMember, setProfileMember] = useState(null);
  const [profileTab, setProfileTab] = useState("personal");
  const [allTransactions, setAllTransactions] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [memberProgress, setMemberProgress] = useState([]);
  const [memberProgressLoading, setMemberProgressLoading] = useState(false);
  const [allMembershipPlans, setAllMembershipPlans] = useState([]);
  const [allWorkoutPlans, setAllWorkoutPlans] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalError, setModalError] = useState("");
  const [modalTab, setModalTab] = useState("identity");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState(createEmptyForm(getDefaultCreateRole(currentRole)));

  useEffect(() => {
    setViewMode(routeViewMode);
  }, [routeViewMode]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [headOffices, setHeadOffices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [reportingOptions, setReportingOptions] = useState([]);
  const [reportingOptionsLoading, setReportingOptionsLoading] = useState(false);

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef(null);

  const createAvailability = useMemo(() => getCreateRoleAvailability(currentRole), [currentRole]);
  const canCreateAnything = useMemo(() => Object.values(createAvailability).some(Boolean), [createAvailability]);
  const canAssignDietPlan = DIET_ASSIGN_ROLES.has(currentRole);
  const canAssignWorkoutPlan = WORKOUT_ASSIGN_ROLES.has(currentRole);
  const canCreateInCurrentView = useMemo(() => {
    if (viewMode === "users") return Boolean(createAvailability.USER);
    return ROLE_OPTIONS.some((item) => item.value !== "USER" && createAvailability[item.value]);
  }, [createAvailability, viewMode]);

  const modalRole = useMemo(() => normalizeRole(isEdit ? selectedRow?.role : form.role), [isEdit, selectedRow?.role, form.role]);
  const modalSteps = useMemo(() => getModalStepsForRole(modalRole), [modalRole]);
  const isCustomerForm = modalRole === "USER";

  const creatableRolesForCurrentView = useMemo(() => {
    return ROLE_OPTIONS.filter((item) => {
      if (!createAvailability[item.value]) return false;
      return viewMode === "users" ? item.value === "USER" : item.value !== "USER";
    });
  }, [createAvailability, viewMode]);

  const selectedHeadOffice = useMemo(
    () => headOffices.find((item) => String(item.id) === String(form.headOfficeId)) || null,
    [headOffices, form.headOfficeId],
  );

  const selectedBranch = useMemo(
    () => branches.find((item) => String(item.id) === String(form.branchId)) || null,
    [branches, form.branchId],
  );

  const selectedDepartment = useMemo(
    () => departments.find((item) => String(item.id) === String(form.departmentId)) || null,
    [departments, form.departmentId],
  );

  const selectedTeam = useMemo(
    () => teams.find((item) => String(item.id) === String(form.teamId)) || null,
    [teams, form.teamId],
  );

  const selectedTeamTrainer = useMemo(
    () => {
      const matched = getTrainerForTeam(selectedTeam, rows);
      if (matched) return { identity: matched, option: matched };
      return resolveTeamTrainerOption(selectedTeam, reportingOptions);
    },
    [selectedTeam, reportingOptions, rows],
  );

  const selectedTeamTrainerName = selectedTeamTrainer.identity.name || getTeamTrainerLabel(selectedTeam);

  const selectedDesignation = useMemo(
    () => designations.find((item) => String(item.id) === String(form.designationId)) || null,
    [designations, form.designationId],
  );

  const filteredBranches = useMemo(() => {
    const active = getActiveByIds(branches);
    if (!form.headOfficeId) return active;
    return active.filter((item) => String(item.headOfficeId) === String(form.headOfficeId));
  }, [branches, form.headOfficeId]);

  const filteredDepartments = useMemo(() => {
    const active = getActiveByIds(departments);
    if (!form.branchId) return active.filter(Boolean);
    return active.filter((item) => String(item.branchId) === String(form.branchId));
  }, [departments, form.branchId]);

  const filteredTeams = useMemo(() => {
    const active = getActiveByIds(teams);
    if (isCustomerForm) {
      // Members have no Department step, so scope teams to the chosen Branch via
      // each team's parent department.
      if (!form.branchId) return active.filter(Boolean);
      const branchDeptIds = new Set(
        getActiveByIds(departments)
          .filter((item) => String(item.branchId) === String(form.branchId))
          .map((item) => String(item.id)),
      );
      return active.filter((item) => branchDeptIds.has(String(item.departmentId)));
    }
    if (!form.departmentId) return active.filter(Boolean);
    return active.filter((item) => String(item.departmentId) === String(form.departmentId));
  }, [teams, departments, form.departmentId, form.branchId, isCustomerForm]);

  const filteredDesignations = useMemo(() => {
    const active = getActiveByIds(designations);
    if (!form.departmentId) return active.filter(Boolean);
    return active.filter((item) => String(item.departmentId) === String(form.departmentId));
  }, [designations, form.departmentId]);

  const orgPreview = useMemo(() => {
    const parts = [
      selectedHeadOffice?.name,
      selectedBranch?.name,
      // Members don't pick a department (it's derived from the team), so keep it
      // out of their selection preview.
      isCustomerForm ? null : selectedDepartment?.name,
      selectedDesignation?.name,
      selectedTeam?.name,
    ].filter(Boolean);

    return parts.length ? parts.join(" > ") : "Not assigned yet";
  }, [selectedHeadOffice, selectedBranch, selectedDepartment, selectedTeam, selectedDesignation, isCustomerForm]);

  const employeeRows = useMemo(() => rows.filter((item) => normalizeRole(item.role) !== "USER"), [rows]);
  const userRows = useMemo(() => rows.filter((item) => normalizeRole(item.role) === "USER"), [rows]);

  const filteredUserRows = useMemo(() => {
    if (viewMode !== "users") return [];
    return userRows.filter((item) => {
      if (memberFilterTab === "active") {
        const isStatusActive = String(item.status).toUpperCase() === "ACTIVE";
        const isNotFrozen = !item.raw?.isFrozen;
        const hasNotExpired = !item.raw?.membershipExpiry || new Date(item.raw.membershipExpiry) >= new Date(new Date().setHours(0,0,0,0));
        return isStatusActive && isNotFrozen && hasNotExpired;
      }
      if (memberFilterTab === "expired") {
        const isStatusInactive = String(item.status).toUpperCase() === "INACTIVE";
        const hasExpired = item.raw?.membershipExpiry && new Date(item.raw.membershipExpiry) < new Date(new Date().setHours(0,0,0,0));
        return isStatusInactive || hasExpired;
      }
      if (memberFilterTab === "freeze") {
        return Boolean(item.raw?.isFrozen);
      }
      if (memberFilterTab === "renewal") {
        if (!item.raw?.membershipExpiry) return false;
        const expiryDate = new Date(item.raw.membershipExpiry);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= -15 && diffDays <= 15;
      }
      if (memberFilterTab === "referrals") {
        return typeof item.raw?.referredBy === "string" && item.raw.referredBy.trim() !== "";
      }
      return true;
    });
  }, [userRows, memberFilterTab, viewMode]);

  const displayedRows = useMemo(() => (viewMode === "users" ? filteredUserRows : employeeRows), [employeeRows, filteredUserRows, viewMode]);

  const activeRows = useMemo(
    () => displayedRows.filter((item) => String(item.status).toUpperCase() === "ACTIVE"),
    [displayedRows],
  );
  const inactiveRows = useMemo(
    () => displayedRows.filter((item) => String(item.status).toUpperCase() !== "ACTIVE"),
    [displayedRows],
  );

  const roleCounts = useMemo(() => {
    return displayedRows.reduce((acc, item) => {
      const key = normalizeRole(item.role);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [displayedRows]);

  const totalRoles = useMemo(() => Object.keys(roleCounts).length, [roleCounts]);
  const modalStepIndex = useMemo(() => {
    const index = modalSteps.findIndex((item) => item.key === modalTab);
    return index >= 0 ? index : 0;
  }, [modalSteps, modalTab]);
  const modalStepCount = modalSteps.length;
  const isLastModalStep = modalStepIndex === modalStepCount - 1;

  const loadOrgData = async () => {
    setOrgLoading(true);
    try {
      const [ho, br, dep, tm, des] = await Promise.all([
        getAllHeadOffices(),
        getAllBranches(),
        getAllDepartments(),
        getAllTeams(),
        getAllDesignations(),
      ]);

      setHeadOffices(getActiveByIds(ho));
      setBranches(getActiveByIds(br));
      setDepartments(getActiveByIds(dep));
      setTeams(getActiveByIds(tm));
      setDesignations(getActiveByIds(des));
    } catch (e) {
      setModalError(extractApiErrorMessage(e, "Failed to load organization masters"));
    } finally {
      setOrgLoading(false);
    }
  };

  const loadRows = async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError("");

    try {
      const nextRows = [];

      if (currentRole === "SUPER_ADMIN") {
        const [adminsResponse, managersResponse, trainersResponse, customersResponse] = await Promise.all([
          api.get("/users/admins", { params: { requesterId: currentUserId } }),
          api.get("/users/managers", { params: { requesterId: currentUserId } }),
          api.get("/users/trainers", { params: { requesterId: currentUserId } }),
          api.get("/users/customers", { params: { requesterId: currentUserId } }),
        ]);

        const admins = unwrapData(adminsResponse);
        const managers = unwrapData(managersResponse);
        const trainers = unwrapData(trainersResponse);
        const customers = unwrapData(customersResponse);

        if (Array.isArray(admins)) nextRows.push(...admins.map(mapAdminRow));
        if (Array.isArray(managers)) nextRows.push(...managers.map(mapManagerRow));
        if (Array.isArray(trainers)) nextRows.push(...trainers.map(mapTrainerRow));
        if (Array.isArray(customers)) nextRows.push(...customers.map(mapCustomerRow));
      } else if (currentRole === "ADMIN") {
        const [managersResponse, trainersResponse, customersResponse] = await Promise.all([
          api.get("/users/managers", { params: { requesterId: currentUserId } }),
          api.get("/users/trainers", { params: { requesterId: currentUserId } }),
          api.get("/users/customers", { params: { requesterId: currentUserId } }),
        ]);
        const managers = unwrapData(managersResponse);
        const trainers = unwrapData(trainersResponse);
        const customers = unwrapData(customersResponse);
        if (Array.isArray(managers)) nextRows.push(...managers.map(mapManagerRow));
        if (Array.isArray(trainers)) nextRows.push(...trainers.map(mapTrainerRow));
        if (Array.isArray(customers)) nextRows.push(...customers.map(mapCustomerRow));
      } else if (currentRole === "MANAGER") {
        const [trainersResponse, customersResponse] = await Promise.all([
          api.get("/users/trainers", { params: { requesterId: currentUserId } }),
          api.get("/users/customers", { params: { requesterId: currentUserId } }),
        ]);
        const trainers = unwrapData(trainersResponse);
        const customers = unwrapData(customersResponse);
        if (Array.isArray(trainers)) nextRows.push(...trainers.map(mapTrainerRow));
        if (Array.isArray(customers)) nextRows.push(...customers.map(mapCustomerRow));
      } else if (currentRole === "TRAINER") {
        const customersResponse = await api.get(`/users/customers/assigned-to/${currentUserId}`);
        const customers = unwrapData(customersResponse);
        if (Array.isArray(customers)) nextRows.push(...customers.map(mapCustomerRow));
      } else if (currentRole === "USER") {
        const customerResponse = await api.get(`/users/customer/${currentUserId}`, {
          params: { requesterId: currentUserId },
        });
        const customer = unwrapData(customerResponse);
        if (customer) nextRows.push(mapCustomerRow(customer));
      }

      nextRows.sort((a, b) => String(a.role).localeCompare(String(b.role)) || String(a.name).localeCompare(String(b.name)));
      setRows(nextRows);
    } catch (e) {
      setRows([]);
      setError(extractApiErrorMessage(e, "Failed to load records"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgData();
    const fetchPlans = async () => {
      try {
        const [mPlans, wPlans] = await Promise.all([
          getMembershipPlans({ activeOnly: true }),
          getWorkoutPlans()
        ]);
        setAllMembershipPlans(mPlans);
        setAllWorkoutPlans(wPlans);
      } catch (err) {
        console.error("Failed to load plans", err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    loadRows();
  }, [currentUserId, currentRole]);

  useEffect(() => {
    if (!currentUserId || viewMode !== "users") return;
    const fetchLogs = async () => {
      try {
        const [transactionsRes, attendanceRes] = await Promise.allSettled([
          api.get("/billing/transactions"),
          api.get("/attendance")
        ]);
        if (transactionsRes.status === "fulfilled") {
          setAllTransactions(transactionsRes.value?.data?.data || []);
        }
        if (attendanceRes.status === "fulfilled") {
          setAllAttendance(attendanceRes.value?.data?.data || []);
        }
      } catch (e) {
        console.error("Failed to load logs for profile modal", e);
      }
    };
    fetchLogs();
  }, [currentUserId, viewMode]);

  useEffect(() => {
    if (!showDietAssignModal) return;

    let cancelled = false;

    const loadDietPlansForAssignment = async () => {
      setDietPlansLoading(true);
      setDietAssignError("");
      try {
        const response = await api.get("/diet-plans");
        const data = unwrapData(response);
        if (!cancelled) {
          setDietPlans(Array.isArray(data) ? data.map(normalizeDietPlan).filter(Boolean) : []);
        }
      } catch (err) {
        if (!cancelled) {
          setDietPlans([]);
          setDietAssignError(extractApiErrorMessage(err, "Failed to load diet plans"));
        }
      } finally {
        if (!cancelled) {
          setDietPlansLoading(false);
        }
      }
    };

    loadDietPlansForAssignment();

    return () => {
      cancelled = true;
    };
  }, [showDietAssignModal]);

  useEffect(() => {
    if (!showWorkoutAssignModal) return;

    let cancelled = false;

    const loadWorkoutPlansForAssignment = async () => {
      setWorkoutPlansLoading(true);
      setWorkoutAssignError("");
      try {
        const data = await getWorkoutPlans();
        if (!cancelled) {
          setWorkoutPlans(Array.isArray(data) ? data.map(normalizeWorkoutPlan).filter(Boolean) : []);
        }
      } catch (err) {
        if (!cancelled) {
          setWorkoutPlans([]);
          setWorkoutAssignError(extractApiErrorMessage(err, "Failed to load workout plans"));
        }
      } finally {
        if (!cancelled) {
          setWorkoutPlansLoading(false);
        }
      }
    };

    loadWorkoutPlansForAssignment();
    return () => {
      cancelled = true;
    };
  }, [showWorkoutAssignModal]);

  useEffect(() => {
    const role = normalizeRole(isEdit ? selectedRow?.role : form.role);
    if (!showModal || !currentUserId || !["ADMIN", "MANAGER", "TRAINER"].includes(role)) {
      setReportingOptions([]);
      return;
    }

    let cancelled = false;
    const loadReportingOptions = async () => {
      setReportingOptionsLoading(true);
      try {
        const response = await api.get("/users/reporting-options", {
          params: {
            role,
            branchId: toSafeId(form.branchId),
            requesterId: currentUserId,
          },
        });
        if (!cancelled) {
          const options = unwrapData(response);
          setReportingOptions(Array.isArray(options) ? options : []);
        }
      } catch (err) {
        if (!cancelled) setReportingOptions([]);
      } finally {
        if (!cancelled) setReportingOptionsLoading(false);
      }
    };

    loadReportingOptions();
    return () => {
      cancelled = true;
    };
  }, [showModal, isEdit, selectedRow?.role, form.role, form.branchId, currentUserId]);

  useEffect(() => {
    if (!showModal || !isCustomerForm || !form.teamId) return;

    const resolved = getTrainerForTeam(selectedTeam, rows) || resolveTeamTrainerOption(selectedTeam, reportingOptions);
    if (!resolved.identity?.id && !resolved.identity?.name && !resolved.option?.id && !resolved.option?.name) return;

    setForm((prev) => {
      const nextReportsToId = resolved.option ? String(resolved.option.id) : String(resolved.identity?.id || "");
      const nextReportingManagerName = resolved.option?.name || resolved.identity?.name || "";

      if (
        String(prev.reportsToId || "") === nextReportsToId &&
        String(prev.reportingManagerName || "") === nextReportingManagerName
      ) {
        return prev;
      }

      return {
        ...prev,
        reportsToId: nextReportsToId,
        assignedTrainerId: nextReportsToId,
        reportingManagerName: nextReportingManagerName,
      };
    });
  }, [showModal, isCustomerForm, form.teamId, selectedTeam, reportingOptions, rows]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setCountryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const openAdd = () => {
    if (!canCreateInCurrentView) {
      setError(`Your current role cannot create ${viewMode === "users" ? "members" : "employees"} from this page.`);
      return;
    }

    const defaultRole = viewMode === "users" && createAvailability.USER ? "USER" : getDefaultCreateRole(currentRole);
    setForm(createEmptyForm(defaultRole));
    setSelectedRow(null);
    setIsEdit(false);
    setModalError("");
    setModalTab("identity");
    setCountrySearch("");
    setCountryDropdownOpen(false);
    setShowModal(true);
  };

  const openEdit = (row) => {
    const split = splitName(row?.name);
    const org = row?.raw || {};
    const orgVisibility = getOrganizationVisibility(row?.role);
    const teamForEdit = orgVisibility.team && org?.teamId
      ? teams.find((item) => String(item.id) === String(org.teamId)) || null
      : null;
    const resolvedTrainerForEdit = teamForEdit
      ? getTrainerForTeam(teamForEdit, rows) || resolveTeamTrainerOption(teamForEdit, reportingOptions)
      : null;
    const resolvedTrainerId =
      String(org?.assignedTrainerId || org?.reportsToId || resolvedTrainerForEdit?.option?.id || resolvedTrainerForEdit?.identity?.id || "").
        trim();
    const resolvedTrainerName =
      String(org?.assignedTrainerName || org?.reportsToName || resolvedTrainerForEdit?.option?.name || resolvedTrainerForEdit?.identity?.name || "").
        trim();

    setForm({
      ...createEmptyForm(row?.role || "ADMIN"),
      role: row?.role || "ADMIN",
      email: row?.email || "",
      password: "",
      firstName: split.firstName,
      lastName: split.lastName,
      name: row?.name || "",
      phone: row?.phone || "",
      countryCode: row?.countryCode || "+91",
      employeeCode: row?.employeeCode || "",
      departmentText: row?.department || "",
      qualification: row?.qualification || "",
      specialization: org?.specialization || row?.department || "",
      experienceYears: org?.experienceYears ?? "",
      certification: org?.certification || "",
      ratePerHour: org?.ratePerHour ?? "",
      weight: org?.weight ?? "",
      height: org?.height ?? "",
      bodyFat: org?.bodyFat ?? "",
      isFrozen: org?.isFrozen ?? false,
      referredBy: org?.referredBy || "",
      membershipPlanId: org?.membershipPlanId ? String(org.membershipPlanId) : "",
      membershipAccessStartTime: org?.accessStartTime || "06:00",
      membershipAccessEndTime: org?.accessEndTime || "22:00",
      membershipMonths: "",
      workoutPlanId: org?.assignedWorkoutPlanId ? String(org.assignedWorkoutPlanId) : "",
      bloodGroup: org?.bloodGroup || "",
      age: org?.age ?? "",
      gender: org?.gender || "",
      address: org?.address || "",
      city: org?.city || "",
      medicalConditions: org?.medicalConditions || "",
      emergencyContact: org?.emergencyContact || "",
      emergencyPhone: org?.emergencyPhone || "",
      status: String(row?.status || "ACTIVE").toUpperCase(),
      headOfficeId: org?.headOfficeId ? String(org.headOfficeId) : "",
      branchId: orgVisibility.branch && org?.branchId ? String(org.branchId) : "",
      departmentId: orgVisibility.department && org?.departmentId ? String(org.departmentId) : "",
      teamId: orgVisibility.team && org?.teamId ? String(org.teamId) : "",
      designationId: orgVisibility.designation && org?.designationId ? String(org.designationId) : "",
      joinDate: toDateInputValue(org?.joinDate),
      bio: org?.bio || "",
      dateOfBirth: toDateInputValue(org?.dateOfBirth),
      personalEmail: org?.personalEmail || "",
      alternatePhone: org?.alternatePhone || "",
      currentAddress: org?.currentAddress || "",
      permanentAddress: org?.permanentAddress || "",
      state: org?.state || "",
      pincode: org?.pincode || "",
      employmentType: org?.employmentType || "",
      workLocation: org?.workLocation || "",
      reportingManagerName: resolvedTrainerName || org?.reportingManagerName || "",
      reportsToId: resolvedTrainerId,
      assignedTrainerId: resolvedTrainerId,
      fatherName: org?.fatherName || "",
      motherName: org?.motherName || "",
      maritalStatus: org?.maritalStatus || "",
      spouseName: org?.spouseName || "",
      location: org?.location || "",
      probationEndDate: toDateInputValue(org?.probationEndDate),
      panNumber: org?.panNumber || "",
      aadharNumber: org?.aadharNumber || "",
      bankName: org?.bankName || "",
      bankAccountNumber: org?.bankAccountNumber || "",
      bankIfscCode: org?.bankIfscCode || "",
      bankAccountType: org?.bankAccountType || "",
      bankAccountHolderName: org?.bankAccountHolderName || "",
      bankBranch: org?.bankBranch || "",
      qualificationDocumentPath: org?.qualificationDocumentPath || "",
      certificationDocumentPath: org?.certificationDocumentPath || "",
      idProofDocumentPath: org?.idProofDocumentPath || org?.idProofPath || "",
      addressProofDocumentPath: org?.addressProofDocumentPath || "",
      resumeDocumentPath: org?.resumeDocumentPath || "",
      offerLetterDocumentPath: org?.offerLetterDocumentPath || "",
      candidatePhotoPath: org?.candidatePhotoPath || org?.photoPath || "",
      aadharCardDocumentPath: org?.aadharCardDocumentPath || "",
      panCardDocumentPath: org?.panCardDocumentPath || "",
      bankDocumentPath: org?.bankDocumentPath || "",
      previousEmployment1: org?.previousEmployment1 || "",
      previousEmployment2: org?.previousEmployment2 || "",
      experienceCertificateDocumentPath: org?.experienceCertificateDocumentPath || "",
      courseCertificatePath: org?.courseCertificatePath || "",
      educationCertificatePath: org?.educationCertificatePath || "",
      emergencyContactRelationship: org?.emergencyContactRelationship || "",
      emergencyContactName2: org?.emergencyContactName2 || "",
      emergencyContactRelationship2: org?.emergencyContactRelationship2 || "",
      emergencyPhone2: org?.emergencyPhone2 || "",
      referenceName1: org?.referenceName1 || "",
      referencePhone1: org?.referencePhone1 || "",
      referenceName2: org?.referenceName2 || "",
      referencePhone2: org?.referencePhone2 || "",
      joiningBranchName: org?.joiningBranchName || "",
      sourcePlatform: org?.sourcePlatform || "",
      pfUan: org?.pfUan || "",
      esiNumber: org?.esiNumber || "",
      declarationDate: toDateInputValue(org?.declarationDate),
      declarationPlace: org?.declarationPlace || "",
    });

    setSelectedRow(row);
    setIsEdit(true);
    setModalError("");
    setModalTab("identity");
    setCountrySearch("");
    setCountryDropdownOpen(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowPassword(false);
    setModalError("");
    setModalTab("identity");
  };

  const openDietAssignModal = (row) => {
    if (!canAssignDietPlan || normalizeRole(row?.role) !== "USER") {
      return;
    }

    setDietAssignTarget(row);
    // Preselect the member's current diet plan so admins/trainers can see and
    // change what's already assigned.
    setDietAssignPlanId(row?.assignedDietPlanId ? String(row.assignedDietPlanId) : "");
    setDietAssignError("");
    setShowDietAssignModal(true);
  };

  const openWorkoutAssignModal = (row) => {
    if (!canAssignWorkoutPlan || normalizeRole(row?.role) !== "USER") {
      return;
    }

    setWorkoutAssignTarget(row);
    // Preselect the member's current workout plan so it's visible and editable.
    setWorkoutAssignPlanId(row?.assignedWorkoutPlanId ? String(row.assignedWorkoutPlanId) : "");
    setWorkoutAssignError("");
    setShowWorkoutAssignModal(true);
  };

  const closeDietAssignModal = () => {
    setShowDietAssignModal(false);
    setDietAssignTarget(null);
    setDietAssignPlanId("");
    setDietAssignError("");
    setDietPlans([]);
  };

  const handleDietAssignSubmit = async () => {
    if (!dietAssignTarget?.id || !dietAssignPlanId) {
      setDietAssignError("Please choose a diet plan first.");
      return;
    }

    setDietAssignSaving(true);
    setDietAssignError("");
    try {
      await api.put(`/users/${dietAssignTarget.id}/assign-diet/${dietAssignPlanId}`);
      setNotice("Diet plan assigned successfully");
      closeDietAssignModal();
      await loadRows();
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? "You do not have permission to assign a diet plan to this member."
          : extractApiErrorMessage(err, "Failed to assign diet plan");
      setDietAssignError(message);
    } finally {
      setDietAssignSaving(false);
    }
  };

  const closeWorkoutAssignModal = () => {
    setShowWorkoutAssignModal(false);
    setWorkoutAssignTarget(null);
    setWorkoutAssignPlanId("");
    setWorkoutAssignError("");
    setWorkoutPlans([]);
  };

  const handleWorkoutAssignSubmit = async () => {
    if (!workoutAssignTarget?.id || !workoutAssignPlanId) {
      setWorkoutAssignError("Please choose a workout plan first.");
      return;
    }

    setWorkoutAssignSaving(true);
    setWorkoutAssignError("");
    try {
      await assignWorkoutPlan(workoutAssignTarget.id, workoutAssignPlanId);
      setNotice("Workout plan assigned successfully");
      closeWorkoutAssignModal();
      await loadRows();
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? "You do not have permission to assign a workout plan to this member."
          : extractApiErrorMessage(err, "Failed to assign workout plan");
      setWorkoutAssignError(message);
    } finally {
      setWorkoutAssignSaving(false);
    }
  };

  const goToNextModalStep = () => {
    setModalError("");
    if (modalStepIndex < modalStepCount - 1) {
      setModalTab(USER_MODAL_STEPS[modalStepIndex + 1].key);
    }
  };

  const goToPreviousModalStep = () => {
    setModalError("");
    if (modalStepIndex > 0) {
      setModalTab(USER_MODAL_STEPS[modalStepIndex - 1].key);
    }
  };

  const buildSharedPayload = () => {
    const normalizedCountryCode = ensureCountryCodeValue(form.countryCode);
    const option = getCountryOptionByValue(normalizedCountryCode);
    const lengths = getCountryAllowedLengths(normalizedCountryCode);
    const digits = sanitizePhoneDigits(form.phone, option?.maxLength, lengths);
    const fullPhone = digits ? `${normalizedCountryCode}${digits}` : "";
    const split = splitName(form.name || [form.firstName, form.lastName].filter(Boolean).join(" "));

    return {
      email: form.email.trim(),
      password: form.password.trim(),
      firstName: split.firstName.trim(),
      lastName: split.lastName.trim(),
      name: [split.firstName.trim(), split.lastName.trim()].filter(Boolean).join(" "),
      phone: fullPhone,
      headOfficeId: toSafeId(form.headOfficeId),
      branchId: toSafeId(form.branchId),
      departmentId: toSafeId(form.departmentId),
      teamId: toSafeId(form.teamId),
      designationId: toSafeId(form.designationId),
      departmentName: selectedDepartment?.name || form.departmentText.trim() || "",
      orgPreview,
    };
  };

  const buildEmployeeExtras = () => {
    const text = (value) => (typeof value === "string" ? value.trim() : "");

    return {
      dateOfBirth: form.dateOfBirth || null,
      gender: text(form.gender) || null,
      bloodGroup: text(form.bloodGroup) || null,
      personalEmail: text(form.personalEmail) || null,
      alternatePhone: text(form.alternatePhone) || null,
      emergencyContact: text(form.emergencyContact) || null,
      emergencyPhone: text(form.emergencyPhone) || null,
      currentAddress: text(form.currentAddress) || null,
      permanentAddress: text(form.permanentAddress) || null,
      city: text(form.city) || null,
      state: text(form.state) || null,
      pincode: text(form.pincode) || null,
      employmentType: text(form.employmentType) || null,
      workLocation: text(form.workLocation) || null,
      reportingManagerName: reportingOptions.find((item) => String(item.id) === String(form.reportsToId))?.name || null,
      reportsToId: toSafeId(form.reportsToId),
      fatherName: text(form.fatherName) || null,
      motherName: text(form.motherName) || null,
      maritalStatus: text(form.maritalStatus) || null,
      spouseName: text(form.spouseName) || null,
      location: text(form.location) || null,
      probationEndDate: form.probationEndDate || null,
      panNumber: text(form.panNumber) || null,
      aadharNumber: text(form.aadharNumber) || null,
      bankName: text(form.bankName) || null,
      bankAccountNumber: text(form.bankAccountNumber) || null,
      bankIfscCode: text(form.bankIfscCode) || null,
      bankAccountType: text(form.bankAccountType) || null,
      bankAccountHolderName: text(form.bankAccountHolderName) || null,
      bankBranch: text(form.bankBranch) || null,
      qualificationDocumentPath: text(form.qualificationDocumentPath) || null,
      certificationDocumentPath: text(form.certificationDocumentPath) || null,
      idProofDocumentPath: text(form.idProofDocumentPath) || null,
      addressProofDocumentPath: text(form.addressProofDocumentPath) || null,
      resumeDocumentPath: text(form.resumeDocumentPath) || null,
      offerLetterDocumentPath: text(form.offerLetterDocumentPath) || null,
      candidatePhotoPath: text(form.candidatePhotoPath) || null,
      aadharCardDocumentPath: text(form.aadharCardDocumentPath) || null,
      panCardDocumentPath: text(form.panCardDocumentPath) || null,
      bankDocumentPath: text(form.bankDocumentPath) || null,
      previousEmployment1: text(form.previousEmployment1) || null,
      previousEmployment2: text(form.previousEmployment2) || null,
      experienceCertificateDocumentPath: text(form.experienceCertificateDocumentPath) || null,
      courseCertificatePath: text(form.courseCertificatePath) || null,
      educationCertificatePath: text(form.educationCertificatePath) || null,
      emergencyContactRelationship: text(form.emergencyContactRelationship) || null,
      emergencyContactName2: text(form.emergencyContactName2) || null,
      emergencyContactRelationship2: text(form.emergencyContactRelationship2) || null,
      emergencyPhone2: text(form.emergencyPhone2) || null,
      referenceName1: text(form.referenceName1) || null,
      referencePhone1: text(form.referencePhone1) || null,
      referenceName2: text(form.referenceName2) || null,
      referencePhone2: text(form.referencePhone2) || null,
      joiningBranchName: text(form.joiningBranchName) || null,
      sourcePlatform: text(form.sourcePlatform) || null,
      pfUan: text(form.pfUan) || null,
      esiNumber: text(form.esiNumber) || null,
      declarationDate: form.declarationDate || null,
      declarationPlace: text(form.declarationPlace) || null,
    };
  };

  const buildCreateRequest = () => {
    const role = normalizeRole(form.role);
    const shared = buildSharedPayload();

    if (role === "SUPER_ADMIN") {
      return {
        endpoint: "/users/super-admin",
        params: { creatorId: currentUserId },
        payload: {
          email: shared.email,
          password: shared.password,
          firstName: shared.firstName,
          lastName: shared.lastName,
        },
      };
    }

    if (role === "ADMIN") {
      return {
        endpoint: "/users/admin",
        params: { creatorId: currentUserId },
      payload: {
        email: shared.email,
        password: shared.password,
        firstName: shared.firstName,
        lastName: shared.lastName,
        department: shared.departmentName,
        phone: shared.phone,
        employeeId: generateEmployeeCode(role, form.employeeCode),
        qualification: form.qualification.trim() || "N/A",
        joinDate: form.joinDate || null,
        headOfficeId: shared.headOfficeId,
        branchId: shared.branchId,
          departmentId: shared.departmentId,
          teamId: shared.teamId,
          designationId: shared.designationId,
          ...buildEmployeeExtras(),
        },
      };
    }

    if (role === "MANAGER") {
      return {
        endpoint: "/users/manager",
        params: { creatorId: currentUserId },
      payload: {
        email: shared.email,
        password: shared.password,
        firstName: shared.firstName,
        lastName: shared.lastName,
        department: shared.departmentName,
        phone: shared.phone,
        employeeId: generateEmployeeCode(role, form.employeeCode),
        qualification: form.qualification.trim() || "N/A",
        joinDate: form.joinDate || null,
        headOfficeId: shared.headOfficeId,
        branchId: shared.branchId,
          departmentId: shared.departmentId,
          teamId: shared.teamId,
          designationId: shared.designationId,
          ...buildEmployeeExtras(),
        },
      };
    }

    if (role === "TRAINER") {
      return {
        endpoint: "/users/trainer",
        params: { creatorId: currentUserId },
        payload: {
          email: shared.email,
          password: shared.password,
          firstName: shared.firstName,
          lastName: shared.lastName,
          specialization: form.specialization.trim() || shared.departmentName || "General Training",
          experienceYears: Number(form.experienceYears) || 0,
          certification: form.certification.trim() || "N/A",
          phone: shared.phone,
          qualification: form.qualification.trim() || "N/A",
          ratePerHour: Number(form.ratePerHour) || 0,
          languages: form.languages.trim() || null,
          rating: form.rating === "" ? null : Number(form.rating),
          totalClientsTrained: form.totalClientsTrained === "" ? null : Number(form.totalClientsTrained),
          joinDate: form.joinDate || null,
          headOfficeId: shared.headOfficeId,
          branchId: shared.branchId,
          departmentId: shared.departmentId,
          teamId: shared.teamId,
          designationId: shared.designationId,
          ...buildEmployeeExtras(),
        },
      };
    }

    if (role === "USER") {
      return {
        endpoint: "/users/customer/by-trainer",
        params: { trainerId: currentUserId },
        payload: {
          email: shared.email,
          password: shared.password,
          firstName: shared.firstName,
          lastName: shared.lastName,
          weight: Number(form.weight) || 0,
          height: Number(form.height) || 0,
          bloodGroup: form.bloodGroup || "O+",
          age: Number(form.age) || 0,
          gender: form.gender || "Prefer not to say",
          phone: shared.phone,
          address: form.address.trim() || "",
          city: form.city.trim() || "",
          medicalConditions: form.medicalConditions.trim() || null,
          emergencyContact: form.emergencyContact.trim() || "",
          emergencyPhone: form.emergencyPhone.trim() || "",
          headOfficeId: shared.headOfficeId,
          branchId: shared.branchId,
          departmentId: shared.departmentId,
          teamId: shared.teamId,
          designationId: shared.designationId,
          assignedTrainerId: toSafeId(selectedTeamTrainer?.option?.id || selectedTeamTrainer?.identity?.id || form.assignedTrainerId),
          photoPath: (form.candidatePhotoPath || "").trim() || null,
          idProofPath: (form.idProofDocumentPath || "").trim() || null,
          bodyFat: form.bodyFat === "" || form.bodyFat === null ? null : Number(form.bodyFat),
          isFrozen: Boolean(form.isFrozen),
          referredBy: (form.referredBy || "").trim() || null,
        },
      };
    }

    throw new Error(
      `${role} creation is not available in the current backend. Add the matching user endpoint before enabling this role.`,
    );
  };

  const buildUpdateRequest = () => {
    const role = normalizeRole(selectedRow?.role);
    const shared = buildSharedPayload();

    if (role === "SUPER_ADMIN") {
      return {
        endpoint: `/users/super-admin/${selectedRow.id}`,
        params: { updaterId: currentUserId },
        payload: {
          email: shared.email,
          password: form.password.trim() || "Temp@123",
        keepPassword: !form.password.trim(),
          firstName: shared.firstName,
          lastName: shared.lastName,
        },
      };
    }

    if (role === "ADMIN") {
      return {
        endpoint: `/users/admin/${selectedRow.id}`,
        params: { updaterId: currentUserId },
      payload: {
        email: shared.email,
        password: form.password.trim() || "Temp@123",
        keepPassword: !form.password.trim(),
        firstName: shared.firstName,
        lastName: shared.lastName,
        department: shared.departmentName,
        phone: shared.phone,
        employeeId: generateEmployeeCode(role, form.employeeCode),
        qualification: form.qualification.trim() || "N/A",
        joinDate: form.joinDate || null,
        headOfficeId: shared.headOfficeId,
        branchId: shared.branchId,
          departmentId: shared.departmentId,
          teamId: shared.teamId,
          designationId: shared.designationId,
          ...buildEmployeeExtras(),
        },
      };
    }

    if (role === "MANAGER") {
      return {
        endpoint: `/users/manager/${selectedRow.id}`,
        params: { updaterId: currentUserId },
      payload: {
        email: shared.email,
        password: form.password.trim() || "Temp@123",
        keepPassword: !form.password.trim(),
        firstName: shared.firstName,
        lastName: shared.lastName,
        department: shared.departmentName,
        phone: shared.phone,
        employeeId: generateEmployeeCode(role, form.employeeCode),
        qualification: form.qualification.trim() || "N/A",
        joinDate: form.joinDate || null,
        headOfficeId: shared.headOfficeId,
        branchId: shared.branchId,
          departmentId: shared.departmentId,
          teamId: shared.teamId,
          designationId: shared.designationId,
          ...buildEmployeeExtras(),
        },
      };
    }

    if (role === "TRAINER") {
      return {
        endpoint: `/users/trainer/${selectedRow.id}`,
        params: { updaterId: currentUserId },
        payload: {
          email: shared.email,
          password: form.password.trim() || "Temp@123",
        keepPassword: !form.password.trim(),
          firstName: shared.firstName,
          lastName: shared.lastName,
          specialization: form.specialization.trim() || shared.departmentName || "General Training",
          experienceYears: Number(form.experienceYears) || 0,
          certification: form.certification.trim() || "N/A",
          phone: shared.phone,
          qualification: form.qualification.trim() || "N/A",
          ratePerHour: Number(form.ratePerHour) || 0,
          languages: form.languages.trim() || null,
          rating: form.rating === "" ? null : Number(form.rating),
          totalClientsTrained: form.totalClientsTrained === "" ? null : Number(form.totalClientsTrained),
          joinDate: form.joinDate || null,
          headOfficeId: shared.headOfficeId,
          branchId: shared.branchId,
          departmentId: shared.departmentId,
          teamId: shared.teamId,
          designationId: shared.designationId,
          ...buildEmployeeExtras(),
        },
      };
    }

    if (role === "USER") {
      return {
        endpoint: `/users/customer/${selectedRow.id}`,
        params: { updaterId: currentUserId },
        payload: {
          email: shared.email,
          firstName: shared.firstName,
          lastName: shared.lastName,
          password: form.password.trim() || null,
          weight: Number(form.weight) || 0,
          height: Number(form.height) || 0,
          bloodGroup: form.bloodGroup || "O+",
          age: Number(form.age) || 0,
          gender: form.gender || "Prefer not to say",
          phone: shared.phone,
          address: form.address.trim() || "",
          city: form.city.trim() || "",
          medicalConditions: form.medicalConditions.trim() || null,
          emergencyContact: form.emergencyContact.trim() || "",
          emergencyPhone: form.emergencyPhone.trim() || "",
          headOfficeId: shared.headOfficeId,
          branchId: shared.branchId,
          departmentId: shared.departmentId,
          teamId: shared.teamId,
          designationId: shared.designationId,
          assignedTrainerId: toSafeId(selectedTeamTrainer?.option?.id || selectedTeamTrainer?.identity?.id || form.assignedTrainerId),
          photoPath: (form.candidatePhotoPath || "").trim() || null,
          idProofPath: (form.idProofDocumentPath || "").trim() || null,
          bodyFat: form.bodyFat === "" || form.bodyFat === null ? null : Number(form.bodyFat),
          isFrozen: Boolean(form.isFrozen),
          referredBy: (form.referredBy || "").trim() || null,
        },
      };
    }

    throw new Error(`${role} records are not editable from this page until the backend exposes that route.`);
  };

  const validateForm = () => {
    const role = normalizeRole(isEdit ? selectedRow?.role : form.role);

    if (!role) return "Please select a role";
    if (!form.email.trim()) return "Email is required";
    if (!isEdit && !form.password.trim()) return "Password is required";
    if (!isEdit && role === "SUPER_ADMIN" && form.password.trim().length < 8) {
      return "Super Admin password must be at least 8 characters";
    }
    if (
      !isEdit &&
      ["ADMIN", "MANAGER", "TRAINER"].includes(role) &&
      !STAFF_PASSWORD_PATTERN.test(form.password.trim())
    ) {
      return "Password must contain uppercase, lowercase, digit, and special character";
    }
    if (isEdit && role === "SUPER_ADMIN" && !form.password.trim()) {
      return "Password is required when updating a Super Admin";
    }
    if (isEdit && role === "SUPER_ADMIN" && form.password.trim().length < 8) {
      return "Super Admin password must be at least 8 characters";
    }
    if (
      isEdit &&
      ["ADMIN", "MANAGER", "TRAINER"].includes(role) &&
      form.password.trim() &&
      !STAFF_PASSWORD_PATTERN.test(form.password.trim())
    ) {
      return "Password must contain uppercase, lowercase, digit, and special character";
    }
    if (!form.name.trim()) return "Name is required";
    if (form.name.trim().length < 2) return "Name must be at least 2 characters";

    if (form.phone) {
      const phoneValidation = validatePhoneNumber(form.phone, form.countryCode);
      if (phoneValidation) return phoneValidation;
    }

    if (!isEdit && !currentUserId) return "Current user is not available for this action";

    if (role === "ADMIN" || role === "MANAGER") {
      const label = role === "ADMIN" ? "Admin" : "Manager";
      if (!form.qualification.trim()) return `Qualification is required for ${label}`;
      if (!form.departmentId && !form.departmentText.trim()) return `Department is required for ${label}`;
    }

    if (role === "TRAINER") {
      if (!form.specialization.trim()) return "Specialization is required for Trainer";
      if (!String(form.experienceYears).trim()) return "Experience years is required for Trainer";
      if (!form.certification.trim()) return "Certification is required for Trainer";
      if (!form.qualification.trim()) return "Qualification is required for Trainer";
      if (!String(form.ratePerHour).trim()) return "Rate per hour is required for Trainer";
    }

    if (role === "USER") {
      if (!selectedTeamTrainer?.identity?.id && !selectedTeamTrainer?.option?.id && !form.assignedTrainerId) {
        return "Team trainer is required for Member";
      }
      if (!String(form.weight).trim()) return "Weight is required for Member";
      if (!String(form.height).trim()) return "Height is required for Member";
      if (!form.bloodGroup.trim()) return "Blood group is required for Member";
      if (!String(form.age).trim()) return "Age is required for Member";
      if (!form.gender.trim()) return "Gender is required for Member";
      if (!form.address.trim()) return "Address is required for Member";
      if (!form.city.trim()) return "City is required for Member";
      if (!form.emergencyContact.trim()) return "Emergency contact is required for Member";
      if (!form.emergencyPhone.trim()) return "Emergency phone is required for Member";
      if (!form.candidatePhotoPath) return "Member photo is required (upload or take a photo)";
      if (!form.idProofDocumentPath) return "ID proof is required for Member";
    }

    const orgVisibility = getOrganizationVisibility(role);

    if (role === "ADMIN") {
      if (!form.headOfficeId) return "Head office is required for Admin";
      if (!form.branchId) return "Branch is required for Admin";
      return null;
    }

    if (role === "MANAGER") {
      if (!form.headOfficeId) return "Head office is required for Manager";
      if (!form.branchId) return "Branch is required for Manager";
      if (!form.departmentId) return "Department is required for Manager";
      return null;
    }

    if (role === "TRAINER") {
      if (!form.headOfficeId) return "Head office is required for Trainer";
      if (!form.branchId) return "Branch is required for Trainer";
      if (!form.departmentId) return "Department is required for Trainer";
      if (!form.teamId) return "Team is required for Trainer";
      return null;
    }

    if (!form.headOfficeId && !form.branchId && !form.departmentId && !form.teamId && !form.designationId) {
      return null;
    }

    if (orgVisibility.branch && form.branchId && !form.headOfficeId) return "Select a head office before choosing a branch";
    if (orgVisibility.department && form.departmentId && !form.branchId) return "Select a branch before choosing a department";
    if (orgVisibility.designation && form.designationId && !form.departmentId) return "Select a department before choosing a designation";

    return null;
  };

  const handleSubmit = async () => {
    setModalError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setModalError(validationMessage);
      const lowerMessage = validationMessage.toLowerCase();
      setModalTab(
        lowerMessage.includes("office") ||
        lowerMessage.includes("branch") ||
        lowerMessage.includes("department") ||
        lowerMessage.includes("team") ||
        lowerMessage.includes("designation")
          ? "organization"
          : lowerMessage.includes("address") ||
              lowerMessage.includes("city") ||
              lowerMessage.includes("emergency")
            ? "personal"
            : lowerMessage.includes("weight") ||
                lowerMessage.includes("height") ||
                lowerMessage.includes("blood") ||
                lowerMessage.includes("age") ||
                lowerMessage.includes("gender")
              ? "details"
              : "identity",
      );
      return;
    }

    const targetRole = normalizeRole(isEdit ? selectedRow?.role : form.role);
    if (!isEdit && !createAvailability[targetRole]) {
      setModalError(
        `${targetRole} creation is currently not enabled for your logged-in role. The backend exposes only the supported create routes.`,
      );
      setModalTab("identity");
      return;
    }

    setSaving(true);
    try {
      const request = isEdit ? buildUpdateRequest() : buildCreateRequest();

      const response = await api.request({
        method: isEdit ? "put" : "post",
        url: request.endpoint,
        params: request.params,
        data: request.payload,
      });

      const member = response?.data?.data;
      const memberId = isEdit ? selectedRow?.id : member?.id;

      if (memberId && targetRole === "USER") {
        // 1. Assign Membership Plan if selected
        if (form.membershipPlanId) {
          const planPayload = {
            planId: Number(form.membershipPlanId),
            accessStartTime: form.membershipAccessStartTime || "06:00",
            accessEndTime: form.membershipAccessEndTime || "22:00",
            months: form.membershipMonths ? Number(form.membershipMonths) : null,
          };
          await assignMembership(memberId, planPayload);
        }

        // 2. Assign Workout Plan if selected
        if (form.workoutPlanId) {
          await assignWorkoutPlan(memberId, Number(form.workoutPlanId));
        }
      }

      const noun = targetRole === "USER" ? "Member" : "Employee";
      setNotice(isEdit ? `${noun} updated successfully` : `${noun} added successfully`);
      setShowModal(false);
      setSelectedRow(null);
      setForm(createEmptyForm(getDefaultCreateRole(currentRole)));
      await loadRows();
    } catch (e) {
      setModalError(extractApiErrorMessage(e, "Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;

    setSaving(true);
    setError("");

    try {
      const role = normalizeRole(deleteTarget.role);
      let request;

      if (role === "SUPER_ADMIN") {
        request = { method: "delete", url: `/users/super-admin/${deleteTarget.id}`, params: { deleterId: currentUserId } };
      } else if (role === "ADMIN") {
        request = { method: "delete", url: `/users/admin/${deleteTarget.id}`, params: { deleterId: currentUserId } };
      } else if (role === "MANAGER") {
        request = { method: "delete", url: `/users/manager/${deleteTarget.id}`, params: { deleterId: currentUserId } };
      } else if (role === "TRAINER") {
        request = { method: "delete", url: `/users/trainer/${deleteTarget.id}`, params: { deleterId: currentUserId } };
      } else if (role === "USER") {
        request = { method: "delete", url: `/users/customer/${deleteTarget.id}`, params: { deleterId: currentUserId } };
      } else {
        throw new Error(`${role} records cannot be deleted from this page until the backend exposes that route.`);
      }

      await api.request(request);
      setNotice("Employee deleted successfully");
      setDeleteTarget(null);
      await loadRows();
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to delete employee"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (row) => {
    if (!row?.id || togglingId) return;
    const nextActive = row.status !== "ACTIVE";
    setTogglingId(row.id);
    setError("");
    try {
      await api.put(`/users/${row.id}/status`, null, {
        params: { active: nextActive, updaterId: currentUserId },
      });
      {
        const noun = normalizeRole(row.role) === "USER" ? "Member" : "Employee";
        setNotice(nextActive ? `${noun} activated` : `${noun} deactivated`);
      }
      await loadRows();
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to update status"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleRemoveInactiveUsers = async () => {
    if (inactiveRows.length === 0) return;

    const confirmed = window.confirm(
      `Remove ${inactiveRows.length} inactive record(s)? This cannot be undone.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      const results = await Promise.allSettled(
        inactiveRows.map((row) => {
          if (row.role === "SUPER_ADMIN") {
            return api.delete(`/users/super-admin/${row.id}`, { params: { deleterId: currentUserId } });
          }
          if (row.role === "ADMIN") {
            return api.delete(`/users/admin/${row.id}`, { params: { deleterId: currentUserId } });
          }
          if (row.role === "MANAGER") {
            return api.delete(`/users/manager/${row.id}`, { params: { deleterId: currentUserId } });
          }
          if (row.role === "TRAINER") {
            return api.delete(`/users/trainer/${row.id}`, { params: { deleterId: currentUserId } });
          }
          if (row.role === "USER") {
            return api.delete(`/users/customer/${row.id}`, { params: { deleterId: currentUserId } });
          }
          throw new Error(`${row.role} records are not supported yet.`);
        }),
      );

      const successCount = results.filter((item) => item.status === "fulfilled").length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        setError(`${failedCount} inactive record(s) could not be removed`);
      }

      if (successCount > 0) {
        setNotice(`${successCount} inactive record(s) removed`);
      }

      await loadRows();
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to remove inactive records"));
    } finally {
      setSaving(false);
    }
  };

  const countryOptions = useMemo(() => getCountryOptions(countrySearch), [countrySearch]);

  const roleSelectOptions = useMemo(() => {
    const availability = createAvailability;
    return ROLE_OPTIONS.filter((item) => {
      if (item.value === "SUPER_ADMIN") return false;
      return viewMode === "users" ? item.value === "USER" : item.value !== "USER";
    }).map((item) => ({
      ...item,
      disabled: !availability[item.value],
    }));
  }, [createAvailability, viewMode]);

  const renderStats = () => (
    <div className="row mb-4">
      <StatCard value={displayedRows.length} label={viewMode === "users" ? "Total Members" : "Total Employees"} />
      <StatCard value={activeRows.length} label="Active Records" />
      <StatCard value={inactiveRows.length} label="Inactive Records" />
      <StatCard value={totalRoles} label="Role Types" />
    </div>
  );

  const renderDisplaySwitch = () => {
    // Members page manages members only — no employee view to switch to.
    if (isMembersPage) return null;
    return (
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button
          type="button"
          variant={viewMode === "employees" ? "primary" : "light"}
          onClick={() => setViewMode("employees")}
        >
          Employees ({employeeRows.length})
        </Button>
        <Button
          type="button"
          variant={viewMode === "users" ? "primary" : "light"}
          onClick={() => setViewMode("users")}
        >
          Members ({userRows.length})
        </Button>
      </div>
    );
  };

  const handleFilterTabClick = (key) => {
    navigate(`/users?filter=${key}`);
  };

  const renderMemberFilterTabs = () => {
    if (viewMode !== "users") return null;

    const tabs = [
      { key: "all", label: "All Members" },
      { key: "active", label: "Active" },
      { key: "expired", label: "Expired" },
      { key: "freeze", label: "Freeze" },
      { key: "renewal", label: "Renewal Due" },
      { key: "referrals", label: "Referrals" },
    ];

    return (
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body p-2">
          <ul className="nav nav-pills gap-2 flex-wrap mb-0 border-0">
            {tabs.map((tab) => {
              const isActive = memberFilterTab === tab.key;
              return (
                <li className="nav-item" key={tab.key}>
                  <button
                    className={`nav-link fw-semibold px-4 py-2 rounded-2 ${
                      isActive ? "active bg-primary text-white shadow" : "text-dark bg-transparent"
                    }`}
                    style={{ transition: "all 0.2s ease-in-out", border: "none" }}
                    type="button"
                    onClick={() => handleFilterTabClick(tab.key)}
                  >
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };

  const openProfileModal = async (row) => {
    setProfileMember(row);
    setShowProfileModal(true);
    setProfileTab("personal");
    setMemberProgress([]);
    if (row.id) {
      setMemberProgressLoading(true);
      try {
        const progressData = await getMemberProgressEntries(row.id);
        setMemberProgress(progressData);
      } catch (err) {
        console.error("Failed to load progress entries for member", err);
      } finally {
        setMemberProgressLoading(false);
      }
    }
  };

  const handleToggleFreeze = async (member) => {
    if (!member?.id) return;
    try {
      const nextFrozen = !member.raw?.isFrozen;
      const requestPayload = {
        email: member.email,
        firstName: member.raw?.firstName,
        lastName: member.raw?.lastName,
        weight: member.raw?.weight,
        height: member.raw?.height,
        bloodGroup: member.raw?.bloodGroup,
        age: member.raw?.age,
        gender: member.raw?.gender,
        phone: member.raw?.phone,
        address: member.raw?.address,
        city: member.raw?.city,
        medicalConditions: member.raw?.medicalConditions,
        emergencyContact: member.raw?.emergencyContact,
        emergencyPhone: member.raw?.emergencyPhone,
        headOfficeId: member.raw?.headOfficeId,
        branchId: member.raw?.branchId,
        departmentId: member.raw?.departmentId,
        teamId: member.raw?.teamId,
        designationId: member.raw?.designationId,
        assignedTrainerId: member.raw?.assignedTrainerId,
        photoPath: member.raw?.photoPath,
        idProofPath: member.raw?.idProofPath,
        bodyFat: member.raw?.bodyFat,
        isFrozen: nextFrozen,
        referredBy: member.raw?.referredBy,
      };

      await api.put(`/users/customer/${member.id}`, requestPayload, {
        params: { updaterId: currentUserId }
      });

      setNotice(`Member ${nextFrozen ? "frozen" : "unfrozen"} successfully`);
      await loadRows();
      setProfileMember((prev) => ({
        ...prev,
        raw: {
          ...prev.raw,
          isFrozen: nextFrozen
        }
      }));
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to toggle freeze status"));
    }
  };

  const renderHeader = (title, activeLabel) => (
    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
      <div className="my-auto mb-2">
        <h2 className="mb-1">{title}</h2>
        <nav>
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/">
                <IconHome size={16} />
              </Link>
            </li>
            <li className="breadcrumb-item">Settings</li>
            <li className="breadcrumb-item active">{activeLabel}</li>
          </ol>
        </nav>
      </div>
      <div className="d-flex gap-2 flex-wrap">
        <button
          className="btn btn-outline-danger"
          onClick={handleRemoveInactiveUsers}
          disabled={saving || inactiveRows.length === 0}
        >
          Remove Inactive Records
        </button>
        <button className="btn btn-primary" onClick={openAdd} disabled={saving || !canCreateInCurrentView}>
          <IconPlus size={16} className="me-2" />
          {viewMode === "users" ? "Add Member" : "Add Employee"}
        </button>
      </div>
    </div>
  );

  const renderRoleSpecificFields = () => {
    const role = normalizeRole(isEdit ? selectedRow?.role : form.role);

    if (role === "ADMIN" || role === "MANAGER") {
      const label = role === "ADMIN" ? "Admin Details" : "Manager Details";
      return (
        <div className="row g-3">
          <SectionHeader label={label} />
          <div className="col-md-6">
            <label className="form-label">Qualification *</label>
            <select
              className="form-select"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
            >
              <option value="">Select qualification</option>
              {QUALIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Department Label</label>
            <input
              className="form-control"
              value={form.departmentText}
              onChange={(e) => setForm({ ...form, departmentText: e.target.value })}
              placeholder="Usually derived from the selected department master"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Join Date</label>
            <input
              type="date"
              className="form-control"
              value={form.joinDate}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            />
          </div>
        </div>
      );
    }

    if (role === "TRAINER") {
      return (
        <div className="row g-3">
          <SectionHeader label="Trainer Details" />
          <div className="col-md-6">
            <label className="form-label">Specialization *</label>
            <input
              className="form-control"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Experience Years *</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Certification *</label>
            <input
              className="form-control"
              value={form.certification}
              onChange={(e) => setForm({ ...form, certification: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Qualification *</label>
            <select
              className="form-select"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
            >
              <option value="">Select qualification</option>
              {QUALIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Rate Per Hour *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-control"
              value={form.ratePerHour}
              onChange={(e) => setForm({ ...form, ratePerHour: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Join Date</label>
            <input
              type="date"
              className="form-control"
              value={form.joinDate}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Languages</label>
            <input
              className="form-control"
              value={form.languages}
              onChange={(e) => setForm({ ...form, languages: e.target.value })}
              placeholder="English, Hindi"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Rating</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.01"
              className="form-control"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Clients Trained</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={form.totalClientsTrained}
              onChange={(e) => setForm({ ...form, totalClientsTrained: e.target.value })}
            />
          </div>
        </div>
      );
    }

    if (role === "USER") {
      return (
        <div className="row g-3">
          <SectionHeader label="Member / Customer Details" />
          <div className="col-md-6">
            <label className="form-label">Weight (kg) *</label>
            <input
              type="number"
              min="0"
              step="0.1"
              className="form-control"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Height (cm) *</label>
            <input
              type="number"
              min="0"
              step="0.1"
              className="form-control"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Blood Group *</label>
            <select
              className="form-select"
              value={form.bloodGroup}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            >
              <option value="">Select</option>
              {BLOOD_GROUP_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Age *</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Gender *</label>
            <select
              className="form-select"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Select</option>
              {GENDER_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Medical Conditions</label>
            <input
              className="form-control"
              value={form.medicalConditions}
              onChange={(e) => setForm({ ...form, medicalConditions: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Body Fat (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="form-control"
              value={form.bodyFat || ""}
              onChange={(e) => setForm({ ...form, bodyFat: e.target.value ? Number(e.target.value) : "" })}
              placeholder="e.g. 18.5"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Referred By</label>
            <input
              type="text"
              className="form-control"
              value={form.referredBy || ""}
              onChange={(e) => setForm({ ...form, referredBy: e.target.value })}
              placeholder="Referrer name (if any)"
            />
          </div>
          <SectionHeader label="Membership & Workout Plan" />
          <div className="col-md-6">
            <label className="form-label">Membership Plan</label>
            <select
              className="form-select"
              value={form.membershipPlanId}
              onChange={(e) => setForm({ ...form, membershipPlanId: e.target.value })}
            >
              <option value="">No membership plan</option>
              {allMembershipPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (₹{plan.price})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Duration (Months override)</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={form.membershipMonths}
              onChange={(e) => setForm({ ...form, membershipMonths: e.target.value })}
              placeholder="e.g. 3 (defaults to plan's duration)"
              disabled={!form.membershipPlanId}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Access Start Time</label>
            <input
              type="time"
              className="form-control"
              value={form.membershipAccessStartTime}
              onChange={(e) => setForm({ ...form, membershipAccessStartTime: e.target.value })}
              disabled={!form.membershipPlanId}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Access End Time</label>
            <input
              type="time"
              className="form-control"
              value={form.membershipAccessEndTime}
              onChange={(e) => setForm({ ...form, membershipAccessEndTime: e.target.value })}
              disabled={!form.membershipPlanId}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Assigned Workout Plan</label>
            <select
              className="form-select"
              value={form.workoutPlanId}
              onChange={(e) => setForm({ ...form, workoutPlanId: e.target.value })}
            >
              <option value="">No workout plan</option>
              {allWorkoutPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6 d-flex align-items-end">
            <div className="form-check form-switch mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="isFrozenSwitch"
                checked={Boolean(form.isFrozen)}
                onChange={(e) => setForm({ ...form, isFrozen: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="isFrozenSwitch">
                Freeze Membership
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (role === "SUPER_ADMIN") {
      return (
        <div className="alert alert-light mb-0">
          Super Admin uses only the identity fields for this form.
        </div>
      );
    }

    return <div className="alert alert-warning mb-0">This role is not supported by user management yet.</div>;
  };


  const apiUploadOrigin = String(api.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  const resolveDocHref = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return value.startsWith("/") ? `${apiUploadOrigin}${value}` : value;
  };

  // Shared uploader for member photo/documents — stores the returned path on the
  // given form field. Used by both the file picker and the live camera capture.
  const uploadMemberFile = async (file, fieldName) => {
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    setUploadingField(fieldName);
    setModalError("");
    try {
      const response = await api.post("/uploads/employee-documents", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const storedPath = response.data?.data?.path || response.data?.data?.url || response.data?.path || response.data?.url;
      if (!storedPath) throw new Error("Upload completed, but no file path was returned.");
      setForm((prev) => ({ ...prev, [fieldName]: storedPath }));
    } catch (uploadError) {
      setModalError(extractApiErrorMessage(uploadError, "File upload failed"));
    } finally {
      setUploadingField("");
    }
  };

  const renderEmployeePersonalFields = () => {
    const role = normalizeRole(isEdit ? selectedRow?.role : form.role);

    if (role === "USER") {
      return (
        <div className="row g-3">
          <SectionHeader label="Personal Details" />
          <div className="col-md-12">
            <label className="form-label">Address *</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="House number, street, landmark, area"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">City *</label>
            <input
              className="form-control"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Emergency Contact *</label>
            <input
              className="form-control"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Emergency Phone *</label>
            <input
              className="form-control"
              value={form.emergencyPhone}
              onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value.replace(/\D/g, "") })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Medical Conditions</label>
            <input
              className="form-control"
              value={form.medicalConditions}
              onChange={(e) => setForm({ ...form, medicalConditions: e.target.value })}
            />
          </div>

          <SectionHeader label="Photo & Documents" />
          <PhotoCaptureField
            label="Member Photo"
            required
            value={form.candidatePhotoPath}
            href={resolveDocHref(form.candidatePhotoPath)}
            uploading={uploadingField === "candidatePhotoPath"}
            onFile={(file) => uploadMemberFile(file, "candidatePhotoPath")}
          />
          <div className="col-md-6">
            <label className="form-label">ID Proof *</label>
            <input
              type="file"
              className="form-control"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              disabled={uploadingField === "idProofDocumentPath"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMemberFile(file, "idProofDocumentPath");
                e.target.value = "";
              }}
            />
            <small className="text-muted d-block mt-1">
              {uploadingField === "idProofDocumentPath"
                ? "Uploading…"
                : form.idProofDocumentPath
                  ? <a href={resolveDocHref(form.idProofDocumentPath)} target="_blank" rel="noreferrer">View uploaded file</a>
                  : "Upload Aadhaar / ID card (PDF or image)."}
            </small>
          </div>
        </div>
      );
    }

    if (!["ADMIN", "MANAGER", "TRAINER"].includes(role)) {
      return <div className="alert alert-light mb-0">Personal details are used for employees only.</div>;
    }

    return (
      <div className="row g-3">
        <SectionHeader label="Personal Details" />
        <div className="col-md-6">
          <label className="form-label">Date of Birth</label>
          <input type="date" className="form-control" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        </div>
        <div className="col-md-6"><label className="form-label">Father's Name</label><input className="form-control" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Mother's Name</label><input className="form-control" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Marital Status</label><select className="form-select" value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}><option value="">Select</option>{MARITAL_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="col-md-6"><label className="form-label">Spouse Name</label><input className="form-control" value={form.spouseName} disabled={form.maritalStatus !== "Married"} onChange={(e) => setForm({ ...form, spouseName: e.target.value })} /></div>        <div className="col-md-6">
          <label className="form-label">Gender</label>
          <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Select</option>
            {GENDER_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Blood Group</label>
          <select className="form-select" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
            <option value="">Select</option>
            {BLOOD_GROUP_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Personal Email</label>
          <input type="email" className="form-control" value={form.personalEmail} onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Alternate Phone</label>
          <input className="form-control" value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value.replace(/[^+\d]/g, "") })} />
        </div>
        <SectionHeader label="Emergency" />
        <div className="col-md-6"><label className="form-label">Emergency Name 1</label><input className="form-control" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Emergency Contact 1</label><input className="form-control" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value.replace(/[^+\d]/g, "") })} /></div>
        <div className="col-md-6"><label className="form-label">Emergency Relationship 1</label><input className="form-control" value={form.emergencyContactRelationship} onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Emergency Name 2</label><input className="form-control" value={form.emergencyContactName2} onChange={(e) => setForm({ ...form, emergencyContactName2: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Emergency Contact 2</label><input className="form-control" value={form.emergencyPhone2} onChange={(e) => setForm({ ...form, emergencyPhone2: e.target.value.replace(/[^+\d]/g, "") })} /></div>
        <div className="col-md-6"><label className="form-label">Emergency Relationship 2</label><input className="form-control" value={form.emergencyContactRelationship2} onChange={(e) => setForm({ ...form, emergencyContactRelationship2: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Location</label><input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="col-md-6">
          <label className="form-label">City</label>
          <input className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">State</label>
          <input className="form-control" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Pincode</label>
          <input className="form-control" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </div>
        <div className="col-md-12">
          <label className="form-label">Current Address</label>
          <textarea className="form-control" rows={2} value={form.currentAddress} onChange={(e) => setForm({ ...form, currentAddress: e.target.value })} />
        </div>
        <div className="col-md-12">
          <label className="form-label">Permanent Address</label>
          <textarea className="form-control" rows={2} value={form.permanentAddress} onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })} />
        </div>
        <SectionHeader label="Employment" />
        <div className="col-md-6">
          <label className="form-label">Employment Type</label>
          <select className="form-select" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
            <option value="">Select</option>
            {EMPLOYMENT_TYPE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Work Location</label>
          <select className="form-select" value={form.workLocation} onChange={(e) => setForm({ ...form, workLocation: e.target.value })}>
            <option value="">Select</option>
            {WORK_LOCATION_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Reports To</label>
          <select
            className="form-select"
            value={form.reportsToId}
            disabled={reportingOptionsLoading}
            onChange={(e) => setForm({ ...form, reportsToId: e.target.value })}
          >
            <option value="">No reporting user</option>
            {reportingOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.role})
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6"><label className="form-label">Joining Branch Name</label><input className="form-control" value={form.joiningBranchName} onChange={(e) => setForm({ ...form, joiningBranchName: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Source Platform</label><select className="form-select" value={form.sourcePlatform} onChange={(e) => setForm({ ...form, sourcePlatform: e.target.value })}><option value="">Select</option>{SOURCE_PLATFORM_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="col-md-6"><label className="form-label">PF UAN</label><input className="form-control" value={form.pfUan} onChange={(e) => setForm({ ...form, pfUan: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">ESI Number</label><input className="form-control" value={form.esiNumber} onChange={(e) => setForm({ ...form, esiNumber: e.target.value })} /></div>        <div className="col-md-6">
          <label className="form-label">Probation End Date</label>
          <input type="date" className="form-control" value={form.probationEndDate} onChange={(e) => setForm({ ...form, probationEndDate: e.target.value })} />
        </div>
      </div>
    );
  };

  const renderEmployeeDocumentFields = () => {
    const role = normalizeRole(isEdit ? selectedRow?.role : form.role);

    if (!["ADMIN", "MANAGER", "TRAINER"].includes(role)) {
      return <div className="alert alert-light mb-0">Documents are optional employee records.</div>;
    }

    const apiOrigin = String(api.defaults?.baseURL || "").replace(/\/api\/?$/, "");
    const documentHref = (value) => {
      if (!value) return "";
      if (/^https?:\/\//i.test(value)) return value;
      return value.startsWith("/") ? `${apiOrigin}${value}` : value;
    };

    const uploadDocument = async (event, fieldName) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const data = new FormData();
      data.append("file", file);
      setUploadingField(fieldName);
      setModalError("");

      try {
        const response = await api.post("/uploads/employee-documents", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const storedPath = response.data?.data?.path || response.data?.data?.url || response.data?.path || response.data?.url;
        if (!storedPath) {
          throw new Error("Upload completed, but no file path was returned.");
        }
        setForm((prev) => ({ ...prev, [fieldName]: storedPath }));
      } catch (uploadError) {
        setModalError(extractApiErrorMessage(uploadError, "File upload failed"));
      } finally {
        setUploadingField("");
        event.target.value = "";
      }
    };

    const renderFileUpload = (label, fieldName, accept = ".pdf,.jpg,.jpeg,.png,.webp") => {
      const value = form[fieldName];
      return (
        <div className="col-md-6">
          <label className="form-label">{label}</label>
          <input
            type="file"
            className="form-control"
            accept={accept}
            disabled={uploadingField === fieldName}
            onChange={(event) => uploadDocument(event, fieldName)}
          />
          <small className="text-muted d-block mt-1">
            {uploadingField === fieldName
              ? "Uploading..."
              : value
                ? (
                  <a href={documentHref(value)} target="_blank" rel="noreferrer">
                    View uploaded file
                  </a>
                )
                : "Upload the file"}
          </small>
        </div>
      );
    };

    return (
      <div className="row g-3">
        <SectionHeader label="Identity Documents" />
        <div className="col-12">
          <small className="text-muted d-block">
            Accepted: PDF, JPG, JPEG, PNG, WEBP. Max size: 10 MB.
          </small>
        </div>
        <div className="col-md-6"><label className="form-label">PAN Number</label><input className="form-control" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} /></div>
        <div className="col-md-6"><label className="form-label">Aadhaar Number</label><input className="form-control" value={form.aadharNumber} onChange={(e) => setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, "") })} /></div>
        {renderFileUpload("Candidate Photo", "candidatePhotoPath", "image/*")}
        {renderFileUpload("Aadhaar Card", "aadharCardDocumentPath")}
        {renderFileUpload("PAN Card", "panCardDocumentPath")}
        {renderFileUpload("ID Proof", "idProofDocumentPath")}
        {renderFileUpload("Address Proof", "addressProofDocumentPath")}

        <SectionHeader label="Bank Details" />
        <div className="col-md-6"><label className="form-label">Account Holder Name</label><input className="form-control" value={form.bankAccountHolderName} onChange={(e) => setForm({ ...form, bankAccountHolderName: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Bank & Branch</label><input className="form-control" value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Bank Name</label><input className="form-control" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Account Number</label><input className="form-control" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">IFSC Code</label><input className="form-control" value={form.bankIfscCode} onChange={(e) => setForm({ ...form, bankIfscCode: e.target.value.toUpperCase() })} /></div>
        <div className="col-md-6"><label className="form-label">Account Type</label><input className="form-control" value={form.bankAccountType} onChange={(e) => setForm({ ...form, bankAccountType: e.target.value })} placeholder="Savings, Current" /></div>
        {renderFileUpload("Bank Proof", "bankDocumentPath")}

        <SectionHeader label="Employee Documents" />
        {renderFileUpload("Qualification Document", "qualificationDocumentPath")}
        {renderFileUpload("Certification Document", "certificationDocumentPath")}
        {renderFileUpload("Resume", "resumeDocumentPath")}
        {renderFileUpload("Offer Letter", "offerLetterDocumentPath")}

        <SectionHeader label="Employment History" />
        <div className="col-md-6"><label className="form-label">Previous Organization 1</label><input className="form-control" value={form.previousEmployment1} onChange={(e) => setForm({ ...form, previousEmployment1: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Previous Organization 2</label><input className="form-control" value={form.previousEmployment2} onChange={(e) => setForm({ ...form, previousEmployment2: e.target.value })} /></div>
        {renderFileUpload("Experience Certificate", "experienceCertificateDocumentPath")}

        <SectionHeader label="Education" />
        {renderFileUpload("Course Certificate", "courseCertificatePath")}
        {renderFileUpload("Education Certificate", "educationCertificatePath")}


        <SectionHeader label="References" />
        <div className="col-md-6"><label className="form-label">Reference Name 1</label><input className="form-control" value={form.referenceName1} onChange={(e) => setForm({ ...form, referenceName1: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Reference Phone 1</label><input className="form-control" value={form.referencePhone1} onChange={(e) => setForm({ ...form, referencePhone1: e.target.value.replace(/[^+\d]/g, "") })} /></div>
        <div className="col-md-6"><label className="form-label">Reference Name 2</label><input className="form-control" value={form.referenceName2} onChange={(e) => setForm({ ...form, referenceName2: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Reference Phone 2</label><input className="form-control" value={form.referencePhone2} onChange={(e) => setForm({ ...form, referencePhone2: e.target.value.replace(/[^+\d]/g, "") })} /></div>
        <SectionHeader label="Declaration" />
        <div className="col-md-6"><label className="form-label">Declaration Date</label><input type="date" className="form-control" value={form.declarationDate} onChange={(e) => setForm({ ...form, declarationDate: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label">Declaration Place</label><input className="form-control" value={form.declarationPlace} onChange={(e) => setForm({ ...form, declarationPlace: e.target.value })} /></div>
      </div>
    );
  };

  const renderOrgFields = () => (
    <div className="row g-3">
      <SectionHeader label="Organization Assignment" />
      {getOrganizationVisibility(form.role).headOffice && (
        <div className="col-md-6">
          <label className="form-label">Head Office</label>
          <select
            className="form-select"
            value={form.headOfficeId}
            disabled={orgLoading}
            onChange={(e) =>
              setForm({
                ...form,
                headOfficeId: e.target.value,
                branchId: "",
                departmentId: "",
                teamId: "",
                designationId: "",
              })
            }
          >
            <option value="">Select Head Office</option>
            {headOffices.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {getOrganizationVisibility(form.role).branch && (
        <div className="col-md-6">
          <label className="form-label">Branch</label>
          <select
            className="form-select"
            value={form.branchId}
            disabled={orgLoading || !form.headOfficeId}
            onChange={(e) =>
              setForm({
                ...form,
                branchId: e.target.value,
                departmentId: "",
                teamId: "",
                designationId: "",
              })
            }
          >
            <option value="">Select Branch</option>
            {filteredBranches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {getOrganizationVisibility(form.role).department && (
        <div className="col-md-6">
          <label className="form-label">Department</label>
          <select
            className="form-select"
            value={form.departmentId}
            disabled={orgLoading || !form.branchId}
            onChange={(e) =>
              setForm({
                ...form,
                departmentId: e.target.value,
                teamId: "",
                designationId: "",
              })
            }
          >
            <option value="">Select Department</option>
            {filteredDepartments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {getOrganizationVisibility(form.role).designation && (
        <div className="col-md-6">
          <label className="form-label">Designation</label>
          <select
            className="form-select"
            value={form.designationId}
            disabled={orgLoading || !form.departmentId}
            onChange={(e) =>
              setForm({
                ...form,
                designationId: e.target.value,
                teamId: "",
              })
            }
          >
            <option value="">Select Designation</option>
            {filteredDesignations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {getOrganizationVisibility(form.role).team && (
        <div className="col-md-6">
          <label className="form-label">Team</label>
          <select
            className="form-select"
            value={form.teamId}
            disabled={orgLoading || (isCustomerForm ? !form.branchId : !form.departmentId)}
            onChange={(e) => {
              const nextTeamId = e.target.value;
              const nextTeam = teams.find((item) => String(item.id) === String(nextTeamId)) || null;
              if (!isCustomerForm) {
                setForm((prev) => ({
                  ...prev,
                  teamId: nextTeamId,
                }));
                return;
              }

              const resolved = getTrainerForTeam(nextTeam, rows) || resolveTeamTrainerOption(nextTeam, reportingOptions);
              const resolvedTrainerId = resolved?.option ? String(resolved.option.id) : String(resolved?.identity?.id || "");
              const resolvedTrainerName = resolved?.option?.name || resolved?.identity?.name || "";

              setForm((prev) => ({
                ...prev,
                teamId: nextTeamId,
                // Members skip the Department dropdown — derive it from the team so
                // the payload and org preview stay correct.
                departmentId: nextTeam ? String(nextTeam.departmentId || "") : "",
                reportsToId: resolvedTrainerId,
                assignedTrainerId: resolvedTrainerId || prev.assignedTrainerId,
                reportingManagerName: resolvedTrainerName,
              }));
            }}
          >
            <option value="">Select Team</option>
            {filteredTeams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isCustomerForm && getOrganizationVisibility(form.role).team && (
        <div className="col-md-6">
          <label className="form-label">Team Trainer</label>
          <select className="form-select bg-light" value={form.assignedTrainerId || selectedTeamTrainer?.identity?.id || ""} disabled>
            <option value="">
              {selectedTeamTrainerName || "No trainer assigned to this team"}
            </option>
            {selectedTeamTrainer?.identity?.id ? (
              <option value={selectedTeamTrainer.identity.id}>{selectedTeamTrainerName}</option>
            ) : null}
          </select>
        </div>
      )}

      <div className="col-md-12">
        <div className="alert alert-light mb-0">
          <strong>Current selection:</strong> {orgPreview}
        </div>
      </div>
    </div>
  );

  const renderIdentityFields = () => {
    const effectiveRole = normalizeRole(isEdit ? selectedRow?.role : form.role);

    return (
      <div className="row g-3">
        <SectionHeader label="Access Information" />

        <div className="col-md-6">
          <label className="form-label">Role *</label>
          <select
            className="form-select"
            value={effectiveRole}
            disabled={isEdit}
            onChange={(e) => {
              const nextRole = e.target.value;
              const orgVisibility = getOrganizationVisibility(nextRole);
              setForm((prev) => ({
                ...createEmptyForm(nextRole),
                role: nextRole,
                email: prev.email,
                password: prev.password,
                firstName: prev.firstName,
                lastName: prev.lastName,
                name: prev.name,
                phone: prev.phone,
                countryCode: prev.countryCode,
                status: prev.status,
                headOfficeId: prev.headOfficeId,
                branchId: orgVisibility.branch ? prev.branchId : "",
                departmentId: orgVisibility.department ? prev.departmentId : "",
                teamId: orgVisibility.team ? prev.teamId : "",
                designationId: orgVisibility.designation ? prev.designationId : "",
              }));
            }}
          >
            {roleSelectOptions.map((item) => (
              <option key={item.value} value={item.value} disabled={item.disabled}>
                {item.label}
              </option>
            ))}
          </select>
          <small className="text-muted">
            {isEdit
              ? "Role changes are locked during edit because each role uses a different backend route."
              : "Only the roles supported by the backend are enabled for your current login."}
          </small>
        </div>

        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Name *</label>
          <input
            className="form-control"
            value={form.name}
            onChange={(e) => {
              const nextName = e.target.value;
              const split = splitName(nextName);
              setForm({ ...form, name: nextName, firstName: split.firstName, lastName: split.lastName });
            }}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Email *</label>
          <input
            type="email"
            className="form-control"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">{isEdit ? "Password" : "Password *"}</label>
          <div className="position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              style={{ paddingRight: "2.5rem" }}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={isEdit ? "Leave blank to keep current password" : "Set an initial password"}
            />
            <button
              type="button"
              className="btn btn-link p-0 position-absolute top-50 end-0 translate-middle-y"
              style={{ right: "0.75rem", lineHeight: 0, color: "#000", textDecoration: "none" }}
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
        </div>

        <div className="col-md-6">
          <PhoneField
            id="employeePhone"
            label="Phone"
            countryCode={form.countryCode}
            value={form.phone}
            onChange={({ countryCode, phone }) => setForm({ ...form, countryCode, phone })}
          />
        </div>

      </div>
    );
  };

  const renderUserModal = () =>
    showModal && (
        <WizardPopup
          open={showModal}
          title={isEdit ? `Edit ${normalizeRole(form.role) === "USER" ? "Member" : "Employee"}` : `Add ${normalizeRole(form.role) === "USER" ? "Member" : "Employee"}`}
        steps={modalSteps.map((item) => item.label)}
          step={modalStepIndex}
          onClose={closeModal}
          onBack={goToPreviousModalStep}
          onNext={goToNextModalStep}
        onSubmit={handleSubmit}
        submitLabel={saving ? "Saving..." : "Save Changes"}
        modalWidth="680px"
        disabled={saving}
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}

        {modalTab === "identity" && renderIdentityFields()}
        {modalTab === "organization" && renderOrgFields()}
        {modalTab === "details" && renderRoleSpecificFields()}
        {modalSteps.some((item) => item.key === "personal") && modalTab === "personal" && renderEmployeePersonalFields()}
        {modalSteps.some((item) => item.key === "documents") && modalTab === "documents" && renderEmployeeDocumentFields()}
      </WizardPopup>
    );

  const renderDeleteModal = () =>
    deleteTarget && (
      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete <strong>{deleteTarget?.name || "this record"}</strong>?
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setDeleteTarget(null)} type="button">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving} type="button">
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    );

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return "-";
    const hMeters = height / 100;
    return (weight / (hMeters * hMeters)).toFixed(1);
  };

  const renderProfileModal = () => {
    if (!profileMember) return null;

    const m = profileMember;
    const raw = m.raw || {};
    
    // Filter member's transactions
    const memberTx = allTransactions.filter((tx) => tx.member?.id === m.id);
    
    // Filter member's attendance
    const memberAttendance = allAttendance.filter((att) => att.memberId === m.id);
    
    // Total visits
    const totalVisits = memberAttendance.length;
    
    // Last visit
    const sortedAttendance = [...memberAttendance].sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
    const lastVisit = sortedAttendance[0];

    const bmi = calculateBMI(raw.weight, raw.height);

    const tabs = [
      { key: "personal", label: "Personal" },
      { key: "fitness", label: "Fitness" },
      { key: "membership", label: "Membership" },
      { key: "workout", label: "Workout" },
      { key: "attendance", label: "Attendance" },
    ];

    return (
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center gap-3">
            <img
              src={m.img || resolveDocHref(raw.photoPath) || ROLE_AVATARS.USER}
              alt={m.name}
              className="rounded-circle border border-white border-2"
              width="50"
              height="50"
              style={{ objectFit: "cover" }}
            />
            <div>
              <h5 className="mb-0 text-white">{m.name || "Member Profile"}</h5>
              <small className="text-white-50">{formatMemberCode(m.id)} • Member Since {new Date(raw.registrationDate || Date.now()).toLocaleDateString()}</small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="bg-light border-bottom p-2">
            <ul className="nav nav-pills nav-fill gap-1">
              {tabs.map((t) => (
                <li className="nav-item" key={t.key}>
                  <button
                    className={`nav-link py-2 fw-semibold border-0 ${profileTab === t.key ? "active bg-primary text-white" : "text-dark bg-transparent"}`}
                    onClick={() => setProfileTab(t.key)}
                    type="button"
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4" style={{ minHeight: "350px", maxHeight: "60vh", overflowY: "auto" }}>
            {profileTab === "personal" && (
              <div className="row g-3">
                <div className="col-md-6">
                  <span className="text-muted small d-block">Full Name</span>
                  <strong className="fs-6">{m.name || "-"}</strong>
                </div>
                <div className="col-md-6">
                  <span className="text-muted small d-block">Mobile</span>
                  <strong className="fs-6">{formatPhoneWithCode(m.phone, m.countryCode)}</strong>
                </div>
                <div className="col-md-6">
                  <span className="text-muted small d-block">Email Address</span>
                  <strong className="fs-6">{m.email || "-"}</strong>
                </div>
                <div className="col-md-6">
                  <span className="text-muted small d-block">Emergency Contact</span>
                  <strong className="fs-6">
                    {raw.emergencyContact || "-"} ({raw.emergencyPhone || "-"})
                  </strong>
                </div>
                <div className="col-md-12">
                  <span className="text-muted small d-block">Residential Address</span>
                  <p className="fs-6 mb-0">{raw.address ? `${raw.address}, ${raw.city || ""}` : "-"}</p>
                </div>
                {raw.medicalConditions && (
                  <div className="col-md-12">
                    <span className="text-muted small d-block text-danger fw-semibold">Medical Conditions</span>
                    <div className="alert alert-danger py-2 px-3 mt-1 mb-0">
                      {raw.medicalConditions}
                    </div>
                  </div>
                )}
              </div>
            )}

            {profileTab === "fitness" && (
              <div className="row g-4 text-center">
                <div className="col-sm-4">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block mb-1">Weight</span>
                    <h3 className="mb-0 text-primary">{raw.weight || "-"} <small className="fs-6 text-muted">kg</small></h3>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block mb-1">Height</span>
                    <h3 className="mb-0 text-success">{raw.height || "-"} <small className="fs-6 text-muted">cm</small></h3>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block mb-1">Calculated BMI</span>
                    <h3 className="mb-0 text-info">{bmi}</h3>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block mb-1">Body Fat</span>
                    <h3 className="mb-0 text-warning">{raw.bodyFat || "-"} <small className="fs-6 text-muted">%</small></h3>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block mb-1">Blood Group</span>
                    <h3 className="mb-0 text-danger">{raw.bloodGroup || "-"}</h3>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block mb-1">Age / Gender</span>
                    <h3 className="mb-0 text-dark">{raw.age || "-"} yrs <small className="fs-6 text-muted">({raw.gender || "-"})</small></h3>
                  </div>
                </div>
              </div>
            )}

            {profileTab === "membership" && (
              <div>
                <div className="row g-3 mb-4 p-3 bg-light rounded-3 border align-items-center">
                  <div className="col-md-5">
                    <span className="text-muted small d-block">Current Plan</span>
                    <h4 className="text-primary mb-0">{raw.membershipPlan || "BASIC"}</h4>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small d-block">Expiry Date</span>
                    <strong className="text-dark">
                      {raw.membershipExpiry ? new Date(raw.membershipExpiry).toLocaleDateString() : "No active plan"}
                    </strong>
                  </div>
                  <div className="col-md-3 text-md-end">
                    <div className="form-check form-switch d-inline-block">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="profileFreezeSwitch"
                        checked={Boolean(raw.isFrozen)}
                        onChange={() => handleToggleFreeze(m)}
                      />
                      <label className="form-check-label fw-semibold text-danger" style={{ cursor: "pointer" }} htmlFor="profileFreezeSwitch">
                        {raw.isFrozen ? "Frozen" : "Freeze Plan"}
                      </label>
                    </div>
                  </div>
                </div>

                <h6 className="mb-3 text-muted">Payment & Transactions History</h6>
                {memberTx.length === 0 ? (
                  <div className="alert alert-light text-center">No payment transactions found.</div>
                ) : (
                  <div className="table-responsive border rounded">
                    <table className="table table-sm table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Plan</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberTx.map((tx) => (
                          <tr key={tx.id}>
                            <td>{new Date(tx.transactionDate).toLocaleDateString()}</td>
                            <td>{tx.plan?.name || tx.planCode || "Membership Plan"}</td>
                            <td>₹{tx.amount}</td>
                            <td><span className="badge bg-light text-dark">{tx.paymentMethod}</span></td>
                            <td>
                              <span className={`badge ${tx.status === "SUCCESS" ? "bg-success" : "bg-danger"}`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {profileTab === "workout" && (
              <div>
                <div className="p-3 bg-light rounded-3 border mb-4">
                  <span className="text-muted small d-block">Assigned Workout Plan</span>
                  <h5 className="text-success mb-0">{m.assignedWorkoutPlanName || "No workout plan assigned"}</h5>
                </div>

                <h6 className="mb-3 text-muted">Progress Entry Logs</h6>
                {memberProgressLoading ? (
                  <div className="text-center py-3">Loading progress entries...</div>
                ) : memberProgress.length === 0 ? (
                  <div className="alert alert-light text-center">No progress entries logged yet.</div>
                ) : (
                  <div className="table-responsive border rounded">
                    <table className="table table-sm table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Weight</th>
                          <th>Heart Rate</th>
                          <th>Workout Min</th>
                          <th>Calories</th>
                          <th>Steps</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberProgress.map((p) => (
                          <tr key={p.id}>
                            <td>{new Date(p.entryDate).toLocaleDateString()}</td>
                            <td>{p.weightKg ? `${p.weightKg} kg` : "-"}</td>
                            <td>{p.heartRateBpm ? `${p.heartRateBpm} bpm` : "-"}</td>
                            <td>{p.workoutMinutes ? `${p.workoutMinutes} m` : "-"}</td>
                            <td>{p.caloriesBurned ? `${p.caloriesBurned} kcal` : "-"}</td>
                            <td>{p.steps || "-"}</td>
                            <td className="text-truncate" style={{ maxWidth: "150px" }} title={p.notes}>
                              {p.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {profileTab === "attendance" && (
              <div>
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <span className="text-muted small d-block mb-1">Total Visits</span>
                      <h3 className="mb-0 text-primary fw-bold">{totalVisits}</h3>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <span className="text-muted small d-block mb-1">Last Visit Scan</span>
                      <h6 className="mb-0 text-success fw-bold">
                        {lastVisit ? new Date(lastVisit.checkInTime).toLocaleString() : "Never visited"}
                      </h6>
                    </div>
                  </div>
                </div>

                <h6 className="mb-3 text-muted">Recent Visit History</h6>
                {memberAttendance.length === 0 ? (
                  <div className="alert alert-light text-center">No attendance scans found.</div>
                ) : (
                  <div className="table-responsive border rounded">
                    <table className="table table-sm table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAttendance.slice(0, 15).map((att) => (
                          <tr key={att.id}>
                            <td>{new Date(att.attendanceDate).toLocaleDateString()}</td>
                            <td>{new Date(att.checkInTime).toLocaleTimeString()}</td>
                            <td>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : "-"}</td>
                            <td><span className="badge bg-light text-dark">{att.method}</span></td>
                            <td>
                              <span className={`badge ${att.status === "CHECKED_OUT" ? "bg-secondary" : "bg-success"}`}>
                                {att.status === "CHECKED_OUT" ? "Checked Out" : "Inside"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)} type="button">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const renderDietAssignModal = () => (
    <Modal show={showDietAssignModal} onHide={closeDietAssignModal} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <IconChefHat size={18} />
          Assign Diet Plan
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {dietAssignError && <div className="alert alert-danger">{dietAssignError}</div>}
        <p className="text-muted mb-2">
          Assign a diet plan to <strong>{dietAssignTarget?.name || "this member"}</strong>.
        </p>
        <div className="alert alert-light py-2 mb-3">
          <span className="text-muted">Current diet plan: </span>
          {dietAssignTarget?.assignedDietPlanName
            ? <strong>{dietAssignTarget.assignedDietPlanName}</strong>
            : <span className="fst-italic text-muted">None assigned yet</span>}
        </div>
        <label className="form-label">Diet Plan</label>
        <select
          className="form-select"
          value={dietAssignPlanId}
          onChange={(e) => setDietAssignPlanId(e.target.value)}
          disabled={dietPlansLoading}
        >
          <option value="">Select a diet plan</option>
          {dietPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        {dietPlansLoading && <small className="text-muted d-block mt-2">Loading diet plans...</small>}
        {!dietPlansLoading && dietPlans.length === 0 && !dietAssignError && (
          <small className="text-muted d-block mt-2">No diet plans were found.</small>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={closeDietAssignModal} type="button">
          Cancel
        </Button>
        <Button
          variant="warning"
          onClick={handleDietAssignSubmit}
          disabled={dietAssignSaving || dietPlansLoading || !dietAssignPlanId}
          type="button"
        >
          {dietAssignSaving ? "Assigning..." : "Assign Diet Plan"}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const renderWorkoutAssignModal = () => (
    <Modal show={showWorkoutAssignModal} onHide={closeWorkoutAssignModal} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <IconBarbell size={18} />
          Assign Workout Plan
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {workoutAssignError && <div className="alert alert-danger">{workoutAssignError}</div>}
        <p className="text-muted mb-2">
          Assign a workout plan to <strong>{workoutAssignTarget?.name || "this member"}</strong>.
        </p>
        <div className="alert alert-light py-2 mb-3">
          <span className="text-muted">Current workout plan: </span>
          {workoutAssignTarget?.assignedWorkoutPlanName
            ? <strong>{workoutAssignTarget.assignedWorkoutPlanName}</strong>
            : <span className="fst-italic text-muted">None assigned yet</span>}
        </div>
        <label className="form-label">Workout Plan</label>
        <select
          className="form-select"
          value={workoutAssignPlanId}
          onChange={(e) => setWorkoutAssignPlanId(e.target.value)}
          disabled={workoutPlansLoading}
        >
          <option value="">Select a workout plan</option>
          {workoutPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        {workoutPlansLoading && <small className="text-muted d-block mt-2">Loading workout plans...</small>}
        {!workoutPlansLoading && workoutPlans.length === 0 && !workoutAssignError && (
          <small className="text-muted d-block mt-2">No workout plans were found.</small>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={closeWorkoutAssignModal} type="button">
          Cancel
        </Button>
        <Button
          variant="warning"
          onClick={handleWorkoutAssignSubmit}
          disabled={workoutAssignSaving || workoutPlansLoading || !workoutAssignPlanId}
          type="button"
        >
          {workoutAssignSaving ? "Assigning..." : "Assign Workout Plan"}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const scopeHelpers = {
    headOffices,
    branches,
    departments,
    teams,
    designations,
  };

  const renderGridCard = (row) => (
    <div className="col-xl-3 col-lg-4 col-md-6 d-flex" key={`${row.role}-${row.id}`}>
      <div className="card flex-fill">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <span className={`badge ${getRoleBadgeClass(row.role)}`}>{roleDisplay(row.role)}</span>
            <div className="d-flex gap-1">
                {canAssignWorkoutPlan && normalizeRole(row.role) === "USER" && (
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => openWorkoutAssignModal(row)}
                    type="button"
                    title="Assign Workout Plan"
                  >
                    <IconBarbell size={14} />
                  </button>
                )}
                {canAssignDietPlan && normalizeRole(row.role) === "USER" && (
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => openDietAssignModal(row)}
                    type="button"
                    title="Assign Diet Plan"
                >
                  <IconChefHat size={14} />
                </button>
              )}
              {normalizeRole(row.role) === "USER" && (
                <button
                  className="btn btn-sm btn-outline-info"
                  onClick={() => openProfileModal(row)}
                  type="button"
                  title="View Member Profile"
                >
                  <IconEye size={14} />
                </button>
              )}
              <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(row)} type="button">
                <IconEdit size={14} />
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(row)} type="button">
                <IconTrash size={14} />
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center mb-3">
            <img
              src={row.img || ROLE_AVATARS[normalizeRole(row.role)] || userAvatar}
              alt={row.name}
              className="rounded-circle me-2"
              width="42"
              height="42"
            />
            <div>
              <h6 className="mb-0">
                {normalizeRole(row.role) === "USER" ? (
                  <button
                    type="button"
                    className="btn btn-link p-0 fw-semibold text-decoration-none text-start text-primary"
                    onClick={() => openProfileModal(row)}
                  >
                    {row.name || "-"}
                  </button>
                ) : (
                  row.name || "-"
                )}
              </h6>
              <small className="text-muted">{normalizeRole(row.role) === "USER" ? (row.assignedTrainerName ? `Trainer: ${row.assignedTrainerName}` : "-") : (row.department || "-")}</small>
            </div>
          </div>

          <p className="mb-1">Email: {row.email || "-"}</p>
          <p className="mb-1">Phone: {formatPhoneWithCode(row.phone, row.countryCode)}</p>
          <p className="mb-1">Org: {buildOrgLabel(row.raw, scopeHelpers, row.role)}</p>
          <div className="form-check form-switch d-inline-flex align-items-center gap-2 m-0 ps-0">
            <input
              className="form-check-input m-0"
              style={{ cursor: togglingId === row.id ? "wait" : "pointer", marginLeft: 0 }}
              type="checkbox"
              role="switch"
              title={row.status === "ACTIVE" ? "Click to deactivate" : "Click to activate"}
              checked={row.status === "ACTIVE"}
              disabled={togglingId === row.id}
              onChange={() => handleToggleStatus(row)}
            />
            <span className={`badge ${row.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>
              {row.status === "ACTIVE" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (gridView) {
    return (
      <div className="content">
        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {renderHeader(isMembersPage ? "Members Management" : "User Management", isMembersPage ? "Members Grid" : "Users Grid")}
        {renderDisplaySwitch()}
        {renderStats()}
        {renderMemberFilterTabs()}

        <div className="row">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : displayedRows.length === 0 ? (
            <div className="text-center py-4">
              No {viewMode === "users" ? "members" : "employees"} found for your role.
            </div>
          ) : (
            displayedRows.map((row) => renderGridCard(row))
          )}
        </div>

        {renderUserModal()}
          {renderDietAssignModal()}
          {renderWorkoutAssignModal()}
          {renderDeleteModal()}
          {renderProfileModal()}
      </div>
    );
  }

  return (
    <div className="page-wrapper users-page-wrapper">
      <div className="content">
        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {renderHeader(isMembersPage ? "Members Management" : "User Management", isMembersPage ? "Members" : "Users")}
        {renderDisplaySwitch()}
        {renderStats()}
        {renderMemberFilterTabs()}

        <div className="card mb-3">
          <div className="card-body d-flex flex-wrap align-items-center gap-3 justify-content-between">
            <div>
              <h5 className="mb-1">Current Role</h5>
              <p className="text-muted mb-0">
                Logged in as <strong>{currentRole || "UNKNOWN"}</strong>
                {currentUserId ? ` (User ID: ${currentUserId})` : ""}
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((item) => (
                <span key={item.value} className={`badge ${getRoleBadgeClass(item.value)}`}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0">{viewMode === "users" ? "Members List" : "Employee List"}</h5>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="badge bg-info">{currentRole || "UNKNOWN"}</span>
              <span className="badge bg-light text-dark">
                Create:{" "}
                {creatableRolesForCurrentView.map((item) => item.label).join(", ") || "None"}
              </span>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead className="thead-light">
                  <tr>
                    <th>ID</th>
                    <th>Role</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>{isMembersPage ? "Trainer" : "Department / Title"}</th>
                    <th>Org Scope</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        No {viewMode === "users" ? "members" : "employees"} found for your role.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => (
                      <tr key={`${row.role}-${row.id}`}>
                        <td className="fw-semibold text-muted text-nowrap">{formatMemberCode(row.id)}</td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(row.role)}`}>{roleDisplay(row.role)}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={row.img || ROLE_AVATARS[normalizeRole(row.role)] || userAvatar}
                              alt={row.name}
                              className="rounded-circle me-2"
                              width="34"
                              height="34"
                            />
                            {normalizeRole(row.role) === "USER" ? (
                              <button
                                type="button"
                                className="btn btn-link p-0 fw-semibold text-decoration-none text-start text-primary"
                                onClick={() => openProfileModal(row)}
                              >
                                {row.name || "-"}
                              </button>
                            ) : (
                              <span className="fw-semibold">{row.name || "-"}</span>
                            )}
                          </div>
                        </td>
                        <td>{row.email || "-"}</td>
                        <td>{formatPhoneWithCode(row.phone, row.countryCode)}</td>
                        <td>{normalizeRole(row.role) === "USER" ? (row.assignedTrainerName || "-") : (row.department || "-")}</td>
                        <td>{buildOrgLabel(row.raw, scopeHelpers, row.role)}</td>
                        <td>
                          <div className="form-check form-switch d-inline-flex align-items-center gap-2 m-0 ps-0">
                            <input
                              className="form-check-input m-0"
                              style={{ cursor: togglingId === row.id ? "wait" : "pointer", marginLeft: 0 }}
                              type="checkbox"
                              role="switch"
                              title={row.status === "ACTIVE" ? "Click to deactivate" : "Click to activate"}
                              checked={row.status === "ACTIVE"}
                              disabled={togglingId === row.id}
                              onChange={() => handleToggleStatus(row)}
                            />
                            <span className={`badge ${row.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>
                              {row.status === "ACTIVE" ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td>
                            {canAssignWorkoutPlan && normalizeRole(row.role) === "USER" && (
                              <button
                                className="btn btn-sm btn-outline-success me-1"
                                onClick={() => openWorkoutAssignModal(row)}
                                type="button"
                              >
                                <IconBarbell size={14} className="me-1" />
                                Assign Workout Plan
                              </button>
                            )}
                            {canAssignDietPlan && normalizeRole(row.role) === "USER" && (
                              <button
                                className="btn btn-sm btn-outline-warning me-1"
                                onClick={() => openDietAssignModal(row)}
                                type="button"
                              >
                              <IconChefHat size={14} className="me-1" />
                              Assign Diet Plan
                            </button>
                          )}
                          {normalizeRole(row.role) === "USER" && (
                            <button
                              className="btn btn-sm btn-outline-info me-1"
                              onClick={() => openProfileModal(row)}
                              type="button"
                              title="View Member Profile"
                            >
                              <IconEye size={14} />
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEdit(row)}
                            type="button"
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => confirmDelete(row)}
                            type="button"
                          >
                            <IconTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {renderUserModal()}
        {renderDietAssignModal()}
        {renderWorkoutAssignModal()}
        {renderDeleteModal()}
        {renderProfileModal()}
      </div>
    </div>
  );
}






























