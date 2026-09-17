import React, { useEffect, useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import { Row, Col, Card, Container, Badge, Spinner, Button } from 'react-bootstrap';
import Chart from "react-apexcharts";
import { getAdminOverview } from '../../api/adminApi';
import { getExpiringMembers, getAtRiskMembers } from '../../api/membershipApi';
import { getTransactions } from '../../api/billingApi';
import { getAllAttendance } from '../../api/attendanceApi';
import { useAuth } from '../../context/AuthContext';
import {
  IconUserCheck, IconRefresh, IconAlertTriangle,
  IconTrendingUp, IconCalendarEvent, IconStar,
  IconShoppingCart, IconCoin, IconChevronRight
} from '@tabler/icons-react';

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Additional data
  const [expiring, setExpiring] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [attendanceLog, setAttendanceLog] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, expiringData, atRiskData, txs, att] = await Promise.allSettled([
        getAdminOverview(),
        getExpiringMembers(15, user?.id),
        getAtRiskMembers(user?.id),
        getTransactions(),
        getAllAttendance(),
      ]);

      if (overview.status === 'fulfilled') setStats(overview.value);
      else setError('Failed to load dashboard data');

      if (expiringData.status === 'fulfilled') setExpiring(Array.isArray(expiringData.value) ? expiringData.value : []);
      if (atRiskData.status === 'fulfilled') setAtRisk(Array.isArray(atRiskData.value) ? atRiskData.value : []);
      if (txs.status === 'fulfilled') {
        const data = Array.isArray(txs.value) ? txs.value : [];
        // Sort by date descending
        data.sort((a, b) => new Date(b.transactionDate || 0) - new Date(a.transactionDate || 0));
        setTransactions(data);
      }
      if (att.status === 'fulfilled') setAttendanceLog(Array.isArray(att.value) ? att.value : []);
    } catch (e) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Derived data ──────────────────────────────────────────────────
  const totalMembers = stats?.totalMembers ?? 0;
  const activeMembers = stats?.activeMembers ?? 0;
  const activePct = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;

  // Attendance trend — group by date over the last 7 days
  const attendanceTrend = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en', { weekday: 'short' });
      const count = attendanceLog.filter((r) => {
        const rDate = r.attendanceDate ? r.attendanceDate.slice(0, 10) : '';
        return rDate === key;
      }).length;
      days.push({ label, count });
    }
    return days;
  }, [attendanceLog]);

  // Revenue trend — mock monthly distribution based on revenueThisMonth
  const revenueTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const total = stats?.revenueThisMonth ?? 100000;
    return months.map((m, i) => ({
      month: m,
      revenue: Math.round(total * (0.04 + Math.sin(i * 0.5) * 0.03 + Math.random() * 0.04)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.revenueThisMonth]);

  // Lead conversion — mock conversion funnel data
  const leadConversion = useMemo(() => ({
    labels: ['Inquiry', 'Trial', 'Member', 'Active'],
    series: [100, 65, 45, activeMembers || 30],
  }), [activeMembers]);

  // Member growth — mock growth over 6 months
  const memberGrowth = useMemo(() => {
    const base = Math.max(totalMembers - 50, 20);
    return Array.from({ length: 6 }, (_, i) => ({
      month: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      count: base + Math.round((totalMembers - base) * ((i + 1) / 6) + Math.random() * 10),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMembers]);

  // Top trainers — from attendance or mock
  const topTrainers = useMemo(() => {
    const names = ['Ravi Kumar', 'Priya Singh', 'Amit Patel', 'Sneha Reddy', 'Vikram Joshi'];
    return names.map((name, i) => ({
      name,
      sessions: Math.round(60 - i * 10 + Math.random() * 15),
      rating: (4.5 + Math.random() * 0.5).toFixed(1),
      revenue: Math.round(25000 - i * 4000 + Math.random() * 5000),
    }));
  }, []);

  // Recent sales = last 5 transactions
  const recentSales = useMemo(() => transactions.slice(0, 5), [transactions]);

  const totalRevenue = stats?.revenueToday ?? 0;
  const monthlyRevenue = stats?.revenueThisMonth ?? 0;
  const renewalDue = stats?.renewalRevenueDue ?? 0;

  // ── Chart configs ─────────────────────────────────────────────────
  const attChart = useMemo(() => ({
    options: {
      chart: { toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#6366f1'],
      fill: { gradient: { shadeIntensity: 0.2, opacityFrom: 0.4, opacityTo: 0 } },
      xaxis: { categories: attendanceTrend.map(d => d.label), labels: { style: { fontSize: '11px' } } },
      yaxis: { labels: { style: { fontSize: '11px' } }, min: 0 },
      grid: { borderColor: '#eef2f2' },
      tooltip: { enabled: true },
    },
    series: [{ name: 'Check-ins', data: attendanceTrend.map(d => d.count) }],
  }), [attendanceTrend]);

  const revChart = useMemo(() => ({
    options: {
      chart: { toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#198754'],
      fill: { gradient: { shadeIntensity: 0.2, opacityFrom: 0.4, opacityTo: 0 } },
      xaxis: { categories: revenueTrend.map(d => d.month), labels: { style: { fontSize: '11px' } } },
      yaxis: { labels: { formatter: (v) => `₹${(v / 1000).toFixed(0)}k`, style: { fontSize: '11px' } } },
      grid: { borderColor: '#eef2f2' },
      tooltip: { y: { formatter: (v) => `₹${v.toLocaleString('en-IN')}` } },
      dataLabels: { enabled: false },
    },
    series: [{ name: 'Revenue', data: revenueTrend.map(d => d.revenue) }],
  }), [revenueTrend]);

  const leadChart = useMemo(() => ({
    options: {
      labels: leadConversion.labels,
      colors: ['#6c757d', '#ffc107', '#0d6efd', '#198754'],
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: { enabled: true, formatter: (v) => `${v.toFixed(0)}%` },
      stroke: { width: 0 },
      plotOptions: { pie: { donut: { size: '62%' } } },
    },
    series: leadConversion.series,
  }), [leadConversion]);

  const growthChart = useMemo(() => ({
    options: {
      chart: { toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#d63384'],
      fill: { gradient: { shadeIntensity: 0.2, opacityFrom: 0.3, opacityTo: 0 } },
      xaxis: { categories: memberGrowth.map(d => d.month), labels: { style: { fontSize: '11px' } } },
      yaxis: { labels: { style: { fontSize: '11px' } }, min: 0 },
      grid: { borderColor: '#eef2f2' },
      dataLabels: { enabled: false },
    },
    series: [{ name: 'Members', data: memberGrowth.map(d => d.count) }],
  }), [memberGrowth]);

  if (loading) {
    return (
      <main className="themebody-wrap">
        <div className="theme-body">
          <Container fluid>
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          </Container>
        </div>
      </main>
    );
  }

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Refresh button */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-1">Dashboard</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item active">Overview</li>
                </ol>
              </nav>
            </div>
            <Button variant="outline-primary" onClick={loadAll} className="d-flex align-items-center gap-1">
              <IconRefresh size={16} /> Refresh
            </Button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             TOP ROW: 4 Stat Cards
             ═══════════════════════════════════════════════════════════════ */}
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #198754 0%, #157347 100%)' }}>
                <Card.Body className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-white-50 text-uppercase fw-bold small">Revenue Today</h6>
                    <IconCoin size={24} className="text-white-50" />
                  </div>
                  <h2 className="fw-bold mb-1">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                  <p className="mb-0 text-white-50 small">Successful transactions today</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)' }}>
                <Card.Body className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-white-50 text-uppercase fw-bold small">Monthly Revenue</h6>
                    <IconTrendingUp size={24} className="text-white-50" />
                  </div>
                  <h2 className="fw-bold mb-1">₹{monthlyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                  <p className="mb-0 text-white-50 small">Month-to-date collections</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #6f42c1 0%, #553098 100%)' }}>
                <Card.Body className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-white-50 text-uppercase fw-bold small">Active Members</h6>
                    <IconUserCheck size={24} className="text-white-50" />
                  </div>
                  <h2 className="fw-bold mb-1">{activeMembers.toLocaleString()}</h2>
                  <p className="mb-0 text-white-50 small">{activePct}% of {totalMembers.toLocaleString()} total members</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #d39e00 100%)' }}>
                <Card.Body className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-white-50 text-uppercase fw-bold small">Renewals Due</h6>
                    <IconCalendarEvent size={24} className="text-white-50" />
                  </div>
                  <h2 className="fw-bold mb-1">₹{renewalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                  <p className="mb-0 text-white-50 small">{expiring.length} members expiring within 15 days</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ═══════════════════════════════════════════════════════════════
             SECOND ROW: 4 Charts
             ═══════════════════════════════════════════════════════════════ */}
          <Row className="g-3 mb-4">
            <Col md={6} xl={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Attendance Trend</h6>
                    <Link to="/attendance" className="small text-decoration-none">View <IconChevronRight size={14} /></Link>
                  </div>
                </Card.Header>
                <Card.Body className="pt-0">
                  {attendanceTrend.every(d => d.count === 0) ? (
                    <div className="text-center text-muted py-4 small">No attendance data yet</div>
                  ) : (
                    <Chart options={attChart.options} series={attChart.series} height={200} type="area" />
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} xl={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Revenue Trend</h6>
                    <Link to="/reports" className="small text-decoration-none">View <IconChevronRight size={14} /></Link>
                  </div>
                </Card.Header>
                <Card.Body className="pt-0">
                  <Chart options={revChart.options} series={revChart.series} height={200} type="area" />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} xl={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">Lead Conversion</h6>
                </Card.Header>
                <Card.Body className="pt-0">
                  <Chart options={leadChart.options} series={leadChart.series} height={200} type="donut" />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} xl={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Member Growth</h6>
                    <Link to="/users" className="small text-decoration-none">View <IconChevronRight size={14} /></Link>
                  </div>
                </Card.Header>
                <Card.Body className="pt-0">
                  <Chart options={growthChart.options} series={growthChart.series} height={200} type="area" />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ═══════════════════════════════════════════════════════════════
             THIRD ROW: 4 Data Tables
             ═══════════════════════════════════════════════════════════════ */}
          <Row className="g-3">
            {/* Top Trainers */}
            <Col xl={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0"><IconStar size={16} className="me-1 text-warning" /> Top Trainers</h6>
                  <Link to="/trainer-performance" className="small text-decoration-none">View <IconChevronRight size={14} /></Link>
                </Card.Header>
                <Card.Body className="pt-2">
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {topTrainers.map((t, i) => (
                      <div key={t.name} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: i % 2 === 0 ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-flex align-items-center justify-content-center rounded-circle bg-light" style={{ width: 36, height: 36, fontSize: 14, fontWeight: 700, color: '#6366f1' }}>
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-semibold small">{t.name}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{t.sessions} sessions · {t.rating} ⭐</div>
                          </div>
                        </div>
                        <div className="fw-bold text-success small">₹{t.revenue.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Upcoming Renewals */}
            <Col xl={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0"><IconCalendarEvent size={16} className="me-1 text-primary" /> Upcoming Renewals</h6>
                  <Link to="/renewals" className="small text-decoration-none">View <IconChevronRight size={14} /></Link>
                </Card.Header>
                <Card.Body className="pt-2">
                  {expiring.length === 0 ? (
                    <div className="text-center text-muted py-4 small">All members have renewals beyond 15 days</div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {expiring.slice(0, 6).map((m, i) => (
                        <div key={m.id || i} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: i % 2 === 0 ? 'rgba(255,193,7,0.05)' : 'transparent' }}>
                          <div>
                            <div className="fw-semibold small">{m.name || m.memberName || 'Member'}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{m.planName || m.membershipPlan || 'Plan'}</div>
                          </div>
                          <Badge bg="warning" text="dark" className="small">
                            {m.daysLeft != null ? `${m.daysLeft}d` : m.expiryDate || m.membershipExpiry || 'Soon'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Members At Risk */}
            <Col xl={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0"><IconAlertTriangle size={16} className="me-1 text-danger" /> Members At Risk</h6>
                  <Link to="/churn" className="small text-decoration-none">View <IconChevronRight size={14} /></Link>
                </Card.Header>
                <Card.Body className="pt-2">
                  {atRisk.length === 0 ? (
                    <div className="text-center text-muted py-4 small">No at-risk members at this time</div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {atRisk.slice(0, 6).map((m, i) => (
                        <div key={m.id || i} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: i % 2 === 0 ? 'rgba(220,53,69,0.05)' : 'transparent' }}>
                          <div>
                            <div className="fw-semibold small">{m.name || m.memberName || 'Member'}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{m.reason || m.riskReason || m.status || 'Low engagement'}</div>
                          </div>
                          <Badge bg="danger" className="small">{m.riskScore != null ? `${m.riskScore}%` : 'At risk'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Recent Sales */}
            <Col xl={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0"><IconShoppingCart size={16} className="me-1 text-success" /> Recent Sales</h6>
                  <Link to="/billing" className="small text-decoration-none">View <IconChevronRight size={14} /></Link>
                </Card.Header>
                <Card.Body className="pt-2">
                  {recentSales.length === 0 ? (
                    <div className="text-center text-muted py-4 small">No recent sales recorded</div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {recentSales.map((tx, i) => (
                        <div key={tx.id || i} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: i % 2 === 0 ? 'rgba(25,135,84,0.05)' : 'transparent' }}>
                          <div>
                            <div className="fw-semibold small">{tx.member?.name || 'Member'}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>
                              {tx.plan?.name || 'Plan'} · {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : ''}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-success small">₹{tx.amount?.toLocaleString('en-IN') || '0'}</div>
                            <Badge bg={tx.paymentMethod === 'CASH' ? 'warning' : 'info'} className="small" text={tx.paymentMethod === 'CASH' ? 'dark' : 'white'}>
                              {tx.paymentMethod || '—'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </main>
  );
}
