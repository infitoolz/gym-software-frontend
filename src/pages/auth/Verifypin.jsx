import React, { useState } from 'react';
import { Form, Alert, Spinner } from 'react-bootstrap';
import {
  IconMailOpened,
  IconShieldCheck,
  IconArrowRight,
  IconArrowLeft,
  IconRefresh,
  IconSparkles,
  IconClock,
  IconLock
} from '@tabler/icons-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from "/src/assets/images/logo/logo.png";
import logoWhite from "/src/assets/images/logo/logo-white.png";
import { verifyOtp, forgotPassword } from '../../api/authApi';
import { extractApiErrorMessage } from '../../utils/errorMessage';

export default function Verifypin() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const purpose = location.state?.purpose || 'RESET';
  const initialDevOtp = location.state?.devOtp || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialDevOtp ? `Demo Mode: Verification code is ${initialDevOtp}` : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      setError('Please enter the 6-digit code received in your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(email, otp.trim(), purpose);
      navigate('/new-password', { state: { email, otp: otp.trim() } });
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Invalid or expired verification code'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    setResending(true);
    try {
      const { data } = await forgotPassword(email);
      setNotice(data?.devOtp ? `Demo Mode: Your new code is ${data.devOtp}` : 'A fresh verification code has been dispatched to your email.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not resend code. Please try again in a few moments.'));
    } finally {
      setResending(false);
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
          <span className="brand-tag">CODE VERIFICATION</span>
        </div>

        <div className="auth-showcase-body">
          <div className="auth-hero-pill">
            <IconSparkles size={14} />
            <span>STEP 2 OF 3 • IDENTITY CONFIRMATION</span>
          </div>

          <h1 className="auth-hero-title">
            Verify Your Code.<br />
            <span className="text-gradient-cyan">Securing Your Profile.</span>
          </h1>

          <p className="auth-hero-desc">
            We prioritize your personal fitness data and account privacy. Please verify the 6-digit one-time authorization code sent to your inbox.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconShieldCheck size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Anti-Tamper Protection</div>
                <div className="feat-desc">Codes are single-use and invalidated immediately upon successful verification.</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconClock size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Time-Sensitive Code</div>
                <div className="feat-desc">Codes remain active for 10 minutes from request time.</div>
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

          <div className="auth-card-header text-center text-lg-start">
            <div className="auth-brand-logo-desktop d-none d-lg-block">
              <Link to="/sign-in">
                <img src={logo} alt="FITNEXA" />
              </Link>
            </div>
            <h2 className="auth-title">Verify Reset Code 📩</h2>
            <p className="auth-subtitle">
              {email ? (
                <>
                  Enter the 6-digit code sent to <strong className="text-dark">{email}</strong>
                </>
              ) : (
                'Please enter the 6-digit code sent to your email.'
              )}
            </p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="fade show">
              {error}
            </Alert>
          )}

          {notice && (
            <Alert variant="info" dismissible onClose={() => setNotice('')} className="fade show">
              {notice}
            </Alert>
          )}

          {!email ? (
            <div className="text-center py-4">
              <p className="text-muted mb-3">No active verification session found. Please enter your email first.</p>
              <Link to="/forgot-password" className="btn-auth-submit text-decoration-none">
                <IconArrowLeft size={16} /> Go to Forgot Password
              </Link>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label className="field-label text-center d-block mb-2" htmlFor="otp-input">
                  Verification Code
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="form-control auth-input text-center fw-bold"
                    style={{
                      letterSpacing: '0.45rem',
                      fontSize: '1.45rem',
                      padding: '14px 16px',
                      height: '56px'
                    }}
                    placeholder="------"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (error) setError('');
                    }}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-auth-submit mt-3"
                disabled={loading || otp.length < 4}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <IconShieldCheck size={18} />
                    <span>Confirm & Continue</span>
                    <IconArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center mt-3">
                <p className="text-muted small mb-0">
                  Didn't receive the email?{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 text-primary fw-semibold small align-baseline text-decoration-none"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                </p>
              </div>
            </Form>
          )}

          <div className="auth-card-footer">
            <div className="signup-prompt mb-0">
              <Link to="/forgot-password" className="signup-link d-inline-flex align-items-center">
                <IconArrowLeft size={15} className="me-1" /> Change Email
              </Link>
              <span className="mx-2 text-muted">•</span>
              <Link to="/sign-in" className="signup-link">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
