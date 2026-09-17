import React, { useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import {
  IconPhoneOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconPhone,
} from "@tabler/icons-react";
import { createPortal } from "react-dom";
import { useCall } from "../context/CallContext";

/**
 * Full-screen overlay for active calls.
 * Shows local and remote video streams, or audio-only UI with profile avatar.
 * Renders via React Portal on document.body.
 */
export default function CallOverlay() {
  const {
    isConnected,
    isCalling,
    activeCall,
    localStream,
    remoteStream,
    micOn,
    cameraOn,
    endCall,
    toggleMic,
    toggleCamera,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!isConnected && !isCalling) return null;
  if (!activeCall) return null;

  const isVideo = activeCall.callType === "VIDEO";
  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0;

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
      style={{
        zIndex: 99998,
        backgroundColor: "#1a1a2e",
        color: "white",
      }}
    >
      {/* Remote video (full background) */}
      {isVideo && hasRemoteVideo ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-100 h-100"
          style={{ objectFit: "cover", position: "absolute", top: 0, left: 0 }}
        />
      ) : (
        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
          <div
            className="rounded-circle bg-primary bg-opacity-25 d-flex align-items-center justify-content-center mb-3"
            style={{ width: 100, height: 100 }}
          >
            {isVideo ? (
              <IconVideo size={44} className="text-primary" />
            ) : (
              <IconPhone size={44} className="text-primary" />
            )}
          </div>
          <h3 className="fw-bold">{activeCall.partnerName}</h3>
          <p className="text-white-50">
            {isCalling ? "Calling..." : "Connected"}
          </p>
        </div>
      )}

      {/* Partner name overlay */}
      <div className="position-absolute top-0 start-0 w-100 p-3 text-center">
        <h5 className="fw-bold mb-0 text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          {activeCall.partnerName}
        </h5>
        <small className="text-white-50">{isCalling ? "Calling..." : "Connected"}</small>
      </div>

      {/* Local video (picture-in-picture) */}
      {isVideo && localStream && (
        <div
          className="position-absolute rounded-3 overflow-hidden shadow"
          style={{
            top: 80,
            right: 16,
            width: 140,
            height: 180,
            border: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      {/* Controls bar */}
      <div
        className="d-flex justify-content-center align-items-center gap-3 p-4"
        style={{
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Mute toggle */}
        <Button
          variant={micOn ? "light" : "danger"}
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 50, height: 50 }}
          onClick={toggleMic}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <IconMicrophone size={22} /> : <IconMicrophoneOff size={22} />}
        </Button>

        {/* Camera toggle (video only) */}
        {isVideo && (
          <Button
            variant={cameraOn ? "light" : "danger"}
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 50, height: 50 }}
            onClick={toggleCamera}
            title={cameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {cameraOn ? <IconVideo size={22} /> : <IconVideoOff size={22} />}
          </Button>
        )}

        {/* End call */}
        <Button
          variant="danger"
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 60, height: 60 }}
          onClick={endCall}
          title="End call"
        >
          <IconPhoneOff size={28} />
        </Button>
      </div>
    </div>,
    document.body
  );
}
