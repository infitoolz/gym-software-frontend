import React, { useState } from 'react';
import { Row, Form, Container, Col } from 'react-bootstrap';
import { IconKey } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from "/src/assets/images/logo/logo.png";
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
            setError('Email is required');
            return;
        }
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const { data } = await forgotPassword(email.trim());
            setNotice('If an account exists, a reset code has been sent to your email.');
            // Demo mode (no SMTP configured): show the code and continue.
            const devOtp = data?.devOtp;
            setTimeout(() => {
                navigate('/verify-pin', { state: { email: email.trim(), purpose: 'RESET', devOtp } });
            }, 1200);
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Could not send reset code'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <section className="d-flex align-items-center vh-100">
                <Container>
                    <Row className="row align-items-center justify-content-center">
                        <Col md={5}>
                            <div className="codex-authbox p-lg-5 p-4 card">
                                <div className="codex-brand mb-lg-5 mb-4">
                                    <Link className="d-flex align-items-center justify-content-center" to="#" onClick={(e) => e.preventDefault()}>
                                        <img className="img-fluid" src={logo} alt="theeme-logo" />
                                        <span className="fs-3 align-middle ms-2 lh-1">FitNexus</span>
                                    </Link>
                                </div>
                                <h3>Forgot password ?</h3>
                                <p className="mb-lg-4 mb-2">Enter your email and we'll send you a code to reset your password.</p>
                                {error && <div className="alert alert-danger">{error}</div>}
                                {notice && <div className="alert alert-success">{notice}</div>}
                                <Form onSubmit={handleSubmit}>
                                    <Row className="gy-4">
                                        <Form.Group>
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control type="email" placeholder="Enter your email" name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </Form.Group>
                                        <Form.Group>
                                            <button className="btn btn-primary w-100 py-3" type="submit" disabled={loading}>
                                                <IconKey className='me-2' />
                                                {loading ? 'Sending...' : 'Send Reset Code'}
                                            </button>
                                        </Form.Group>
                                        <div className="text-center">
                                            <Link to="/sign-in">Back to Sign In</Link>
                                        </div>
                                    </Row>
                                </Form>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
}
