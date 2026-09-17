import React from "react";
import { Button } from "react-bootstrap";
import { IconPhone, IconPhoneX, IconVideo } from "@tabler/icons-react";
import { createPortal } from "react-dom";
import { useCall } from "../context/CallContext";

/**
 * Full-screen overlay for incoming calls (ringing state).
 * Renders via React Portal on document.body to overlay the entire app.
 */
export default function IncomingCallModal() {
  const { incomingCall, isRinging, acceptCall, rejectCall } = useCall();

  if (!isRinging || !incomingCall) return null;

  const isVideo = incomingCall.callType === "VIDEO";

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 99999, backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="bg-white rounded-4 shadow-lg text-center p-5"
        style={{ maxWidth: 400, width: "90%", animation: "callPulse 1.5s ease-in-out infinite" }}
      >
        {/* Avatar */}
        <div
          className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{ width: 80, height: 80 }}
        >
          {isVideo ? (
            <IconVideo size={36} className="text-primary" />
          ) : (
            <IconPhone size={36} className="text-primary" />
          )}
        </div>

        {/* Caller info */}
        <h4 className="fw-bold mb-1">{incomingCall.partnerName}</h4>
        <p className="text-muted mb-4">
          {isVideo ? "Incoming video call..." : "Incoming audio call..."}
        </p>

        {/* Action buttons */}
        <div className="d-flex justify-content-center gap-4">
          <Button
            variant="outline-danger"
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 60, height: 60 }}
            onClick={rejectCall}
            title="Decline"
          >
            <IconPhoneX size={28} />
          </Button>

          <Button
            variant="success"
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 60, height: 60 }}
            onClick={acceptCall}
            title="Accept"
          >
            <IconPhone size={28} />
          </Button>
        </div>
      </div>

      {/* Keyframe animation for ringing pulse */}
      <style>{`
        @keyframes callPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>,
    document.body
  );
}
