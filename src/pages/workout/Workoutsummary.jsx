import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Container, Table, Modal } from 'react-bootstrap';
import Chart from "react-apexcharts";
import { heartchart } from '../js/Workoutsummary';
import Footer from '../../components/Footer';

const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

import warmupCobra from '/src/assets/images/workout/warmup-cobra.png';
import plankUps from '/src/assets/images/workout/plank-ups.png';
import strengthImg from '/src/assets/images/workout/strength-balance.png';
import functionalImg from '/src/assets/images/workout/functional-training.png';
import intervalImg from '/src/assets/images/workout/interval-cardio.png';
import pilatesImg from '/src/assets/images/workout/pilates-reformer.png';
import coreImg from '/src/assets/images/workout/functional-core.png';
import crossfitImg from '/src/assets/images/workout/crossfit-workout.png';
import workouttraining from "/src/assets/images/workout/workout-training.png"
import dumbelles from "/src/assets/images/workout/dumbbells.png"
import { IconCircleCheckFilled, IconInfoCircle, IconPointFilled, IconX } from '@tabler/icons-react';

export default function WorkoutSummary() {
    const warmupList = [
        { name: "Cobra Stretch", time: "0:40", img: warmupCobra },
        { name: "Plank Ups", time: "0:40", img: plankUps },
        { name: "Rest", time: "0:30", text: "00:30", img: null, isRest: true }
    ];

    const finishedWorkoutList = [
        { title: "Strength & Balance", img: strengthImg },
        { title: "Functional Training", img: functionalImg },
        { title: "Interval Cardio Blast", img: intervalImg },
        { title: "Pilates Reformer Class", img: pilatesImg },
        { title: "Functional Core", img: coreImg },
        { title: "CrossFit Workout", img: crossfitImg }
    ];

    const [weekDays, setWeekDays] = useState([]);

    useEffect(() => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)

        // Start from Sunday
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - currentDay);

        const days = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);

            days.push({
                label: dayNames[i],
                number: date.getDate(),
                active: false,
                id: i,
            });
        }

        setWeekDays(days);
    }, []);

    const toggleActive = (index) => {
        setWeekDays((prevDays) =>
            prevDays.map((day, i) =>
                i === index ? { ...day, active: !day.active } : day
            )
        );
    };

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <main className="themebody-wrap">
                <div className="theme-body">
                    <Container fluid>
                        <Row>
                            <Col xxl={3} md={6}>
                                <Card>
                                    <Card.Body>
                                        <ul className="warmup-list">
                                            <li>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className="img-wrap">
                                                            <img src={warmupCobra} alt="" className="img-fluid" />
                                                        </div>
                                                        <div>
                                                            <h6>Bodyweight Stretch</h6>
                                                            <p className="font-light">08:30 - 09:15</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </Card.Body>
                                </Card>
                                <Card>
                                    <Card.Body>
                                        <Table className="w-100 text-center table-bordered mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="py-4">
                                                        <h3 className="fw-semibold">00:58:56</h3>
                                                        <span className="font-light fs-6">Total time</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <h3 className="fw-semibold">164 bmp</h3>
                                                        <span className="font-light fs-6">Avg Heart Rate</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-4">
                                                        <h3 className="fw-semibold">617 Kcal</h3>
                                                        <span className="font-light fs-6">Active Calories</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <h3 className="fw-semibold">640 Kcal</h3>
                                                        <span className="font-light fs-6">Total Calories</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4 className="fw-bold">Heart Rate</h4>
                                            <span className="fs-5">178 <small className="font-light">max</small></span>
                                        </div>
                                        <Chart options={heartchart} series={heartchart.series} height={200} type='bar' />
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xxl={3} md={6}>
                                <Card className="summary-week">
                                    <Card.Body>
                                        <div className="day-selector">
                                            {weekDays.map((day, index) => (
                                                <div
                                                    key={index}
                                                    className={`summary-day ${day.active ? 'active' : ''}`}
                                                    onClick={() => toggleActive(index)}
                                                >
                                                    <div className="summaryday-label">{day.label}</div>
                                                    <div className="summary-circle">✔</div>
                                                    <div className="summary-date">{day.number}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Body>
                                        <h4 className="fw-bold mb-3">Heart Rate Zone</h4>

                                        {[{
                                            name: "VO2 max", range: "175 - 195", percent: "2%  01:00", width: 80, color: "info"
                                        },
                                        { name: "Anaerobic", range: "175 - 195 bmp", percent: "15%  09:00", width: 20, color: "secondary" },
                                        { name: "Aerobic", range: "156 - 174 bmp", percent: "69%  41:00", width: 5, color: "success" },
                                        { name: "Intensive", range: "156 - 174 bmp", percent: "10%  06:00", width: 60, color: "warning" },
                                        { name: "Light", range: "96 - 117 bmp", percent: "0%  00:00", width: 40, color: "danger" },
                                        { name: "Relaxed", range: "40 - 94 bmp", percent: "3%  02:00", width: 25, color: "primary" }
                                        ].map((zone, idx) => (
                                            <div key={idx} className="mb-3">
                                                <h6 className="mb-1 fw-semibold">{zone.name}</h6>
                                                <div className="d-flex justify-content-between font-light mb-2">
                                                    <span>{zone.range}</span>
                                                    <span>{zone.percent}</span>
                                                </div>
                                                <div className="progress sm">
                                                    <div className={`progress-bar bg-${zone.color}`} style={{ width: `${zone.width}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xxl={3} md={6}>
                                <Card>
                                    <Card.Body>
                                        <h4 className="fw-bold mb-5">Training Effect</h4>
                                        <h5 className="fw-bold mb-3">Recovery: 2.1</h5>
                                        <div className="progress-stacked d-flex">
                                            {["primary", "secondary", "info", "success", "danger", "transparent"].map((variant, index) => (
                                                <div
                                                    key={index}
                                                    className="progress"
                                                    role="progressbar"
                                                    style={{ width: "16%" }}
                                                >
                                                    <div className={`progress-bar bg-${variant}`}></div>
                                                </div>
                                            ))}
                                        </div>
                                        <Table className="progress-charttbl w-100 mt-4">
                                            <tbody>
                                                <tr>
                                                    <td className="fs-6">                                                        
                                                        <IconPointFilled className='fs-5 font-light align-middle'/>
                                                        Minor
                                                    </td>
                                                    <td className="fs-6">
                                                        <IconPointFilled className='fs-5 text-success align-middle'/>
                                                        Recovery
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fs-6">
                                                        <IconPointFilled className='fs-5 text-secondary align-middle'/>
                                                        Maintaining
                                                    </td>
                                                    <td className="fs-6">
                                                        <IconPointFilled className='fs-5 text-info align-middle'/>                                                        
                                                        Improving
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fs-6">
                                                        <IconPointFilled className='fs-5 text-primary align-middle'/>
                                                        Highly Improving
                                                    </td>
                                                    <td className="fs-6">
                                                        <IconPointFilled className='fs-5 text-danger align-middle'/>                                                       
                                                        Overreaching
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Body>
                                        <div className="d-flex justify-content-between mb-2">
                                            <h5 className="fw-semibold">Warm-up</h5>
                                            <p>3 Exercises 2 Minutes</p>
                                        </div>
                                        <ul className="warmup-list">
                                            {warmupList.map((item, i) => (
                                                <li key={i}>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <div className="img-wrap">
                                                                {item.isRest ? (
                                                                    <div className="img-wrap bg-info text-white">{item.text}</div>
                                                                ) : (
                                                                    <img src={item.img} alt="" className="img-fluid" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h6>{item.name}</h6>
                                                                <p className="font-light">{item.time}</p>
                                                            </div>
                                                        </div>
                                                        <a href="#" className="fs-5" onClick={handleShow}>                                                           
                                                            <IconInfoCircle/>
                                                        </a>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xxl={3} md={6}>
                                <Card>
                                    <Card.Body>
                                        <h4 className="fw-bold mb-3">Finished Workout</h4>
                                        <ul className="warmup-list">
                                            {finishedWorkoutList.map((item, i) => (
                                                <li key={i}>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <div className="img-wrap">
                                                                <img src={item.img} alt="" className="img-fluid" />
                                                            </div>
                                                            <div>
                                                                <h6>{item.title}</h6>
                                                                <p className="font-light">08:40 - 09:15</p>
                                                            </div>
                                                        </div>
                                                        <a href="#" className="fs-5" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                                            <IconCircleCheckFilled className='text-success'/>
                                                        </a>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>

                <Modal show={show} onHide={handleClose} centered size="lg">
                    <Modal.Body>
                        {/* Close Icon */}
                        <span className="close-modal" onClick={handleClose} style={{ cursor: 'pointer', float: 'right' }}>                           
                            <IconX/>
                        </span>

                        <Row className="gy-4">
                            <Col lg={5}>
                                <img
                                    src={workouttraining}
                                    alt="Workout"
                                    className="img-fluid w-100"
                                />
                            </Col>
                            <Col lg={7}>
                                <h3 className="mb-2 fw-bold">Squat Jump</h3>
                                <p>
                                    To further challenge yourself, try widening your stance to perform a Squat Jump instead.
                                    This variation can add variety to your lower body strength training routine.
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
                                                    <a href="#">
                                                        <img
                                                            src={dumbelles}
                                                            alt="Dumbbells"
                                                            className="img-fluid"
                                                        />
                                                    </a>
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
                                        Inhale while pushing your hips back and lowering into a squat position.
                                        Keep your core tight, back straight, and knees forward during this movement.
                                    </li>
                                    <li className="mt-2">
                                        Exhale while returning to the starting position.
                                        Focus on keeping your weight evenly distributed throughout your heel and midfoot.
                                    </li>
                                </ul>
                            </Col>
                        </Row>
                    </Modal.Body>
                </Modal>

            </main>
            <Footer />
        </>
    );
}