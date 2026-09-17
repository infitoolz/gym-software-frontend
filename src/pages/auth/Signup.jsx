import React, { useState } from 'react'
import { Link } from "react-router-dom";
import { Container, Form, Row, Col, InputGroup, Alert } from 'react-bootstrap';
import logo from "/src/assets/images/logo/logo.png";
import welcomeimg from "/src/assets/images/auth/no-pain-no-gain-2048x2048-17407.png";
import InputGroupText from 'react-bootstrap/esm/InputGroupText';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

export default function Signup() {

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError(''); // Clear error when user starts typing
    };

    const validateForm = () => {
        // Check if all fields are filled
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!formData.password) {
            setError('Password is required');
            return false;
        }
        if (!formData.confirmPassword) {
            setError('Please confirm your password');
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        // Check password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            console.log("Submitting sign up with:", {
                email: formData.email,
                name: formData.name
            });

            const response = await api.post("/auth/signup", {
                email: formData.email,
                password: formData.password,
                name: formData.name
            });

            console.log("Sign up success:", response.data);

            if (response.data.success) {
                setSuccess("Registration successful! Redirecting to login...");
                
                // Clear form
                setFormData({
                    email: '',
                    password: '',
                    name: '',
                    confirmPassword: ''
                });

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate("/sign-in");
                }, 2000);
            } else {
                setError(response.data.message || "Registration failed");
            }

        } catch (error) {
            console.error("Sign up error:", error);
            
            if (error.response?.status === 400) {
                setError(error.response?.data?.message || "Invalid input. Please check your details.");
            } else if (error.code === 'ERR_NETWORK') {
                setError("Cannot connect to server. Make sure backend is running on localhost:8082");
            } else {
                setError(error.response?.data?.message || "An error occurred during registration. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Sign Up Start */}
            <section className="py-lg-5 py-4 bg-white">
                <Container>
                    <Row className="align-items-center justify-content-center">
                        <Col md={6}>
                            <div className="codex-authbox px-lg-5">
                                <div className="codex-brand mb-lg-5 mb-4">
                                    <Link className="d-flex align-items-center justify-content-center" to="/" onClick={(e) => e.preventDefault()}>
                                        <img className="img-fluid" src={logo} alt="theeme-logo" />
                                        <span className="fs-3 align-middle ms-2 lh-1">FitNexus</span>
                                    </Link>
                                </div>
                                <h3>Create Account 🚀</h3>
                                <p className="mb-lg-4 mb-2">Join FitNexus and start your fitness journey today. Sign up to get started.</p>
                                
                                {error && (
                                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                                        {error}
                                    </Alert>
                                )}

                                {success && (
                                    <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                                        {success}
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit}>
                                    <Row className="gy-4">
                                        <Col md="12">
                                            <Form.Label>Full Name</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                placeholder="John Doe" 
                                                name='name' 
                                                value={formData.name}
                                                onChange={handleChange}
                                                disabled={loading}
                                            />
                                        </Col>
                                        <Col md="12">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control 
                                                type="email" 
                                                placeholder="example@gmail.com" 
                                                name='email' 
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={loading}
                                            />
                                        </Col>
                                        <Col md="12">
                                            <Form.Label>Password</Form.Label>
                                            <InputGroup>
                                                <Form.Control 
                                                    type={showPassword ? "text" : "password"} 
                                                    placeholder="At least 8 characters" 
                                                    name='password' 
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    disabled={loading}
                                                />
                                                <InputGroupText 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <IconEyeOff /> : <IconEye />}
                                                </InputGroupText>
                                            </InputGroup>
                                        </Col>
                                        <Col md="12">
                                            <Form.Label>Confirm Password</Form.Label>
                                            <InputGroup>
                                                <Form.Control 
                                                    type={showConfirmPassword ? "text" : "password"} 
                                                    placeholder="Re-enter your password" 
                                                    name='confirmPassword' 
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    disabled={loading}
                                                />
                                                <InputGroupText 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                                                </InputGroupText>
                                            </InputGroup>
                                        </Col>
                                        <Col md="12">
                                            <Form.Check 
                                                type="checkbox" 
                                                label="I agree to the Terms & Conditions" 
                                                disabled={loading}
                                                defaultChecked={false}
                                                required
                                            />
                                        </Col>
                                        <Col md="12">
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary w-100 py-3"
                                                disabled={loading}
                                            >
                                                {loading ? "Creating Account..." : "Sign Up"}
                                            </button>
                                        </Col>
                                    </Row>
                                </Form>
                                <div className="text-center mt-4">
                                    Already have an account?
                                    <Link to="/sign-in" className="text-primary ms-2">Sign In</Link>
                                </div>
                            </div>
                        </Col>
                        <Col lg={6} className="d-none d-lg-block">
                            <img src={welcomeimg} alt="" className="img-fluid" />
                        </Col>
                    </Row>
                </Container>
            </section>
            {/* Sign Up End */}
        </>
    )
}
