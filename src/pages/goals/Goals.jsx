import React, { useEffect, useMemo, useState } from 'react';
import { Table, Container, Row, Col, Card, CardBody, Modal, Form, Button } from 'react-bootstrap';
import Footer from '../../components/Footer.jsx';
import { IconPlus, IconSearch, IconEdit, IconTrash } from '@tabler/icons-react';
import { createGoal, deleteGoal, getMyGoals, updateGoal } from '../../api/goalsApi.js';
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
};

const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

export default function Goals() {
    // Goals are personal data; any signed-in user manages their own (ownership enforced by the API).
    const canCreate = true;
    const canEdit = true;
    const canDelete = true;

    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_GOAL);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const loadGoals = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getMyGoals();
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
    }, []);

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(''), 2500);
        return () => clearTimeout(timer);
    }, [notice]);

    const openAdd = () => {
        setForm(EMPTY_GOAL);
        setEditingId(null);
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
        };
        setSaving(true);
        setFormError('');
        try {
            if (editingId) {
                await updateGoal(editingId, payload);
                setNotice('Goal updated successfully');
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

    const filteredGoals = useMemo(() => {
        const term = search.trim().toLowerCase();
        return goals.filter((goal) => {
            const matchesSearch = !term || String(goal.name || '').toLowerCase().includes(term);
            const matchesStatus = !statusFilter || goal.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [goals, search, statusFilter]);

    const badgeClass = (status) => {
        switch (status) {
            case 'Completed':
                return 'badge-success';
            case 'In Progress':
                return 'badge-warning';
            case 'Skipped':
                return 'badge-danger';
            case 'Not Started':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    };

    return (
        <>
            <main className="themebody-wrap">
                <div className="theme-body goals-page">
                    <Container fluid>
                        {error && <div className="alert alert-danger">{error}</div>}
                        {notice && <div className="alert alert-success">{notice}</div>}
                        <Card>
                            <CardBody>
                                <Row className="gy-4">
                                    <Col md={8}>
                                        <div className="d-sm-flex align-items-center justify-content-between gap-3">
                                            <div className="input-group">
                                                <span className="input-group-text pe-0">
                                                    <IconSearch />
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Search goals"
                                                    className="form-control"
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="d-sm-flex align-items-center gap-3">
                                                <select
                                                    className="form-select select-status"
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                >
                                                    <option value="">All Status</option>
                                                    {STATUS_OPTIONS.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-end">
                                        {canCreate && (
                                            <button type="button" onClick={openAdd} className="btn btn-primary">
                                                <IconPlus />
                                                Add Goal
                                            </button>
                                        )}
                                    </Col>

                                    <Col className="mt-4">
                                        <Table className="goals-table" responsive>
                                            <thead>
                                                <tr>
                                                    <th>Exercise / Goal</th>
                                                    <th>Sets</th>
                                                    <th>Reps</th>
                                                    <th>Rest</th>
                                                    <th>Weight</th>
                                                    <th>Calories</th>
                                                    <th>Status</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={8} className="text-center py-4">Loading...</td>
                                                    </tr>
                                                ) : filteredGoals.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="text-center py-4">No goals found. Add your first goal.</td>
                                                    </tr>
                                                ) : (
                                                    filteredGoals.map((goal) => (
                                                        <tr key={goal.id}>
                                                            <td>
                                                                <div className="cooking-grid">
                                                                    <div>
                                                                        <div className="fw-semibold">{goal.name}</div>
                                                                        {goal.category && <small className="text-muted">{goal.category}</small>}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{goal.sets ?? '-'}</td>
                                                            <td>{goal.reps ?? '-'} {goal.reps != null && <span className="font-light">reps</span>}</td>
                                                            <td>{goal.rest ?? '-'} {goal.rest != null && <span className="font-light">sec</span>}</td>
                                                            <td>{goal.weight ?? '-'} {goal.weight != null && <span className="font-light">kg</span>}</td>
                                                            <td>{goal.calories ?? '-'} {goal.calories != null && <span className="font-light">cal</span>}</td>
                                                            <td>
                                                                <span className={`badge ${badgeClass(goal.status)}`}>{goal.status}</span>
                                                            </td>
                                                            <td className="text-end text-nowrap">
                                                                {canEdit && (
                                                                    <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(goal)}>
                                                                        <IconEdit size={14} />
                                                                    </button>
                                                                )}
                                                                {canDelete && (
                                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(goal)}>
                                                                        <IconTrash size={14} />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Container>
                </div>
            </main>

            <Modal show={showModal} onHide={closeModal} centered>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingId ? 'Edit Goal' : 'Add Goal'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {formError && <div className="alert alert-danger">{formError}</div>}
                        <Row className="gy-3">
                            <Col md={12}>
                                <Form.Label>Exercise / Goal Name *</Form.Label>
                                <Form.Control type="text" placeholder="e.g., Squats" value={form.name} onChange={handleChange('name')} autoFocus />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Category</Form.Label>
                                <Form.Control type="text" placeholder="e.g., Strength" value={form.category} onChange={handleChange('category')} />
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
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={closeModal} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Goal'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

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
