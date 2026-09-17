import React, { useState } from "react";
import { 
  IconBrandFacebook, 
  IconBrandInstagram, 
  IconBrandWhatsapp, 
  IconWorldWww, 
  IconCheck, 
  IconCopy,
  IconPlugConnected,
  IconLink
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { Card, Button, Form, Badge } from "react-bootstrap";

export default function Integrations() {
  const [tokens, setTokens] = useState({
    meta: "fitnexus_meta_secret_2026",
    whatsapp: "fitnexus_wa_secret_2026",
    website: "api_key_public_123"
  });

  const baseUrl = "https://your-gym-domain.com";

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'URL copied to clipboard.',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const handleTestConnection = (platform) => {
    Swal.fire({
      title: 'Simulating Webhook',
      text: `Sending a test lead from ${platform}...`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    setTimeout(() => {
      Swal.fire('Success!', `Test lead from ${platform} received successfully. Check your Lead Inbox.`, 'success');
    }, 1500);
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4 d-flex align-items-center gap-2">
        <div className="p-2 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <IconPlugConnected size={24} color="#3b82f6" />
        </div>
        <div>
          <h4 className="fw-bold mb-0">Integrations & Webhooks</h4>
          <p className="text-muted small mb-0">Configure your social media lead capture channels</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Meta Ads Integration */}
        <div className="col-12 col-xl-6">
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: "#e0f2fe" }}>
                    <IconBrandFacebook color="#0ea5e9" size={24} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Meta Lead Ads</h6>
                    <Badge bg="success" className="d-flex align-items-center gap-1 w-max-content">
                      <IconCheck size={12} /> Connected
                    </Badge>
                  </div>
                </div>
                <IconBrandInstagram color="#e11d48" size={24} style={{ opacity: 0.5 }} />
              </div>

              <p className="text-muted small mb-4">
                Connect your Facebook and Instagram Lead Generation campaigns. Meta will push new leads to this Webhook URL automatically.
              </p>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Webhook Callback URL</Form.Label>
                <div className="input-group">
                  <Form.Control readOnly value={`${baseUrl}/api/webhooks/meta`} style={{ fontSize: 13, background: "#f8fafc" }} />
                  <Button variant="outline-secondary" onClick={() => handleCopy(`${baseUrl}/api/webhooks/meta`)}>
                    <IconCopy size={16} />
                  </Button>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold text-muted">Verify Token</Form.Label>
                <Form.Control 
                  type="text" 
                  value={tokens.meta} 
                  onChange={(e) => setTokens({...tokens, meta: e.target.value})}
                  style={{ fontSize: 13 }} 
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 border-top pt-3">
                <Button variant="outline-primary" size="sm" onClick={() => handleTestConnection('Meta Lead Ads')}>
                  Test Webhook
                </Button>
                <Button variant="primary" size="sm">Save Token</Button>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* WhatsApp Integration */}
        <div className="col-12 col-xl-6">
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: "#dcfce7" }}>
                    <IconBrandWhatsapp color="#16a34a" size={24} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">WhatsApp Business API</h6>
                    <Badge bg="success" className="d-flex align-items-center gap-1 w-max-content">
                      <IconCheck size={12} /> Connected
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-muted small mb-4">
                Capture leads when prospects message your official WhatsApp business number.
              </p>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Webhook Callback URL</Form.Label>
                <div className="input-group">
                  <Form.Control readOnly value={`${baseUrl}/api/webhooks/whatsapp`} style={{ fontSize: 13, background: "#f8fafc" }} />
                  <Button variant="outline-secondary" onClick={() => handleCopy(`${baseUrl}/api/webhooks/whatsapp`)}>
                    <IconCopy size={16} />
                  </Button>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold text-muted">Verify Token</Form.Label>
                <Form.Control 
                  type="text" 
                  value={tokens.whatsapp} 
                  onChange={(e) => setTokens({...tokens, whatsapp: e.target.value})}
                  style={{ fontSize: 13 }} 
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 border-top pt-3">
                <Button variant="outline-success" size="sm" onClick={() => handleTestConnection('WhatsApp')}>
                  Test Webhook
                </Button>
                <Button variant="success" size="sm">Save Token</Button>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Website Integration */}
        <div className="col-12 col-xl-6">
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: "#f1f5f9" }}>
                    <IconWorldWww color="#475569" size={24} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Public Website API</h6>
                    <Badge bg="secondary" className="d-flex align-items-center gap-1 w-max-content">
                      <IconLink size={12} /> Active
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-muted small mb-4">
                Connect your gym's public website (WordPress, Wix, custom) contact forms directly to your CRM.
              </p>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Public Endpoint (POST)</Form.Label>
                <div className="input-group">
                  <Form.Control readOnly value={`${baseUrl}/api/public/leads`} style={{ fontSize: 13, background: "#f8fafc" }} />
                  <Button variant="outline-secondary" onClick={() => handleCopy(`${baseUrl}/api/public/leads`)}>
                    <IconCopy size={16} />
                  </Button>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold text-muted">API Key (Optional Security)</Form.Label>
                <Form.Control 
                  type="text" 
                  value={tokens.website} 
                  onChange={(e) => setTokens({...tokens, website: e.target.value})}
                  style={{ fontSize: 13 }} 
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 border-top pt-3">
                <Button variant="outline-dark" size="sm" onClick={() => handleTestConnection('Website Form')}>
                  Simulate Form Submit
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
