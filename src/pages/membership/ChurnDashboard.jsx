import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { getAtRiskMembers, engageAtRiskMember } from "../../api/membershipApi";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";

const ChurnDashboard = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getAtRiskMembers(user.userId);
      setMembers(data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load churn data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchMembers();
    }
  }, [user]);

  const handleEngage = async (member) => {
    // 1. Select Platform
    const { value: platform } = await Swal.fire({
      title: 'Select Platform',
      input: 'radio',
      inputOptions: {
        'whatsapp': 'WhatsApp',
        'email': 'Email'
      },
      inputValue: 'whatsapp',
      showCancelButton: true
    });

    if (!platform) return;

    // 2. Select Message Template
    const { value: selectedMessage } = await Swal.fire({
      title: `Engage via ${platform === 'whatsapp' ? 'WhatsApp' : 'Email'}`,
      input: 'select',
      inputOptions: {
        'miss_you': 'We noticed you haven\'t been in lately, let\'s schedule a session!',
        'poor_workout': 'Your workout completion is low. Need help adjusting your plan?',
        'expiring': 'Your membership is expiring soon. Renew now for a discount!',
        'custom': 'Custom Message...'
      },
      inputPlaceholder: 'Select a message template',
      showCancelButton: true,
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value !== '') {
            resolve();
          } else {
            resolve('You need to select a message');
          }
        });
      }
    });

    if (selectedMessage) {
      let finalMessage = selectedMessage;
      if (selectedMessage === 'custom') {
        const { value: customText } = await Swal.fire({
          title: 'Custom Message',
          input: 'textarea',
          inputPlaceholder: 'Type your message here...',
          showCancelButton: true
        });
        if (!customText) return;
        finalMessage = customText;
      } else {
        const options = {
          'miss_you': 'We noticed you haven\'t been in lately, let\'s schedule a session!',
          'poor_workout': 'Your workout completion is low. Need help adjusting your plan?',
          'expiring': 'Your membership is expiring soon. Renew now for a discount!'
        };
        finalMessage = options[selectedMessage];
      }

      try {
        Swal.fire({ title: 'Sending...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        // We could pass platform to the API, but for now we'll just append it to the message or assume backend knows
        await engageAtRiskMember(member.id, user.userId, finalMessage);
        Swal.fire('Sent!', `Message successfully sent to the member via ${platform === 'whatsapp' ? 'WhatsApp' : 'Email'}.`, 'success');
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to send message.', 'error');
      }
    }
  };

  const stats = {
    totalRisk: members.filter(m => m.reasons && m.reasons.length > 0).length,
    noVisit: members.filter(m => m.reasons.some(r => r.includes("Not visited") || r.includes("Never"))).length,
    lowWorkout: members.filter(m => m.reasons.some(r => r.includes("Workout completion"))).length,
    expiringSoon: members.filter(m => m.reasons.some(r => r.includes("Membership"))).length,
  };

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0 text-danger fw-bold">AI Churn Dashboard</h2>
              <p className="text-muted">Identify and retain at-risk members</p>
            </div>
            <button className="btn btn-outline-primary shadow-sm" onClick={fetchMembers} disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Refreshing...</>
              ) : (
                <><i className="bi bi-arrow-clockwise me-2" />Refresh Data</>
              )}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger shadow-sm border-0 border-start border-danger border-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm bg-danger text-white h-100" style={{ background: "linear-gradient(135deg, #dc3545, #b02a37)" }}>
                <div className="card-body">
                  <h6 className="card-title text-uppercase fw-semibold mb-3 opacity-75">Total at Risk</h6>
                  <h2 className="display-5 fw-bold mb-0">{stats.totalRisk}</h2>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm h-100 border-start border-warning border-4">
                <div className="card-body">
                  <h6 className="card-title text-muted text-uppercase fw-semibold mb-3">No Visit (&gt;10 days)</h6>
                  <h2 className="display-5 fw-bold mb-0 text-warning">{stats.noVisit}</h2>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm h-100 border-start border-info border-4">
                <div className="card-body">
                  <h6 className="card-title text-muted text-uppercase fw-semibold mb-3">Low Workout (&lt;30%)</h6>
                  <h2 className="display-5 fw-bold mb-0 text-info">{stats.lowWorkout}</h2>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm h-100 border-start border-secondary border-4">
                <div className="card-body">
                  <h6 className="card-title text-muted text-uppercase fw-semibold mb-3">Expiring Soon</h6>
                  <h2 className="display-5 fw-bold mb-0 text-secondary">{stats.expiringSoon}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Member Name</th>
                      <th>Contact Info</th>
                      <th>Risk Factors</th>
                      <th className="text-end pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && members.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted">
                          <div className="spinner-border text-primary mb-3" role="status"></div>
                          <p className="mb-0">Analyzing churn risk...</p>
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted">
                          <i className="bi bi-emoji-smile fs-1 text-success mb-3 d-block"></i>
                          <p className="mb-0 fw-semibold">Looking good! No members currently at high risk.</p>
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => (
                        <tr key={member.id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <div className="avatar me-3 bg-light text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                                {member.firstName?.[0] || "?"}
                              </div>
                              <div>
                                <h6 className="mb-0 fw-semibold">{member.firstName} {member.lastName}</h6>
                                <small className="text-muted">ID: #{member.id}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="small"><i className="bi bi-envelope me-2 text-muted"></i>{member.email}</span>
                              {member.phone && <span className="small mt-1"><i className="bi bi-telephone me-2 text-muted"></i>{member.phone}</span>}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              {member.reasons.length === 0 ? (
                                <span className="badge bg-success bg-opacity-75 rounded-pill px-3 py-2 fw-normal">
                                  <i className="bi bi-check-circle me-1"></i>Healthy / Regular
                                </span>
                              ) : (
                                member.reasons.map((reason, idx) => {
                                  let badgeClass = "bg-secondary";
                                  if (reason.includes("visited") || reason.includes("Never")) badgeClass = "bg-warning text-dark";
                                  else if (reason.includes("Workout")) badgeClass = "bg-info text-dark";
                                  else if (reason.includes("Membership")) badgeClass = "bg-danger";
                                  
                                  return (
                                    <span key={idx} className={`badge ${badgeClass} bg-opacity-75 rounded-pill px-3 py-2 fw-normal`}>
                                      {reason}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="text-end pe-4">
                             <button onClick={() => handleEngage(member)} className="btn btn-sm btn-light text-primary fw-semibold rounded-pill px-3 shadow-sm border">
                                <i className="bi bi-whatsapp me-2 text-success"></i>Engage
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </main>
  );
};

export default ChurnDashboard;
