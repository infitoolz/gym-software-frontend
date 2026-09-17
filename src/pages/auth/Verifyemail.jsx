import { IconMail } from '@tabler/icons-react';
import React, { useState } from 'react';
import { Row, Col, Container, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { sendEmailOtp, verifyEmail } from '../../api/authApi';
import { extractApiErrorMessage } from '../../utils/errorMessage';

export default function Verifyemail() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [done, setDone] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError('Enter your email'); return; }
        setLoading(true); setError(''); setNotice('');
        try {
            const { data } = await sendEmailOtp(email.trim());
            setSent(true);
            setNotice(data?.devOtp ? `Demo mode: your code is ${data.devOtp}` : 'Verification code sent to your email.');
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Could not send code'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.trim().length < 4) { setError('Enter the code from your email'); return; }
        setLoading(true); setError('');
        try {
            await verifyEmail(email.trim(), otp.trim());
            setDone(true);
            setNotice('Your email has been verified successfully!');
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Invalid or expired code'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className='d-flex align-items-center vh-100'>
            <Container>
                <Row className="align-items-center justify-content-center">
                    <Col md={5}>
                        <div className="codex-authbox p-lg-5 p-4 card text-center">
                            <div className="auth-header">
                                <div className="auth-icon mb-2"><IconMail className='fs-3 text-primary' /></div>
                                <h3 className='mb-2'>Verify your email address</h3>
                                <p>Enter your email and we'll send you a verification code.</p>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                            {notice && <div className="alert alert-info">{notice}</div>}

                            {done ? (
                                <Link to="/sign-in" className="btn btn-primary w-100 mt-2">Back to Sign In</Link>
                            ) : !sent ? (
                                <Form onSubmit={handleSend}>
                                    <Form.Group className="mb-3 text-start">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </Form.Group>
                                    <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send Code'}
                                    </button>
                                </Form>
                            ) : (
                                <Form onSubmit={handleVerify}>
                                    <Form.Group className="mb-3">
                                        <Form.Control
                                            className="text-center"
                                            style={{ letterSpacing: '0.5rem', fontSize: '1.3rem' }}
                                            type="text" inputMode="numeric" maxLength={6} placeholder="------"
                                            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus
                                        />
                                    </Form.Group>
                                    <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                                        {loading ? 'Verifying...' : 'Verify Email'}
                                    </button>
                                    <button type="button" className="btn btn-link mt-2" onClick={handleSend}>Resend code</button>
                                </Form>
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
}
