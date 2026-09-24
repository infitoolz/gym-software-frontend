import React, { useState, useEffect, useMemo } from "react";
import { Container, Card, Table, Badge, InputGroup, Form, Button, Spinner } from "react-bootstrap";
import { IconSearch, IconDownload, IconCalendarEvent } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { getCorporateAttendance } from "../../api/corporateWellnessApi";
import { useAuth } from "../../context/AuthContext";

export default function CorporateAttendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, auth } = useAuth();
  const currentUser = user || auth;

  const basePath = currentUser?.role === "CORPORATE_HR" ? "/hr-portal" : "/corporate";

  const fetchAttendance = async () => {
    try {
      const hrUserId = currentUser?.userId || currentUser?.id || localStorage.getItem("userId");
      const data = await getCorporateAttendance(hrUserId);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load attendance logs", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentUser]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(term)) ||
        (l.date && l.date.includes(term)) ||
        (l.status && l.status.toLowerCase().includes(term))
    );
  }, [logs, searchTerm]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["Employee Name,Date,Check In,Check Out,Duration,Status"];
    const rows = filteredLogs.map(
      (l) => `"${l.name}","${l.date}","${l.checkIn}","${l.checkOut}","${l.duration}","${l.status}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `corporate_attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Attendance Logs</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={basePath}>Corporate Wellness</Link></li>
                  <li className="breadcrumb-item active">Attendance</li>
                </ol>
              </nav>
            </div>
            <Button
              variant="outline-primary"
              className="d-flex align-items-center gap-2"
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
            >
              <IconDownload size={18} /> Export CSV
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <InputGroup style={{ maxWidth: "300px" }}>
                  <InputGroup.Text className="bg-light border-end-0">
                    <IconSearch size={18} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search employee or date..."
                    className="bg-light border-start-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                <div className="d-flex align-items-center gap-2">
                  <IconCalendarEvent size={20} className="text-muted" />
                  <span className="text-muted fw-medium">
                    Showing {filteredLogs.length} records
                  </span>
                </div>
              </div>

              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light text-muted small text-uppercase">
                    <tr>
                      <th className="py-3">Employee Name</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Check In</th>
                      <th className="py-3">Check Out</th>
                      <th className="py-3">Duration</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                          Loading attendance records...
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          No attendance records found yet. Member gate check-ins will appear here in real-time.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="fw-medium text-dark">{log.name}</td>
                          <td>{log.date}</td>
                          <td>{log.checkIn}</td>
                          <td>{log.checkOut}</td>
                          <td>{log.duration}</td>
                          <td>
                            <Badge
                              bg={log.status === "Present" ? "success" : "secondary"}
                              className="rounded-pill px-3 py-2"
                            >
                              {log.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </main>
  );
}
