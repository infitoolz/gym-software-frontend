import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Row, Col, Container, Button, Modal, Card, CardBody, Table } from 'react-bootstrap';
import Footer from '../../components/Footer';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import doubleheel from "/src/assets/images/workout/double-heel.png"
import lungjumps from "/src/assets/images/workout/lung-jumps.png"
import arm from "/src/assets/images/workout/arm.png"
import sunosquat from "/src/assets/images/workout/sumo-squat.png"
import frontlunge from "/src/assets/images/workout/front-lunge.png"
import legabducation from "/src/assets/images/workout/leg-abduction.png"
import armcircles from "/src/assets/images/workout/arm-circles.png"
import legkickbacks from "/src/assets/images/workout/leg-kickbacks.png"
import tujishgetup from "/src/assets/images/workout/tujish-getup.png"
import situps from "/src/assets/images/workout/sit-ups.png"
import workouttraining from "/src/assets/images/workout/workout-training.png"
import lowLungeImg from "/src/assets/images/workout/low-lunge.png";
import sideAngleImg from "/src/assets/images/workout/side-angle.png";
import chairPoseImg from "/src/assets/images/workout/chair-pose.png";
import armImg from "/src/assets/images/workout/arm.png";
import dumblebell from "/src/assets/images/workout/dumbbells.png"
import { IconEdit, IconInfoCircle, IconTrash, IconX, IconChevronRight } from '@tabler/icons-react';

export default function Createworkout() {
    const [startDate, setStartDate] = useState(new Date());
    const [settings, setSettings] = useState({
        notification: true,
        pinLock: true,
        appleHealth: true,
        darkMode: false,
    });
    const handleToggle = (settingName) => {
        setSettings(prev => ({
            ...prev,
            [settingName]: !prev[settingName],
        }));
    };

    const [showinfomodal, setShowinfomodal] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);

    return (
        <>

            {/* Theme Body Start */}
            <main className="themebody-wrap">
                <div className="theme-body">
                    <Container fluid>
                        <Row>
                            <Col xxl={4} lg={6}>
                                <div className="card">
                                    <div className="card-body">
                                        <h4 className="fw-semibold mb-1">Custom Workout</h4>
                                        <p className="mb-3">Log each workout you complete to keep track of tour fitness program!</p>
                                        <input type="text" placeholder="Workout name" className="form-control" />
                                        <h5 className="mb-2 mt-3">Choose Level</h5>
                                        <ul className="warmup-list mb-3">
                                            <li>
                                                <h6 className="fw-semibold">Beginner</h6>
                                                <p className="font-light">I want to start training</p>
                                            </li>
                                            <li>
                                                <h6 className="fw-semibold">Irregular training</h6>
                                                <p className="font-light">I train 1-2 times a week</p>
                                            </li>
                                            <li>
                                                <h6 className="fw-semibold">Medium</h6>
                                                <p className="font-light">I train 3-5 times a week</p>
                                            </li>
                                            <li>
                                                <h6 className="fw-semibold">Advanced</h6>
                                                <p className="font-light">I train more than 5 times a week</p>
                                            </li>
                                        </ul>
                                        <table className="table mt-3 mb-4">
                                            <tbody>
                                                <tr>
                                                    <td className="fs-6 fw-semibold py-3 align-middle">Choose Equipment</td>
                                                    <td className="text-end align-middle">
                                                        <span className="font-light ">2 Dumbells, Mat <IconChevronRight className="ms-2"/></span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fs-6 fw-semibold py-3 align-middle">Choose Focus Area</td>
                                                    <td className="text-end align-middle">
                                                        <span className="font-light ">Legs, Core muscles <IconChevronRight className="ms-2"/></span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fs-6 fw-semibold py-3 align-middle">Includes Warm-Up</td>
                                                    <td className="text-end align-middle">
                                                        <label className="switch round switch-primary">
                                                            <input type="checkbox" checked={settings.pinLock} onChange={() => handleToggle('pinLock')} />
                                                            <span className="switch-btn"></span>
                                                        </label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fs-6 fw-semibold py-3 align-middle">Includes Stretching</td>
                                                    <td className="text-end align-middle">
                                                        <label className="switch round switch-primary">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.appleHealth}
                                                                onChange={() => handleToggle('appleHealth')}
                                                            />
                                                            <span className="switch-btn"></span>
                                                        </label>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Col>
                            <Col xxl={4} lg={6}>
                                <Card>
                                    <CardBody>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <h4 className="fw-bold">Full body workout</h4>
                                            <Link to="#" className="font-light fs-5" onClick={() => setShowSchedule(true)}>                                               
                                                <IconEdit/>
                                            </Link>
                                        </div>
                                        <div className="d-flex gap-3 flex-wrap">
                                            <div className="p-3 text-center bg-light rounded-4">
                                                <h4 className="fw-bold">12</h4>
                                                <h6 className="font-light">Exercises</h6>
                                            </div>
                                            <div className="p-3 text-center bg-light rounded-4">
                                                <h4 className="fw-bold">30:00</h4>
                                                <h6 className="font-light">Time</h6>
                                            </div>
                                            <div className="p-3 text-center bg-light rounded-4">
                                                <h4 className="fw-bold">260</h4>
                                                <h6 className="font-light">Calorie</h6>
                                            </div>
                                        </div>
                                        <Table className="mt-3 mb-4">
                                            <tbody>
                                                <tr>
                                                    <td className="fs-6 fw-semibold py-3 align-middle">Choose Equipment</td>
                                                    <td className="text-end align-middle">
                                                        <span className="font-light ">2 Dumbells, Mat <IconChevronRight className="ms-2"/></span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fs-6 fw-semibold py-3 align-middle">Choose Focus Area</td>
                                                    <td className="text-end align-middle">
                                                        <span className="font-light ">Legs, Core muscles <IconChevronRight className="ms-2"/></span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="fs-semibold">Warm-Up</h5>
                                            <Link to="#" className="font-light" onClick={() => setShowEdit(true)}>Edit</Link>
                                        </div>
                                        <ul className="warmup-list mb-3">
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={doubleheel} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Double Heel</h6>
                                                            <p className="font-light">x 20</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>                                                       
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={lungjumps} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Lung Jumps Atlernated</h6>
                                                            <p className="font-light">x 20</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                        </ul>
                                        <h5 className="fs-semibold mb-2">Workout</h5>
                                        <ul className="warmup-list mb-3">
                                            <li>
                                                <div className="d-flex align-items-center">
                                                    <div className="img-wrap">
                                                        <img src={arm} alt="" className="img-fluid" />
                                                    </div>
                                                    <div>
                                                        <h6 className="fw-semibold">Add Exercises</h6>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="fs-semibold">Stretching</h5>
                                            <Link to="#" className="font-light" onClick={() => setShowEdit(true)}>Edit</Link>
                                        </div>
                                        <ul className="warmup-list">
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={doubleheel} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Double Heel Tabs</h6>
                                                            <p className="font-light">x 20</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                        </ul>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col xxl={4} lg={6}>
                                <Card>
                                    <CardBody>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div>
                                                <h4 className="fw-bold">Best Exercises</h4>
                                                <span className="font-light">Exercises: 210</span>
                                            </div>
                                            <Link to="#" onClick={(e) => e.preventDefault()} className="btn btn-primary">All Exercises</Link>
                                        </div>
                                        <ul className="warmup-list">
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={sunosquat} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Sumo Squat</h6>
                                                            <p className="font-light">08:40 - 09:15</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={frontlunge} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Front Lunge</h6>
                                                            <p className="font-light">08:40 - 09:15</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={legabducation} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Leg Abduction</h6>
                                                            <p className="font-light">08:40 - 09:15</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={armcircles} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Arm circles</h6>
                                                            <p className="font-light">08:40 - 09:15</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={legkickbacks} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Leg Kickbacks</h6>
                                                            <p className="font-light">08:40 - 09:15</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={tujishgetup} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Turkish Get-Up</h6>
                                                            <p className="font-light">08:40 - 09:15</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={situps} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-semibold">Sit-Ups</h6>
                                                            <p className="font-light">08:40 - 09:15</p>
                                                        </div>
                                                    </div>
                                                    <Link to="#" className="fs-5" onClick={() => setShowinfomodal(true)}>
                                                        <IconInfoCircle/>
                                                    </Link>
                                                </div>
                                            </li>
                                        </ul>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>

                {/* Example Modal */}
                <Modal show={showinfomodal} onHide={() => setShowinfomodal(false)} centered size="lg">
                    <Modal.Body>
                        <span onClick={() => setShowinfomodal(false)} className='close-modal'>                           
                            <IconX/>
                        </span>
                        <Row className="gy-4">
                            <Col lg={5}>
                                <img src={workouttraining} alt="" className="img-fluid w-100" />
                            </Col>
                            <Col lg={7}>
                                <h3 className="mb-2 fw-bold">Squat Jump</h3>
                                <p>
                                    To further challenge yourself, try widening your stance to perform
                                    a Squat Jump instead. This variatoion can add variety to your lower
                                    body strength training routine.
                                </p>
                                <div className="d-flex align-items-center justify-content-between my-3">
                                    <h4 className="fw-semibold">Equipment</h4>
                                    <span className="font-light fs-6">2 Items</span>
                                </div>
                                <Row>
                                    <Col xs={6}>
                                        <ul className="equipment-list equipment-lglist pe-md-5 gap-3">
                                            <li>
                                                <div>
                                                    <Link>
                                                        <img src={dumblebell} alt="" className="img-fluid" />
                                                    </Link>
                                                    <h4 className="mt-2">2 Dumbbells</h4>
                                                </div>
                                            </li>
                                        </ul>
                                    </Col>
                                </Row>
                            </Col>
                            <Col md={12} className="mt-4">
                                <h3>Exercise technique</h3>
                                <ul className="mb-3 liststyle-number">
                                    <li className="mt-2">
                                        Inhale While pushing your hips back and lowering into a squat
                                        position. Keep your core tight, back straight, and knees forward
                                        during this movement.
                                    </li>
                                    <li className="mt-2">
                                        Exhale while returning to the starting position. Focus on keeping
                                        your weight evenly distributed throughout your heel and midfoot.
                                    </li>
                                </ul>
                            </Col>
                        </Row>
                    </Modal.Body>
                </Modal>

                {/* Warm-up Edit Modal */}
                                        <Modal show={showEdit} onHide={() => setShowEdit(false)} centered size="lg">
                    <Modal.Body>
                        <span onClick={() => setShowEdit(false)} className='close-modal'>
                            <IconX/>
                        </span>
                        <h3 className="text-center mb-3 fw-bold">Warm-up</h3>
                        <ul className="warmup-list mb-3">
                            <li>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <div className="img-wrap">
                                            <img src={lowLungeImg} alt="Low Lunge" className="img-fluid" />
                                        </div>
                                        <div>
                                            <h6 className="fw-semibold">Low Lunge</h6>
                                            <p className="font-light">x 20</p>
                                        </div>
                                    </div>
                                    <a href="#!" className="fs-5">
                                        <IconTrash/>                                       
                                    </a>
                                </div>
                            </li>
                            <li>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <div className="img-wrap">
                                            <img src={sideAngleImg} alt="Side Angle" className="img-fluid" />
                                        </div>
                                        <div>
                                            <h6 className="fw-semibold">Side Angle</h6>
                                            <p className="font-light">x 20</p>
                                        </div>
                                    </div>
                                    <a href="#!" className="fs-5">
                                        <IconTrash/>
                                    </a>
                                </div>
                            </li>
                            <li>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <div className="img-wrap">
                                            <img src={chairPoseImg} alt="Chair Pose" className="img-fluid" />
                                        </div>
                                        <div>
                                            <h6 className="fw-semibold">Chair Pose</h6>
                                            <p className="font-light">x 20</p>
                                        </div>
                                    </div>
                                    <a href="#!" className="fs-5">
                                        <IconTrash/>
                                    </a>
                                </div>
                            </li>
                            <li>
                                <div className="d-flex align-items-center">
                                    <div className="img-wrap">
                                        <img src={armImg} alt="Add Exercises" className="img-fluid" />
                                    </div>
                                    <div>
                                        <h6 className="fw-semibold">Add Exercises</h6>
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <Button className="btn-primary mt-2 w-100" onClick={() => setShowEdit(false)}>
                            Save
                        </Button>
                    </Modal.Body>
                </Modal>

                {/* Schedule Workout Modal */}
                                        <Modal show={showSchedule} onHide={() => setShowSchedule(false)} centered size="lg">
                    <Modal.Body>
                        <span onClick={() => setShowSchedule(false)} className="close-modal">
                            <IconX/>
                        </span>
                        <h3 className="text-center mb-3 fw-bold">Schedule-workout</h3>
                        <DatePicker className="form-control w-100" selected={startDate} onChange={(date) => setStartDate(date)} />
                        <Button className="btn-primary mt-4 w-100" onClick={() => setShowSchedule(false)}>
                            Create a reminder
                        </Button>
                    </Modal.Body>
                </Modal>

            </main>
            {/* Theme Body End */}

            {/* Footer Start */}
            <Footer />
            {/* Footer End */}

        </>
    );
}
