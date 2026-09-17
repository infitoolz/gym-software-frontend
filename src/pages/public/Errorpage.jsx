import React from 'react';
import { Link } from 'react-router-dom';

import errorimg from '/src/assets/images/error-img.png';
import errorBg from '/src/assets/images/error-bg.png';

export default function Errorpage() {
    return (
        <>

            <section className="error-main" style={{ backgroundImage: `url(${errorBg})` }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 text-center">
                            <div className="codex-error">
                                <div>
                                    <img src={errorimg} alt="" className="img-fluid w-100" />
                                    <h1>The page you’re looking for could not be found</h1>
                                    <p>Please check the URL or navigate back to the homepage</p>
                                    <Link to="/" className="btn btn-primary">Back to Home</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
