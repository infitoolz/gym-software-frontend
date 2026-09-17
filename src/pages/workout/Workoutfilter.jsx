import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Row, Col, Container, Card, CardBody } from 'react-bootstrap';
import Footer from '../../components/Footer.jsx';
import Workoutdata from "../api/Workoutdata.json";
import {getImageUrl} from "../../utils/imageresolver.js"
import { IconAdjustmentsHorizontal, IconHeart, IconPoint, IconX } from '@tabler/icons-react';
import workoutBanner from "/src/assets/images/workout/workout-banner.png";
export default function Workoutfilter() {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState("Beginner");
    const openFilter = () => setSidebarActive(true);
    const closeFilter = () => setSidebarActive(false);
    const handleLevelSelect = (level) => {
        setSelectedLevel(level);
    };
    const resetFilters = () => {
        setSelectedLevel("Beginner");
    };
    const applyFilters = () => {
        closeFilter();
    };
    const filteredData = Workoutdata.filter(workout =>
        selectedLevel ? workout.level === selectedLevel : true
    );
    return (
        <>
            <main className="themebody-wrap">
                <div className="theme-body">
                    <Container fluid>
                        <Row>
                            {/* Sidebar */}
                            <Col xxl={3} lg={4} className={`filte-sidebar ${sidebarActive ? "active" : ""}`}>
                                <div className="close-filter d-lg-none">
                                    <h5 className="fw-bold">Close Filter</h5>                                   
                                    <IconX onClick={closeFilter} className='close-filter'/>
                                </div>
                                <Card className="workout-banner" style={{ backgroundImage: `url(${workoutBanner})` }}>
                                    <CardBody>
                                        <h3 className="fw-bold lh-base text-black">
                                            Create Personal
                                            <br /> Training
                                        </h3>
                                    </CardBody>
                                </Card>
                                <Card className="workoutfilter-sidebar">
                                    <CardBody>
                                        <div className="mb-3">
                                            <h5 className="fw-bold mb-2">Your Goals</h5>
                                            <ul className="filtertag-list">
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} className="active">
                                                        Stretch
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Legs</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Yoga</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Boxing</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Running</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Personal</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Arms</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Chest</Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="mb-3">
                                            <h5 className="fw-bold mb-2">Price</h5>
                                            <ul className="filtertag-list">
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} className="active">
                                                        Free
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Premium</Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="mb-3">
                                            <h5 className="fw-bold mb-2">Level</h5>
                                            <ul className="filtertag-list">
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} className="active">
                                                        Beginner
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Medium</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Advanced</Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="mb-3">
                                            <h5 className="fw-bold mb-2">Duration</h5>
                                            <ul className="filtertag-list">
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} className="active">
                                                        15-20 min
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>20-30 min</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>30-40 min</Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="mb-3">
                                            <h5 className="fw-bold mb-2">Equipment</h5>
                                            <ul className="filtertag-list">
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()} className="active">
                                                        Kettlebell
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Dumbbells</Link>
                                                </li>
                                                <li>
                                                    <Link to="#" onClick={(e) => e.preventDefault()}>Yoga mat</Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="d-flex align-items-center gap-4">
                                            <button type="button" className="btn btn-outline-primary w-100" onClick={resetFilters}>
                                                Reset
                                            </button>
                                            <button type="button" className="btn btn-primary w-100" onClick={applyFilters}>
                                                Apply
                                            </button>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col xxl={9} lg={8}>
                                <Row className="gy-4">
                                    <Col className="col-12 d-lg-none">
                                        <button className="btn btn-primary filter-action" onClick={openFilter} type="button" >
                                            <IconAdjustmentsHorizontal/>
                                            Filter
                                        </button>
                                    </Col>
                                   {filteredData.map((workout, index) => {
                                        const imageUrl = getImageUrl(workout.image);
                                        return (
                                            <Col xxl={4} md={6} key={index}>
                                            <div className="workout-grid">
                                                <div className="img-wrap">
                                                <Link to="#" onClick={(e) => e.preventDefault()} className="btn-wishlist">                                                   
                                                    <IconHeart/>
                                                </Link>
                                                <Link to="/upperbody-workout">
                                                    <img
                                                    src={imageUrl}
                                                    alt={workout.title}
                                                    className="w-100"
                                                    />
                                                </Link>
                                                </div>
                                                <div className="workout-detail">
                                                <Link to="/upperbody-workout">
                                                    <h5 className="fw-semibold mb-2">{workout.title}</h5>
                                                </Link>
                                                <h6 className="fw-semibold">
                                                    {workout.level}
                                                    <span>                                                   
                                                        <IconPoint/>
                                                        {workout.duration}
                                                    </span>
                                                </h6>
                                                </div>
                                            </div>
                                            </Col>
                                        );
                                        })}

                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </main>
            <Footer />
        </>
    );
}
