import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Button } from "react-bootstrap";
import { IconHome, IconChartBar, IconTrendingUp, IconUsers, IconHeart, IconRefresh } from "@tabler/icons-react";
import Chart from "react-apexcharts";
import Swal from "sweetalert2";
import { getLeads } from "../../api/leadsApi";
import { getTransactions } from "../../api/billingApi";
import { getAllAttendance } from "../../api/attendanceApi";

export default function ReportsDashboard() {
  const [leads, setLeads] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsData, transactionsData, attendanceData] = await Promise.all([
        getLeads(),
        getTransactions(),
        getAllAttendance()
      ]);
      
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to retrieve reporting records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Leads CRM Conversion Funnel computations
  const funnelChart = useMemo(() => {
    const statuses = ["NEW", "CONTACTED", "TRIAL_SCHEDULED", "TRIAL_ATTENDED", "MEMBERSHIP_SOLD", "RENEWAL", "LOST"];
    const counts = statuses.map(s => leads.filter(l => l.status === s).length);
    
    return {
      options: {
        chart: { type: "bar" },
        plotOptions: {
          bar: {
            borderRadius: 4,
            horizontal: true,
            distributed: true,
            barHeight: "70%"
          }
        },
        colors: ["#5e72e4", "#fb6340", "#11cdef", "#8965e0", "#2dce89", "#172b4d", "#f5365c"],
        dataLabels: { enabled: true },
        xaxis: { categories: ["New", "Contacted", "Trial Scheduled", "Trial Attended", "Membership Sold", "Renewal", "Lost"] },
        legend: { show: false }
      },
      series: [{ name: "Leads Count", data: counts }]
    };
  }, [leads]);

  // 2. Revenue Trend over transactions
  const revenueChart = useMemo(() => {
    // Group transactions by date
    const dateMap = {};
    transactions.forEach(t => {
      if (t.transactionDate) {
        const dateStr = new Date(t.transactionDate).toLocaleDateString();
        dateMap[dateStr] = (dateMap[dateStr] || 0) + (t.amount || 0);
      }
    });

    // Sort dates
    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b)).slice(-10); // last 10 transaction dates
    const values = sortedDates.map(d => dateMap[d]);

    return {
      options: {
        chart: { type: "line", toolbar: { show: false } },
        stroke: { curve: "smooth", width: 3 },
        colors: ["#2dce89"],
        xaxis: { categories: sortedDates.length ? sortedDates : ["No Data"] },
        grid: { borderColor: "#eef2f2" }
      },
      series: [{ name: "Revenue (₹)", data: values.length ? values : [0] }]
    };
  }, [transactions]);

  // 3. Peak Gym Access Hours computations from Attendance logs
  const attendanceChart = useMemo(() => {
    const hours = Array(24).fill(0);
    attendance.forEach(a => {
      if (a.scanTime) {
        const hour = new Date(a.scanTime).getHours();
        if (hour >= 0 && hour < 24) {
          hours[hour]++;
        }
      }
    });

    const categories = Array(24).fill(0).map((_, i) => `${i}:00`);
    // filter to reasonable hours (e.g. 5:00 to 22:00)
    const displayHours = hours.slice(5, 23);
    const displayLabels = categories.slice(5, 23);

    return {
      options: {
        chart: { type: "bar", toolbar: { show: false } },
        colors: ["#11cdef"],
        plotOptions: { bar: { borderRadius: 4 } },
        xaxis: { categories: displayLabels.length ? displayLabels : ["5:00", "12:00", "18:00"] }
      },
      series: [{ name: "Check-ins", data: displayHours.length ? displayHours : [0, 0, 0] }]
    };
  }, [attendance]);

  // Key summaries
  const totalSales = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const conversionRate = leads.length > 0 
    ? Math.round((leads.filter(l => l.status === "MEMBERSHIP_SOLD" || l.status === "RENEWAL").length / leads.length) * 100) 
    : 0;
  const activeLeadsCount = leads.filter(l => l.status !== "MEMBERSHIP_SOLD" && l.status !== "RENEWAL" && l.status !== "LOST").length;
  const avgTransactions = transactions.length > 0 ? Math.round(totalSales / transactions.length) : 0;

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="mb-1">Reports & Analytics</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                  <li className="breadcrumb-item active">Reports</li>
                </ol>
              </nav>
            </div>
            <Button variant="outline-primary" onClick={loadData} className="d-flex align-items-center gap-1">
              <IconRefresh size={16} /> Reload Reports
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Calculating reports...</p>
            </div>
          ) : (
            <>
              {/* Analytics summary rows */}
              <Row className="mb-4 g-3">
                <Col sm={6} lg={3}>
                  <Card className="border-0 shadow-sm bg-light-success h-100">
                    <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-success mb-1">Total Billing</h6>
                        <h3 className="fw-bold mb-0">₹{totalSales.toLocaleString()}</h3>
                      </div>
                      <IconTrendingUp size={36} className="text-success opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} lg={3}>
                  <Card className="border-0 shadow-sm bg-light-primary h-100">
                    <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-primary mb-1">CRM Conversion</h6>
                        <h3 className="fw-bold mb-0">{conversionRate}%</h3>
                      </div>
                      <IconUsers size={36} className="text-primary opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} lg={3}>
                  <Card className="border-0 shadow-sm bg-light-warning h-100">
                    <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-warning mb-1">Active Pipeline</h6>
                        <h3 className="fw-bold mb-0">{activeLeadsCount} Leads</h3>
                      </div>
                      <IconChartBar size={36} className="text-warning opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} lg={3}>
                  <Card className="border-0 shadow-sm bg-light-info h-100">
                    <Card.Body className="p-4 d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-info mb-1">Avg. Invoice</h6>
                        <h3 className="fw-bold mb-0">₹{avgTransactions}</h3>
                      </div>
                      <IconHeart size={36} className="text-info opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Chart panels */}
              <Row className="g-4">
                {/* 1. Leads CRM Funnel */}
                <Col lg={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-transparent border-0 pt-4">
                      <h5 className="fw-bold mb-0">Leads Funnel Analysis</h5>
                      <p className="text-muted small mb-0">Distribution of leads across different sales cycle statuses.</p>
                    </Card.Header>
                    <Card.Body>
                      <Chart 
                        options={funnelChart.options} 
                        series={funnelChart.series} 
                        type="bar" 
                        height={320} 
                      />
                    </Card.Body>
                  </Card>
                </Col>

                {/* 2. Revenue Trend */}
                <Col lg={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-transparent border-0 pt-4">
                      <h5 className="fw-bold mb-0">Sales Timeline</h5>
                      <p className="text-muted small mb-0">Revenue transactions logged over active billing periods.</p>
                    </Card.Header>
                    <Card.Body>
                      <Chart 
                        options={revenueChart.options} 
                        series={revenueChart.series} 
                        type="line" 
                        height={320} 
                      />
                    </Card.Body>
                  </Card>
                </Col>

                {/* 3. Peak Access Timings */}
                <Col lg={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-transparent border-0 pt-4">
                      <h5 className="fw-bold mb-0">Gym Hourly Traffic</h5>
                      <p className="text-muted small mb-0">Peak attendance check-in scan volumes by hour of day.</p>
                    </Card.Header>
                    <Card.Body>
                      <Chart 
                        options={attendanceChart.options} 
                        series={attendanceChart.series} 
                        type="bar" 
                        height={280} 
                      />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>
    </main>
  );
}
