import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  IconHome, IconEdit, IconTrash, IconPlus, IconStar, IconClock,
  IconChefHat, IconHeartbeat, IconTools, IconList, IconPhoto,
  IconX
} from '@tabler/icons-react';
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import WizardPopup from "../../components/WizardPopup";
import api from "../../utils/api";
import { resolveDietImage } from "../../utils/dietImages";

// ----------------------------------------------
//  Constants & Helpers
// ----------------------------------------------
const EMPTY_DIET = {
  name: "",
  description: "",
  eatTime: "08:00",
  prepTime: 5,
  cookTime: 10,
  difficulty: "Medium",
  totalSteps: 1,
  healthScore: 85,
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  cholesterol: 0,
  sodium: 0,
  potassium: 0,
  vitaminA: 0,
  vitaminC: 0,
  calcium: 0,
  iron: 0,
  ingredients: [],
  directions: [],
  tools: [],
  notes: "",
  mainImage: "",
  galleryImages: [],
  status: "ACTIVE",
};

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];
const STEP_FIELDS = [
  { key: "basic", label: "Basic Info" },
  { key: "timing", label: "Timing & Difficulty" },
  { key: "nutrition", label: "Nutrition" },
  { key: "ingredients", label: "Ingredients & Tools" },
  { key: "directions", label: "Directions" },
  { key: "images", label: "Images" },
];

const textToArray = (text) => text.split(/\r?\n/).filter(s => s.trim().length > 0);
const arrayToText = (arr) => (arr || []).join("\n");
const numberOrZero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function normalizeDietPlan(plan) {
  return {
    ...EMPTY_DIET,
    ...plan,
    id: plan.id,
    name: plan.name || plan.title || "Untitled menu item",
    description: plan.description || "",
    prepTime: numberOrZero(plan.prepTime),
    cookTime: numberOrZero(plan.cookTime),
    totalSteps: Math.max(numberOrZero(plan.totalSteps), 1),
    healthScore: numberOrZero(plan.healthScore),
    calories: numberOrZero(plan.calories),
    protein: numberOrZero(plan.protein),
    carbs: numberOrZero(plan.carbs),
    fats: numberOrZero(plan.fats),
    ingredients: plan.ingredients || [],
    directions: plan.directions || [],
    tools: plan.tools || [],
    mainImage: plan.mainImage || plan.image || "",
    galleryImages: plan.galleryImages || [],
    status: plan.status || "ACTIVE",
  };
}

// ----------------------------------------------
//  Main Component
// ----------------------------------------------
export default function DietPlanPage() {
  const { hasPermission, user } = useAuth();
  // Members don't manage the catalog — they only see the plan an admin/trainer
  // assigned to them. Staff see and manage the full Diet Menu catalog.
  const isMember = String(user?.role || "").toUpperCase() === "USER";

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_DIET);
  const [modalTab, setModalTab] = useState("basic");
  const [modalError, setModalError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ingredientText, setIngredientText] = useState("");
  const [directionText, setDirectionText] = useState("");
  const [toolText, setToolText] = useState("");

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const modalStepIndex = useMemo(() => {
    const idx = STEP_FIELDS.findIndex(s => s.key === modalTab);
    return idx >= 0 ? idx : 0;
  }, [modalTab]);
  const modalStepCount = STEP_FIELDS.length;

  // ----------------------------------------------
  //  API calls (adjust endpoints as needed)
  // ----------------------------------------------
  const loadDietPlans = async () => {
    setLoading(true);
    try {
      if (isMember) {
        // A member only sees the single plan assigned to them (or nothing).
        const res = await api.get("/users/me/diet-plan");
        const data = res.data?.data ?? res.data ?? null;
        const assigned = data && data.id ? [normalizeDietPlan(data)] : [];
        setPlans(assigned);
      } else {
        const res = await api.get("/diet-plans");
        const data = res.data?.data || res.data || [];
        setPlans(Array.isArray(data) ? data.map(normalizeDietPlan) : []);
      }
      setError("");
    } catch (err) {
      // No plan assigned yet comes back as an error/empty for members — show the
      // empty state rather than a scary error.
      if (isMember) {
        setPlans([]);
        setError("");
      } else {
        setError(extractApiErrorMessage(err, "Failed to load diet menu"));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveDietPlan = async (payload) => {
    if (isEdit) {
      await api.put(`/diet-plans/${selectedId}`, payload);
      setNotice("Diet menu item updated successfully");
    } else {
      await api.post("/diet-plans", payload);
      setNotice("Diet menu item added successfully");
    }
  };

  const deleteDietPlan = async (id) => {
    await api.delete(`/diet-plans/${id}`);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/uploads/diet-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data?.path || res.data?.path || "";
  };

  useEffect(() => {
    loadDietPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMember]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  // Authorization now comes from saved permissions
  if (!hasPermission("dietplan")) {
    return (
      <div className="content">
        <div className="alert alert-danger">
          You do not have permission to manage Diet Menu.
        </div>
      </div>
    );
  }

  // ----------------------------------------------
  //  Modal Handlers
  // ----------------------------------------------
  const openAdd = () => {
    setForm(EMPTY_DIET);
    setIngredientText("");
    setDirectionText("");
    setToolText("");
    setIsEdit(false);
    setModalError("");
    setModalTab("basic");
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setForm({
      ...plan,
      ingredients: plan.ingredients || [],
      directions: plan.directions || [],
      tools: plan.tools || [],
      galleryImages: plan.galleryImages || [],
    });
    setIngredientText(arrayToText(plan.ingredients || []));
    setDirectionText(arrayToText(plan.directions || []));
    setToolText(arrayToText(plan.tools || []));
    setSelectedId(plan.id);
    setIsEdit(true);
    setModalError("");
    setModalTab("basic");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError("");
    setModalTab("basic");
  };

  const goToNextStep = () => {
    setModalError("");
    // Basic validation before moving forward
    if (modalTab === "basic" && !form.name?.trim()) {
      setModalError("Diet menu item name is required");
      return;
    }
    if (modalStepIndex < modalStepCount - 1) {
      setModalTab(STEP_FIELDS[modalStepIndex + 1].key);
    }
  };

  const goToPrevStep = () => {
    setModalError("");
    if (modalStepIndex > 0) {
      setModalTab(STEP_FIELDS[modalStepIndex - 1].key);
    }
  };

  const validateForm = () => {
    if (!form.name?.trim()) return "Diet menu item name is required";
    if (form.prepTime < 0) return "Prep time cannot be negative";
    if (form.cookTime < 0) return "Cook time cannot be negative";
    if (form.totalSteps < 1) return "Total steps must be at least 1";
    if (form.healthScore < 0 || form.healthScore > 100) return "Health score must be between 0 and 100";
    return null;
  };

  const handleSubmit = async () => {
    setModalError("");
    const errMsg = validateForm();
    if (errMsg) {
      setModalError(errMsg);
      setModalTab("basic");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || "",
      eatTime: form.eatTime,
      prepTime: Number(form.prepTime),
      cookTime: Number(form.cookTime),
      difficulty: form.difficulty,
      totalSteps: Number(form.totalSteps),
      healthScore: Number(form.healthScore),
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fats: Number(form.fats),
      cholesterol: Number(form.cholesterol),
      sodium: Number(form.sodium),
      potassium: Number(form.potassium),
      vitaminA: Number(form.vitaminA),
      vitaminC: Number(form.vitaminC),
      calcium: Number(form.calcium),
      iron: Number(form.iron),
      ingredients: textToArray(ingredientText),
      directions: textToArray(directionText),
      tools: textToArray(toolText),
      notes: form.notes?.trim() || "",
      mainImage: form.mainImage,
      galleryImages: form.galleryImages || [],
      status: form.status,
    };

    setSaving(true);
    try {
      await saveDietPlan(payload);
      closeModal();
      await loadDietPlans();
    } catch (err) {
      setModalError(extractApiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => setDeleteTarget(id);
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteDietPlan(deleteTarget);
      setNotice("Diet menu item deleted");
      setDeleteTarget(null);
      await loadDietPlans();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Delete failed"));
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------
  //  Image Upload Handlers
  // ----------------------------------------------
  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    try {
      const path = await uploadImage(file);
      setForm(prev => ({ ...prev, mainImage: path }));
    } catch (err) {
      setModalError("Main image upload failed");
    } finally {
      setUploadingMain(false);
      e.target.value = "";
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingGallery(true);
    setModalError("");
    try {
      const results = await Promise.allSettled(files.map(f => uploadImage(f)));
      const uploadedPaths = results
        .filter(result => result.status === "fulfilled" && result.value)
        .map(result => result.value);

      if (!uploadedPaths.length) {
        setModalError("Gallery image upload failed");
        return;
      }

      setForm(prev => ({
        ...prev,
        galleryImages: [...(prev.galleryImages || []), ...uploadedPaths],
      }));

      const failedCount = results.length - uploadedPaths.length;
      if (failedCount > 0) {
        setModalError(`${failedCount} gallery image${failedCount > 1 ? "s" : ""} failed to upload`);
      }
    } catch (err) {
      setModalError("One or more gallery images failed to upload");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (index) => {
    setForm(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  // ----------------------------------------------
  //  Render Form Sections
  // ----------------------------------------------
  const renderBasicInfo = () => (
    <div className="row g-3">
      <div className="col-12">
        <p className="avm-section-title">Basic Information</p>
      </div>
      <div className="col-md-12">
        <label className="form-label">Plan Name *</label>
        <input className="form-control" value={form.name}
               onChange={e => setForm({...form, name: e.target.value})}
               placeholder="e.g., Morning Energy Bowl" />
      </div>
      <div className="col-md-12">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={3} value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Short overview of this diet menu item" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Status</label>
        <select className="form-select" value={form.status}
                onChange={e => setForm({...form, status: e.target.value})}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
    </div>
  );

  const renderTimingDifficulty = () => (
    <div className="row g-3">
      <div className="col-12"><p className="avm-section-title">Timing & Difficulty</p></div>
      <div className="col-md-6">
        <label className="form-label">Eat Time (24h)</label>
        <input type="time" className="form-control" value={form.eatTime}
               onChange={e => setForm({...form, eatTime: e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Prep Time (minutes)</label>
        <input type="number" min="0" className="form-control" value={form.prepTime}
               onChange={e => setForm({...form, prepTime: e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Cook Time (minutes)</label>
        <input type="number" min="0" className="form-control" value={form.cookTime}
               onChange={e => setForm({...form, cookTime: e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Difficulty</label>
        <select className="form-select" value={form.difficulty}
                onChange={e => setForm({...form, difficulty: e.target.value})}>
          {DIFFICULTY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Total Steps</label>
        <input type="number" min="1" className="form-control" value={form.totalSteps}
               onChange={e => setForm({...form, totalSteps: e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Health Score (0‑100)</label>
        <input type="number" min="0" max="100" className="form-control" value={form.healthScore}
               onChange={e => setForm({...form, healthScore: e.target.value})} />
      </div>
    </div>
  );

  const renderNutrition = () => (
    <div className="row g-3">
      <div className="col-12"><p className="avm-section-title">Nutrition Facts (per serving)</p></div>
      <div className="col-md-4"><label>Calories</label><input type="number" className="form-control" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} /></div>
      <div className="col-md-4"><label>Protein (g)</label><input type="number" className="form-control" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} /></div>
      <div className="col-md-4"><label>Carbs (g)</label><input type="number" className="form-control" value={form.carbs} onChange={e => setForm({...form, carbs: e.target.value})} /></div>
      <div className="col-md-4"><label>Fats (g)</label><input type="number" className="form-control" value={form.fats} onChange={e => setForm({...form, fats: e.target.value})} /></div>
      <div className="col-md-4"><label>Cholesterol (mg)</label><input type="number" className="form-control" value={form.cholesterol} onChange={e => setForm({...form, cholesterol: e.target.value})} /></div>
      <div className="col-md-4"><label>Sodium (mg)</label><input type="number" className="form-control" value={form.sodium} onChange={e => setForm({...form, sodium: e.target.value})} /></div>
      <div className="col-md-4"><label>Potassium (mg)</label><input type="number" className="form-control" value={form.potassium} onChange={e => setForm({...form, potassium: e.target.value})} /></div>
      <div className="col-md-2"><label>Vitamin A (%)</label><input type="number" className="form-control" value={form.vitaminA} onChange={e => setForm({...form, vitaminA: e.target.value})} /></div>
      <div className="col-md-2"><label>Vitamin C (%)</label><input type="number" className="form-control" value={form.vitaminC} onChange={e => setForm({...form, vitaminC: e.target.value})} /></div>
      <div className="col-md-2"><label>Calcium (%)</label><input type="number" className="form-control" value={form.calcium} onChange={e => setForm({...form, calcium: e.target.value})} /></div>
      <div className="col-md-2"><label>Iron (%)</label><input type="number" className="form-control" value={form.iron} onChange={e => setForm({...form, iron: e.target.value})} /></div>
    </div>
  );

  const renderIngredientsTools = () => (
    <div className="row g-3">
      <div className="col-md-12">
        <label className="form-label">Ingredients (one per line)</label>
        <textarea
          className="form-control"
          rows={5}
          style={{ minHeight: "180px", maxHeight: "220px" }}
          value={ingredientText}
          onChange={e => setIngredientText(e.target.value)}
          placeholder="2 large eggs&#10;1 cup spinach&#10;..."
        />
      </div>
      <div className="col-md-12">
        <label className="form-label">Tools & Equipment (one per line)</label>
        <textarea
          className="form-control"
          rows={4}
          style={{ minHeight: "140px", maxHeight: "180px" }}
          value={toolText}
          onChange={e => setToolText(e.target.value)}
          placeholder="Non-stick skillet&#10;Spatula&#10;..."
        />
        <small className="text-muted d-block mt-2">
          Keep each item on its own line so the wizard controls remain visible below.
        </small>
      </div>
      <div className="col-md-12">
        <label className="form-label">Notes</label>
        <textarea className="form-control" rows={3} value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})} />
      </div>
    </div>
  );

  const renderDirections = () => (
    <div className="row g-3">
      <div className="col-md-12">
        <label className="form-label">Directions (one step per line)</label>
        <textarea
          className="form-control"
          rows={7}
          style={{ minHeight: "240px", maxHeight: "280px" }}
          value={directionText}
          onChange={e => setDirectionText(e.target.value)}
          placeholder="Step 1: ...&#10;Step 2: ..."
        />
        <small className="text-muted d-block mt-2">
          Use Enter for each new step. The Next button stays in the wizard footer below.
        </small>
      </div>
    </div>
  );

  const renderImages = () => (
    <div className="row g-3">
      <div className="col-12"><p className="avm-section-title">Main Image</p></div>
      <div className="col-md-12">
        <input type="file" accept="image/*" className="form-control" onChange={handleMainImageUpload} disabled={uploadingMain} />
        {uploadingMain && <small className="text-muted">Uploading...</small>}
        {form.mainImage && (
          <div className="mt-2">
            <img src={resolveDietImage(form.mainImage)} alt="Main" style={{ maxWidth: "200px", borderRadius: "8px" }} />
            <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => setForm({...form, mainImage: ""})}>Remove</button>
          </div>
        )}
      </div>

      <div className="col-12 mt-3"><p className="avm-section-title">Gallery Images</p></div>
      <div className="col-md-12">
        <input type="file" multiple accept="image/*" className="form-control" onChange={handleGalleryUpload} disabled={uploadingGallery} />
        {uploadingGallery && <small className="text-muted">Uploading gallery...</small>}
        <div className="d-flex flex-wrap gap-2 mt-2">
          {form.galleryImages.map((img, idx) => (
            <div key={idx} className="position-relative">
              <img src={resolveDietImage(img)} alt={`gallery-${idx}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} />
              <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0" style={{ width: "20px", height: "20px", lineHeight: "1" }} onClick={() => removeGalleryImage(idx)}><IconX size={12} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------
  //  Render List (Cards / Table)
  // ----------------------------------------------
  const renderGrid = () => (
    <div className="row">
      {plans.map(plan => (
        <div key={plan.id} className="col-xl-3 col-lg-4 col-md-6 mb-3">
          <div className="card h-100">
            {plan.mainImage && <img src={resolveDietImage(plan.mainImage)} className="card-img-top" alt={plan.name} style={{ height: "180px", objectFit: "cover" }} />}
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h6 className="card-title">{plan.name}</h6>
                <span className={`badge ${plan.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>{plan.status}</span>
              </div>
              <p className="small text-muted">{plan.description?.slice(0, 80)}...</p>
              <div className="d-flex flex-wrap gap-2 small text-muted">
                <span><IconClock size={14} /> {plan.prepTime + plan.cookTime} min</span>
                <span><IconHeartbeat size={14} /> {plan.healthScore}/100</span>
                <span><IconChefHat size={14} /> {plan.difficulty}</span>
              </div>
              <div className="d-flex gap-2 mt-2">
                <Link className="btn btn-sm btn-outline-secondary" to={`/diet-detail/${plan.id}`}>View</Link>
                {!isMember && (
                  <>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(plan)}><IconEdit size={14} /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(plan.id)}><IconTrash size={14} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th style={{ minWidth: 260 }}>Menu Item</th>
            <th>Difficulty</th>
            <th>Time</th>
            <th>Calories</th>
            <th>Protein</th>
            <th>Health Score</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(plan => (
            <tr key={plan.id}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {plan.mainImage && <img src={resolveDietImage(plan.mainImage)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />}
                  <div>
                    <div className="fw-semibold">{plan.name}</div>
                    <small className="text-muted">{plan.description?.slice(0, 70)}</small>
                  </div>
                </div>
              </td>
              <td>{plan.difficulty}</td>
              <td>{plan.prepTime + plan.cookTime} min</td>
              <td>{plan.calories}</td>
              <td>{plan.protein}g</td>
              <td>{plan.healthScore}/100</td>
              <td><span className={`badge ${plan.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>{plan.status}</span></td>
              <td className="text-end">
                <Link className="btn btn-sm btn-outline-secondary me-1" to={`/diet-detail/${plan.id}`}>View</Link>
                {!isMember && (
                  <>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(plan)}><IconEdit size={14} /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(plan.id)}><IconTrash size={14} /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderEmptyState = () => (
    <div className="card p-5 text-center">
      <div className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-light rounded-circle" style={{ width: 64, height: 64 }}>
        <IconChefHat size={32} />
      </div>
      <h5 className="mb-2">{isMember ? "No diet plan assigned yet" : "No menu items yet"}</h5>
      <p className="text-muted mb-3">
        {isMember
          ? "Your trainer or admin hasn't assigned a diet plan to you yet. It will appear here once assigned."
          : "Add breakfast, lunch, dinner, or snack items to build the Diet Menu table."}
      </p>
      {!isMember && (
        <div>
          <button className="btn btn-primary" onClick={openAdd}>
            <IconPlus size={16} className="me-2" />
            Add Menu Item
          </button>
        </div>
      )}
    </div>
  );

  // ----------------------------------------------
  //  Main Render
  // ----------------------------------------------
  return (
    <div className="page-wrapper diet-plan-page">
      <div className="content">
        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-md-flex align-items-center justify-content-between mb-3">
          <div>
            <h2>DIET MENU</h2>
            <nav><ol className="breadcrumb"><li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li><li className="breadcrumb-item active">Diet Menu</li></ol></nav>
          </div>
          {!isMember && (
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={openAdd}><IconPlus size={16} className="me-2" />Add Menu Item</button>
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="d-flex gap-2 mb-3">
          <button className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-light"}`} onClick={() => setViewMode("grid")}>Grid View</button>
          <button className={`btn ${viewMode === "table" ? "btn-primary" : "btn-light"}`} onClick={() => setViewMode("table")}>Table View</button>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : plans.length === 0 ? (
          renderEmptyState()
        ) : (
          viewMode === "grid" ? renderGrid() : renderTable()
        )}
      </div>

      {/* Add/Edit Modal */}
      <WizardPopup
        open={showModal}
        title={isEdit ? "Edit Menu Item" : "Add Menu Item"}
        steps={STEP_FIELDS.map(s => s.label)}
        step={modalStepIndex}
        onClose={closeModal}
        onBack={goToPrevStep}
        onNext={goToNextStep}
        onSubmit={handleSubmit}
        submitLabel={saving ? "Saving..." : "Save"}
        modalWidth="700px"
        disabled={saving}
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}
        {modalTab === "basic" && renderBasicInfo()}
        {modalTab === "timing" && renderTimingDifficulty()}
        {modalTab === "nutrition" && renderNutrition()}
        {modalTab === "ingredients" && renderIngredientsTools()}
        {modalTab === "directions" && renderDirections()}
        {modalTab === "images" && renderImages()}
      </WizardPopup>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header"><h5>Confirm Delete</h5><button className="btn-close" onClick={() => setDeleteTarget(null)} /></div>
              <div className="modal-body">Delete this diet menu item? This cannot be undone.</div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && <div className="modal-backdrop fade show" />}
    </div>
  );
}
