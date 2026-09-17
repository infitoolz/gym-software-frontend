import React, { useMemo, useState } from 'react';
import { Container, Row, Col, Tab, Nav, Form, Button } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import Chart from "react-apexcharts";
import "react-datepicker/dist/react-datepicker.css";
import logo from "/src/assets/images/logo/logo.png";
import { useNavigate } from 'react-router-dom';
import { updateMyProfile, completeOnboarding } from '../../api/profileApi';
import { extractApiErrorMessage } from '../../utils/errorMessage';

// Onboarding Steps
import step1Img from '/src/assets/images/onboding/1.png';
import step2Img from '/src/assets/images/onboding/2.png';
import step3Img from '/src/assets/images/onboding/3.png';
import step4Img from '/src/assets/images/onboding/4.png';
import step5Img from '/src/assets/images/onboding/5.png';
import step6Img from '/src/assets/images/onboding/6.png';

// Gender
import womanImg from '/src/assets/images/onboding/woman.png';
import manImg from '/src/assets/images/onboding/man.png';
import neutralImg from '/src/assets/images/onboding/neautral.png';

// Goals
import loseWeightImg from '/src/assets/images/onboding/lose-weight.png';
import keepFitImg from '/src/assets/images/onboding/keep-fit.png';
import getStrongerImg from '/src/assets/images/onboding/get-stronger.png';
import gainMuscleImg from '/src/assets/images/onboding/gain-muscle.png';

// Activities
import cardioImg from '/src/assets/images/onboding/cardio.png';
import powerTrainingImg from '/src/assets/images/onboding/power-training.png';
import stretchImg from '/src/assets/images/onboding/stretch.png';
import dancingImg from '/src/assets/images/onboding/dancing.png';
import yogaImg from '/src/assets/images/onboding/yoga.png';
import { Link } from 'react-router-dom';
import { IconChevronLeft } from '@tabler/icons-react';

const stepsData = [
    { title: 'Choose gender', step: 'Step 1 of 6' },
    { title: 'Choose main goals!', step: 'Step 2 of 6' },
    { title: 'Select birth date', step: 'Step 3 of 6' },
    { title: 'How tall are you?', step: 'Step 4 of 6' },
    { title: 'Choose training level', step: 'Step 5 of 6' },
    { title: 'Choose activities that interest', step: 'Step 6 of 6' },
    { title: 'We create your training plan', step: null }
];

const GENDER_OPTIONS = [
    { id: 'women', label: 'Woman', value: 'Female', img: womanImg },
    { id: 'man', label: 'Man', value: 'Male', img: manImg },
    { id: 'neautral', label: 'Neutral', value: 'Other', img: neutralImg },
];

const GOAL_OPTIONS = [
    { id: 'loseweight', label: 'Lose Weight', img: loseWeightImg },
    { id: 'keepfit', label: 'Keep Fit', img: keepFitImg },
    { id: 'getstronger', label: 'Get Stronger', img: getStrongerImg },
    { id: 'gainmass', label: 'Gain Muscle', img: gainMuscleImg },
];

const LEVEL_OPTIONS = [
    { id: 'beginner', label: 'Beginner', hint: 'I want to start training' },
    { id: 'irregulartraining', label: 'Irregular Training', hint: 'I train 1-2 times a week' },
    { id: 'medium', label: 'Medium', hint: 'I train 3-5 times a week' },
    { id: 'advanced', label: 'Advanced', hint: 'I train more than 5 times a week' },
];

const ACTIVITY_OPTIONS = [
    { id: 'cardio', label: 'Cardio', img: cardioImg },
    { id: 'power', label: 'Power', img: powerTrainingImg },
    { id: 'stretch', label: 'Stretch', img: stretchImg },
    { id: 'dancing', label: 'Dancing', img: dancingImg },
    { id: 'yoga', label: 'Yoga', img: yogaImg },
];

export default function Onbodingstep() {
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(new Date());
    const [step, setStep] = useState(0);

    // Captured answers
    const [gender, setGender] = useState('');        // Female / Male / Other
    const [goal, setGoal] = useState('');            // readable label
    const [heightUnit, setHeightUnit] = useState('cm');
    const [heightValue, setHeightValue] = useState('');
    const [level, setLevel] = useState('');          // readable label
    const [activity, setActivity] = useState('');    // readable label

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const nextStep = () => setStep((prev) => Math.min(prev + 1, stepsData.length - 1));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

    const stepImages = [step1Img, step2Img, step3Img, step4Img, step5Img, step6Img];

    // Real completion: how many of the 6 questions have an answer.
    const completionPercent = useMemo(() => {
        const answered = [gender, goal, Boolean(startDate), heightValue, level, activity]
            .filter(Boolean).length;
        return Math.round((answered / 6) * 100);
    }, [gender, goal, startDate, heightValue, level, activity]);

    const ringChart = useMemo(() => ({
        chart: { toolbar: { show: false } },
        plotOptions: {
            radialBar: {
                hollow: { size: '62%' },
                dataLabels: { value: { fontSize: '28px', fontWeight: 700, formatter: (v) => `${v}%` }, name: { show: false } },
            },
        },
        colors: ['#2bb3a3'],
        labels: ['Profile'],
        series: [done ? 100 : completionPercent],
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
            // Mark onboarding finished so the member's staff gets notified.
            // Non-blocking: a failure here shouldn't stop the member reaching their dashboard.
            try { await completeOnboarding(); } catch { /* ignore — profile already saved */ }
            setDone(true);
            // brief moment on the 100% ring, then go to the dashboard
            setTimeout(() => navigate('/'), 900);
        } catch (e) {
            setError(extractApiErrorMessage(e, 'Could not save your details. Please make sure you are signed in.'));
            setSaving(false);
        }
    };

    return (
        <section className="d-flex align-items-center bg-light onbodying-main py-4 vh-100">
            <Container>
                <Row className="justify-content-center">
                    <Col md={10}>
                        <div className="form-step active">
                            <Row className="align-items-center justify-content-center">
                                {step < 6 && (
                                    <Col lg={6} className="d-none d-lg-block">
                                        <div className="onboding-imgwrap">
                                            <img src={stepImages[step]} alt="" className="img-fluid" />
                                        </div>
                                    </Col>
                                )}
                                <Col lg={5} md={8}>
                                    <div className="onboding-detail">
                                        <div className="codex-brand mb-4">
                                            <Link className="d-flex align-items-center justify-content-center" to="#" onClick={(e) => e.preventDefault()}>
                                                <img className="img-fluid" src={logo} alt="theme-logo" />
                                                <span className="fs-3 align-middle ms-2">FitNexus</span>
                                            </Link>
                                        </div>
                                        {step < 6 && (
                                            <div className="d-flex align-items-center justify-content-between mb-4">
                                                <span className="step-preve" onClick={prevStep}>
                                                    <IconChevronLeft className='fs-5 font-light' />
                                                </span>
                                                <span className="font-light">{stepsData[step].step}</span>
                                                <span className="font-light step-skip" onClick={nextStep} style={{ cursor: 'pointer' }}>Skip</span>
                                            </div>
                                        )}
                                        <h3 className="mb-4 fw-bold text-center">{stepsData[step].title}</h3>

                                        {step === 0 && (
                                            <ul className="onboding-list">
                                                {GENDER_OPTIONS.map(({ id, label, value, img }) => (
                                                    <li key={id}>
                                                        <input type="radio" name='gender' id={id} hidden
                                                            checked={gender === value}
                                                            onChange={() => setGender(value)} />
                                                        <Form.Label htmlFor={id}>
                                                            <img src={img} alt={label} className="img-fluid" />
                                                            {label}
                                                        </Form.Label>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {step === 1 && (
                                            <ul className="onboding-list">
                                                {GOAL_OPTIONS.map(({ id, label, img }) => (
                                                    <li key={id}>
                                                        <input type="radio" name='goal' id={id} hidden
                                                            checked={goal === label}
                                                            onChange={() => setGoal(label)} />
                                                        <Form.Label htmlFor={id}>
                                                            <img src={img} alt={label} className="img-fluid" />
                                                            {label}
                                                        </Form.Label>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {step === 2 && (
                                            <DatePicker
                                                className="form-control w-100"
                                                selected={startDate}
                                                onChange={(date) => setStartDate(date)}
                                                showYearDropdown
                                                showMonthDropdown
                                                dropdownMode="select"
                                                scrollableYearDropdown
                                                yearDropdownItemNumber={100}
                                                maxDate={new Date()}
                                                dateFormat="dd MMM yyyy"
                                                placeholderText="Select your birth date"
                                            />
                                        )}

                                        {step === 3 && (
                                            <Tab.Container activeKey={heightUnit} onSelect={(k) => setHeightUnit(k || 'cm')}>
                                                <Nav variant="tabs">
                                                    <Nav.Item>
                                                        <Nav.Link eventKey="feet">Feet</Nav.Link>
                                                    </Nav.Item>
                                                    <Nav.Item>
                                                        <Nav.Link eventKey="cm">Centimeter</Nav.Link>
                                                    </Nav.Item>
                                                </Nav>
                                                <Tab.Content className="mt-3">
                                                    <Tab.Pane eventKey="feet">
                                                        <Row className="justify-content-center">
                                                            <Col md={4}>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <Form.Control type="number" min="0" step="0.1"
                                                                        value={heightValue}
                                                                        onChange={(e) => setHeightValue(e.target.value)} />
                                                                    <span>feet</span>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Tab.Pane>
                                                    <Tab.Pane eventKey="cm">
                                                        <Row className="justify-content-center">
                                                            <Col md={4}>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <Form.Control type="number" min="0"
                                                                        value={heightValue}
                                                                        onChange={(e) => setHeightValue(e.target.value)} />
                                                                    <span>cm</span>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Tab.Pane>
                                                </Tab.Content>
                                            </Tab.Container>
                                        )}

                                        {step === 4 && (
                                            <ul className="onboding-list">
                                                {LEVEL_OPTIONS.map(({ id, label, hint }) => (
                                                    <li key={id}>
                                                        <input type="radio" name="training" id={id} hidden
                                                            checked={level === label}
                                                            onChange={() => setLevel(label)} />
                                                        <Form.Label htmlFor={id}>
                                                            {label}
                                                            <span className="fs-6 font-light d-block">{hint}</span>
                                                        </Form.Label>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {step === 5 && (
                                            <ul className="onboding-list">
                                                {ACTIVITY_OPTIONS.map(({ id, label, img }) => (
                                                    <li key={id}>
                                                        <input type="radio" name="activites" id={id} hidden
                                                            checked={activity === label}
                                                            onChange={() => setActivity(label)} />
                                                        <Form.Label htmlFor={id}>
                                                            <img src={img} alt={label} className="img-fluid" />
                                                            {label}
                                                        </Form.Label>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {step === 6 && (
                                            <div className="createtraining-card text-center">
                                                <Chart options={ringChart} series={ringChart.series} height={305} type='radialBar' className="mt-3" />
                                                <p>{done
                                                    ? 'Your profile is ready! Taking you to your dashboard...'
                                                    : 'We create a workout according to your demographic profile, activity level and interests.'}</p>
                                                {error && <div className="alert alert-danger">{error}</div>}
                                            </div>
                                        )}

                                        <Button
                                            className="btn btn-primary btn-lg py-3 mt-5 w-100 btn-continue"
                                            onClick={step === 6 ? handleStartTraining : nextStep}
                                            disabled={saving || done}
                                        >
                                            {step === 6 ? (saving ? 'Saving...' : done ? 'Done' : 'Start Training') : 'Continue'}
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
}
