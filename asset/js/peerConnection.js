// /asset/js/peerConnection.js
import {
  peer,
  connections,
  mediaConnections,
  peerDetails,
  localUsername,
  localAvatar,
  localStream,
  currentPeerId,
} from "./globals.js";
import { setupConnection } from "./messaging.js";
import { showToast, appendSystemMessage } from "./utils.js";
import { updatePeerSidebar } from "./uiUpdates.js";
import { addUserToVoiceUI, removeUserFromVoiceUI } from "./voiceVideoChat.js";

peer.on("open", (id) => {
  alert(
    `All messages and content will be gone when all members disconnect. Your peer ID will change if you refresh or leave the chat. EVERYTHING IS LOST WHEN YOU LEAVE.`
  );
  showToast("Connected <i class='fas fa-check text-green-400 ml-1'></i>");
  document.getElementById("peer-id-input").placeholder = "Enter a peer ID";
  currentPeerId.textContent = `ID: ${id}`;
  peerDetails[id] = {
    joined: new Date(),
    messages: 0,
    files: 0,
    active: true,
    username: localUsername,
    avatar: localAvatar,
  };
  const urlParams = new URLSearchParams(window.location.search);
  const remoteId = urlParams.get("id");
  if (remoteId) {
    const conn = peer.connect(remoteId);
    setupConnection(conn);
  }
});

peer.on("connection", (conn) => {
  setupConnection(conn);
});

document.getElementById("connect-btn").onclick = () => {
  const id = document.getElementById("peer-id-input").value.trim();
  if (id && !connections[id]) {
    const conn = peer.connect(id);
    setupConnection(conn);
  }
};

export function initializeConnection(conn) {
  connections[conn.peer] = conn;
  peerDetails[conn.peer] = {
    joined: new Date(),
    messages: 0,
    files: 0,
    active: true,
    username: conn.peer,
    avatar: "https://via.placeholder.com/40",
  };
  updatePeerSidebar();
  conn.on("open", () => {
    appendSystemMessage(`Connected to ${conn.peer}`);
    conn.send({ type: "profile", username: localUsername, avatar: localAvatar });
    if (localStream) {
      const call = peer.call(conn.peer, localStream);
      mediaConnections[conn.peer] = call;
      call.on("stream", (remoteStream) => {
        addUserToVoiceUI(
          conn.peer,
          peerDetails[conn.peer]?.username || "Unknown",
          peerDetails[conn.peer]?.avatar || "https://via.placeholder.com/20"
        );
      });
      call.on("close", () => removeUserFromVoiceUI(conn.peer));
    }
  });
  conn.on("close", () => {
    appendSystemMessage(`Disconnected: ${conn.peer}`);
    peerDetails[conn.peer].active = false;
    updatePeerSidebar();
    delete connections[conn.peer];
  });
}
