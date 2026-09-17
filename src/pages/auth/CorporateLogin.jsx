import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Container, Form, Row, Col, InputGroup, Alert } from 'react-bootstrap';
import api from "../../utils/api";
import { useAuth } from '../../context/AuthContext';
import logo from "/src/assets/images/logo/logo.png";
import InputGroupText from 'react-bootstrap/esm/InputGroupText';
import { IconEye, IconEyeOff, IconBuildingCommunity } from '@tabler/icons-react';

export default function CorporateLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post("/auth/login", { email, password });
            const tokenValue = response.data?.data?.token;

            if (tokenValue) {
                // If they are not CORPORATE_HR, reject them.
                if (response.data.data.role !== 'CORPORATE_HR') {
                    setError("This login portal is restricted to Corporate Partners only.");
                    setLoading(false);
                    return;
                }

                login({
                    token: tokenValue,
                    accessToken: tokenValue,
                    email: response.data.data.email,
                    name: response.data.data.name,
                    role: response.data.data.role,
                    userId: response.data.data.userId
                });

                setTimeout(() => {
                    navigate("/hr-portal");
                }, 1000);
            } else {
                setError("Login successful but no token received.");
            }
        } catch (error) {
            if (error.response?.status === 401) {
                setError("Invalid email or password");
            } else {
                setError(error.response?.data?.message || "Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-lg-5 py-4 d-flex align-items-center" style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Container>
                <Row className="align-items-center justify-content-center">
                    <Col md={8} lg={6} xl={5}>
                        <div className="bg-white p-5 rounded-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
                            <div className="text-center mb-5">
                                <IconBuildingCommunity size={64} className="text-primary mb-3" />
                                <h3 className="fw-bold text-dark">Corporate Partner Login</h3>
                                <p className="text-muted">Access your employee wellness dashboard.</p>
                            </div>

                            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold small text-muted">Corporate Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="hr@company.com"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                        disabled={loading}
                                        style={{ padding: '12px 16px', background: '#f1f5f9', border: 'none' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold small text-muted">Password</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                            disabled={loading}
                                            style={{ padding: '12px 16px', background: '#f1f5f9', border: 'none' }}
                                        />
                                        <InputGroupText
                                            style={{ cursor: 'pointer', background: '#f1f5f9', border: 'none' }}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                        </InputGroupText>
                                    </InputGroup>
                                </Form.Group>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 fw-bold"
                                    disabled={loading}
                                    style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: 'none' }}
                                >
                                    {loading ? "Authenticating..." : "Access Portal"}
                                </button>
                            </Form>
                        </div>
                        <div className="text-center mt-4 text-muted small">
                            Return to <Link to="/sign-in" className="text-primary text-decoration-none fw-bold">Admin Login</Link>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
}
