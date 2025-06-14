// /asset/js/voiceVideoChat.js
import {
  peer,
  localStream,
  mediaConnections,
  localUsername,
  localAvatar,
  peerDetails,
  localVideoStream,
  localScreenStream,
  videoEnabled,
  micEnabled,
  setLocalStream,
  setLocalVideoStream,
  setLocalScreenStream,
  setVideoEnabled,
  connections,
  setMicEnabled,
} from "./globals.js";

function showError(message) {
  const errorBox = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");
  errorText.textContent = message;
  errorBox.classList.remove("hidden");
  setTimeout(() => errorBox.classList.add("hidden"), 5000);
}

export function joinVoiceChannel() {
  document.getElementById("media-control-dock").classList.remove("hidden");
  document.getElementById("voice-top-panel").classList.remove("hidden");
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      setLocalStream(stream);
      // old: addUserToVoiceUI(peer.id, localUsername, localAvatar);
      addUserToVoiceUI(peer.id, localUsername, localAvatar, localStream, false, false);
      for (const id in connections) {
        if (!mediaConnections[id]) {
          const call = peer.call(id, stream);
          mediaConnections[id] = call;
         call.on("stream", (remoteStream) => {
            addUserToVoiceUI(
              call.peer,
              peerDetails[call.peer]?.username || "Unknown",
              peerDetails[call.peer]?.avatar || "https://via.placeholder.com/20",
              remoteStream,
              false, // isVideo
              false  // isScreenShare
            );
          });
          call.on("close", () => removeUserFromVoiceUI(call.peer));
        }
      }
    })
    .catch((err) => {
      console.error("Failed to access microphone", err);
      showError("Microphone access denied or failed.");
    });
}

peer.on("call", (call) => {
  if (localStream) {
    // Only answer the call if the user is in the voice channel
    call.answer(localStream);
    mediaConnections[call.peer] = call;
    call.on("stream", (remoteStream) => {
      addUserToVoiceUI(
              call.peer,
              peerDetails[call.peer]?.username || "Unknown",
              peerDetails[call.peer]?.avatar || "https://via.placeholder.com/20",
              remoteStream,
              false, // isVideo
              false  // isScreenShare
            );
    });
    call.on("close", () => removeUserFromVoiceUI(call.peer));
  } else {
    // Ignore the call if not in the voice channel
    call.close();
  }
});

export function addUserToVoiceUI(peerId, username, avatarUrl, stream, isVideo, isScreenShare) {
  // Add user avatars below voice channel
  if (document.getElementById(`voice-user-${peerId}`)) return;
  const voiceUsers = document.getElementById("voice-users");
  const div = document.createElement("div");
  div.id = `voice-user-${peerId}`;
  div.className = "voice-user";
  div.innerHTML = `<img src="${avatarUrl}" alt="${username}"><span>${username}</span>`;
  voiceUsers.appendChild(div);

  // Create container for top panel (avatar + visualizer)
  const container = document.createElement('div');
  container.id = `voice-user-container-${peerId}`; // Unique ID to avoid conflicts
  container.className = "relative flex items-center justify-center w-24 h-24";

  // Create canvas for audio visualizer
  const canvas = document.createElement('canvas');
  canvas.width = 96; // Slightly larger than avatar to allow ring expansion
  canvas.height = 96;
  canvas.className = "absolute z-0"; // No need for top-0 left-0; centering handled by flex

  // Create avatar
  const avatar = document.createElement('img');
  avatar.src = avatarUrl || '/default-avatar.png';
  avatar.className = "rounded-full w-16 h-16 z-10";

  // Append elements to container
  container.append(canvas, avatar);
  document.getElementById("voice-top-panel").appendChild(container);
  document.getElementById("voice-top-panel").classList.remove('hidden');

  // If not video/screen share, show avatar + ring
  if (!isVideo && !isScreenShare) {
    setupAudioVisualizer(stream, canvas);
  } else {
    // Replace avatar with video or screen
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.className = "rounded w-full h-full object-cover";
    container.innerHTML = ''; // Clear canvas + avatar
    container.appendChild(video);
  }
}

export function removeUserFromVoiceUI(id) {
  const el = document.getElementById(`voice-user-${id}`);
  if (el) el.remove();
}

export function setupAudioVisualizer(stream, canvas) {
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  const source = audioCtx.createMediaStreamSource(stream);

  analyser.fftSize = 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  const ctx = canvas.getContext('2d');
  const avatarRadius = 32; // Half of avatar's 64px (w-16 h-16)
  const baseRadius = avatarRadius + 4; // Start just outside avatar edge
  const maxScale = 1.5; // Limit how far the ring expands

  const draw = () => {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    const amplitude = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const scale = Math.min(Math.max(amplitude / 50, 1), maxScale); // Adjust sensitivity

    const center = canvas.width / 2; // Canvas is 96x96, so center is 48
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(center, center, baseRadius * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  draw();
}

document.getElementById("toggle-mic").onclick = () => {
  setMicEnabled(!micEnabled);
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => (track.enabled = micEnabled));
  }
  document.getElementById("toggle-mic").innerHTML = micEnabled
    ? '<i class="fas fa-microphone"></i>'
    : '<i class="fas fa-microphone-slash text-red-400"></i>';
};

document.getElementById("toggle-cam").onclick = async () => {
  if (!videoEnabled) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setLocalVideoStream(stream);
      replaceTracks(localVideoStream.getVideoTracks()[0]);
      setVideoEnabled(true);
      document.getElementById("toggle-cam").innerHTML =
        '<i class="fas fa-video"></i>';
    } catch (e) {
      console.error("Failed to access webcam:", e);
      showError("Camera access denied or failed.");
    }
  } else {
    if (localVideoStream) {
      localVideoStream.getTracks().forEach((t) => t.stop());
    }
    replaceTracks(null);
    setVideoEnabled(false);
    setLocalVideoStream(null);
    document.getElementById("toggle-cam").innerHTML =
      '<i class="fas fa-video-slash text-red-400"></i>';
  }
};

document.getElementById("share-screen").onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    setLocalScreenStream(stream);
    replaceTracks(localScreenStream.getVideoTracks()[0]);
    localScreenStream.getVideoTracks()[0].onended = () => {
      replaceTracks(null);
      setLocalScreenStream(null);
    };
  } catch (e) {
    console.error("Screen share cancelled or failed", e);
    showError("Screen share denied or failed.");
  }
};

export function leaveVoiceChannel() {
  for (let id in mediaConnections) {
    mediaConnections[id].close();
    delete mediaConnections[id];
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (localVideoStream) {
    localVideoStream.getTracks().forEach((track) => track.stop());
  }
  if (localScreenStream) {
    localScreenStream.getTracks().forEach((track) => track.stop());
  }
  setLocalStream(null);
  setMicEnabled(true);
  setVideoEnabled(false);
  setLocalVideoStream(null);
  setLocalScreenStream(null);

  document.getElementById("media-control-dock").classList.add("hidden");
  document.getElementById("voice-top-panel").classList.add("hidden");

  document.getElementById("voice-users").innerHTML = "";
}

document.getElementById("leave-voice").onclick = leaveVoiceChannel;

function replaceTracks(newVideoTrack) {
  Object.values(mediaConnections).forEach((call) => {
    const sender = call.peerConnection
      .getSenders()
      .find((s) => s.track && s.track.kind === "video");
    if (sender) {
      if (newVideoTrack) sender.replaceTrack(newVideoTrack);
      else sender.replaceTrack(null);
    }
  });
}
