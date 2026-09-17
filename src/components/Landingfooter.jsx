import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import logo from "/src/assets/images/logo/logo.png"
import { Link } from 'react-router-dom'
import { IconStarFilled } from '@tabler/icons-react'
import footerShape from "/src/assets/images/landing/footer-shap.png"

export default function Landingfooter() {
  return (
    <>
      <footer className="landing-footer">
        <div
          aria-hidden="true"
          style={{
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 35,
            width: '20%',
            height: 310,
            backgroundImage: `url(${footerShape})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom',
            backgroundSize: 'contain',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            content: '""',
            position: 'absolute',
            bottom: 0,
            right: 35,
            width: '20%',
            height: 310,
            backgroundImage: `url(${footerShape})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom',
            backgroundSize: 'contain',
            transform: 'rotateY(-165deg)',
          }}
        />
        <Container>
            <Row className="justify-content-center">
                <Col xxl={6} lg={9} className="col-xxl-6 col-lg-9">
                    <Link className="codexbrand-logo d-flex align-items-center justify-content-center mb-3" href="#!">
                        <img className="img-fluid" src={logo} alt="theeme-logo" />
                        <span className="fs-3 align-middle ms-2 text-white">FitNexus</span>
                    </Link>
                    <h2 className="text-white mb-2">
                        Let's Buy Our Unique & Creative Design <br /> Responsive Admin Template
                    </h2>                   
                    <p className="mb-4">FitNexus makes it easier to build better websites with great speed. Save hundreds of hours of design and development by using it.</p>
                    <ul className="d-flex justify-content-center gap-2">
                        <li>                           
                            <IconStarFilled className='fs-2 text-warning'/>
                        </li>
                        <li>
                            <IconStarFilled className='fs-2 text-warning'/>
                        </li>
                        <li>
                            <IconStarFilled className='fs-2 text-warning'/>
                        </li>
                        <li>
                            <IconStarFilled className='fs-2 text-warning'/>
                        </li>
                        <li>
                            <IconStarFilled className='fs-2 text-warning'/>
                        </li>
                    </ul>
                </Col>
            </Row>
        </Container>
    </footer>
    </>
  )
}
