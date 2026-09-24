import React, { useState } from 'react';
import { Form, Alert, Spinner } from 'react-bootstrap';
import {
  IconLock,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconShieldCheck,
  IconSparkles
} from '@tabler/icons-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from "/src/assets/images/logo/logo.png";
import logoWhite from "/src/assets/images/logo/logo-white.png";
import { resetPassword } from '../../api/authApi';
import { extractApiErrorMessage } from '../../utils/errorMessage';

export default function Newpassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  const [form, setForm] = useState({ password: '', cnfpassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showCnfPassword, setShowCnfPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (form.password !== form.cnfpassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email, otp, form.password);
      setNotice('Password updated successfully! Redirecting to Sign In...');
      setTimeout(() => navigate('/sign-in'), 1500);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not reset password. Your code may have expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* ── Left Showcase Panel ── */}
      <div className="auth-showcase-panel d-none d-lg-flex">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />

        <div className="auth-showcase-header">
          <img className="brand-logo-white" src={logoWhite} alt="FITNEXA" />
          <span className="brand-tag">PASSWORD SETUP</span>
        </div>

        <div className="auth-showcase-body">
          <div className="auth-hero-pill">
            <IconSparkles size={14} />
            <span>FINAL STEP • CREATE CREDENTIALS</span>
          </div>

          <h1 className="auth-hero-title">
            Set New Password.<br />
            <span className="text-gradient-cyan">Stay Protected.</span>
          </h1>

          <p className="auth-hero-desc">
            Your verification code has been confirmed. Choose a strong, memorable password to secure your personal FitNexus profile and workout history.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconShieldCheck size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Bcrypt Hash Security</div>
                <div className="feat-desc">Your credentials are cryptographically hashed using salted SHA/Bcrypt.</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconCheck size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Instant Device Synchronization</div>
                <div className="feat-desc">Once updated, sign in seamlessly across all your desktop and mobile devices.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <span>&copy; {new Date().getFullYear()} FitNexus. All rights reserved.</span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card-main">
          <div className="auth-mobile-logo d-lg-none">
            <Link to="/sign-in">
              <img src={logo} alt="FITNEXA" />
            </Link>
          </div>

          <div className="auth-card-header">
            <div className="auth-brand-logo-desktop d-none d-lg-block">
              <Link to="/sign-in">
                <img src={logo} alt="FITNEXA" />
              </Link>
            </div>
            <h2 className="auth-title">Reset Password 🔒</h2>
            <p className="auth-subtitle">
              Your code is verified! Enter and confirm your new password below.
            </p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="fade show">
              {error}
            </Alert>
          )}

          {notice && (
            <Alert variant="success" dismissible onClose={() => setNotice('')} className="fade show">
              {notice}
            </Alert>
          )}

          {!email || !otp ? (
            <div className="text-center py-4">
              <p className="text-muted mb-3">Verification session expired or missing. Please restart the reset process.</p>
              <Link to="/forgot-password" className="btn-auth-submit text-decoration-none">
                <IconArrowLeft size={16} /> Go to Forgot Password
              </Link>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="auth-field-group">
                <label className="field-label" htmlFor="new-password">New Password</label>
                <div className="field-input-wrapper">
                  <span className="leading-icon">
                    <IconLock size={18} />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control auth-input"
                    placeholder="At least 6 characters"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="new-password"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="trailing-action-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="auth-field-group">
                <label className="field-label" htmlFor="cnf-password">Confirm New Password</label>
                <div className="field-input-wrapper">
                  <span className="leading-icon">
                    <IconLock size={18} />
                  </span>
                  <input
                    id="cnf-password"
                    type={showCnfPassword ? 'text' : 'password'}
                    className="form-control auth-input"
                    placeholder="Re-enter password"
                    name="cnfpassword"
                    value={form.cnfpassword}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="trailing-action-btn"
                    onClick={() => setShowCnfPassword(!showCnfPassword)}
                    tabIndex={-1}
                    aria-label={showCnfPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCnfPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-auth-submit mt-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <IconCheck size={18} />
                    <span>Update Password</span>
                    <IconArrowRight size={16} />
                  </>
                )}
              </button>
            </Form>
          )}

          <div className="auth-card-footer">
            <div className="signup-prompt mb-0">
              <Link to="/sign-in" className="signup-link d-inline-flex align-items-center">
                <IconArrowLeft size={15} className="me-1" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
