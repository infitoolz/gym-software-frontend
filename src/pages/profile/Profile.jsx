import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Container, CardBody, Modal, Button, Form } from 'react-bootstrap';
import Footer from '../../components/Footer';
import { IconUser, IconEdit, IconLogout, IconBarbell, IconRuler2, IconWeight } from "@tabler/icons-react";
import { getMyProfile, updateMyProfile } from "../../api/profileApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import { formatMemberCode } from "../../utils/memberCode";
import {
    getTheme, setTheme,
    getNotificationsEnabled, setNotificationsEnabled,
    isPinLockEnabled, setPin, disablePinLock,
} from "../../utils/preferences";

const EMPTY_FORM = {
    name: '',
    weight: '',
    height: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    phone: '',
    address: '',
    city: '',
    bio: '',
    fitnessGoals: '',
};

const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value));
const display = (value, suffix = '') => (value === null || value === undefined || value === '' ? '--' : `${value}${suffix}`);

export default function Profile() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    // Preferences are backed by persisted device settings (see utils/preferences).
    const [settings, setSettings] = useState({
        notification: getNotificationsEnabled(),
        pinLock: isPinLockEnabled(),
        darkMode: getTheme() === 'dark',
    });

    // PIN setup modal state.
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinValue, setPinValue] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [pinError, setPinError] = useState('');

    const handleToggle = (name) => {
        if (name === 'notification') {
            const next = !settings.notification;
            setNotificationsEnabled(next);
            setSettings((prev) => ({ ...prev, notification: next }));
            return;
        }
        if (name === 'darkMode') {
            const next = !settings.darkMode;
            setTheme(next ? 'dark' : 'light');
            setSettings((prev) => ({ ...prev, darkMode: next }));
            return;
        }
        if (name === 'pinLock') {
            if (settings.pinLock) {
                // Turning it off — clear the stored PIN.
                disablePinLock();
                setSettings((prev) => ({ ...prev, pinLock: false }));
            } else {
                // Turning it on — collect a PIN first.
                setPinValue('');
                setPinConfirm('');
                setPinError('');
                setShowPinModal(true);
            }
        }
    };

    const handleSavePin = (e) => {
        e.preventDefault();
        if (!/^\d{4,6}$/.test(pinValue)) {
            setPinError('PIN must be 4 to 6 digits.');
            return;
        }
        if (pinValue !== pinConfirm) {
            setPinError('PINs do not match.');
            return;
        }
        setPin(pinValue);
        setSettings((prev) => ({ ...prev, pinLock: true }));
        setShowPinModal(false);
        setNotice('PIN lock enabled.');
    };

    const loadProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getMyProfile();
            setProfile(data);
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Failed to load profile'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(''), 2500);
        return () => clearTimeout(timer);
    }, [notice]);

    const openEdit = () => {
        setForm({
            name: profile?.name || '',
            weight: profile?.weight ?? '',
            height: profile?.height ?? '',
            age: profile?.age ?? '',
            gender: profile?.gender || '',
            dateOfBirth: profile?.dateOfBirth || '',
            bloodGroup: profile?.bloodGroup || '',
            phone: profile?.phone || '',
            address: profile?.address || '',
            city: profile?.city || '',
            bio: profile?.bio || '',
            fitnessGoals: profile?.fitnessGoals || '',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setFormError('Name is required');
            return;
        }
        const payload = {
            name: form.name.trim(),
            weight: numberOrNull(form.weight),
            height: numberOrNull(form.height),
            age: numberOrNull(form.age),
            gender: form.gender || null,
            dateOfBirth: form.dateOfBirth || null,
            bloodGroup: form.bloodGroup || null,
            phone: form.phone || null,
            address: form.address || null,
            city: form.city || null,
            bio: form.bio || null,
            fitnessGoals: form.fitnessGoals || null,
        };
        setSaving(true);
        setFormError('');
        try {
            const updated = await updateMyProfile(payload);
            setProfile(updated);
            setNotice('Profile updated successfully');
            setShowModal(false);
        } catch (err) {
            setFormError(extractApiErrorMessage(err, 'Failed to update profile'));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        localStorage.clear();
        navigate('/sign-in');
        setTimeout(() => { window.location.href = '/sign-in'; }, 300);
    };

    const isUserRole = String(profile?.role || '').toUpperCase() === 'USER';

    return (
        <>
            <main className="themebody-wrap">
                <div className="theme-body">
                    <Container fluid>
                        {error && <div className="alert alert-danger">{error}</div>}
                        {notice && <div className="alert alert-success">{notice}</div>}
                        {loading ? (
                            <div className="text-center py-5">Loading...</div>
                        ) : (
                            <Row>
                                <Col xxl={4} md={6}>
                                    <Card>
                                        <CardBody>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="img-wrap border rounded-circle d-flex align-items-center justify-content-center" style={{ width: 72, height: 72 }}>
                                                    <IconUser size={40} stroke={1.5} />
                                                </div>
                                                <div>
                                                    <h4 className="fw-bold mb-1">{profile?.name || 'User'}</h4>
                                                    <span className="badge badge-light">{profile?.role || ''}</span>
                                                </div>
                                            </div>

                                            {isUserRole && (
                                                <ul className="equipment-list gap-3 my-4 d-flex list-unstyled flex-wrap">
                                                    <li className="d-flex align-items-center gap-1"><IconWeight size={18} /> {display(profile?.weight, ' kg')}</li>
                                                    <li className="d-flex align-items-center gap-1"><IconRuler2 size={18} /> {display(profile?.height, ' cm')}</li>
                                                    <li className="d-flex align-items-center gap-1"><IconBarbell size={18} /> {display(profile?.age, ' yrs')}</li>
                                                </ul>
                                            )}

                                            <table className="table mt-3 mb-4">
                                                <tbody>
                                                    <tr>
                                                        <td className="fs-6 fw-semibold py-3 align-middle">Member ID</td>
                                                        <td className="text-end align-middle">
                                                            <span className="badge bg-primary fs-6">{profile?.id ? formatMemberCode(profile.id) : '--'}</span>
                                                            <div className="small text-muted mt-1">Use this (or your email) to check in at the gym.</div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fs-6 fw-semibold py-3 align-middle">Email</td>
                                                        <td className="text-end align-middle">{profile?.email || '--'}</td>
                                                    </tr>
                                                    {isUserRole && (
                                                        <>
                                                            <tr>
                                                                <td className="fs-6 fw-semibold py-3 align-middle">Gender</td>
                                                                <td className="text-end align-middle">{display(profile?.gender)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fs-6 fw-semibold py-3 align-middle">Date of birth</td>
                                                                <td className="text-end align-middle">{display(profile?.dateOfBirth)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fs-6 fw-semibold py-3 align-middle">Blood group</td>
                                                                <td className="text-end align-middle">{display(profile?.bloodGroup)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fs-6 fw-semibold py-3 align-middle">Phone</td>
                                                                <td className="text-end align-middle">{display(profile?.phone)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fs-6 fw-semibold py-3 align-middle">City</td>
                                                                <td className="text-end align-middle">{display(profile?.city)}</td>
                                                            </tr>
                                                        </>
                                                    )}
                                                </tbody>
                                            </table>

                                            <button type="button" className="btn btn-primary w-100" onClick={openEdit}>
                                                <IconEdit size={16} className="me-1" /> Edit Profile
                                            </button>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col xxl={4} md={6}>
                                    {isUserRole && (
                                        <Card>
                                            <CardBody>
                                                <h4 className="fw-bold mb-3">About</h4>
                                                <p className="mb-2"><strong>Bio:</strong> {display(profile?.bio)}</p>
                                                <p className="mb-2"><strong>Fitness goals:</strong> {display(profile?.fitnessGoals)}</p>
                                                <p className="mb-0"><strong>Address:</strong> {display(profile?.address)}</p>
                                            </CardBody>
                                        </Card>
                                    )}
                                    <Card>
                                        <CardBody>
                                            <h4 className="fw-bold mb-3">Account</h4>
                                            <p className="text-muted">Manage your session.</p>
                                            <button type="button" className="btn btn-outline-danger" onClick={handleLogout}>
                                                <IconLogout size={16} className="me-1" /> Log out
                                            </button>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col xxl={4} md={6}>
                                    <Card>
                                        <CardBody>
                                            <h4 className="fw-bold mb-2">Preferences</h4>
                                            <table className="table mt-3 mb-0">
                                                <tbody>
                                                    <tr>
                                                        <td className="fs-6 fw-semibold py-4 align-middle">Notifications</td>
                                                        <td className="text-end align-middle">
                                                            <Form.Check
                                                                type="switch"
                                                                id="pref-notification"
                                                                className="d-flex justify-content-end fs-4 m-0"
                                                                checked={settings.notification}
                                                                onChange={() => handleToggle('notification')}
                                                            />
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fs-6 fw-semibold py-4 align-middle">Pin Lock</td>
                                                        <td className="text-end align-middle">
                                                            <Form.Check
                                                                type="switch"
                                                                id="pref-pinlock"
                                                                className="d-flex justify-content-end fs-4 m-0"
                                                                checked={settings.pinLock}
                                                                onChange={() => handleToggle('pinLock')}
                                                            />
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fs-6 fw-semibold py-4 align-middle border-bottom-0">Dark Mode</td>
                                                        <td className="text-end align-middle border-bottom-0">
                                                            <Form.Check
                                                                type="switch"
                                                                id="pref-darkmode"
                                                                className="d-flex justify-content-end fs-4 m-0"
                                                                checked={settings.darkMode}
                                                                onChange={() => handleToggle('darkMode')}
                                                            />
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        )}
                    </Container>
                </div>
            </main>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Profile</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {formError && <div className="alert alert-danger">{formError}</div>}
                        <Row className="gy-3">
                            <Col md={12}>
                                <Form.Label>Name *</Form.Label>
                                <Form.Control type="text" value={form.name} onChange={handleChange('name')} autoFocus />
                            </Col>
                            {isUserRole && (
                                <>
                                    <Col md={4}>
                                        <Form.Label>Weight (kg)</Form.Label>
                                        <Form.Control type="number" step="0.1" min="0" value={form.weight} onChange={handleChange('weight')} />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label>Height (cm)</Form.Label>
                                        <Form.Control type="number" step="0.1" min="0" value={form.height} onChange={handleChange('height')} />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label>Age</Form.Label>
                                        <Form.Control type="number" min="0" value={form.age} onChange={handleChange('age')} />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Gender</Form.Label>
                                        <Form.Select value={form.gender} onChange={handleChange('gender')}>
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Date of birth</Form.Label>
                                        <Form.Control type="date" value={form.dateOfBirth} onChange={handleChange('dateOfBirth')} />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Blood group</Form.Label>
                                        <Form.Control type="text" value={form.bloodGroup} onChange={handleChange('bloodGroup')} />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Phone</Form.Label>
                                        <Form.Control type="text" value={form.phone} onChange={handleChange('phone')} />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>City</Form.Label>
                                        <Form.Control type="text" value={form.city} onChange={handleChange('city')} />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control type="text" value={form.address} onChange={handleChange('address')} />
                                    </Col>
                                    <Col md={12}>
                                        <Form.Label>Bio</Form.Label>
                                        <Form.Control as="textarea" rows={2} value={form.bio} onChange={handleChange('bio')} />
                                    </Col>
                                    <Col md={12}>
                                        <Form.Label>Fitness goals</Form.Label>
                                        <Form.Control as="textarea" rows={2} value={form.fitnessGoals} onChange={handleChange('fitnessGoals')} />
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showPinModal} onHide={() => setShowPinModal(false)} centered>
                <Form onSubmit={handleSavePin}>
                    <Modal.Header closeButton>
                        <Modal.Title>Set up PIN lock</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="text-muted small">
                            You&apos;ll be asked for this PIN each time you open the app in a new session.
                            If you forget it, simply log out to clear it.
                        </p>
                        {pinError && <div className="alert alert-danger py-2">{pinError}</div>}
                        <Form.Group className="mb-3">
                            <Form.Label>Enter PIN (4–6 digits)</Form.Label>
                            <Form.Control
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pinValue}
                                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Confirm PIN</Form.Label>
                            <Form.Control
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pinConfirm}
                                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" type="button" onClick={() => setShowPinModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Enable PIN lock</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Footer />
        </>
    );
}
