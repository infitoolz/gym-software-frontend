import React, { useEffect, useState } from 'react'

import logo from "/src/assets/images/logo/logo.png"
import { Link } from 'react-router-dom';
import { Row, Container, Col, Navbar,Nav } from 'react-bootstrap';
import { IconMenu2 } from '@tabler/icons-react';

export default function Landingheader() {
    const [isSticky, setIsSticky] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 78) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        // Cleanup function
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    return (
        <>
            <header className={`landing-header ${isSticky ? 'sticky' : ''}`}>
                <Container>
                    <Row>
                        <Col xs={12}>
                            <Navbar collapseOnSelect expand="xl" className='py-0'>
                                <Navbar.Brand href="#home" className="codexbrand-logo d-flex align-items-center me-0">
                                    <img className="img-fluid" src={logo} alt="logo" />
                                    <span className="fs-3 align-middle ms-2 text-white">FitNexus</span>
                                </Navbar.Brand>
                                <Navbar.Collapse className='justify-content-xl-center' id="responsive-navbar-nav">
                                    <ul className="menu-list">
                                        <li>
                                            <Nav.Link href="#">Home</Nav.Link>
                                        </li>
                                        <li>
                                            <Nav.Link href="#Demos">Demo</Nav.Link>
                                        </li>
                                        <li>
                                            <Nav.Link href="#frameworks">Frameworks</Nav.Link>
                                        </li>
                                        <li>
                                            <Nav.Link href="#innerpages">Pages</Nav.Link>
                                        </li>                                       
                                    </ul>
                                </Navbar.Collapse>
                                <div>                                   
                                    <Link to="#" onClick={(e) => e.preventDefault()} className="btn btn-primary">Purchase</Link>
                                    <Navbar.Toggle aria-controls="responsive-navbar-nav" className="align-middle d-xl-none ms-3 p-0 menu-action">                                                                              
                                        <IconMenu2 className='fs-2'/>
                                    </Navbar.Toggle>
                                </div>
                            </Navbar>
                        </Col>
                    </Row>
                </Container>
            </header>
        </>
    )
}
