import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert, Spinner } from 'react-bootstrap';
import api from "../../utils/api";
import logo from "/src/assets/images/logo/logo.png";
import logoWhite from "/src/assets/images/logo/logo-white.png";
import {
  IconEye,
  IconEyeOff,
  IconUser,
  IconMail,
  IconLock,
  IconLockCheck,
  IconBarbell,
  IconFlame,
  IconHeartRateMonitor,
  IconArrowRight,
  IconCheck,
  IconSparkles
} from '@tabler/icons-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!formData.confirmPassword) {
      setError('Please confirm your password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.terms) {
      setError('Please accept the Terms & Conditions to proceed');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/signup", {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim()
      });

      if (response.data.success) {
        setSuccess("Registration successful! Redirecting to sign in...");
        setFormData({
          email: '',
          password: '',
          name: '',
          confirmPassword: '',
          terms: false
        });

        setTimeout(() => {
          navigate("/sign-in");
        }, 1500);
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid input. Please check your details.");
      } else if (err.response?.status === 409) {
        setError(err.response?.data?.message || "An account with this email already exists.");
      } else if (err.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Make sure backend is running on localhost:8083");
      } else {
        setError(err.response?.data?.message || "An error occurred during registration. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* ── Left Showcase / Brand Hero Panel (Desktop & Tablet) ── */}
      <div className="auth-showcase-panel d-none d-lg-flex">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />

        {/* Brand Header */}
        <div className="auth-showcase-header">
          <img className="brand-logo-white" src={logoWhite} alt="FITNEXA" />
          <span className="brand-tag">MEMBER REGISTRATION</span>
        </div>

        {/* Hero Body */}
        <div className="auth-showcase-body">
          <div className="auth-hero-pill">
            <IconSparkles size={14} />
            <span>START YOUR TRANSFORMATION TODAY</span>
          </div>

          <h1 className="auth-hero-title">
            Build Your Best Self.<br />
            <span className="text-gradient-cyan">Join FitNexa.</span>
          </h1>

          <p className="auth-hero-desc">
            Unlock premium gym amenities, personalized workout schedules, live biometric tracking, and tailored nutritional guidance.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconBarbell size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Tailored Workout Regimens</div>
                <div className="feat-desc">Custom sets, reps, and periodized training routines.</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconHeartRateMonitor size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Nutritional & Meal Tracking</div>
                <div className="feat-desc">Curated macro-balanced diet plans aligned to your fitness goals.</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feat-icon-wrap">
                <IconFlame size={18} />
              </div>
              <div className="feat-text">
                <div className="feat-title">Real-Time Progress & Calorie Metrics</div>
                <div className="feat-desc">Monitor active sessions, burned calories, and attendance streaks.</div>
              </div>
            </div>
          </div>

          <div className="auth-social-proof">
            <div className="proof-badge-icon">
              <IconCheck size={16} />
            </div>
            <div className="proof-text">
              Joined by <strong>10,000+ active fitness members</strong> achieving their dream physique.
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
            <h2 className="auth-title">Create Account 🚀</h2>
            <p className="auth-subtitle">
              Join FitNexus and start your fitness journey today. Sign up to get started.
            </p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="fade show">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')} className="fade show">
              {success}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="auth-field-group">
              <label className="field-label" htmlFor="user-name">Full Name</label>
              <div className="field-input-wrapper">
                <span className="leading-icon">
                  <IconUser size={18} />
                </span>
                <input
                  id="user-name"
                  type="text"
                  className="form-control auth-input"
                  placeholder="e.g. John Doe"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="auth-field-group">
              <label className="field-label" htmlFor="user-email">Email Address</label>
              <div className="field-input-wrapper">
                <span className="leading-icon">
                  <IconMail size={18} />
                </span>
                <input
                  id="user-email"
                  type="email"
                  className="form-control auth-input"
                  placeholder="example@gmail.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <label className="field-label" htmlFor="user-password">Password</label>
              <div className="field-input-wrapper">
                <span className="leading-icon">
                  <IconLock size={18} />
                </span>
                <input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  className="form-control auth-input"
                  placeholder="At least 6 characters"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="trailing-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field-group">
              <label className="field-label" htmlFor="user-confirm-password">Confirm Password</label>
              <div className="field-input-wrapper">
                <span className="leading-icon">
                  <IconLockCheck size={18} />
                </span>
                <input
                  id="user-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control auth-input"
                  placeholder="Re-enter your password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="trailing-action-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="auth-aux-row mb-3">
              <Form.Check
                id="terms-check"
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                disabled={loading}
                label={
                  <span className="text-secondary small">
                    I agree to the <span className="text-primary fw-semibold">Terms & Conditions</span>
                  </span>
                }
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-auth-submit"
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Sign Up</span>
                  <IconArrowRight size={18} />
                </>
              )}
            </button>
          </Form>

          {/* Footer */}
          <div className="auth-card-footer">
            <div className="signup-prompt mb-0">
              Already have an account?
              <Link to="/sign-in" className="signup-link">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
