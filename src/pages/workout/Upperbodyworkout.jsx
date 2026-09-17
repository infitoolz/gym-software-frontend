import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Row, Col, Card, Table, Container, Form, CardBody, Accordion, Button } from 'react-bootstrap';
import Footer from '../../components/Footer';

import workout from "/src/assets/images/workout/workout.png"
import clock from "/src/assets/images/workout/clock.svg"
import fire from "/src/assets/images/workout/fire.svg"
import power from "/src/assets/images/workout/power.svg"
import doubleboll from "/src/assets/images/workout/dumbbells.png"
import mat from "/src/assets/images/workout/mat.png"
import warmupcobra from "/src/assets/images/workout/warmup-cobra.png"
import plankups from "/src/assets/images/workout/plank-ups.png"
import doubleheel from "/src/assets/images/workout/double-heel.png"
import longjump from "/src/assets/images/workout/lung-jumps.png"
import squatjump from "/src/assets/images/workout/squat-jump.png"
import workouttraining from "/src/assets/images/workout/workout-training.png"
import { IconInfoCircle } from '@tabler/icons-react';


export default function Upperbodyworkout() {

    return (
        <>

            {/* Theme Body Start */}
            <main className="themebody-wrap">

                <div className="theme-body">
                    <Container fluid>
                        <Row>
                            <Col xxl={4} md={6}>
                                <Card>
                                    <img src={workout} className='img-fluid' />
                                    <Card.Body>
                                        <p>
                                            Resistance training, also known as strength training, is an essential component of any fitness routine, especially for your body
                                        </p>
                                        <ul className="equipment-list gap-2 my-4">
                                            <li>
                                                <Link to="#" onClick={(e) => e.preventDefault()}>
                                                    <img src={clock} fluid className="me-1" />
                                                    30 min
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="#" onClick={(e) => e.preventDefault()}>
                                                    <img src={fire} fluid className="me-1" />
                                                    340 kal
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="#" onClick={(e) => e.preventDefault()}>
                                                    <img src={power} fluid className="me-1" />
                                                    Beginner
                                                </Link>
                                            </li>
                                        </ul>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h3 className="fw-semibold">Equipment</h3>
                                            <span className="font-light fs-6">2 Items</span>
                                        </div>
                                        <ul className="equipment-list equipment-lglist pe-md-5 gap-3">
                                            <li>
                                                <div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>
                                                        <img src={doubleboll} className='img-fluid' />
                                                    </Link>
                                                    <h4 className="mt-2">2 Dumbbells</h4>
                                                </div>
                                            </li>
                                            <li>
                                                <div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>
                                                        <img src={mat} className='img-fluid' />
                                                    </Link>
                                                    <h4 className="mt-2">Mat</h4>
                                                </div>
                                            </li>
                                        </ul>
                                        <Accordion className="mt-4 accordion-primary" defaultActiveKey="">
                                            <Accordion.Item eventKey="0">
                                                <Accordion.Header>Schedule workout</Accordion.Header>
                                                <Accordion.Body>
                                                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Mollitia, et.
                                                </Accordion.Body>
                                            </Accordion.Item>
                                            <Accordion.Item eventKey="1">
                                                <Accordion.Header>Pick a playlist</Accordion.Header>
                                                <Accordion.Body>
                                                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Mollitia, et.
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        </Accordion>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Card 2 */}
                            <Col xxl={4} md={6}>
                                <Card>
                                    <Card.Body>
                                        <h4 className="fw-semibold mb-2">Exercises</h4>
                                        <div className="d-flex justify-content-between mb-2">
                                            <h5 className="fw-semibold">Warm-up</h5>
                                            <p>3 Exercises  2 Minutes</p>
                                        </div>
                                        <ul className="warmup-list">
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={warmupcobra} className='img-fluid' />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Cobra Stretch</h6>
                                                            <p className="font-light">0:40</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} data-bs-toggle="modal" data-bs-target="#exampleModal" className="fs-5">
                                                        <IconInfoCircle/>                                                       
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={plankups} className='img-fluid' />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Plank Ups</h6>
                                                            <p className="font-light">0:40</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} data-bs-toggle="modal" data-bs-target="#exampleModal" className="fs-5">
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap bg-success text-white">00:30</div>
                                                        <div>
                                                            <h6 className="fw-semibold">Rest</h6>
                                                            <p className="font-light">0:30</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} data-bs-toggle="modal" data-bs-target="#exampleModal" className="fs-5">
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                        </ul>

                                        <div className="d-flex justify-content-between mb-2 mt-3">
                                            <h5 className="fw-semibold">Workout</h5>
                                            <p>3 Exercises  2 Minutes</p>
                                        </div>
                                        <ul className="warmup-list">
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={doubleheel} className='img-fluid' />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Double Heel</h6>
                                                            <p className="font-light">X20</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} data-bs-toggle="modal" data-bs-target="#exampleModal" className="fs-5">
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={longjump} className='img-fluid' />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Lung Jumps</h6>
                                                            <p className="font-light">X20</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} data-bs-toggle="modal" data-bs-target="#exampleModal" className="fs-5">
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={squatjump} className='img-fluid' />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Squat Jump</h6>
                                                            <p className="font-light">X20</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} data-bs-toggle="modal" data-bs-target="#exampleModal" className="fs-5">
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap bg-success text-white">00:30</div>
                                                        <div>
                                                            <h6 className="fw-semibold">Rest</h6>
                                                            <p className="font-light">0:30</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} data-bs-toggle="modal" data-bs-target="#exampleModal" className="fs-5">
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                        </ul>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Card 3 */}
                            <Col xxl={4} md={6}>
                                <Card>
                                    <Card.Body>
                                        <h4 className="mb-2 fw-bold">Training</h4>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4>Exercise 5/12</h4>
                                            <h3>06:39</h3>
                                        </div>
                                        <img src={workouttraining} className="img-fluid w-100" />
                                        <div className="text-center py-3">
                                            <h2>00:22</h2>
                                            <h3>Lung Jumps Alternated</h3>
                                        </div>
                                        <h6 className="font-light mb-1">Next exercise</h6>
                                        <ul className="warmup-list mb-3">
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={warmupcobra} className='img-fluid' />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Cobra Stretch</h6>
                                                            <p className="font-light">0:40</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} data-bs-toggle="modal" data-bs-target="#exampleModal" className="fs-5">
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="d-flex align-items-center gap-4">
                                            <Button variant="outline-primary" className="w-100">Pause</Button>
                                            <Button variant="primary" className="w-100">Finish</Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>

            </main>
            {/* Theme Body End */}

            {/* Footer Start */}
            <Footer />
            {/* Footer End */}

        </>
    );
}