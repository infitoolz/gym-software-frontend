import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap';
import Landinghero from '../../components/Landinghero.jsx';
import Landingheader from '../../components/Landingheader.jsx';
import Featuresdata from "../api/Featuresdata.json"
import Demopages from "../api/Landingdemo.json";
import Featureskey from "../api/Featureskey.json"
import Landingfooter from '../../components/Landingfooter.jsx';
import support from "/src/assets/images/landing/support.png"
import {getImageUrl} from "../../utils/imageresolver.js"
import {
  IconArtboard,
  IconBrandBootstrap,
  IconCalendar,
  IconCloudUpload,
  IconCode,
  IconDevices2,
  IconHelpOctagon,
  IconLayout,
  IconPalette,
  IconPhoto,
  IconSettings,
  IconTable,
} from '@tabler/icons-react';

// Explicit map so only the icons used by Featuresdata are bundled
// (a namespace import would pull in the entire ~5000-icon library).
const featureIcons = {
  IconArtboard,
  IconBrandBootstrap,
  IconCalendar,
  IconCloudUpload,
  IconCode,
  IconDevices2,
  IconHelpOctagon,
  IconLayout,
  IconPalette,
  IconPhoto,
  IconSettings,
  IconTable,
};

export default function Landing() {



    return (
        <>

            {/* Header Start */}
            <Landingheader />
            {/* Header End */}


            {/* Page Body Start */}
            <main className="landing-wrap">

                {/* Hero Start */}
                <section className="hero-sec" id="home">
                    <Landinghero />
                </section>
                {/* Hero End */}

                {/* Dashboard Start */}
                <section className="py-70 bg-white" id="Demos">
                    <Container>
                        <Row className="gy-4 justify-content-center">
                            <Col xs={12}>
                                <div className="landing-title">
                                    <h2>Awesome Pages</h2>
                                    <p>FitNexus Admin contains all the commonly used pages to develop any <br /> applications which will ease the developer efforts.</p>
                                </div>
                            </Col>
                            {Demopages.pages.map((page, index) => {
                                const imageUrl = getImageUrl(page.img);
                                return(
                                <Col lg={4} md={6} key={index}>
                                    <div className="demo-grid">
                                        <div className="img-wrap">
                                            <Link to={page.to} target="_blank">
                                                <img src={imageUrl} alt={page.title} className="img-fluid" />
                                            </Link>
                                        </div>
                                        <div className="demo-detail">
                                            <Link to={page.to} target="_blank" className="demo-title">
                                                {page.title}
                                            </Link>
                                        </div>
                                    </div>
                                </Col>
                                );
                            })}
                        </Row>
                    </Container>
                </section>
                {/* Dashboard End */}

                {/* Freamwork Start */}
                <section className="py-70" id="frameworks">
                    <Container>
                        <Row className="gy-4 justify-content-center">
                            <Col xs={12}>
                                <div className="landing-title">
                                    <h2>Top Frameworks</h2>
                                    <p>Various Editions of the Crocs Admin Template Available in HTML</p>
                                </div>
                            </Col>
                            {Featureskey.map((feature, index) => {
                                const imageUrl = getImageUrl(feature.img);
                                return(
                                <Col xxl={2} lg={3} md={4} xs={6} key={index}>
                                    <div className="freamwork-grid">
                                        <div className="icon-wrap">
                                            <img src={imageUrl} alt={feature.title} className="img-fluid" />
                                        </div>
                                        <div className="freamwork-detail">
                                            <h6>{feature.title}</h6>
                                        </div>
                                    </div>
                                </Col>
                                )
                            })}
                        </Row>
                    </Container>
                </section>
                {/* Freamwork End */}

                {/* Application Start */}
                <section className="py-70 bg-white" id="innerpages">
                    <Container>
                        <Row className="gy-4">
                            <Col xs={12}>
                                <div className="landing-title">
                                    <h2>Feathure & Inner Pages</h2>
                                    <p>Fitnexus admin template provides 3+ workable application and designs of other applications.</p>
                                </div>
                            </Col>
                            {Demopages.feature.map((page, index) => {
                                const imageUrl = getImageUrl(page.img);
                                return(
                                <Col lg={4} md={6} key={index}>
                                    <div className="demo-grid">
                                        <div className="img-wrap">
                                            <Link to={page.to} target="_blank">
                                                <img src={imageUrl} alt={page.title} className="img-fluid" />
                                            </Link>
                                        </div>
                                        <div className="demo-detail">
                                            <Link to={page.to} target="_blank" className="demo-title">
                                                {page.title}
                                            </Link>
                                        </div>
                                    </div>
                                </Col>
                                )
                            })}
                        </Row>
                    </Container>
                </section>
                {/* Application Etart */}

                {/* Features Start */}
                <section className="features py-70" id="feature">
                    <Container>
                        <Row className="gy-4">
                            <Col xs={12}>
                                <div className="landing-title">
                                    <h2>Unique Features</h2>
                                    <p>We are using scss 7-1 tire folder structure for this admin template</p>
                                </div>
                            </Col>
                            {Featuresdata.map((feature, index) => {
                                const TablerIcon = featureIcons[feature.icon];
                                 return (
                                        <Col xl={3} lg={4} sm={6} key={index}>
                                        <div className="feature-grid">
                                            <div className="icon-wrap">
                                            {TablerIcon ? <TablerIcon size={28} stroke={1.5} /> : null}
                                            </div>
                                            <div className="feature-detail">
                                            <h5>{feature.title}</h5>
                                            <p>{feature.description}</p>
                                            </div>
                                        </div>
                                        </Col>
                                    );
                            })}
                        </Row>
                    </Container>
                </section>
                {/* Features End */}

                {/* Support Start */}
                <section className="lan-supports py-70 bg-white">
                    <Container>
                        <Row className="gy-4 align-items-center">
                            <Col md={12}>
                                <div className="landing-title">
                                    <h2>Premium Support</h2>
                                    <p>“fast issue resolution, and dedicated experts for a seamless experience”</p>
                                </div>
                            </Col>
                            <Col md={6} className="order-1 order-md-0">
                                <div className="support-detail">
                                    <h3 className="mb-3">Our License</h3>
                                    <h2 className="mb-3 fw-bold">We Give It As We Think That Excellent Support Is Needed</h2>
                                    <p>Check our reviews for fast and accurate support to ensure support. we offer premium assistance around-the-clock for any bugs you encounter. and we’ll do best to help you out with any future updates for free.</p>
                                    <Link href="#!" className="btn btn-primary mt-4">Support</Link>
                                </div>
                            </Col>
                            <Col md={6} className="text-md-end">
                                <img src={support} alt="" className="img-fluid" />
                            </Col>
                        </Row>
                    </Container>
                </section>
                {/* Support End */}

            </main>
            {/* Page Body End */}

            {/* Footer Start */}
            <Landingfooter />
            {/* Footer End */}

        </>
    )
}