import React from 'react'
import { Container,Row,Col } from 'react-bootstrap'
import demo from "/src/assets/images/landing/hero/demo.png"
import activity from "/src/assets/images/landing/hero/activity.png"
import calories from "/src/assets/images/landing/hero/calories.png"
import heartrate from "/src/assets/images/landing/hero/heart-rate.png"
import progress from "/src/assets/images/landing/hero/progress.png"
import running from "/src/assets/images/landing/hero/running.png"
import sleeping from "/src/assets/images/landing/hero/sleeping.png"
import step from "/src/assets/images/landing/hero/steps.png"
import water from "/src/assets/images/landing/hero/water.png"
import weightloss from "/src/assets/images/landing/hero/weight-loss.png"
import { Link } from 'react-router-dom'
import heroBg from "/src/assets/images/landing/hero-bg.png"

export default function Landinghero() {
    return (
        <>
            <Container>
                <Row className="row align-items-center justify-content-center">
                    <Col xl={6} md={10}>                   
                        <div className="hero-contain">
                            <div>
                                <h2 className="text-white mb-2">Multiple Demos with flexible layouts</h2>
                                <p className="text-white">The flexible layout system along with build automation ready-to-use UI elements enable to develop modern web application with great speed.</p>
                                <Link to="/" target="_blank" className="btn btn-primary">Live Preview</Link>
                                <Link to="#" onClick={(e) => e.preventDefault()} className="btn btn-secondary ms-2">Buy Now</Link>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
            <div
                className="hero-card"
                style={{ backgroundImage: `url(${heroBg})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover' }}
            >
                <img src={demo} alt="" className="img-fluid demo-card" />
                <img src={activity} alt="" className="img-fluid activity-card" />
                <img src={calories}  alt="" className="img-fluid calories-card" />
                <img src={heartrate} alt="" className="img-fluid heartrate-card" />
                <img src={progress} alt="" className="img-fluid progress-card" />
                <img src={running}  alt="" className="img-fluid runing-card" />
                <img src={sleeping} alt="" className="img-fluid sleeping-card" />
                <img src={step}  alt="" className="img-fluid steps-card" />
                <img src={water} alt="" className="img-fluid water-card" />
                <img src={weightloss}  alt="" className="img-fluid weightlosss-card" />
            </div>
        </>
    )
}
