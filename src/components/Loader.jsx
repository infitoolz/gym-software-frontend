import React, {useState, useEffect } from 'react';
import loader from '/src/assets/images/loader.gif';


export default function Loader() {

    const [loading, setLoading] = useState(true);

    useEffect(() => {       
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }, []);
    

    return (
        <>
            {loading ? (
                <div className="codex-loader">
                    <img src={loader} alt="" className='img-fluid'/>
                </div>
            ) : (
                <></>
            )}
        </>
    )
}
