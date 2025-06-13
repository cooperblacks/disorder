// /asset/js/uiUpdates.js
import {
  chatBox,
  peerList,
  peerCount,
  replyPreview,
  peerDetails,
  localUsername,
  messageInput,
  setReplyingTo,
} from "./globals.js";

export function displayMessage(
  sender,
  message = "",
  avatar = "",
  fileType = "",
  fileData = "",
  fileName = "",
  peerId = null,
  replyTo = null
) {
  const container = document.createElement("div");
  container.className = "message-container flex gap-3 relative group mb-2";
  container.dataset.peerId = peerId || peer.id;

  const img = document.createElement("img");
  img.src = avatar || "https://via.placeholder.com/40";
  img.className = "w-10 h-10 rounded-full avatar";
  img.dataset.peerId = peerId || peer.id;

  const content = document.createElement("div");
  content.className = "flex-1";

  if (replyTo) {
    const reply = document.createElement("div");
    reply.className = "text-xs text-gray-400 bg-[#2b2d31] p-1 rounded mb-1";
    reply.textContent = `Replying to ${replyTo.sender}: ${replyTo.message.slice(
      0,
      20
    )}${replyTo.message.length > 20 ? "..." : ""}`;
    reply.addEventListener("click", () => {
      setReplyingTo(replyTo);
      messageInput.focus();
      updateReplyPreview();
    });
    content.appendChild(reply);
  }

  const messageWrapper = document.createElement("div");
  messageWrapper.className = "flex flex-col";

  const header = document.createElement("div");
  header.className = "flex items-center";
  header.innerHTML = `<span class="font-bold text-blue-400">${sender}</span> <span class="text-xs text-gray-400 ml-2">${new Date().toLocaleTimeString()}</span>`;

  const body = document.createElement("div");
  body.className = "text-white";

  const mentionRegex = new RegExp(`@${localUsername}\\b`, "gi");
  const isMentioned = message.match(mentionRegex);
  if (isMentioned) {
    container.classList.add("mentioned");
  }

  if (message) {
    body.innerHTML = message.replace(
      mentionRegex,
      `<span class="bg-blue-600 text-white px-1 rounded">@${localUsername}</span>`
    );
  } else if (fileType && fileData) {
    let el;
    if (fileType.startsWith("image/")) {
      el = document.createElement("img");
      el.src = fileData;
      el.className = "w-64 rounded mt-2";
    } else if (fileType.startsWith("video/")) {
      el = document.createElement("video");
      el.src = fileData;
      el.controls = true;
      el.className = "w-64 mt-2";
    } else if (fileType.startsWith("audio/")) {
      el = document.createElement("audio");
      el.src = fileData;
      el.controls = true;
      el.className = "mt-2";
    } else {
      const byteString = atob(fileData.split(",")[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ia], { type: fileType });
      const blobUrl = URL.createObjectURL(blob);
      const fileSizeKB = Math.round(blob.size / 1024);

      const embed = document.createElement("div");
      embed.className =
        "bg-[#2b2d31] text-white p-3 rounded mt-2 max-w-xs border border-gray-600";

      const fileTitle = document.createElement("div");
      fileTitle.className = "font-semibold text-blue-400 break-all";
      fileTitle.textContent = fileName;

      const fileMeta = document.createElement("div");
      fileMeta.className = "text-xs text-gray-400 mt-1";
      fileMeta.textContent = `${fileType} • ${fileSizeKB} KB`;

      const actionLink = document.createElement("a");
      actionLink.href = blobUrl;
      actionLink.className = "text-yellow-300 underline text-sm mt-2 inline-block";
      const previewTypes = [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (previewTypes.includes(fileType)) {
        actionLink.textContent = "Open in new tab";
        actionLink.target = "_blank";
      } else {
        actionLink.textContent = "Download";
        actionLink.download = fileName;
      }

      embed.appendChild(fileTitle);
      embed.appendChild(fileMeta);
      embed.appendChild(actionLink);
      el = embed;
    }
    body.appendChild(el);
  }

  messageWrapper.appendChild(header);
  messageWrapper.appendChild(body);
  content.appendChild(messageWrapper);

  const hover = document.createElement("div");
  hover.className = "message-hover";
  hover.innerHTML =
    '<i class="fas fa-reply text-blue-400 mr-2 cursor-pointer"></i><span class="text-white">Reply</span>';
  hover.addEventListener("click", () => {
    const messageData = {
      sender,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setReplyingTo(messageData);
    messageInput.focus();
    updateReplyPreview();
  });

  content.appendChild(hover);
  container.appendChild(img);
  container.appendChild(content);
  chatBox.appendChild(container);
  chatBox.scrollTop = chatBox.scrollHeight;
}

export function appendSystemMessage(msg) {
  const div = document.createElement("div");
  div.className = "text-center text-gray-400 text-sm";
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

export function updatePeerSidebar() {
  peerList.innerHTML = "";
  const activePeers = Object.values(peerDetails).filter((p) => p.active).length;
  peerCount.textContent = `Online - ${activePeers}`;
  Object.keys(peerDetails).forEach((peerId) => {
    const peer = document.createElement("div");
    peer.className =
      "flex items-center gap-2 p-1 hover:bg-[#3c3f45] rounded cursor-pointer";
    peer.dataset.peerId = peerId;
    peer.innerHTML = `
      <img src="${
        peerDetails[peerId].avatar || "https://via.placeholder.com/20"
      }" class="w-5 h-5 rounded-full" />
      <span class="text-white-500 ml-auto">${
        peerDetails[peerId].username || peerId
      }</span>
      <span class="text-xs text-gray-400 ml-auto">${
        peerDetails[peerId].active ? "Online" : "Offline"
      }</span>
    `;
    peerList.appendChild(peer);
  });
}

export function updateReplyPreview() {
  if (replyingTo) {
    replyPreview.textContent = `Replying to ${replyingTo.sender}: ${replyingTo.message.slice(
      0,
      30
    )}${replyingTo.message.length > 30 ? "..." : ""}`;
    replyPreview.classList.remove("hidden");
  } else {
    replyPreview.classList.add("hidden");
  }
}

document.addEventListener("click", (e) => {
  document.querySelectorAll(".user-profile-card").forEach((el) => el.remove());

  let avatar = e.target.closest(".avatar");
  if (!avatar) avatar = e.target.closest("[data-peer-id]");
  if (avatar) {
    const peerId = avatar.dataset.peerId;
    if (peerDetails[peerId]) {
      const joined =
        Math.floor((new Date() - peerDetails[peerId].joined) / 1000 / 60) +
        "m ago";

      const profileCard = document.createElement("div");
      profileCard.className =
        "user-profile-card fixed bg-[#2b2d31] text-white rounded-lg shadow-lg p-4 w-64 z-50 border border-gray-600";

      const rect = avatar.getBoundingClientRect();
      profileCard.style.left = `${rect.right + 10}px`;
      profileCard.style.top = `${rect.top - 50}px`;

      const cardRect = profileCard.getBoundingClientRect();
      if (cardRect.right > window.innerWidth) {
        profileCard.style.left = `${rect.left - cardRect.width - 10}px`;
      }
      if (cardRect.top < 0) {
        profileCard.style.top = `${rect.top + 10}px`;
      }

      profileCard.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
          <img src="${
            peerDetails[peerId].avatar || "https://via.placeholder.com/40"
          }" class="w-12 h-12 rounded-full" />
          <div>
            <h3 class="text-lg font-bold">${
              peerDetails[peerId].username || peerId
            }</h3>
            <p class="text-xs text-gray-400">ID: ${peerId}</p>
          </div>
        </div>
        <hr class="border-gray-600 mb-3">
        <p class="text-sm text-gray-300">Messages: ${
          peerDetails[peerId].messages
        }</p>
        <p class="text-sm text-gray-300">Files: ${peerDetails[peerId].files}</p>
        <p class="text-sm text-gray-300">Joined: ${joined}</p>
        <p class="text-sm text-gray-300">Status: ${
          peerDetails[peerId].active ? "Connected" : "Disconnected"
        }</p>
        <button class="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-1 rounded text-sm">Mention @</button>
      `;

      document.body.appendChild(profileCard);

      profileCard.querySelector("button").addEventListener("click", () => {
        messageInput.value += `@${peerDetails[peerId].username} `;
        messageInput.focus();
        profileCard.remove();
      });

      const closeCard = (event) => {
        if (!profileCard.contains(event.target) && event.target !== avatar) {
          profileCard.remove();
          document.removeEventListener("click", closeCard);
        }
      };
      setTimeout(() => {
        document.addEventListener("click", closeCard);
      }, 0);
    }
  }
});
