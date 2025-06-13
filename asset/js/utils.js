// /asset/js/utils.js
import { peer, copyPeerIdBtn } from "./globals.js";

export function showToast(message) {
  const toast = document.createElement("div");
  toast.innerHTML = message;
  toast.className =
    "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

copyPeerIdBtn.addEventListener("click", () => {
  const peerId = peer.id;
  navigator.clipboard
    .writeText(peerId)
    .then(() => {
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-5 right-5 bg-green-500 text-white p-2 rounded";
      notification.textContent = "Peer ID copied!";
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    })
    .catch((err) => console.error("Failed to copy: ", err));
});

document.getElementById("copy-invite-btn").onclick = () => {
  const id = peer.id;
  if (id) {
    const url = `${window.location.origin}?id=${id}`;
    navigator.clipboard.writeText(url);
    showToast("Invite link copied <i class='fas fa-link text-blue-400 ml-1'></i>");
  }
};
