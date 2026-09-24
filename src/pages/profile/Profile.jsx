import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Container, CardBody, Modal, Button, Form } from 'react-bootstrap';
import Footer from '../../components/Footer';
import PhoneInputWithFlag from "../../components/PhoneInputWithFlag";
import { 
    IconUser, 
    IconEdit, 
    IconLogout, 
    IconBarbell, 
    IconRuler2, 
    IconWeight,
    IconMail,
    IconPhone,
    IconCalendar,
    IconDroplet,
    IconMapPin,
    IconBell,
    IconLock,
    IconMoon,
    IconTarget,
    IconFileText,
    IconShieldCheck,
    IconSettings
} from "@tabler/icons-react";
import { getMyProfile, updateMyProfile, setPinOnServer, removePinOnServer } from "../../api/profileApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import { formatMemberCode } from "../../utils/memberCode";
import {
    getTheme, setTheme,
    getNotificationsEnabled, setNotificationsEnabled,
    isPinLockEnabled, setPinLockEnabled, disablePinLock,
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
    const [pinSaving, setPinSaving] = useState(false);

    const handleToggle = async (name) => {
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
                // Turning it off — delete on server and clear local state.
                try {
                    await removePinOnServer();
                    disablePinLock();
                    setSettings((prev) => ({ ...prev, pinLock: false }));
                    setNotice('PIN lock disabled.');
                } catch (err) {
                    setError(extractApiErrorMessage(err, 'Failed to disable PIN lock'));
                }
            } else {
                // Turning it on — collect a PIN first.
                setPinValue('');
                setPinConfirm('');
                setPinError('');
                setShowPinModal(true);
            }
        }
    };

    const handleSavePin = async (e) => {
        e.preventDefault();
        if (!/^\d{4,6}$/.test(pinValue)) {
            setPinError('PIN must be 4 to 6 numeric digits.');
            return;
        }
        if (pinValue !== pinConfirm) {
            setPinError('PINs do not match.');
            return;
        }
        setPinSaving(true);
        setPinError('');
        try {
            await setPinOnServer(pinValue);
            setPinLockEnabled(true);
            setSettings((prev) => ({ ...prev, pinLock: true }));
            setShowPinModal(false);
            setNotice('PIN lock enabled & synced across your devices.');
        } catch (err) {
            setPinError(extractApiErrorMessage(err, 'Failed to enable PIN lock'));
        } finally {
            setPinSaving(false);
        }
    };

    const loadProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getMyProfile();
            setProfile(data);
            if (data && typeof data.pinLockEnabled === 'boolean') {
                setSettings((prev) => ({ ...prev, pinLock: data.pinLockEnabled }));
                setPinLockEnabled(data.pinLockEnabled);
            }
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
        if (form.phone) {
            const phoneDigits = String(form.phone).replace(/\D/g, '');
            if (phoneDigits.length !== 10) {
                setFormError('Phone number must be exactly 10 digits');
                return;
            }
            if (!/^[6-9]/.test(phoneDigits)) {
                setFormError('Mobile number must start with 6, 7, 8, or 9');
                return;
            }
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
                    <Container fluid className="profile-page-wrapper">
                        {error && <div className="alert alert-danger">{error}</div>}
                        {notice && <div className="alert alert-success">{notice}</div>}
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <Row className="g-4">
                                {/* Left Column: Identity & Details */}
                                <Col lg={5} xl={4}>
                                    <Card className="profile-card">
                                        <CardBody>
                                            <div className="profile-identity-header">
                                                <div className="profile-avatar-wrap">
                                                    <IconUser size={34} stroke={1.8} />
                                                </div>
                                                <div className="profile-user-info">
                                                    <h4 className="profile-user-name">{profile?.name || 'User'}</h4>
                                                    <span className="profile-role-badge">{profile?.role || 'Member'}</span>
                                                </div>
                                            </div>

                                            {isUserRole && (
                                                <div className="profile-stat-chips">
                                                    <div className="profile-stat-chip">
                                                        <IconWeight size={18} className="chip-icon" />
                                                        <span className="chip-val">{display(profile?.weight, ' kg')}</span>
                                                        <span className="chip-lbl">Weight</span>
                                                    </div>
                                                    <div className="profile-stat-chip">
                                                        <IconRuler2 size={18} className="chip-icon" />
                                                        <span className="chip-val">{display(profile?.height, ' cm')}</span>
                                                        <span className="chip-lbl">Height</span>
                                                    </div>
                                                    <div className="profile-stat-chip">
                                                        <IconBarbell size={18} className="chip-icon" />
                                                        <span className="chip-val">{display(profile?.age, ' yrs')}</span>
                                                        <span className="chip-lbl">Age</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="profile-member-pass">
                                                <div className="pass-left">
                                                    <div className="pass-label">Member ID</div>
                                                    <div className="pass-hint">Use this (or your email) to check in at the gym.</div>
                                                </div>
                                                <div className="pass-code-badge">
                                                    {profile?.id ? formatMemberCode(profile.id) : '--'}
                                                </div>
                                            </div>

                                            <div className="profile-detail-list">
                                                <div className="profile-detail-row">
                                                    <div className="detail-key">
                                                        <IconMail size={16} className="key-icon" /> Email
                                                    </div>
                                                    <div className="detail-val">{profile?.email || '--'}</div>
                                                </div>

                                                {isUserRole && (
                                                    <>
                                                        <div className="profile-detail-row">
                                                            <div className="detail-key">
                                                                <IconUser size={16} className="key-icon" /> Gender
                                                            </div>
                                                            <div className="detail-val">{display(profile?.gender)}</div>
                                                        </div>
                                                        <div className="profile-detail-row">
                                                            <div className="detail-key">
                                                                <IconCalendar size={16} className="key-icon" /> Date of birth
                                                            </div>
                                                            <div className="detail-val">{display(profile?.dateOfBirth)}</div>
                                                        </div>
                                                        <div className="profile-detail-row">
                                                            <div className="detail-key">
                                                                <IconDroplet size={16} className="key-icon" /> Blood group
                                                            </div>
                                                            <div className="detail-val">{display(profile?.bloodGroup)}</div>
                                                        </div>
                                                        <div className="profile-detail-row">
                                                            <div className="detail-key">
                                                                <IconPhone size={16} className="key-icon" /> Phone
                                                            </div>
                                                            <div className="detail-val">{display(profile?.phone)}</div>
                                                        </div>
                                                        <div className="profile-detail-row">
                                                            <div className="detail-key">
                                                                <IconMapPin size={16} className="key-icon" /> City
                                                            </div>
                                                            <div className="detail-val">{display(profile?.city)}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <button type="button" className="btn btn-primary btn-edit-profile" onClick={openEdit}>
                                                <IconEdit size={16} /> Edit Profile
                                            </button>
                                        </CardBody>
                                    </Card>
                                </Col>

                                {/* Right Column: About, Preferences & Account */}
                                <Col lg={7} xl={8}>
                                    {isUserRole && (
                                        <Card className="profile-card mb-4">
                                            <CardBody>
                                                <div className="profile-card-header">
                                                    <h5 className="card-header-title">
                                                        <IconFileText size={20} className="header-icon" /> About
                                                    </h5>
                                                </div>
                                                <div className="about-tiles-grid">
                                                    <div className="about-info-tile">
                                                        <div className="tile-header">
                                                            <IconFileText size={15} /> Bio
                                                        </div>
                                                        <p className="tile-content">{display(profile?.bio)}</p>
                                                    </div>
                                                    <div className="about-info-tile">
                                                        <div className="tile-header">
                                                            <IconTarget size={15} /> Fitness goals
                                                        </div>
                                                        <p className="tile-content">{display(profile?.fitnessGoals)}</p>
                                                    </div>
                                                    <div className="about-info-tile">
                                                        <div className="tile-header">
                                                            <IconMapPin size={15} /> Address
                                                        </div>
                                                        <p className="tile-content">{display(profile?.address)}</p>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )}

                                    <Row className="g-4">
                                        <Col md={7}>
                                            <Card className="profile-card h-100 mb-0">
                                                <CardBody>
                                                    <div className="profile-card-header">
                                                        <h5 className="card-header-title">
                                                            <IconSettings size={20} className="header-icon" /> Preferences
                                                        </h5>
                                                    </div>

                                                    <div className="pref-setting-item">
                                                        <div className="pref-left">
                                                            <div className="pref-icon">
                                                                <IconBell size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="pref-title">Notifications</div>
                                                                <div className="pref-desc">Workout alerts and reminders</div>
                                                            </div>
                                                        </div>
                                                        <Form.Check
                                                            type="switch"
                                                            id="pref-notification"
                                                            checked={settings.notification}
                                                            onChange={() => handleToggle('notification')}
                                                        />
                                                    </div>

                                                    <div className="pref-setting-item">
                                                        <div className="pref-left">
                                                            <div className="pref-icon">
                                                                <IconLock size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="pref-title">Pin Lock</div>
                                                                <div className="pref-desc">Secure access with a quick PIN</div>
                                                            </div>
                                                        </div>
                                                        <Form.Check
                                                            type="switch"
                                                            id="pref-pinlock"
                                                            checked={settings.pinLock}
                                                            onChange={() => handleToggle('pinLock')}
                                                        />
                                                    </div>

                                                    <div className="pref-setting-item">
                                                        <div className="pref-left">
                                                            <div className="pref-icon">
                                                                <IconMoon size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="pref-title">Dark Mode</div>
                                                                <div className="pref-desc">Toggle dark and light appearance</div>
                                                            </div>
                                                        </div>
                                                        <Form.Check
                                                            type="switch"
                                                            id="pref-darkmode"
                                                            checked={settings.darkMode}
                                                            onChange={() => handleToggle('darkMode')}
                                                        />
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        <Col md={5}>
                                            <Card className="profile-card h-100 mb-0">
                                                <CardBody className="d-flex flex-column justify-content-between">
                                                    <div>
                                                        <div className="profile-card-header">
                                                            <h5 className="card-header-title">
                                                                <IconShieldCheck size={20} className="header-icon" /> Account
                                                            </h5>
                                                        </div>
                                                        <div className="account-session-box">
                                                            <div>
                                                                <div className="session-status">
                                                                    <span className="status-indicator"></span>
                                                                    <span>Active Session</span>
                                                                </div>
                                                                <p className="session-desc">
                                                                    Manage your session or log out of your current device.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="account-session-box mt-3">
                                                        <button type="button" className="btn btn-logout" onClick={handleLogout}>
                                                            <IconLogout size={16} /> Log out
                                                        </button>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>
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
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Form.Label className="mb-0">Phone</Form.Label>
                                            {form.phone && (
                                                <span className="small fw-semibold" style={{ fontSize: "0.75rem", color: form.phone.length === 10 ? "#16a34a" : "#94a3b8" }}>
                                                    {form.phone.length}/10
                                                </span>
                                            )}
                                        </div>
                                        <PhoneInputWithFlag
                                            value={form.phone}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setForm(prev => ({ ...prev, phone: val }));
                                            }}
                                            placeholder="9876543210"
                                            size="sm"
                                        />
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
                        <Button variant="light" type="button" onClick={() => setShowPinModal(false)} disabled={pinSaving}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={pinSaving}>
                            {pinSaving ? 'Enabling...' : 'Enable PIN lock'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Footer />
        </>
    );
}
