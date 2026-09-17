import React, { useState } from 'react'
import { Row, Form, Container, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from "/src/assets/images/logo/logo.png";
import { resetPassword } from '../../api/authApi';
import { extractApiErrorMessage } from '../../utils/errorMessage';

export default function Newpassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const otp = location.state?.otp || '';

    const [form, setForm] = useState({ password: '', cnfpassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    if (!email || !otp) {
        return (
            <section className="d-flex align-items-center vh-100">
                <Container>
                    <Row className="justify-content-center"><Col md={5}>
                        <div className="codex-authbox p-4 card text-center">
                            <p>Please verify your reset code first.</p>
                            <Link to="/forgot-password" className="btn btn-primary">Go to Forgot Password</Link>
                        </div>
                    </Col></Row>
                </Container>
            </section>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
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
            setNotice('Password updated! Redirecting to Sign In...');
            setTimeout(() => navigate('/sign-in'), 1500);
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Could not reset password'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="d-flex align-items-center vh-100">
            <Container>
                <Row className="align-items-center justify-content-center">
                    <Col md={5}>
                        <div className="codex-authbox p-lg-5 p-4 card">
                            <div className="codex-brand mb-lg-5 mb-4">
                                <Link className="d-flex align-items-center justify-content-center" to="#" onClick={(e) => e.preventDefault()}>
                                    <img className="img-fluid" src={logo} alt="theeme-logo" />
                                    <span className="fs-3 align-middle ms-2 lh-1">FitNexus</span>
                                </Link>
                            </div>
                            <h3>Reset your password</h3>
                            <p className="mb-lg-4 mb-2">Your code is verified. Enter a new password below.</p>
                            {error && <div className="alert alert-danger">{error}</div>}
                            {notice && <div className="alert alert-success">{notice}</div>}
                            <Form onSubmit={handleSubmit}>
                                <Row className='gy-4'>
                                    <Form.Group>
                                        <Form.Label>New Password</Form.Label>
                                        <Form.Control type="password" placeholder="Enter your new password" name='password' value={form.password} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label>Confirm Password</Form.Label>
                                        <Form.Control type="password" placeholder="Re-enter your new password" name='cnfpassword' value={form.cnfpassword} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group>
                                        <button type="submit" className="btn btn-primary w-100 py-3" disabled={loading}>
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </Form.Group>
                                </Row>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
}
