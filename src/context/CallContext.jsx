import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { WebRTCManager } from "../utils/webrtcManager";
import {
  connectStomp,
  disconnectStomp,
  subscribeStomp,
  sendStomp,
} from "../utils/stompClient";
import {
  initiateCall,
  initiateCallToMember,
  acceptCall as apiAcceptCall,
  rejectCall as apiRejectCall,
  endCall as apiEndCall,
  getIceServers,
} from "../api/chatApi";

const CallContext = createContext(null);

/**
 * Manages the full lifecycle of audio/video calls.
 * Exposes: callState, startCall, acceptCall, rejectCall, endCall,
 *          toggleMic, toggleCamera, localStream, remoteStream
 */
export function CallProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.userId;
  const role = String(user?.role || "").toUpperCase();

  const [callState, setCallState] = useState("idle"); // idle | calling | ringing | connected
  const [incomingCall, setIncomingCall] = useState(null); // { callId, callType, partnerId, partnerName, initiator }
  const [activeCall, setActiveCall] = useState(null); // { callId, callType, partnerId, partnerName }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [iceServers, setIceServers] = useState(null);
  const [connected, setConnected] = useState(false);

  const managerRef = useRef(null);
  const incomingCallRef = useRef(null);
  const activeCallRef = useRef(null);

  // Keep refs in sync with state
  incomingCallRef.current = incomingCall;
  activeCallRef.current = activeCall;

  // Fetch ICE servers on mount
  useEffect(() => {
    getIceServers()
      .then((servers) => {
        if (servers && servers.length > 0) setIceServers(servers);
      })
      .catch(() => {
        // Fallback STUN
        setIceServers([{ urls: ["stun:stun.l.google.com:19302"], username: "", credential: "" }]);
      });
  }, []);

  // Connect STOMP when userId is available
  useEffect(() => {
    if (!userId) return;

    connectStomp({
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });

    return () => {
      disconnectStomp();
    };
  }, [userId]);

  // Subscribe to STOMP channels when connected
  // Note: The broker resolves /user/queue/... to the authenticated user's queue,
  // so we use the generic path (without userId) here.
  useEffect(() => {
    if (!connected || !userId) return;

    const unsubIncoming = subscribeStomp(
      "/user/queue/call/incoming",
      (data) => {
        setIncomingCall(data);
        setCallState("ringing");
      }
    );

    const unsubAccepted = subscribeStomp(
      "/user/queue/call/accepted",
      async (data) => {
        setCallState("connected");
        setActiveCall(data);
        setIncomingCall(null);
        // Re-send the offer now that the callee is ready to receive it.
        // The offer was sent once on initiate, but the callee may not have
        // had their RTCPeerConnection set up yet, so this ensures delivery.
        if (managerRef.current) {
          try {
            const offer = await managerRef.current.createOffer();
            sendStomp("/app/call.signal", {
              recipientId: data.partnerId,
              type: "offer",
              payload: offer,
              callId: data.callId,
            });
          } catch (err) {
            console.error("[Call] Failed to re-send offer:", err);
          }
        }
      }
    );

    const unsubRejected = subscribeStomp(
      "/user/queue/call/rejected",
      (data) => {
        setCallState("idle");
        cleanupManager();
      }
    );

    const unsubMissed = subscribeStomp(
      "/user/queue/call/missed",
      (data) => {
        setCallState("idle");
        cleanupManager();
      }
    );

    const unsubEnded = subscribeStomp(
      "/user/queue/call/ended",
      (data) => {
        setCallState("idle");
        setActiveCall(null);
        cleanupManager();
      }
    );

    const unsubSignal = subscribeStomp(
      "/user/queue/call/signal",
      (data) => {
        handleSignal(data);
      }
    );

    return () => {
      unsubIncoming();
      unsubAccepted();
      unsubRejected();
      unsubMissed();
      unsubEnded();
      unsubSignal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, userId]);

  const handleSignal = useCallback(async (msg) => {
    if (!msg?.type || !managerRef.current) return;

    switch (msg.type) {
      case "offer": {
        await managerRef.current.setRemoteOffer(msg.payload);
        const answer = await managerRef.current.createAnswer();
        sendStomp("/app/call.signal", {
          recipientId: activeCallRef.current?.partnerId || incomingCallRef.current?.partnerId,
          type: "answer",
          payload: answer,
          callId: msg.callId,
        });
        break;
      }
      case "answer":
        await managerRef.current.setRemoteAnswer(msg.payload);
        break;
      case "ice-candidate":
        await managerRef.current.addIceCandidate(msg.payload);
        break;
      default:
        break;
    }
  }, []);

  const cleanupManager = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.destroy();
      managerRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const initManager = useCallback(
    async (video, audio) => {
      cleanupManager();
      const servers = iceServers?.map((s) => ({
        urls: s.urls,
        username: s.username,
        credential: s.credential,
      }));

      const manager = new WebRTCManager({
        iceServers: servers,
        onRemoteStream: (stream) => setRemoteStream(stream),
        onIceCandidate: (candidate) => {
          if (activeCallRef.current) {
            sendStomp("/app/call.signal", {
              recipientId: activeCallRef.current.partnerId,
              type: "ice-candidate",
              payload: candidate,
              callId: activeCallRef.current.callId,
            });
          }
        },
        onConnectionState: (state) => {
          if (state === "disconnected" || state === "failed" || state === "closed") {
            setCallState("idle");
            setActiveCall(null);
            cleanupManager();
          }
        },
      });

      managerRef.current = manager;
      const stream = await manager.startLocalStream(video, audio);
      setLocalStream(stream);
      return manager;
    },
    [iceServers, cleanupManager]
  );

  /** Member starts a call to their trainer. */
  const startCall = useCallback(
    async (callType = "AUDIO") => {
      try {
        const result = await initiateCall(callType);
        setCallState("calling");
        setActiveCall(result);

        const manager = await initManager(callType === "VIDEO", true);
        const offer = await manager.createOffer();

        sendStomp("/app/call.signal", {
          recipientId: result.partnerId,
          type: "offer",
          payload: offer,
          callId: result.callId,
        });
      } catch (err) {
        console.error("Failed to start call:", err);
        setCallState("idle");
        cleanupManager();
      }
    },
    [initManager, cleanupManager]
  );

  /** Trainer starts a call to a specific member. */
  const startCallToMember = useCallback(
    async (memberId, callType = "AUDIO") => {
      try {
        const result = await initiateCallToMember(memberId, callType);
        setCallState("calling");
        setActiveCall(result);

        const manager = await initManager(callType === "VIDEO", true);
        const offer = await manager.createOffer();

        sendStomp("/app/call.signal", {
          recipientId: result.partnerId,
          type: "offer",
          payload: offer,
          callId: result.callId,
        });
      } catch (err) {
        console.error("Failed to start call:", err);
        setCallState("idle");
        cleanupManager();
      }
    },
    [initManager, cleanupManager]
  );

  /** Accept incoming call. */
  const acceptIncomingCall = useCallback(async () => {
    const call = incomingCallRef.current;
    if (!call) return;

    try {
      await apiAcceptCall(call.callId);
      setCallState("connected");
      setActiveCall(call);
      setIncomingCall(null);

      const manager = await initManager(call.callType === "VIDEO", true);

      // Wait for the offer to arrive via STOMP
      // The offer signal handler will create and send the answer automatically
    } catch (err) {
      console.error("Failed to accept call:", err);
      setCallState("idle");
      cleanupManager();
    }
  }, [initManager, cleanupManager]);

  /** Reject incoming call. */
  const rejectIncomingCall = useCallback(async () => {
    const call = incomingCallRef.current;
    if (!call) return;
    try {
      await apiRejectCall(call.callId);
    } catch (err) {
      console.error("Failed to reject call:", err);
    }
    setIncomingCall(null);
    setCallState("idle");
  }, []);

  /** End active call (either party). */
  const endActiveCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call) return;
    try {
      await apiEndCall(call.callId);
    } catch (err) {
      console.error("Failed to end call:", err);
    }
    setCallState("idle");
    setActiveCall(null);
    cleanupManager();
  }, [cleanupManager]);

  const toggleMic = useCallback(() => {
    if (managerRef.current) {
      const on = managerRef.current.toggleMic();
      setMicOn(on);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (managerRef.current) {
      const on = managerRef.current.toggleCamera();
      setCameraOn(on);
    }
  }, []);

  const value = {
    callState,
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    micOn,
    cameraOn,
    isCalling: callState === "calling",
    isRinging: callState === "ringing",
    isConnected: callState === "connected",
    isIdle: callState === "idle",
    startCall,
    startCallToMember,
    acceptCall: acceptIncomingCall,
    rejectCall: rejectIncomingCall,
    endCall: endActiveCall,
    toggleMic,
    toggleCamera,
    connected,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
}
