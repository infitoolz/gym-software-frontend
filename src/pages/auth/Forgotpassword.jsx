import React, { useState } from 'react';
import { Form, Alert, Spinner } from 'react-bootstrap';
import {
  IconKey,
  IconMail,
  IconArrowRight,
  IconArrowLeft,
  IconShieldCheck,
  IconLock,
  IconClock,
  IconSparkles
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from "/src/assets/images/logo/logo.png";
import logoWhite from "/src/assets/images/logo/logo-white.png";
import { forgotPassword } from '../../api/authApi';
import { extractApiErrorMessage } from '../../utils/errorMessage';

export default function Forgotpassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const { data, message } = await forgotPassword(email.trim());
      setNotice(message || 'If an account exists, a 6-digit reset code has been sent to your email.');
      const devOtp = data?.devOtp;
      setTimeout(() => {
        navigate('/verify-pin', {
          state: {
            email: email.trim(),
            purpose: 'RESET',
            devOtp
          }
        });
      }, 1200);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not send reset code. Please check your network or try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* ── Left Showcase / Hero Panel (Desktop & Tablet) ── */}
      <div className="auth-showcase-panel d-none d-lg-flex">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />

        {/* Brand Header */}
        <div className="auth-showcase-header">
          <img className="brand-logo-white" src={logoWhite} alt="FITNEXA" />
          <span className="brand-tag">SECURITY & RECOVERY</span>
        </div>

        {/* Hero Body */}
        <div className="auth-showcase-body">
          <div className="auth-hero-pill">
            <IconSparkles size={14} />
            <span>ACCOUNT RECOVERY ASSISTANCE</span>
          </div>

          <h1 className="auth-hero-title">
            Reset Easily.<br />
            <span className="text-gradient-cyan">Stay on Track.</span>
          </h1>

          <p className="auth-hero-desc">
            Forgot your password? No problem. We will send a secure 6-digit one-time passcode directly to your registered email to help you safely regain access.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconShieldCheck size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">End-to-End Encrypted OTP</div>
                <div className="feat-desc">6-digit cryptographic verification code sent to your inbox.</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconClock size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">10-Minute Safe Window</div>
                <div className="feat-desc">One-time code expires automatically to guarantee account protection.</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconLock size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Instant Password Reset</div>
                <div className="feat-desc">Set your new password and jump straight back into your workout plans.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-showcase-footer">
          <span>&copy; {new Date().getFullYear()} FitNexus. All rights reserved.</span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card-main">
          {/* Mobile Brand Logo */}
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
            <h2 className="auth-title">Forgot Password? 🔑</h2>
            <p className="auth-subtitle">
              Enter your registered email and we'll send you a 6-digit verification code to reset your password.
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

          <Form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="auth-field-group">
              <label className="field-label" htmlFor="reset-email">Email Address</label>
              <div className="field-input-wrapper">
                <span className="leading-icon">
                  <IconMail size={18} />
                </span>
                <input
                  id="reset-email"
                  type="email"
                  className="form-control auth-input"
                  placeholder="name@example.com"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-auth-submit mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  <span>Sending Reset Code...</span>
                </>
              ) : (
                <>
                  <IconKey size={18} />
                  <span>Send Reset Code</span>
                  <IconArrowRight size={16} />
                </>
              )}
            </button>
          </Form>

          {/* Bottom Card Footer */}
          <div className="auth-card-footer">
            <div className="signup-prompt mb-0">
              Remember your password?
              <Link to="/sign-in" className="signup-link d-inline-flex align-items-center ms-1">
                <IconArrowLeft size={15} className="me-1" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
