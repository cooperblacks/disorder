// /asset/js/profileManagement.js
import {
  localUsername,
  localAvatar,
  peerDetails,
  peer,
  setLocalUsername,
  setLocalAvatar,
} from "./globals.js";
import { broadcast } from "./messaging.js";
import { updatePeerSidebar } from "./uiUpdates.js";

export function toggleProfilePanel() {
  const panel = document.getElementById("profile-panel");
  panel.classList.toggle("hidden");
  document.getElementById("nickname-input").value = localUsername;
}

export function saveProfile() {
  const newName = document.getElementById("nickname-input").value.trim();
  if (newName) {
    setLocalUsername(newName);
    document.getElementById("nickname-display").textContent = newName;
    broadcast({ type: "profile", username: localUsername, avatar: localAvatar });
    peerDetails[peer.id].username = localUsername;
    updatePeerSidebar();
  }
  const file = document.getElementById("avatar-upload").files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      setLocalAvatar(reader.result);
      document.getElementById("avatar-preview").src = localAvatar;
      broadcast({ type: "profile", username: localUsername, avatar: localAvatar });
      peerDetails[peer.id].avatar = localAvatar;
      updatePeerSidebar();
    };
    reader.readAsDataURL(file);
  }
  document.getElementById("profile-panel").classList.add("hidden");
}
