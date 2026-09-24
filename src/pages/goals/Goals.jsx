import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Modal, Form, Button } from 'react-bootstrap';
import Footer from '../../components/Footer.jsx';
import CommonTable from '../../components/CommonTable';
import { IconPlus, IconBolt, IconUserCheck } from '@tabler/icons-react';
import {
    createGoal,
    deleteGoal,
    getMyGoals,
    updateGoal,
    getMemberGoals,
    createGoalForMember,
    loadGoalPresets,
} from '../../api/goalsApi.js';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { extractApiErrorMessage } from '../../utils/errorMessage';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Skipped'];

const EMPTY_GOAL = {
    name: '',
    category: '',
    sets: '',
    reps: '',
    rest: '',
    weight: '',
    calories: '',
    status: 'Not Started',
    notes: '',
};

const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

const formatMemberName = (m) => {
    if (!m) return '';
    const full = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
    return full || m.name || m.email || `Member #${m.id}`;
};

export default function Goals() {
    const { user } = useAuth();
    const isStaff = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'TRAINER'].includes(
        String(user?.role || '').toUpperCase()
    );

    const canCreate = true;
    const canEdit = true;
    const canDelete = true;

    const [goals, setGoals] = useState([]);
    const [members, setMembers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [targetMemberId, setTargetMemberId] = useState('');
    const [loading, setLoading] = useState(false);
    const [presetLoading, setPresetLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_GOAL);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Fetch gym members list if logged-in user is a coach or staff
    useEffect(() => {
        if (isStaff) {
            api.get('/users/customers', { params: { requesterId: user?.id } })
                .then((res) => {
                    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
                    setMembers(list);
                })
                .catch(() => {
                    api.get('/users/customers')
                        .then((res) => {
                            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
                            setMembers(list);
                        })
                        .catch(() => setMembers([]));
                });
        }
    }, [isStaff, user?.id]);

    const loadGoals = async () => {
        setLoading(true);
        setError('');
        try {
            let data;
            if (selectedMemberId && isStaff) {
                data = await getMemberGoals(selectedMemberId);
            } else {
                data = await getMyGoals();
            }
            setGoals(Array.isArray(data) ? data : []);
        } catch (err) {
            setGoals([]);
            setError(extractApiErrorMessage(err, 'Failed to load goals'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGoals();
    }, [selectedMemberId]);

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(''), 3000);
        return () => clearTimeout(timer);
    }, [notice]);

    const openAdd = () => {
        setForm(EMPTY_GOAL);
        setEditingId(null);
        setTargetMemberId(selectedMemberId || '');
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (goal) => {
        setForm({
            name: goal.name || '',
            category: goal.category || '',
            sets: goal.sets ?? '',
            reps: goal.reps ?? '',
            rest: goal.rest ?? '',
            weight: goal.weight ?? '',
            calories: goal.calories ?? '',
            status: goal.status || 'Not Started',
            notes: goal.notes || '',
        });
        setEditingId(goal.id);
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormError('');
    };

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setFormError('Exercise name is required');
            return;
        }
        const payload = {
            name: form.name.trim(),
            category: form.category.trim() || null,
            sets: numberOrNull(form.sets),
            reps: numberOrNull(form.reps),
            rest: numberOrNull(form.rest),
            weight: numberOrNull(form.weight),
            calories: numberOrNull(form.calories),
            status: form.status,
            notes: form.notes.trim() || null,
        };
        setSaving(true);
        setFormError('');
        try {
            if (editingId) {
                await updateGoal(editingId, payload);
                setNotice('Goal updated successfully');
            } else if (targetMemberId && isStaff) {
                await createGoalForMember(targetMemberId, payload);
                setNotice('Goal assigned to member successfully');
            } else {
                await createGoal(payload);
                setNotice('Goal added successfully');
            }
            closeModal();
            await loadGoals();
        } catch (err) {
            setFormError(extractApiErrorMessage(err, 'Failed to save goal'));
        } finally {
            setSaving(false);
        }
    };

    const handleLoadPreset = async (category) => {
        setPresetLoading(true);
        setError('');
        try {
            const targetId = selectedMemberId || null;
            await loadGoalPresets(targetId, category);
            setNotice(`Loaded ${category} starter goals successfully!`);
            await loadGoals();
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Failed to load starter goals'));
        } finally {
            setPresetLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget?.id) return;
        setSaving(true);
        try {
            await deleteGoal(deleteTarget.id);
            setNotice('Goal deleted successfully');
            setDeleteTarget(null);
            await loadGoals();
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Failed to delete goal'));
        } finally {
            setSaving(false);
        }
    };

    const badgeClass = (status) => {
        const s = String(status || '').toLowerCase();
        if (s.includes('complete') || s.includes('achieved')) return 'badge-success';
        if (s.includes('progress')) return 'badge-warning';
        if (s.includes('skip') || s.includes('abandon')) return 'badge-danger';
        return 'badge-secondary';
    };

    const handleBulkDelete = async (selectedIds) => {
        if (!selectedIds || selectedIds.size === 0) return;
        setSaving(true);
        try {
            await Promise.all(Array.from(selectedIds).map((id) => deleteGoal(id)));
            setNotice(`${selectedIds.size} goal(s) deleted successfully`);
            await loadGoals();
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Failed to delete selected goals'));
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => [
        {
            key: 'name',
            label: 'EXERCISE / GOAL',
            sortable: true,
            render: (val, row) => {
                const isAssigned = (row.notes || '').includes('[Assigned by');
                return (
                    <div>
                        <div className="fw-semibold d-flex align-items-center gap-2">
                            <span>{row.name}</span>
                            {isAssigned && (
                                <span
                                    className="badge bg-primary-subtle text-primary border"
                                    style={{ fontSize: '0.68rem', fontWeight: 600 }}
                                    title={row.notes}
                                >
                                    Coach Assigned
                                </span>
                            )}
                        </div>
                        {row.category && <small className="text-muted d-block">{row.category}</small>}
                        {row.notes && !isAssigned && (
                            <small className="text-muted d-block text-truncate" style={{ maxWidth: '240px' }} title={row.notes}>
                                {row.notes}
                            </small>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'sets',
            label: 'SETS',
            sortable: true,
            render: (val) => (val != null ? <span className="fw-semibold">{val}</span> : <span className="text-muted">—</span>),
        },
        {
            key: 'reps',
            label: 'REPS',
            sortable: true,
            render: (val) => (val != null ? <span>{val} <small className="text-muted">reps</small></span> : <span className="text-muted">—</span>),
        },
        {
            key: 'rest',
            label: 'REST',
            sortable: true,
            render: (val) => (val != null ? <span>{val} <small className="text-muted">sec</small></span> : <span className="text-muted">—</span>),
        },
        {
            key: 'weight',
            label: 'WEIGHT',
            sortable: true,
            render: (val) => (val != null ? <span>{val} <small className="text-muted">kg</small></span> : <span className="text-muted">—</span>),
        },
        {
            key: 'calories',
            label: 'CALORIES',
            sortable: true,
            render: (val) => (val != null ? <span>{val} <small className="text-muted">cal</small></span> : <span className="text-muted">—</span>),
        },
        {
            key: 'status',
            label: 'STATUS',
            sortable: true,
            render: (val) => {
                const statusText = val || 'Not Started';
                const s = statusText.toLowerCase();
                const badgeColor = s.includes('complete') || s.includes('achieved')
                    ? 'badge-success'
                    : s.includes('progress')
                    ? 'badge-warning'
                    : s.includes('skip') || s.includes('abandon')
                    ? 'badge-danger'
                    : 'badge-secondary';

                return (
                    <span className={`badge ${badgeColor}`}>
                        {statusText}
                    </span>
                );
            },
        },
    ], []);

    const selectedMemberObj = members.find((m) => String(m.userId || m.id) === String(selectedMemberId));

    return (
        <>
            <main className="themebody-wrap">
                <div className="theme-body goals-page">
                    <Container fluid>
                        {error && <div className="alert alert-danger">{error}</div>}
                        {notice && <div className="alert alert-success">{notice}</div>}

                        {/* Trainer / Staff context header banner */}
                        {isStaff && selectedMemberObj && (
                            <div className="alert alert-primary d-flex align-items-center justify-content-between mb-3 shadow-sm border-0 py-2 px-3 rounded-3">
                                <div className="d-flex align-items-center gap-2">
                                    <IconUserCheck size={20} className="text-primary" />
                                    <span>
                                        Viewing & managing goals for member: <strong>{formatMemberName(selectedMemberObj)}</strong>
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => setSelectedMemberId('')}
                                >
                                    Switch back to My Goals
                                </button>
                            </div>
                        )}

                        {/* Top Toolbar: Member Switcher & Actions */}
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                {isStaff && (
                                    <div style={{ minWidth: '240px' }}>
                                        <select
                                            className="form-select form-select-sm fw-semibold"
                                            style={{ borderRadius: '8px', borderColor: selectedMemberId ? '#3b82f6' : '#cbd5e1' }}
                                            value={selectedMemberId}
                                            onChange={(e) => setSelectedMemberId(e.target.value)}
                                        >
                                            <option value="">👤 My Personal Goals</option>
                                            {members.length > 0 && (
                                                <optgroup label="Gym Members">
                                                    {members.map((m) => (
                                                        <option key={m.id} value={m.userId || m.id}>
                                                            🎯 {formatMemberName(m)}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <div className="btn-group">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm dropdown-toggle d-inline-flex align-items-center gap-1 rounded-pill px-3"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                        disabled={presetLoading}
                                    >
                                        <IconBolt size={15} className="text-warning" />
                                        {presetLoading ? 'Loading…' : 'Starter Presets'}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                        <li>
                                            <h6 className="dropdown-header">Quick Starter Presets</h6>
                                        </li>
                                        <li>
                                            <button
                                                type="button"
                                                className="dropdown-item py-2"
                                                onClick={() => handleLoadPreset('strength')}
                                            >
                                                🏋️ Strength (Squats, Bench, Rows)
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                type="button"
                                                className="dropdown-item py-2"
                                                onClick={() => handleLoadPreset('cardio')}
                                            >
                                                🔥 Fat Loss & Cardio (HIIT, Swings, Rowing)
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                type="button"
                                                className="dropdown-item py-2"
                                                onClick={() => handleLoadPreset('general')}
                                            >
                                                🏃 General Fitness (Steps, Pushups, Plank)
                                            </button>
                                        </li>
                                    </ul>
                                </div>

                                {canCreate && (
                                    <button
                                        type="button"
                                        onClick={openAdd}
                                        className="btn btn-primary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1"
                                    >
                                        <IconPlus size={16} />
                                        {isStaff && selectedMemberId ? 'Assign Goal' : 'Add Goal'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Preset Generator Banner when empty */}
                        {goals.length === 0 && !loading && (
                            <div className="card border-dashed p-4 text-center bg-light mb-3 rounded-3 shadow-none">
                                <div className="mb-2">
                                    <span style={{ fontSize: '2.5rem' }}>🎯</span>
                                </div>
                                <h6 className="fw-bold mb-1">
                                    {selectedMemberObj
                                        ? `No goals set for ${formatMemberName(selectedMemberObj) || 'this member'} yet`
                                        : 'You haven’t established workout goals yet'}
                                </h6>
                                <p className="text-muted small mb-3" style={{ maxWidth: '420px', margin: '0 auto' }}>
                                    Kickstart tracking with a curated starter program or create a custom workout milestone.
                                </p>
                                <div className="d-flex flex-wrap justify-content-center gap-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        disabled={presetLoading}
                                        onClick={() => handleLoadPreset('strength')}
                                        className="rounded-pill px-3 py-1.5 fw-semibold"
                                    >
                                        🏋️ Strength Program
                                    </Button>
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        disabled={presetLoading}
                                        onClick={() => handleLoadPreset('cardio')}
                                        className="rounded-pill px-3 py-1.5 fw-semibold"
                                    >
                                        🔥 Fat Loss Program
                                    </Button>
                                    <Button
                                        variant="outline-info"
                                        size="sm"
                                        disabled={presetLoading}
                                        onClick={() => handleLoadPreset('general')}
                                        className="rounded-pill px-3 py-1.5 fw-semibold"
                                    >
                                        🏃 General Fitness
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={openAdd}
                                        className="rounded-pill px-3 fw-semibold"
                                    >
                                        <IconPlus size={14} className="me-1" />
                                        Create Custom Goal
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* CommonTable Component */}
                        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                            <div className="card-body p-0">
                                <CommonTable
                                    columns={columns}
                                    data={goals}
                                    entityName="goal"
                                    searchPlaceholder="Search goals by exercise, category, status, notes..."
                                    searchKeys={['name', 'category', 'status', 'notes']}
                                    loading={loading}
                                    onEdit={canEdit ? openEdit : null}
                                    onDelete={canDelete ? (row) => setDeleteTarget(row) : null}
                                    onBulkDelete={handleBulkDelete}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    defaultPageSize={10}
                                    filterOptions={[
                                        { label: 'All Status', value: 'ALL' },
                                        { label: 'Not Started', value: 'NOT STARTED' },
                                        { label: 'In Progress', value: 'IN PROGRESS' },
                                        { label: 'Completed', value: 'COMPLETED' },
                                        { label: 'Skipped', value: 'SKIPPED' },
                                    ]}
                                    idKey="id"
                                />
                            </div>
                        </div>
                    </Container>
                </div>
            </main>

            {/* Add / Edit Goal Modal */}
            <Modal show={showModal} onHide={closeModal} centered>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingId ? 'Edit Goal' : 'Add Goal'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {formError && <div className="alert alert-danger">{formError}</div>}
                        <Row className="gy-3">
                            {/* Member assignment dropdown for staff */}
                            {isStaff && !editingId && (
                                <Col md={12}>
                                    <Form.Label className="fw-semibold small">Assign Goal To</Form.Label>
                                    <Form.Select
                                        value={targetMemberId}
                                        onChange={(e) => setTargetMemberId(e.target.value)}
                                        className="form-select-sm"
                                    >
                                        <option value="">👤 Myself (Personal Goal)</option>
                                        {members.length > 0 && (
                                            <optgroup label="Assign to Gym Member">
                                                {members.map((m) => (
                                                    <option key={m.id} value={m.userId || m.id}>
                                                        🎯 {formatMemberName(m)} (Member)
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </Form.Select>
                                    <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                                        Trainers and coaches can assign fitness milestones directly to members.
                                    </small>
                                </Col>
                            )}

                            <Col md={12}>
                                <Form.Label>Exercise / Goal Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Squats, Bench Press"
                                    value={form.name}
                                    onChange={handleChange('name')}
                                    autoFocus
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Category</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Strength, Cardio"
                                    value={form.category}
                                    onChange={handleChange('category')}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Status</Form.Label>
                                <Form.Select value={form.status} onChange={handleChange('status')}>
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label>Sets</Form.Label>
                                <Form.Control type="number" min="0" value={form.sets} onChange={handleChange('sets')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Reps</Form.Label>
                                <Form.Control type="number" min="0" value={form.reps} onChange={handleChange('reps')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Rest (seconds)</Form.Label>
                                <Form.Control type="number" min="0" value={form.rest} onChange={handleChange('rest')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Weight (kg)</Form.Label>
                                <Form.Control type="number" min="0" value={form.weight} onChange={handleChange('weight')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Calories</Form.Label>
                                <Form.Control type="number" min="0" value={form.calories} onChange={handleChange('calories')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Notes (Optional)</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Target by next month"
                                    value={form.notes}
                                    onChange={handleChange('notes')}
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={closeModal} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Save Changes' : (targetMemberId && isStaff ? 'Assign Goal' : 'Add Goal')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Delete <strong>{deleteTarget?.name || 'this goal'}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setDeleteTarget(null)} type="button">Cancel</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={saving} type="button">
                        {saving ? 'Deleting...' : 'Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Footer />
        </>
    );
}

