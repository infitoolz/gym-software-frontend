import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Card } from "react-bootstrap";
import { IconRobot } from "@tabler/icons-react";

import CrmDashboard from "./CrmDashboard";
import LeadInbox from "./LeadInbox";
import WalkinRegister from "./WalkinRegister";
import TrialMembers from "./TrialMembers";
import LeadRegistry from "./LeadRegistry";
import FollowupCalendar from "./FollowupCalendar";
import SalesPipeline from "./SalesPipeline";
import CampaignManagement from "./CampaignManagement";
import SalesTeam from "./SalesTeam";
import ReferralProgram from "./ReferralProgram";
import CorporateLeads from "./CorporateLeads";
import Automation from "./Automation";
import CrmReports from "./CrmReports";
import LeadDetails from "./LeadDetails";
import AiCrm from "./AiCrm";
import CrmSettings from "./CrmSettings";
import Integrations from "../settings/Integrations";

// Navigation is handled by the sidebar flyout panel (Sidebar.jsx).
// This component renders only the routed content — no internal sidebar.
export default function LeadsCRM() {
  return (
    <div className="themebody-wrap">
      <div className="theme-body">
        <Routes>
          <Route path="/"            element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<CrmDashboard />} />
          <Route path="inbox"        element={<LeadInbox />} />
          <Route path="registry"     element={<LeadRegistry />} />
          <Route path="walkin"       element={<WalkinRegister />} />
          <Route path="trials"       element={<TrialMembers />} />
          <Route path="followup"     element={<FollowupCalendar />} />
          <Route path="pipeline"     element={<SalesPipeline />} />
          <Route path="referral"     element={<ReferralProgram />} />
          <Route path="campaigns"    element={<CampaignManagement />} />
          <Route path="team"         element={<SalesTeam />} />
          <Route path="corporate"    element={<CorporateLeads />} />
          <Route path="automation"   element={<Automation />} />
          <Route path="reports"      element={<CrmReports />} />
          <Route path="ai"           element={<AiCrm />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="settings"     element={<CrmSettings />} />
          <Route path="details/:id"  element={<LeadDetails />} />
          <Route path="*" element={
            <Card className="border-0 shadow-sm text-center py-5">
              <Card.Body>
                <IconRobot size={60} className="text-muted mb-3 opacity-50" />
                <h4 className="fw-bold">Module Coming Soon</h4>
                <p className="text-muted">This module is planned for Phase 2 / Phase 3 implementation.</p>
              </Card.Body>
            </Card>
          } />
        </Routes>
      </div>
    </div>
  );
}
