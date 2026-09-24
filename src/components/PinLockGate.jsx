import React, { useState, useEffect } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { IconLock, IconShieldCheck, IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isPinLockEnabled, isUnlockedThisSession, markUnlocked, disablePinLock } from '../utils/preferences';
import { verifyPinOnServer } from '../api/profileApi';
import { extractApiErrorMessage } from '../utils/errorMessage';
import logo from '/src/assets/images/logo/logo.png';

/**
 * Server-backed PIN lock security gate.
 * Blocks protected dashboard routes until the user enters their 4-6 digit PIN.
 * Remembers unlock state for the active browser session (sessionStorage).
 */
// eslint-disable-next-line react/prop-types
export default function PinLockGate({ children }) {
    const [locked, setLocked] = useState(isPinLockEnabled() && !isUnlockedThisSession());
    const [pin, setPin] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutSeconds, setLockoutSeconds] = useState(0);

    const { logout } = useAuth();
    const navigate = useNavigate();

    // Lockout countdown timer
    useEffect(() => {
        if (lockoutSeconds <= 0) return;
        const timer = setInterval(() => {
            setLockoutSeconds((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [lockoutSeconds]);

    if (!locked) return children;

    const submit = async (e) => {
        e.preventDefault();
        if (lockoutSeconds > 0) return;
        if (pin.length < 4) {
            setError('Please enter your 4 to 6-digit PIN');
            return;
        }

        setVerifying(true);
        setError('');

        try {
            await verifyPinOnServer(pin);
            markUnlocked();
            setLocked(false);
            setFailedAttempts(0);
        } catch (err) {
            const nextAttempts = failedAttempts + 1;
            setFailedAttempts(nextAttempts);

            if (nextAttempts >= 5) {
                setLockoutSeconds(30);
                setError('Too many failed attempts. Please wait 30 seconds.');
            } else {
                const remaining = 5 - nextAttempts;
                setError(extractApiErrorMessage(err, `Incorrect PIN. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`));
            }
            setPin('');
        } finally {
            setVerifying(false);
        }
    };

    const handleLogout = () => {
        disablePinLock();
        logout();
        navigate('/sign-in');
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #070d19 0%, #0f172a 60%, #1e3a8a 100%)',
                padding: '16px',
            }}
        >
            <div
                className="card shadow-lg border-0"
                style={{
                    width: 380,
                    maxWidth: '94vw',
                    borderRadius: 20,
                    background: '#ffffff',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                }}
            >
                <div className="card-body p-4 p-sm-5 text-center">
                    <div className="mb-4">
                        <img src={logo} alt="FITNEXA" style={{ height: 38, objectFit: 'contain' }} />
                    </div>

                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: '#eff6ff',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <IconLock size={20} />
                        </div>
                        <h4 className="fw-bold mb-0 text-dark">App Locked</h4>
                    </div>

                    <p className="text-muted small mb-4">
                        Enter your 4–6 digit security PIN to access your personal dashboard.
                    </p>

                    {error && (
                        <div className="alert alert-danger py-2 small d-flex align-items-center justify-content-center gap-2 mb-3">
                            <IconAlertTriangle size={16} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Form onSubmit={submit}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                className="text-center form-control-lg fw-bold"
                                style={{
                                    letterSpacing: '0.45rem',
                                    fontSize: 22,
                                    height: 54,
                                    border: '1.5px solid #e2e8f0',
                                    borderRadius: 12,
                                    background: '#f8fafc',
                                }}
                                placeholder="------"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value.replace(/\D/g, ''));
                                    if (error) setError('');
                                }}
                                disabled={verifying || lockoutSeconds > 0}
                                autoFocus
                                aria-label="Security PIN"
                            />
                        </Form.Group>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                            style={{
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                border: 'none',
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                            }}
                            disabled={verifying || pin.length < 4 || lockoutSeconds > 0}
                        >
                            {verifying ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                                    <span>Verifying PIN...</span>
                                </>
                            ) : lockoutSeconds > 0 ? (
                                <span>Locked ({lockoutSeconds}s)</span>
                            ) : (
                                <>
                                    <IconShieldCheck size={18} />
                                    <span>Unlock Dashboard</span>
                                </>
                            )}
                        </Button>
                    </Form>

                    <div className="mt-4 pt-3 border-top">
                        <button
                            type="button"
                            className="btn btn-link btn-sm text-muted text-decoration-none"
                            onClick={handleLogout}
                        >
                            Forgot PIN? Log out & Sign in again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
