import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogout } from '@tabler/icons-react';
import { Dropdown, Form } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Link } from 'react-router-dom';
import { useSidebarContext } from '../context/useSidebarContext';

import logo from '/src/assets/images/logo/logo.png';
import { getNotifications } from '../api/notificationApi';
import { getTheme, setTheme, getNotificationsEnabled, PREFERENCES_EVENT } from '../utils/preferences';
import { IconBellRinging, IconBarbell, IconCalendarEvent, IconChefHat, IconChevronRight, IconLayout, IconLayoutGrid, IconMoon, IconSearch, IconSettings, IconSun, IconUser, IconUserCheck, IconInfoCircle } from '@tabler/icons-react';
export default function Header() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // Theme — backed by the shared preference so it persists and stays in sync
    // with the Dark Mode toggle on the Profile page.
    const [theme, setThemeState] = useState(getTheme());
    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);        // persists, applies to <body>, and notifies other components
        setThemeState(next);
    };

    // Keep the icon in sync if the theme is changed elsewhere (e.g. Profile preferences).
    useEffect(() => {
        const sync = () => setThemeState(getTheme());
        window.addEventListener(PREFERENCES_EVENT, sync);
        return () => window.removeEventListener(PREFERENCES_EVENT, sync);
    }, []);

    const [navsearchData, setnavsearchData] = useState({
        navsearch: '',
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setnavsearchData({ ...navsearchData, [name]: value, });
    };

    // Notifications — only fetched when the user keeps them enabled (Profile preference).
    const [notifications, setNotifications] = useState([]);
    const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled());
    useEffect(() => {
        const sync = () => setNotifEnabled(getNotificationsEnabled());
        window.addEventListener(PREFERENCES_EVENT, sync);
        return () => window.removeEventListener(PREFERENCES_EVENT, sync);
    }, []);
    useEffect(() => {
        if (!notifEnabled) {
            setNotifications([]);
            return undefined;
        }
        let active = true;
        const load = async () => {
            try {
                const data = await getNotifications();
                if (active) setNotifications(Array.isArray(data) ? data : []);
            } catch {
                if (active) setNotifications([]);
            }
        };
        load();
        const timer = setInterval(load, 60000); // refresh every minute
        return () => { active = false; clearInterval(timer); };
    }, [notifEnabled]);

    // Read state is tracked client-side by each notification's stable key, so it
    // works for both persisted and live-derived notifications and survives reloads.
    const READ_KEY = 'read_notifications';
    const [readKeys, setReadKeys] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
    });
    const persistRead = (set) => {
        localStorage.setItem(READ_KEY, JSON.stringify([...set]));
        setReadKeys(new Set(set));
    };
    const markRead = (key) => {
        if (!key || readKeys.has(key)) return;
        const next = new Set(readKeys);
        next.add(key);
        persistRead(next);
    };
    const markAllRead = () => {
        const next = new Set(readKeys);
        notifications.forEach((n) => n.key && next.add(n.key));
        persistRead(next);
    };
    const unread = notifications.filter((n) => !readKeys.has(n.key));

    const notificationIcon = (type) => {
        switch (type) {
            case 'APPROVAL': return <IconUserCheck />;
            case 'SCHEDULE': return <IconCalendarEvent />;
            case 'DIET': return <IconChefHat />;
            case 'WORKOUT': return <IconBarbell />;
            default: return <IconInfoCircle />;
        }
    };

    // Sidebar Action
    const { toggleSidebar } = useSidebarContext();

    // Logout Functionality
    const handleLogout = () => {
    console.log("Logout clicked");
    logout();
    localStorage.clear();
    console.log("✅ localStorage cleared");
    navigate('/sign-in');
    
    // Hard refresh to clear all state
    setTimeout(() => {
        window.location.href = '/sign-in';
    }, 500);
};
    


    return (
        <>
            <header className="codex-header">
                <div className="header-contian d-flex justify-content-between align-items-center">
                    <div className="header-left d-flex align-items-center">
                        <div className='codex-brand me-3'>
                            <Link className="d-flex align-items-center" to="/">
                                <img className="img-fluid" src={logo} alt="theeme-logo" />
                                <span className="fs-3 align-middle ms-2 lh-1">FitNexus</span>
                            </Link>
                        </div>
                        <div className="sidebar-action navicon-wrap me-3 d-xl-none" onClick={toggleSidebar}>
                            <IconLayoutGrid/>
                        </div>
                        <div className="input-group">
                            <span className="input-group-text pe-0">                               
                                <IconSearch/>
                            </span>
                            <Form.Control type="text" placeholder="Search Here" name="navsearch" value={navsearchData.navsearch} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="header-right d-flex align-items-center justify-content-end">
                        <ul className="nav-iconlist">
                            <li>
                                <div className="navicon-wrap action-dark" onClick={toggleTheme}>
                                    {theme === 'dark' ?
                                        <IconSun/> : <IconMoon/>}
                                </div>
                            </li>
                            <li className="action-menu dropdown">
                                <Dropdown>
                                    <Dropdown.Toggle className="navicon-wrap notiicon-iconwrap">
                                        <IconBellRinging/>
                                        {unread.length > 0 && <div className="noti-count"></div>}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className='action-dropdown navnotification-drop'>
                                        <div className="drop-header d-flex align-items-center justify-content-between">
                                            <h5 className="mb-0">
                                                Notifications<span className="ms-2 badge badge-primary">{unread.length}</span>
                                            </h5>
                                            {unread.length > 0 && (
                                                <button type="button" className="btn btn-link btn-sm p-0 text-primary" onClick={markAllRead}>
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        <SimpleBar>
                                            <ul>
                                                {!notifEnabled ? (
                                                    <li>
                                                        <div className="text-center text-muted py-3">Notifications are turned off</div>
                                                    </li>
                                                ) : unread.length === 0 ? (
                                                    <li>
                                                        <div className="text-center text-muted py-3">You&apos;re all caught up</div>
                                                    </li>
                                                ) : (
                                                    unread.map((item, index) => (
                                                        <li key={item.key || index}>
                                                            <Dropdown.Item as={Link} to={item.link || '#'} onClick={() => markRead(item.key)}>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="icon-nav">
                                                                        {notificationIcon(item.type)}
                                                                    </div>
                                                                    <div className="media-body">
                                                                        <h6>{item.title}</h6>
                                                                        {item.message && <small className="d-block text-muted">{item.message}</small>}
                                                                        {item.time && <span className="badge badge-success">{item.time}</span>}
                                                                    </div>
                                                                </div>
                                                                <IconChevronRight/>
                                                            </Dropdown.Item>
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </SimpleBar>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </li>
                            <li className="nav-profile action-menu dropdown">
                                <Dropdown>
                                    <Dropdown.Toggle className="navicon-wrap p-0">
                                        <IconUser stroke={1.5} />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="navprofile-drop action-dropdown">
                                        <ul>
                                            <li>
                                                <div className="media-body text-center">
                                                    <IconUser size={48} stroke={1.5} />
                                                    <h6 className="mt-2 fw-bold">Hello {user?.name || "User"}</h6>
                                                </div>
                                            </li>
                                            <li>
                                                <Dropdown.Item as={Link} to="/profile">                                                   
                                                    <IconSettings className='me-2 align-middle'/>
                                                    setting
                                                </Dropdown.Item>
                                            </li>
                                            <li>
                                                <Dropdown.Item onClick={handleLogout}>                                                   
                                                    <IconLogout className='me-2 align-middle'/>
                                                    Logout
                                                </Dropdown.Item>
                                            </li>
                                        </ul>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </li>
                        </ul>
                    </div>
                </div>
            </header>

        </>
    );
    
}
