import React from 'react';
import { Link } from "react-router-dom";
import { Row, Col } from 'react-bootstrap';

export default function PageBreadcrumb(props) {
    return (
        <div className="codex-breadcrumb">
            <Row>
                <Col xs={4}>
                    <h1 className="fs-5">{props.pagename}</h1>
                </Col>
                <Col xs={8}>
                    <ul className="breadcrumb justify-content-end mb-0">
                        <li className="breadcrumb-item">
                            <Link to="/">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                            <Link className="text-muted" to="/">{props.pagename}</Link>
                        </li>
                    </ul>
                </Col>
            </Row>
        </div>
    );
}