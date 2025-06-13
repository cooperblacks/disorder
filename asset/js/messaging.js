// /asset/js/messaging.js
import {
  connections,
  peerDetails,
  localUsername,
  localAvatar,
  peer,
  messageInput,
  sendBtn,
  replyPreview,
  replyingTo,
  setReplyingTo,
} from "./globals.js";
import { displayMessage, updatePeerSidebar } from "./uiUpdates.js";

export function setupConnection(conn) {
  import("./peerConnection.js").then(({ initializeConnection }) => {
    initializeConnection(conn);
    conn.on("data", (data) => {
      if (data.type === "profile") {
        peerDetails[conn.peer].username = data.username;
        peerDetails[conn.peer].avatar = data.avatar;
        updatePeerSidebar();
      } else {
        displayMessage(
          data.username,
          data.message,
          data.avatar,
          data.fileType,
          data.fileData,
          data.fileName,
          conn.peer,
          data.replyTo
        );
        peerDetails[conn.peer].messages++;
        if (data.fileType) peerDetails[conn.peer].files++;
        updatePeerSidebar();
      }
    });
  });
}

// Send message
export function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;
  const payload = { type: 'text', message: msg, replyTo: replyingTo };
  broadcast(payload);
  displayMessage(localUsername, msg, localAvatar, null, null, null, peer.id, replyingTo);
  messageInput.value = "";
  replyingTo = null;
  replyPreview.classList.add("hidden");
  peerDetails[peer.id].messages++;
  updatePeerSidebar();
}

sendBtn.onclick = sendMessage;
messageInput.addEventListener("keypress", e => e.key === "Enter" && sendMessage());


export function broadcast(data) {
  Object.values(connections).forEach((conn) => {
    if (conn.open)
      conn.send({ ...data, username: localUsername, avatar: localAvatar });
  });
}
