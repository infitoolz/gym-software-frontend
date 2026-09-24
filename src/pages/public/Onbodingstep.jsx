import React, { useMemo, useState } from 'react';
import { Tab, Nav, Form } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import Chart from "react-apexcharts";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from 'react-router-dom';
import { updateMyProfile, completeOnboarding } from '../../api/profileApi';
import { extractApiErrorMessage } from '../../utils/errorMessage';
import logo from "/src/assets/images/logo/logo.png";
import logoWhite from "/src/assets/images/logo/logo-white.png";
import heroImg from '/src/assets/images/onboding/onboarding_hero.jpg';

// Gender icons
import womanImg from '/src/assets/images/onboding/woman.png';
import manImg from '/src/assets/images/onboding/man.png';
import neutralImg from '/src/assets/images/onboding/neautral.png';

// Goals icons
import loseWeightImg from '/src/assets/images/onboding/lose-weight.png';
import keepFitImg from '/src/assets/images/onboding/keep-fit.png';
import getStrongerImg from '/src/assets/images/onboding/get-stronger.png';
import gainMuscleImg from '/src/assets/images/onboding/gain-muscle.png';

// Activities icons
import cardioImg from '/src/assets/images/onboding/cardio.png';
import powerTrainingImg from '/src/assets/images/onboding/power-training.png';
import stretchImg from '/src/assets/images/onboding/stretch.png';
import dancingImg from '/src/assets/images/onboding/dancing.png';
import yogaImg from '/src/assets/images/onboding/yoga.png';

import {
  IconChevronLeft,
  IconArrowRight,
  IconCheck,
  IconSparkles,
  IconCalendar,
} from '@tabler/icons-react';

const stepsData = [
  {
    title: 'Choose gender',
    step: 'Step 1 of 6',
    subtitle: 'This helps us calculate your daily caloric expenditure and recovery rates.'
  },
  {
    title: 'Choose main goals!',
    step: 'Step 2 of 6',
    subtitle: 'Select what you want to achieve so we can craft your target workout splits.'
  },
  {
    title: 'Select birth date',
    step: 'Step 3 of 6',
    subtitle: 'We calibrate workout intensity and rest intervals based on your age bracket.'
  },
  {
    title: 'How tall are you?',
    step: 'Step 4 of 6',
    subtitle: 'Your height helps us accurately measure your BMI and lean mass metrics.'
  },
  {
    title: 'Choose training level',
    step: 'Step 5 of 6',
    subtitle: 'Tell us about your fitness experience so we start you at the right pace.'
  },
  {
    title: 'Choose activities that interest you',
    step: 'Step 6 of 6',
    subtitle: 'Pick the styles of training you enjoy most for your weekly schedule.'
  },
  {
    title: 'We create your training plan',
    step: 'Complete',
    subtitle: 'Synthesizing your personal profile into a custom fitness and nutrition roadmap.'
  }
];

const GENDER_OPTIONS = [
  { id: 'women', label: 'Woman', value: 'Female', img: womanImg },
  { id: 'man', label: 'Man', value: 'Male', img: manImg },
  { id: 'neautral', label: 'Neutral', value: 'Other', img: neutralImg },
];

const GOAL_OPTIONS = [
  { id: 'loseweight', label: 'Lose Weight', hint: 'Burn fat and improve cardiovascular endurance', img: loseWeightImg },
  { id: 'keepfit', label: 'Keep Fit', hint: 'Stay active, agile, and maintain healthy energy', img: keepFitImg },
  { id: 'getstronger', label: 'Get Stronger', hint: 'Build raw power, functional lift capacity and grit', img: getStrongerImg },
  { id: 'gainmass', label: 'Gain Muscle', hint: 'Hypertrophy-focused training for mass and definition', img: gainMuscleImg },
];

const LEVEL_OPTIONS = [
  { id: 'beginner', label: 'Beginner', hint: 'I want to start training regularly' },
  { id: 'irregulartraining', label: 'Irregular Training', hint: 'I train 1–2 times a week occasionally' },
  { id: 'medium', label: 'Medium', hint: 'I train 3–5 times a week with good form' },
  { id: 'advanced', label: 'Advanced', hint: 'I train 5+ times a week and track progression' },
];

const ACTIVITY_OPTIONS = [
  { id: 'cardio', label: 'Cardio', img: cardioImg },
  { id: 'power', label: 'Power Training', img: powerTrainingImg },
  { id: 'stretch', label: 'Stretch & Mobility', img: stretchImg },
  { id: 'dancing', label: 'Dancing', img: dancingImg },
  { id: 'yoga', label: 'Yoga & Mind', img: yogaImg },
];

const STEPPER_LABELS = [
  'Gender & Physiology',
  'Primary Fitness Goals',
  'Date of Birth',
  'Height & Proportions',
  'Experience Level',
  'Favorite Activities',
];

export default function Onbodingstep() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date(2000, 0, 1));
  const [step, setStep] = useState(0);

  // Captured answers
  const [gender, setGender] = useState('Female');       // Female / Male / Other
  const [goal, setGoal] = useState('Lose Weight');      // readable label
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightValue, setHeightValue] = useState('170');
  const [level, setLevel] = useState('Beginner');       // readable label
  const [activity, setActivity] = useState('Cardio');   // readable label

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, stepsData.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  // Real completion: how many of the 6 questions have an answer
  const completionPercent = useMemo(() => {
    const answered = [gender, goal, Boolean(startDate), heightValue, level, activity].filter(Boolean).length;
    return Math.round((answered / 6) * 100);
  }, [gender, goal, startDate, heightValue, level, activity]);

  const ringChart = useMemo(() => ({
    chart: { toolbar: { show: false } },
    plotOptions: {
      radialBar: {
        hollow: { size: '64%' },
        track: { background: '#e2e8f0', strokeWidth: '100%' },
        dataLabels: {
          value: {
            fontSize: '32px',
            fontWeight: 800,
            color: '#0f172a',
            formatter: (v) => `${v}%`
          },
          name: { show: false }
        },
      },
    },
    colors: ['#0066ff'],
    labels: ['Profile'],
    series: [done ? 100 : Math.max(completionPercent, 20)],
  }), [completionPercent, done]);

  const heightInCm = () => {
    if (!heightValue) return null;
    const n = Number(heightValue);
    if (Number.isNaN(n) || n <= 0) return null;
    return heightUnit === 'feet' ? Math.round(n * 30.48) : Math.round(n);
  };

  const handleStartTraining = async () => {
    setSaving(true);
    setError('');
    try {
      await updateMyProfile({
        gender: gender || null,
        dateOfBirth: startDate ? startDate.toISOString().slice(0, 10) : null,
        height: heightInCm(),
        fitnessGoals: goal || null,
        bio: [level && `Training level: ${level}`, activity && `Preferred activity: ${activity}`]
          .filter(Boolean).join('. ') || null,
      });

      // Mark onboarding finished so staff gets notified
      try {
        await completeOnboarding();
      } catch {
        // profile already saved
      }

      setDone(true);
      setTimeout(() => navigate('/'), 900);
    } catch (e) {
      setError(extractApiErrorMessage(e, 'Could not save your details. Please make sure you are signed in.'));
      setSaving(false);
    }
  };

  const progressPercent = Math.min(((step + 1) / 6) * 100, 100);

  return (
    <div className="onboarding-split-wrapper">
      {/* ── Left Showcase Panel (Desktop) ── */}
      <div className="onboarding-showcase-panel d-none d-lg-flex">
        {/* Glow orbs */}
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />

        {/* Real fitness photography background */}
        <img src={heroImg} alt="FitNexa Training" className="showcase-bg-image" />
        <div className="showcase-overlay" />

        {/* Header */}
        <div className="onboarding-showcase-header">
          <img className="brand-logo-white" src={logoWhite} alt="FITNEXA" />
          <span className="brand-tag">MEMBER SETUP</span>
        </div>

        {/* Body */}
        <div className="onboarding-showcase-body">
          <div className="onboarding-pill">
            <IconSparkles size={14} />
            <span>PERSONALIZED PROGRAM</span>
          </div>

          <h1 className="onboarding-hero-title">
            Build Your Custom <br />
            <span className="text-gradient-cyan">Fitness Blueprint</span>
          </h1>

          <p className="onboarding-hero-desc">
            Answer a few quick questions to calibrate your personalized workout schedule, macro distribution, and trainer assignments.
          </p>

          {/* Stepper Checklist */}
          <div className="onboarding-stepper-list">
            {STEPPER_LABELS.map((label, idx) => {
              const isDone = step > idx;
              const isCurrent = step === idx;
              return (
                <div
                  key={idx}
                  className={`stepper-item ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                >
                  <div className="stepper-circle">
                    {isDone ? <IconCheck size={14} stroke={2.5} /> : idx + 1}
                  </div>
                  <span className="stepper-label">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="onboarding-showcase-footer">
          © {new Date().getFullYear()} FitNexa Gym Management. All rights reserved.
        </div>
      </div>

      {/* ── Right Interactive Form Panel ── */}
      <div className="onboarding-form-panel">
        <div className="onboarding-card-main">
          {/* Mobile Logo */}
          <div className="onboarding-mobile-logo d-lg-none">
            <Link to="/" onClick={(e) => e.preventDefault()}>
              <img src={logo} alt="FITNEXA" />
            </Link>
          </div>

          {/* Nav Header */}
          {step < 6 && (
            <div className="onboarding-card-nav">
              <button
                type="button"
                className="nav-btn-back"
                onClick={prevStep}
                disabled={step === 0}
                title="Previous step"
              >
                <IconChevronLeft size={20} />
              </button>

              <span className="nav-step-badge">
                {stepsData[step].step}
              </span>

              <button
                type="button"
                className="nav-btn-skip"
                onClick={nextStep}
              >
                Skip
              </button>
            </div>
          )}

          {/* Animated Progress Bar */}
          {step < 6 && (
            <div className="onboarding-progress-track">
              <div
                className="onboarding-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Step Heading */}
          <div className="onboarding-title-area">
            <h2 className="onboarding-step-title">{stepsData[step].title}</h2>
            <p className="onboarding-step-subtitle">{stepsData[step].subtitle}</p>
          </div>

          {/* ── Step 0: Choose Gender ── */}
          {step === 0 && (
            <ul className="onboarding-option-list">
              {GENDER_OPTIONS.map(({ id, label, value, img }) => {
                const isSelected = gender === value;
                return (
                  <li
                    key={id}
                    className={`onboarding-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setGender(value)}
                  >
                    <div className="option-left">
                      <div className="option-icon-wrap">
                        <img src={img} alt={label} />
                      </div>
                      <div>
                        <div className="option-label">{label}</div>
                      </div>
                    </div>
                    <div className="option-indicator">
                      {isSelected && <IconCheck size={14} stroke={3} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* ── Step 1: Choose Main Goals ── */}
          {step === 1 && (
            <ul className="onboarding-option-list">
              {GOAL_OPTIONS.map(({ id, label, hint, img }) => {
                const isSelected = goal === label;
                return (
                  <li
                    key={id}
                    className={`onboarding-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setGoal(label)}
                  >
                    <div className="option-left">
                      <div className="option-icon-wrap">
                        <img src={img} alt={label} />
                      </div>
                      <div>
                        <div className="option-label">{label}</div>
                        <div className="option-hint">{hint}</div>
                      </div>
                    </div>
                    <div className="option-indicator">
                      {isSelected && <IconCheck size={14} stroke={3} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* ── Step 2: Birth Date ── */}
          {step === 2 && (
            <div className="onboarding-datepicker-wrapper">
              <label className="form-label fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                <IconCalendar size={18} className="text-primary" />
                Select Your Date of Birth
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                maxDate={new Date()}
                dateFormat="dd MMMM yyyy"
                placeholderText="Select your birth date"
              />
            </div>
          )}

          {/* ── Step 3: Height ── */}
          {step === 3 && (
            <div className="onboarding-height-container">
              <Tab.Container activeKey={heightUnit} onSelect={(k) => setHeightUnit(k || 'cm')}>
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link eventKey="cm">Centimeter (cm)</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="feet">Feet (ft)</Nav.Link>
                  </Nav.Item>
                </Nav>
                <Tab.Content>
                  <Tab.Pane eventKey="cm">
                    <div className="height-input-box">
                      <Form.Control
                        type="number"
                        min="50"
                        max="250"
                        value={heightValue}
                        onChange={(e) => setHeightValue(e.target.value)}
                        placeholder="170"
                        autoFocus
                      />
                      <span className="height-unit-tag">cm</span>
                    </div>
                  </Tab.Pane>
                  <Tab.Pane eventKey="feet">
                    <div className="height-input-box">
                      <Form.Control
                        type="number"
                        min="2"
                        max="8"
                        step="0.1"
                        value={heightValue}
                        onChange={(e) => setHeightValue(e.target.value)}
                        placeholder="5.8"
                        autoFocus
                      />
                      <span className="height-unit-tag">ft</span>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>
          )}

          {/* ── Step 4: Training Level ── */}
          {step === 4 && (
            <ul className="onboarding-option-list">
              {LEVEL_OPTIONS.map(({ id, label, hint }) => {
                const isSelected = level === label;
                return (
                  <li
                    key={id}
                    className={`onboarding-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setLevel(label)}
                  >
                    <div className="option-left">
                      <div>
                        <div className="option-label">{label}</div>
                        <div className="option-hint">{hint}</div>
                      </div>
                    </div>
                    <div className="option-indicator">
                      {isSelected && <IconCheck size={14} stroke={3} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* ── Step 5: Activities ── */}
          {step === 5 && (
            <ul className="onboarding-option-list">
              {ACTIVITY_OPTIONS.map(({ id, label, img }) => {
                const isSelected = activity === label;
                return (
                  <li
                    key={id}
                    className={`onboarding-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setActivity(label)}
                  >
                    <div className="option-left">
                      <div className="option-icon-wrap">
                        <img src={img} alt={label} />
                      </div>
                      <div>
                        <div className="option-label">{label}</div>
                      </div>
                    </div>
                    <div className="option-indicator">
                      {isSelected && <IconCheck size={14} stroke={3} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* ── Step 6: Summary & Creation ── */}
          {step === 6 && (
            <div className="onboarding-chart-card">
              <Chart
                options={ringChart}
                series={ringChart.series}
                height={260}
                type="radialBar"
              />
              <p>
                {done
                  ? 'Your profile is ready! Redirecting to your dashboard...'
                  : 'We are generating your custom training splits and recommended nutrition target based on your demographic profile.'}
              </p>
              {error && <div className="alert alert-danger mt-2">{error}</div>}
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            className="btn-onboarding-continue"
            onClick={step === 6 ? handleStartTraining : nextStep}
            disabled={saving || done}
          >
            {step === 6 ? (
              saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  <span>Saving Profile...</span>
                </>
              ) : done ? (
                <>
                  <IconCheck size={20} />
                  <span>Setup Complete!</span>
                </>
              ) : (
                <>
                  <span>Start Training</span>
                  <IconArrowRight size={18} />
                </>
              )
            ) : (
              <>
                <span>Continue</span>
                <IconArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
