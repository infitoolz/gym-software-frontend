import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Row, Col, Container } from 'react-bootstrap';
import Footer from '../../components/Footer.jsx';
import Workoutdata from "../api/Workoutdata.json";
import {getImageUrl} from "../../utils/imageresolver.js"
import { IconHeart, IconPoint } from '@tabler/icons-react';
export default function Workouttopfilter() {
    return (
        <>

            {/* Theme Body Start */}
            <main className="themebody-wrap">
                <div className="theme-body">
                    <Container fluid>
                        <Row className='gy-4'>                           
                                {Workoutdata.map((workout, index) => {
                                    const imageUrl = getImageUrl(workout.image);
                                    return (
                                        <Col xxl={3} md={6} key={index}>
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