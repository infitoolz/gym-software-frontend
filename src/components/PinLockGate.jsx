import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { IconLock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isPinLockEnabled, isUnlockedThisSession, verifyPin, markUnlocked } from '../utils/preferences';
import logo from '/src/assets/images/logo/logo.png';

/**
 * Blocks the authenticated app with a PIN screen when the user has enabled PIN
 * lock (Profile → Preferences) and hasn't unlocked this browser session yet.
 * Forgotten PIN? Logging out clears it.
 */
// eslint-disable-next-line react/prop-types
export default function PinLockGate({ children }) {
    const [locked, setLocked] = useState(isPinLockEnabled() && !isUnlockedThisSession());
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const { logout } = useAuth();
    const navigate = useNavigate();

    if (!locked) return children;

    const submit = (e) => {
        e.preventDefault();
        if (verifyPin(pin)) {
            markUnlocked();
            setLocked(false);
        } else {
            setError('Incorrect PIN. Try again.');
            setPin('');
        }
    };

    const handleLogout = () => {
        logout();
        localStorage.clear();
        navigate('/sign-in');
        setTimeout(() => { window.location.href = '/sign-in'; }, 100);
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bs-body-bg, #f4f5f7)',
            }}
        >
            <div className="card shadow-sm border-0" style={{ width: 360, maxWidth: '92vw', borderRadius: 16 }}>
                <div className="card-body p-4 text-center">
                    <img src={logo} alt="FitNexus" style={{ height: 36 }} className="mb-3" />
                    <div className="d-flex align-items-center justify-content-center mb-2">
                        <IconLock size={20} className="me-1" />
                        <h5 className="fw-bold mb-0">App locked</h5>
                    </div>
                    <p className="text-muted small mb-4">Enter your PIN to continue.</p>
                    <Form onSubmit={submit}>
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        <Form.Control
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            className="text-center mb-3"
                            style={{ letterSpacing: '0.4em', fontSize: 20 }}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                            aria-label="PIN"
                        />
                        <Button type="submit" variant="primary" className="w-100 mb-2" disabled={pin.length < 4}>
                            Unlock
                        </Button>
                    </Form>
                    <button type="button" className="btn btn-link btn-sm text-muted" onClick={handleLogout}>
                        Forgot PIN? Log out
                    </button>
                </div>
            </div>
        </div>
    );
}
