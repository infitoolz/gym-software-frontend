/**
 * WebRTCManager - wraps RTCPeerConnection for one-on-one audio/video calls.
 *
 * Usage:
 *   const manager = new WebRTCManager({ iceServers, onRemoteStream, onIceCandidate });
 *   await manager.startLocalStream(video, audio);
 *   const offer = await manager.createOffer();
 *   await manager.setRemoteAnswer(answer);
 *   await manager.addIceCandidate(candidate);
 *   manager.destroy();
 */

export class WebRTCManager {
  constructor({ iceServers, onRemoteStream, onIceCandidate, onConnectionState }) {
    this.pc = new RTCPeerConnection({
      iceServers: iceServers || [{ urls: "stun:stun.l.google.com:19302" }],
    });
    this.localStream = null;
    this.onRemoteStream = onRemoteStream;
    this.onIceCandidate = onIceCandidate;
    this.onConnectionState = onConnectionState;

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(event.candidate);
      }
    };

    this.pc.ontrack = (event) => {
      this.onRemoteStream?.(event.streams[0]);
    };

    this.pc.onconnectionstatechange = () => {
      this.onConnectionState?.(this.pc.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      if (
        this.pc.iceConnectionState === "disconnected" ||
        this.pc.iceConnectionState === "failed"
      ) {
        this.onConnectionState?.("failed");
      }
    };
  }

  /**
   * Start capturing local media (camera / microphone).
   */
  async startLocalStream(video = true, audio = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio,
      });
      // Add all tracks to the peer connection
      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream);
      });
      return this.localStream;
    } catch (err) {
      console.error("[WebRTC] getUserMedia failed:", err);
      throw err;
    }
  }

  /**
   * Create an SDP offer (caller side).
   */
  async createOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create an SDP answer (callee side).
   */
  async createAnswer() {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set the remote SDP offer (callee side).
   */
  async setRemoteOffer(offer) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
  }

  /**
   * Set the remote SDP answer (caller side).
   */
  async setRemoteAnswer(answer) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Add a remote ICE candidate.
   */
  async addIceCandidate(candidate) {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("[WebRTC] Failed to add ICE candidate:", err);
    }
  }

  /**
   * Toggle local microphone on/off.
   */
  toggleMic() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Toggle local camera on/off.
   */
  toggleCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}
