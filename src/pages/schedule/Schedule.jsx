import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import DatePicker from "react-datepicker";
import Slider from "react-slick";
import { subDays, addDays } from 'date-fns';
import Footer from '../../components/Footer';

import cardioworkout from "/src/assets/images/shedule/cardioworkouts.png"
import strengthtraining from "/src/assets/images/shedule/strengthtraining.png"
import flexibility from "/src/assets/images/shedule/flexibility.png"
import coretraining from "/src/assets/images/shedule/coretraining.png"
import mindbody from "/src/assets/images/shedule/mindbody.png"
import recovery from "/src/assets/images/shedule/recovery.png"
import lasttraining from '/src/assets/images/shedule/lasttraining.png'
import durationclock from '/src/assets/images/shedule/durationclock.png'
import calories from '/src/assets/images/shedule/calories.png'
import trainer1 from "/src/assets/images/trainer/trainer1.png"
import trainer2 from "/src/assets/images/trainer/trainer2.png"
import trainer1avtar from "/src/assets/images/trainer/trainer1-avtar.png"
import trainer2avtar from "/src/assets/images/trainer/trainer2-avtar.png"
import star from "/src/assets/images/trainer/star.png"
import trophy from "/src/assets/images/trainer/trophy.png"
import { Link } from 'react-router-dom';
import { IconDotsVertical } from '@tabler/icons-react';



export default function Schedule() {
    const [startDate, setStartDate] = useState(new Date());

    const events = [
        { title: 'Event 1', start: '2024-08-01', end: '2024-08-02' },
        { title: 'Event 2', start: '2024-08-07', allDay: true },
        { title: 'Event 3', start: '2024-08-09T16:00:00' }
    ];

    var trinerslider = {
        dots: false,
        infinite: true,
        speed: 1000,
        autoplay: true,
        autoplaySpeed: 1200,
        slidesToShow: 2,
        slidesToScroll: 1,
         responsive: [
            { breakpoint: 992, settings: { slidesToShow: 1 } },            
        ]
    };

    return (
        <div>

            {/* Theme Body Start */}
            <main className="themebody-wrap">
                <div className="theme-body codex-calendar">
                    <Container fluid>
                        <Row>
                            <Col xl={8}>
                                <Card>
                                    <Card.Body>
                                        <ul className="events-list" id="codex-events-list">
                                            <li className="fc-event bg-light-primary">
                                                <img src={cardioworkout} className="img-fluid" alt="" />
                                                Cardio Workouts
                                            </li>
                                            <li className="fc-event bg-light-secondary">
                                                <img src={strengthtraining} className="img-fluid" alt="" />
                                                Strength Training
                                            </li>
                                            <li className="fc-event bg-light-success">
                                                <img src={flexibility} className="img-fluid" alt="" />
                                                Flexibility & Mobility
                                            </li>
                                            <li className="fc-event bg-light-warning">
                                                <img src={coretraining} className="img-fluid" alt="" />
                                                Core Training
                                            </li>
                                            <li className="fc-event bg-light-info">
                                                <img src={mindbody} className="img-fluid" alt="" />
                                                Mind & Body
                                            </li>
                                            <li className="fc-event bg-light-danger">
                                                <img src={recovery} className="img-fluid" alt="" />
                                                Recovery & Relaxation
                                            </li>
                                            <li>
                                                <p className="d-none">
                                                    <input id="drop-remove" type="checkbox" />
                                                    <label htmlFor="drop-remove">remove after drop</label>
                                                </p>
                                            </li>
                                        </ul>
                                        <FullCalendar
                                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                                            initialView="dayGridMonth"
                                            headerToolbar={{
                                                left: 'prev,next today',
                                                center: 'title',
                                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                                            }}
                                            editable={true}
                                            selectable={true}
                                            events={events}
                                        />
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col xxl={4}>
                                <Row>
                                    {/* Stats Card */}
                                    <Col xxl={12} md={6}>
                                        <Card>
                                            <Card.Body>
                                                <ul className="warmup-list list-unstyled">
                                                    <li>
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="img-wrap">
                                                                    <img src={lasttraining} alt="" className="img-fluid w-auto" />
                                                                </div>
                                                                <div>
                                                                    <h5>Last Training</h5>
                                                                    <h4>55 <span className="font-light fs-6">minutes</span></h4>
                                                                </div>
                                                            </div>
                                                            <Link to="#" onClick={(e) => e.preventDefault()} className="fs-5" data-bs-toggle="modal" data-bs-target="#exampleModal">                                                               
                                                                <IconDotsVertical/>                                                          
                                                            </Link>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="img-wrap">
                                                                    <img src={durationclock} alt="" className="img-fluid w-auto" />
                                                                </div>
                                                                <div>
                                                                    <h5>Total Duration</h5>
                                                                    <h4>10 <span className="font-light fs-6">hours</span></h4>
                                                                </div>
                                                            </div>
                                                            <Link to="#" onClick={(e) => e.preventDefault()} className="fs-5" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                                                <IconDotsVertical/>
                                                            </Link>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="img-wrap">
                                                                    <img src={calories} alt="" className="img-fluid w-auto" />
                                                                </div>
                                                                <div>
                                                                    <h5>Total Calories</h5>
                                                                    <h4>5,400 <span className="font-light fs-6">Cal</span></h4>
                                                                </div>
                                                            </div>
                                                            <Link to="#" onClick={(e) => e.preventDefault()} className="fs-5" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                                                <IconDotsVertical/>
                                                            </Link>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    <Col xxl={12} md={6}>
                                        <Card>
                                            <Card.Body>
                                                <DatePicker
                                                    selected={startDate}
                                                    onChange={(date) => setStartDate(date)}
                                                    inline
                                                    calendarClassName="inline-datepicker"
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Trainer Info */}
                                    <Col xxl={12} md={6}>
                                        <h4 className="fw-bold mb-3">Trainer Info</h4>
                                        <Row>
                                            <Col md={12}>
                                                <Slider {...trinerslider} className="trainer-slider arrow-style1">
                                                    <div>
                                                        <div className="trainer-grid">
                                                            <div className="img-wrap">
                                                                <img src={trainer1} alt="" className="img-fluid w-100" />
                                                                <div className="icon-avtar">
                                                                    <img src={trainer1avtar} alt="" className="img-fluid" />
                                                                </div>
                                                            </div>
                                                            <div className="trainer-detail">
                                                                <h5 className="fw-bold">Cameron Williamson</h5>
                                                                <p className="fs-6">Fitness Specialist</p>
                                                                <div className="d-flex align-items-end mt-3 justify-content-between">
                                                                    <ul className="icon-list d-flex align-items-center gap-2">
                                                                        <li>
                                                                            <img src={trophy} alt="" className="img-fluid" />
                                                                            <div className="fw-bold mt-1">
                                                                                25
                                                                            </div>
                                                                        </li>
                                                                        <li>
                                                                            <img src={star} alt="" className="img-fluid" />
                                                                            <div className="fw-bold mt-1">
                                                                                104
                                                                            </div>
                                                                        </li>
                                                                    </ul>
                                                                    <Link to="#" onClick={(e) => e.preventDefault()} className="text-primary ms-2">View Profile</Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="trainer-grid">
                                                            <div className="img-wrap">
                                                                <img src={trainer2} alt="" className="img-fluid w-100" />
                                                                <div className="icon-avtar">
                                                                    <img src={trainer2avtar} alt="" className="img-fluid" />
                                                                </div>
                                                            </div>
                                                            <div className="trainer-detail">
                                                                <h5 className="fw-bold">Cameron Williamson</h5>
                                                                <p className="fs-6">Fitness Specialist</p>
                                                                <div className="d-flex align-items-end mt-3 justify-content-between">
                                                                    <ul className="icon-list d-flex align-items-center gap-2">
                                                                        <li>
                                                                            <img src={trophy} alt="" className="img-fluid" />
                                                                            <div className="fw-bold mt-1">
                                                                                25
                                                                            </div>
                                                                        </li>
                                                                        <li>
                                                                            <img src={star} alt="" className="img-fluid" />
                                                                            <div className="fw-bold mt-1">
                                                                                104
                                                                            </div>
                                                                        </li>
                                                                    </ul>
                                                                    <Link to="#" onClick={(e) => e.preventDefault()} className="text-primary ms-2">View Profile</Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="trainer-grid">
                                                            <div className="img-wrap">
                                                                <img src={trainer1} alt="" className="img-fluid w-100" />
                                                                <div className="icon-avtar">
                                                                    <img src={trainer1avtar} alt="" className="img-fluid" />
                                                                </div>
                                                            </div>
                                                            <div className="trainer-detail">
                                                                <h5 className="fw-bold">Cameron Williamson</h5>
                                                                <p className="fs-6">Fitness Specialist</p>
                                                                <div className="d-flex align-items-end mt-3 justify-content-between">
                                                                    <ul className="icon-list d-flex align-items-center gap-2">
                                                                        <li>
                                                                            <img src={trophy} alt="" className="img-fluid" />
                                                                            <div className="fw-bold mt-1">
                                                                                25
                                                                            </div>
                                                                        </li>
                                                                        <li>
                                                                            <img src={star} alt="" className="img-fluid" />
                                                                            <div className="fw-bold mt-1">
                                                                                104
                                                                            </div>
                                                                        </li>
                                                                    </ul>
                                                                    <Link to="#" onClick={(e) => e.preventDefault()} className="text-primary ms-2">View Profile</Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Slider>
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xxl={12} md={6}>
                                        <Card className="overflow-hidden">
                                            <Card.Body className="p-0">
                                                <img
                                                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
                                                    alt="People training in a gym"
                                                    className="img-fluid w-100"
                                                    style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </div>

            </main>
            {/* Theme Body End */}

            {/* Footer Start */}
            <Footer />
            {/* Footer End */}

        </div>
    )
}
