import { IconMailOpened } from '@tabler/icons-react';
import React, { useState } from 'react';
import { Row, Form, Container, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    const [error, setError] = useState('');
    const [notice, setNotice] = useState(initialDevOtp ? `Demo mode: your code is ${initialDevOtp}` : '');

    if (!email) {
        return (
            <section className="d-flex align-items-center vh-100">
                <Container>
                    <Row className="justify-content-center"><Col md={5}>
                        <div className="codex-authbox p-4 card text-center">
                            <p>Please start from the Forgot Password page.</p>
                            <Link to="/forgot-password" className="btn btn-primary">Go to Forgot Password</Link>
                        </div>
                    </Col></Row>
                </Container>
            </section>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (otp.trim().length < 4) {
            setError('Enter the code from your email');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await verifyOtp(email, otp.trim(), purpose);
            navigate('/new-password', { state: { email, otp: otp.trim() } });
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Invalid or expired code'));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setNotice('');
        try {
            const { data } = await forgotPassword(email);
            setNotice(data?.devOtp ? `Demo mode: your new code is ${data.devOtp}` : 'A new code has been sent.');
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Could not resend code'));
        }
    };

    return (
        <section className='d-flex align-items-center vh-100'>
            <Container>
                <Row className="align-items-center justify-content-center">
                    <Col md={5}>
                        <div className="codex-authbox p-lg-5 p-4 card text-center">
                            <div className="auth-header mb-2">
                                <div className="auth-icon mb-2"><IconMailOpened className='text-primary fs-3' /></div>
                                <h3 className='mb-2'>Verify your code</h3>
                                <p>Enter the verification code we sent to<br /><strong>{email}</strong></p>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                            {notice && <div className="alert alert-info">{notice}</div>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Control
                                        className="text-center"
                                        style={{ letterSpacing: '0.5rem', fontSize: '1.4rem' }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="------"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        autoFocus
                                    />
                                </Form.Group>
                                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Confirm'}
                                </button>
                            </Form>
                            <div className="auth-footer text-center mt-3">
                                <p className="mb-0">
                                    Didn't receive the email?{' '}
                                    <button type="button" className="btn btn-link p-0 align-baseline" onClick={handleResend}>Resend</button>
                                </p>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
}
