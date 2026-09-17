

import { IconLayoutNavbar, IconLayoutSidebar, IconLayoutSidebarRight, IconMoon, IconSettings, IconSun } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';

export default function Customizer() {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [theme, setTheme] = useState('light'); // light | dark
    const [sidebarTheme, setSidebarTheme] = useState('light'); // light | dark

    // This holds the user-selected sidebar type (full or compact)
    const [userSidebarType, setUserSidebarType] = useState('full');

    // This is the effective sidebar type applied to body
    const [sidebarType, setSidebarType] = useState('full');

    // Handle sidebar type toggle by user
    const toggleSidebarType = (type) => {
        setUserSidebarType(type);
        // If window width >= 1200, apply immediately
        if (window.innerWidth >= 1200) {
            setSidebarType(type);
        }
        // If width < 1200, we keep sidebarType = 'compact' (responsive override)
    };

    // Effect to listen to window resize and apply sidebar type accordingly
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1200) {
                setSidebarType('compact');
            } else {
                // Restore user choice
                setSidebarType(userSidebarType);
            }
        };

        handleResize(); // check on mount

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [userSidebarType]);

    // Apply theme classes
    useEffect(() => {
        document.body.setAttribute('data-bs-theme', theme);
    }, [theme]);

    // Apply sidebar theme classes
    useEffect(() => {
        document.body.setAttribute('data-sidebar-theme', sidebarTheme);
    }, [sidebarTheme]);

    // Apply sidebar type classes
    useEffect(() => {
        document.body.setAttribute('data-bs-sidebar', sidebarType);
    }, [sidebarType]);

    return (
        <>
            <span onClick={handleShow} className='customizer-action'>               
                <IconSettings/>
            </span>
            <Offcanvas show={show} placement="end" onHide={handleClose} className="theme-cutomizer">
                <Offcanvas.Header closeButton className='border-bottom'>
                    <Offcanvas.Title>Theme Settings</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className='customizer-body'>
                    <div className="cutomize-group">
                        <h6 className="customizer-title">Sidebar Mode</h6>
                        <ul className="customizeoption-list sidebarmode-list">
                            <li className={sidebarTheme === 'light' ? 'active-mode' : ''} onClick={() => setSidebarTheme('light')}>                                                             
                                <IconSun/>                                                        
                                light
                            </li>
                            <li className={sidebarTheme === 'dark' ? 'active-mode' : ''} onClick={() => setSidebarTheme('dark')}>                               
                                <IconMoon/>
                                dark
                            </li>
                        </ul>
                    </div>
                    <div className="cutomize-group d-xl-block d-none">
                        <h6 className="customizer-title">Sidebar Type</h6>
                        <ul className="customizeoption-list sidebartype-list">
                            <li
                                className={userSidebarType === 'full' ? 'active-mode' : ''}
                                onClick={() => toggleSidebarType('full')}
                                style={{ pointerEvents: window.innerWidth < 1200 ? 'none' : 'auto', opacity: window.innerWidth < 1200 ? 0.5 : 1 }}
                            >                               
                                <IconLayoutSidebarRight/>
                                Full
                            </li>
                            <li
                                className={userSidebarType === 'compact' ? 'active-mode' : ''}
                                onClick={() => toggleSidebarType('compact')}
                                style={{ pointerEvents: window.innerWidth < 1200 ? 'none' : 'auto', opacity: window.innerWidth < 1200 ? 0.5 : 1 }}
                            >                               
                                <IconLayoutSidebar/>
                                Collapse
                            </li>
                            <li
                                className={userSidebarType === 'horizontal' ? 'active-mode' : ''}
                                onClick={() => toggleSidebarType('horizontal')}
                                style={{ pointerEvents: window.innerWidth < 1200 ? 'none' : 'auto', opacity: window.innerWidth < 1200 ? 0.5 : 1 }}
                            >                               
                                <IconLayoutNavbar/>
                                Horizontal
                            </li>
                        </ul>
                        {window.innerWidth < 1200 && (
                            <small style={{ color: '#ccc' }}>
                                Sidebar forced to compact on small screens
                            </small>
                        )}
                    </div>
                    <div className="cutomize-group mb-0">
                        <h6 className="customizer-title">Layout mode</h6>
                        <ul className="customizeoption-list layoutmode-list">
                            <li className={theme === 'light' ? 'active-mode' : ''} onClick={() => setTheme('light')}>                               
                                <IconSun/>
                                light
                            </li>
                            <li className={theme === 'dark' ? 'active-mode' : ''} onClick={() => setTheme('dark')}>                               
                                <IconMoon/>
                                dark
                            </li>
                        </ul>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    )
}