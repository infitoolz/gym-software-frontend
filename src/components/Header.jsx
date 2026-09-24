import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogout } from '@tabler/icons-react';
import { Dropdown, Form } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Link } from 'react-router-dom';
import { useSidebarContext } from '../context/useSidebarContext';
import HeaderSearch from './HeaderSearch';

import logo from '/src/assets/images/logo/logo.png';
import { getNotifications } from '../api/notificationApi';
import { getTheme, setTheme, getNotificationsEnabled, PREFERENCES_EVENT } from '../utils/preferences';
import { IconBellRinging, IconBarbell, IconCalendarEvent, IconChefHat, IconChevronRight, IconLayout, IconLayoutGrid, IconMoon, IconSearch, IconSettings, IconSun, IconUser, IconUserCheck, IconInfoCircle, IconMenu2, IconBuildingCommunity } from '@tabler/icons-react';
export default function Header() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const role = String(user?.role || "").toUpperCase();
    const isStaff = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TRAINER"].includes(role);
    const isCorporateHr = role === "CORPORATE_HR";

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
                        <div 
                            className="sidebar-action navicon-wrap me-3" 
                            onClick={toggleSidebar}
                            role="button"
                            title="Toggle Sidebar"
                            style={{ cursor: "pointer" }}
                        >
                            <IconMenu2 size={20}/>
                        </div>
                        <HeaderSearch theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />
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
                                <Dropdown align="end">
                                    <Dropdown.Toggle 
                                        as="div" 
                                        className="navicon-wrap p-0 border-0 bg-transparent" 
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div
                                            className="d-flex align-items-center justify-content-center text-white fw-bold rounded-circle"
                                            style={{
                                                width: 38,
                                                height: 38,
                                                background: "linear-gradient(135deg, #0066ff 0%, #00d2f4 100%)",
                                                fontSize: "14px",
                                                boxShadow: "0 2px 8px rgba(0, 102, 255, 0.28)",
                                                letterSpacing: "0.5px"
                                            }}
                                        >
                                            {(user?.name || user?.email || "U")[0]?.toUpperCase()}
                                        </div>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu 
                                        className="border-0 shadow-lg p-0"
                                        style={{
                                            minWidth: "265px",
                                            borderRadius: "14px",
                                            overflow: "hidden",
                                            backgroundColor: theme === "dark" ? "#162235" : "#ffffff",
                                            boxShadow: "0 14px 35px rgba(0, 0, 0, 0.16)",
                                            marginTop: "8px"
                                        }}
                                    >
                                        {/* User Identity Header */}
                                        <div 
                                            className="p-3 border-bottom d-flex align-items-center gap-3"
                                            style={{ 
                                                borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                                                background: theme === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 102, 255, 0.03)"
                                            }}
                                        >
                                            <div
                                                className="d-flex align-items-center justify-content-center text-white fw-bold rounded-circle flex-shrink-0"
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    background: "linear-gradient(135deg, #0052cc 0%, #00d2f4 100%)",
                                                    fontSize: "17px",
                                                    boxShadow: "0 4px 12px rgba(0, 102, 255, 0.25)"
                                                }}
                                            >
                                                {(user?.name || user?.email || "U")[0]?.toUpperCase()}
                                            </div>
                                            <div className="overflow-hidden flex-grow-1">
                                                <div 
                                                    className="fw-bold text-truncate" 
                                                    style={{ 
                                                        fontSize: "14.5px", 
                                                        color: theme === "dark" ? "#f1f5f9" : "#0f172a" 
                                                    }}
                                                    title={user?.name || "User"}
                                                >
                                                    {user?.name || "User"}
                                                </div>
                                                <div 
                                                    className="text-truncate small text-muted mb-1" 
                                                    style={{ fontSize: "11.5px" }}
                                                    title={user?.email || ""}
                                                >
                                                    {user?.email || ""}
                                                </div>
                                                <span 
                                                    className="badge" 
                                                    style={{
                                                        background: isCorporateHr ? "rgba(0, 210, 244, 0.15)" : "rgba(0, 102, 255, 0.12)",
                                                        color: isCorporateHr ? "#00b4d8" : "#0066ff",
                                                        border: `1px solid ${isCorporateHr ? "rgba(0, 210, 244, 0.3)" : "rgba(0, 102, 255, 0.25)"}`,
                                                        fontSize: "10px",
                                                        fontWeight: 600,
                                                        letterSpacing: "0.4px",
                                                        padding: "3px 8px",
                                                        borderRadius: "6px"
                                                    }}
                                                >
                                                    {role === "CORPORATE_HR" ? "Corporate HR" : role || "User"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="p-2 d-flex flex-column gap-1">
                                            {isCorporateHr && (
                                                <Dropdown.Item 
                                                    as={Link} 
                                                    to="/hr-portal" 
                                                    className="rounded-3 px-3 py-2 d-flex align-items-center gap-2 text-decoration-none"
                                                    style={{ fontSize: "13.5px", fontWeight: 500 }}
                                                >
                                                    <span 
                                                        className="d-flex align-items-center justify-content-center rounded-2"
                                                        style={{ width: 28, height: 28, background: "rgba(0, 102, 255, 0.08)", color: "#0066ff" }}
                                                    >
                                                        <IconBuildingCommunity size={16} />
                                                    </span>
                                                    <span>Corporate Portal</span>
                                                </Dropdown.Item>
                                            )}

                                            <Dropdown.Item 
                                                as={Link} 
                                                to={isCorporateHr ? "/hr-portal/profile" : "/profile"} 
                                                className="rounded-3 px-3 py-2 d-flex align-items-center gap-2 text-decoration-none"
                                                style={{ fontSize: "13.5px", fontWeight: 500 }}
                                            >
                                                <span 
                                                    className="d-flex align-items-center justify-content-center rounded-2"
                                                    style={{ width: 28, height: 28, background: "rgba(100, 116, 139, 0.1)", color: "#475569" }}
                                                >
                                                    <IconSettings size={16} />
                                                </span>
                                                <span>Account Settings</span>
                                            </Dropdown.Item>

                                            <div 
                                                className="my-1 border-top" 
                                                style={{ borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)" }} 
                                            />

                                            <Dropdown.Item 
                                                onClick={handleLogout} 
                                                className="rounded-3 px-3 py-2 d-flex align-items-center gap-2 text-danger text-decoration-none"
                                                style={{ fontSize: "13.5px", fontWeight: 500 }}
                                            >
                                                <span 
                                                    className="d-flex align-items-center justify-content-center rounded-2"
                                                    style={{ width: 28, height: 28, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
                                                >
                                                    <IconLogout size={16} />
                                                </span>
                                                <span>Sign Out</span>
                                            </Dropdown.Item>
                                        </div>
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
