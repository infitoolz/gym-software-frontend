import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Container, CardBody, Modal, Button, Form } from 'react-bootstrap';
import Chart from "react-apexcharts";
import Footer from '../../components/Footer';
import { IconHeart, IconPlus, IconTrash } from '@tabler/icons-react';
import { createProgressEntry, deleteProgressEntry, getProgressEntries, getProgressSummary } from '../../api/progressApi';
import { extractApiErrorMessage } from '../../utils/errorMessage';

const EMPTY_ENTRY = {
    entryDate: new Date().toISOString().slice(0, 10),
    weightKg: '',
    heartRateBpm: '',
    healthScore: '',
    workoutMinutes: '',
    workoutsCompleted: '',
    caloriesBurned: '',
    steps: '',
    waterLiters: '',
    notes: '',
};

const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

export default function Progress() {
    const [summary, setSummary] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_ENTRY);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const loadAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [summaryData, entryData] = await Promise.all([getProgressSummary(), getProgressEntries()]);
            setSummary(summaryData);
            setEntries(Array.isArray(entryData) ? entryData : []);
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Failed to load progress'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(''), 2500);
        return () => clearTimeout(timer);
    }, [notice]);

    const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        const payload = {
            entryDate: form.entryDate || null,
            weightKg: numberOrNull(form.weightKg),
            heartRateBpm: numberOrNull(form.heartRateBpm),
            healthScore: numberOrNull(form.healthScore),
            workoutMinutes: numberOrNull(form.workoutMinutes),
            workoutsCompleted: numberOrNull(form.workoutsCompleted),
            caloriesBurned: numberOrNull(form.caloriesBurned),
            steps: numberOrNull(form.steps),
            waterLiters: numberOrNull(form.waterLiters),
            notes: form.notes.trim() || null,
        };
        setSaving(true);
        try {
            await createProgressEntry(payload);
            setNotice('Progress entry logged');
            setShowModal(false);
            setForm(EMPTY_ENTRY);
            await loadAll();
        } catch (err) {
            setFormError(extractApiErrorMessage(err, 'Failed to log entry'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteProgressEntry(id);
            setNotice('Entry deleted');
            await loadAll();
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Failed to delete entry'));
        }
    };

    const goals = summary?.goals || [];
    const weightSeries = summary?.weightSeries || [];

    const workoutHours = Math.floor((summary?.workoutMinutesThisWeek || 0) / 60);
    const workoutMins = (summary?.workoutMinutesThisWeek || 0) % 60;

    const avgGoalProgress = useMemo(() => {
        if (!goals.length) return 0;
        const total = goals.reduce((sum, g) => sum + (g.progressPercent || 0), 0);
        return Math.round(total / goals.length);
    }, [goals]);

    const weightChart = useMemo(() => ({
        chart: { toolbar: { show: false }, sparkline: { enabled: false } },
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false },
        colors: ['#6571ff'],
        xaxis: {
            categories: weightSeries.map((p) => p.date),
            labels: { rotate: 0 },
        },
        yaxis: { labels: { formatter: (v) => `${Math.round(v)}` } },
        series: [{ name: 'Weight (kg)', data: weightSeries.map((p) => p.weight) }],
    }), [weightSeries]);

    const radialChart = useMemo(() => ({
        chart: { toolbar: { show: false } },
        plotOptions: {
            radialBar: {
                hollow: { size: '60%' },
                dataLabels: { value: { formatter: (v) => `${v}%` } },
            },
        },
        labels: ['Goals Progress'],
        colors: ['#6571ff'],
        series: [avgGoalProgress],
    }), [avgGoalProgress]);

    return (
        <>
            <main className="themebody-wrap">
                <div className="theme-body">
                    <Container fluid>
                        {error && <div className="alert alert-danger">{error}</div>}
                        {notice && <div className="alert alert-success">{notice}</div>}
                        <Row>
                            <Col md={12}>
                                <Card>
                                    <CardBody>
                                        <Row className="gy-3 mb-4">
                                            <Col xxl={8}>
                                                <div className="d-sm-flex d-inline-grid align-items-center gap-3">
                                                    <h5>Workout Time</h5>
                                                    <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light">
                                                        <h4><strong className="fw-bold">{workoutHours}</strong> <small className="font-light">Hours</small></h4>
                                                        <h4><strong className="fw-bold">{workoutMins}</strong> <small className="font-light">Minutes</small></h4>
                                                    </div>
                                                    <h5>Total Workouts</h5>
                                                    <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light">
                                                        <h4><strong className="fw-bold">{summary?.workoutsThisWeek || 0}</strong> <small className="font-light">This Week</small></h4>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col xxl={4} md={6} className="text-xxl-end">
                                                <button type="button" className="btn btn-primary" onClick={() => { setForm(EMPTY_ENTRY); setFormError(''); setShowModal(true); }}>
                                                    <IconPlus size={16} className="me-1" /> Log Progress
                                                </button>
                                            </Col>
                                        </Row>

                                        {loading ? (
                                            <div className="text-center py-4">Loading...</div>
                                        ) : (
                                            <>
                                            <Row className="gy-3">
                                                <Col xl={3} md={6}>
                                                    <Card className="shadow-none bg-light-secondary h-100 mb-0">
                                                        <CardBody>
                                                            <h4><IconHeart className='me-1' />Health Score</h4>
                                                            <div className="d-flex align-items-center mt-4">
                                                                <h2>{summary?.latestHealthScore != null ? `${summary.latestHealthScore}%` : '--'}</h2>
                                                            </div>
                                                            <div className="progress my-2" style={{ height: "8px" }}>
                                                                <div className="progress-bar bg-secondary" style={{ width: `${summary?.latestHealthScore || 0}%` }}></div>
                                                            </div>
                                                            <span>Logged from your latest entry.</span>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                                <Col xl={3} md={6}>
                                                    <Card className="shadow-none bg-light-danger h-100 mb-0">
                                                        <CardBody>
                                                            <h4><IconHeart className='me-1' />Heart Rate</h4>
                                                            <div className="d-flex align-items-center mt-4">
                                                                <h2>{summary?.latestHeartRate != null ? summary.latestHeartRate : '--'} <small className="fs-5">bpm</small></h2>
                                                            </div>
                                                            <span className="mt-2 d-block">Most recent reading.</span>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                                <Col xl={3} md={6}>
                                                    <Card className="shadow-none bg-light-info h-100 mb-0">
                                                        <CardBody>
                                                            <h4><IconHeart className='me-1' />Goals Progress</h4>
                                                            <Chart options={radialChart} series={radialChart.series} height={220} type='radialBar' />
                                                            <span className="text-center d-block">Average completion across your goals.</span>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                                <Col xl={3} md={6}>
                                                    <Card className="shadow-none border h-100 mb-0">
                                                        <CardBody>
                                                            <h4>Weight Data</h4>
                                                            <Table className="mt-2 mb-0">
                                                                <tbody>
                                                                    <tr>
                                                                        <td className="px-0 align-middle">Current Weight</td>
                                                                        <td className="px-0 align-middle text-end">
                                                                            <span className="fs-5">{summary?.latestWeight ?? '--'}</span>
                                                                            <span className="font-light"> kg</span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="px-0 align-middle">Weight Goal</td>
                                                                        <td className="px-0 align-middle text-end">
                                                                            <span className="fs-5">{summary?.weightGoal ?? '--'}</span>
                                                                            <span className="font-light"> kg</span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="px-0 align-middle">Progress</td>
                                                                        <td className="px-0 align-middle text-end">
                                                                            <span className="fs-5">{summary?.weightProgressPercent ?? '--'}</span>
                                                                            <span className="font-light"> %</span>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                            {weightSeries.length > 0 ? (
                                                                <Chart options={weightChart} series={weightChart.series} height={200} type='area' className="mt-3" />
                                                            ) : (
                                                                <p className="text-muted mt-3 mb-0">Log weight entries to see the trend. Set a goal with category "Weight" to track progress.</p>
                                                            )}
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            </Row>

                                            <Row className="mt-3">
                                                <Col md={12}>
                                                    <Card className="border shadow-none">
                                                        <CardBody>
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <h4 className="fw-bold">Recent Entries</h4>
                                                                <span className="badge badge-light">{summary?.caloriesThisWeek || 0} cal this week</span>
                                                            </div>
                                                            <div className="table-responsive">
                                                                <Table className="mb-0 align-middle">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Date</th>
                                                                            <th>Weight</th>
                                                                            <th>HR</th>
                                                                            <th>Mins</th>
                                                                            <th>Cal</th>
                                                                            <th className="text-end">Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {entries.length === 0 ? (
                                                                            <tr><td colSpan={6} className="text-center py-4">No entries logged yet.</td></tr>
                                                                        ) : (
                                                                            entries.map((entry) => (
                                                                                <tr key={entry.id}>
                                                                                    <td>{entry.entryDate}</td>
                                                                                    <td>{entry.weightKg ?? '-'}</td>
                                                                                    <td>{entry.heartRateBpm ?? '-'}</td>
                                                                                    <td>{entry.workoutMinutes ?? '-'}</td>
                                                                                    <td>{entry.caloriesBurned ?? '-'}</td>
                                                                                    <td className="text-end">
                                                                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(entry.id)}>
                                                                                            <IconTrash size={14} />
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        )}
                                                                    </tbody>
                                                                </Table>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            </Row>

                                            <Row className="mt-2">
                                                <Col md={12}>
                                                    <h4 className="mb-3 fw-semibold">Goals List</h4>
                                                    {goals.length === 0 ? (
                                                        <Card className="shadow-none border"><CardBody><span className="text-muted">No goals yet. Add goals on the Goals page.</span></CardBody></Card>
                                                    ) : (
                                                        <Row className="gy-3">
                                                            {goals.map((goal) => (
                                                                <Col xl={3} lg={4} sm={6} key={goal.id}>
                                                                    <Card className="shadow-none border h-100 mb-0">
                                                                        <CardBody>
                                                                            <h5 className="fw-semibold mb-2">{goal.name}</h5>
                                                                            {goal.category && <span className="badge badge-light me-2">{goal.category}</span>}
                                                                            {goal.targetValue != null && (
                                                                                <span className="font-light">{goal.currentValue ?? 0}/{goal.targetValue} {goal.unit || ''}</span>
                                                                            )}
                                                                            <div className="mt-3">
                                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                                    <h4 className="fw-semibold">{goal.progressPercent || 0}%</h4>
                                                                                    <span className="font-light">{goal.status}</span>
                                                                                </div>
                                                                                <div className="progress" style={{ height: "10px" }}>
                                                                                    <div className="progress-bar bg-primary" style={{ width: `${goal.progressPercent || 0}%` }}></div>
                                                                                </div>
                                                                            </div>
                                                                        </CardBody>
                                                                    </Card>
                                                                </Col>
                                                            ))}
                                                        </Row>
                                                    )}
                                                </Col>
                                            </Row>
                                            </>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </main>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Log Progress</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {formError && <div className="alert alert-danger">{formError}</div>}
                        <Row className="gy-3">
                            <Col md={6}>
                                <Form.Label>Date</Form.Label>
                                <Form.Control type="date" value={form.entryDate} onChange={handleChange('entryDate')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Weight (kg)</Form.Label>
                                <Form.Control type="number" step="0.1" min="0" value={form.weightKg} onChange={handleChange('weightKg')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Heart Rate (bpm)</Form.Label>
                                <Form.Control type="number" min="0" value={form.heartRateBpm} onChange={handleChange('heartRateBpm')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Health Score (%)</Form.Label>
                                <Form.Control type="number" min="0" max="100" value={form.healthScore} onChange={handleChange('healthScore')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Workout Minutes</Form.Label>
                                <Form.Control type="number" min="0" value={form.workoutMinutes} onChange={handleChange('workoutMinutes')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Workouts Completed</Form.Label>
                                <Form.Control type="number" min="0" value={form.workoutsCompleted} onChange={handleChange('workoutsCompleted')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Calories Burned</Form.Label>
                                <Form.Control type="number" min="0" value={form.caloriesBurned} onChange={handleChange('caloriesBurned')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Steps</Form.Label>
                                <Form.Control type="number" min="0" value={form.steps} onChange={handleChange('steps')} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Water (liters)</Form.Label>
                                <Form.Control type="number" step="0.1" min="0" value={form.waterLiters} onChange={handleChange('waterLiters')} />
                            </Col>
                            <Col md={12}>
                                <Form.Label>Notes</Form.Label>
                                <Form.Control as="textarea" rows={2} value={form.notes} onChange={handleChange('notes')} />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Footer />
        </>
    );
}
