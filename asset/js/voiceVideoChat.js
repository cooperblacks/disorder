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
      addUserToVoiceUI(peer.id, localUsername, localAvatar);
      for (const id in connections) {
        if (!mediaConnections[id]) {
          const call = peer.call(id, stream);
          mediaConnections[id] = call;
          call.on("stream", (remoteStream) => {
            addUserToVoiceUI(
              call.peer,
              peerDetails[call.peer]?.username || "Unknown",
              peerDetails[call.peer]?.avatar || "https://via.placeholder.com/20"
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
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      setLocalStream(stream);
      call.answer(stream);
      mediaConnections[call.peer] = call;
      call.on("stream", (remoteStream) => {
        addUserToVoiceUI(
          call.peer,
          peerDetails[call.peer]?.username || "Unknown",
          peerDetails[call.peer]?.avatar || "https://via.placeholder.com/20"
        );
      });
      call.on("close", () => removeUserFromVoiceUI(call.peer));
    });
});

export function addUserToVoiceUI(id, username, avatar) {
  if (document.getElementById(`voice-user-${id}`)) return;
  const voiceUsers = document.getElementById("voice-users");
  const div = document.createElement("div");
  div.id = `voice-user-${id}`;
  div.className = "voice-user";
  div.innerHTML = `<img src="${avatar}" alt="${username}"><span>${username}</span>`;
  voiceUsers.appendChild(div);
}

export function removeUserFromVoiceUI(id) {
  const el = document.getElementById(`voice-user-${id}`);
  if (el) el.remove();
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
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
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
