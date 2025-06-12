const peer = new Peer();
const connections = {}; // Track multiple connections
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const fileInput = document.getElementById("file-input");
const plusFileInput = document.getElementById("plus-file-input");
const sendBtn = document.getElementById("send-btn");
const peerList = document.getElementById("peer-list");
const peerCount = document.getElementById("peer-count");
const replyPreview = document.getElementById("reply-preview");
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");
const currentPeerId = document.getElementById("current-peer-id");
const copyPeerIdBtn = document.getElementById("copy-peer-id");

// Local user data
let localUsername = `Stranger #${Math.floor(1000 + Math.random() * 9000)}`;
let localAvatar = document.getElementById("avatar-preview").src;
let peerDetails = {}; // Track peer connection times and stats
let replyingTo = null;

// PeerJS Setup
peer.on("open", id => {
  alert(`All messages and content will be gone when all members disconnect. Your peer ID will change if you refresh or leave the chat.`);
  showToast("Connected <i class='fas fa-check text-green-400 ml-1'></i>");
  document.getElementById("peer-id-input").placeholder = "Enter a peer ID"; 
  currentPeerId.textContent = `ID: ${id}`;
  peerDetails[id] = {
    joined: new Date(),
    messages: 0,
    files: 0,
    active: true,
    username: localUsername,
    avatar: localAvatar
  };
  const urlParams = new URLSearchParams(window.location.search);
  const remoteId = urlParams.get('id');
  if (remoteId) {
    const conn = peer.connect(remoteId);
    setupConnection(conn);
  }
});

peer.on("connection", conn => {
  setupConnection(conn);
});

document.getElementById("connect-btn").onclick = () => {
  const id = document.getElementById("peer-id-input").value.trim();
  if (id && !connections[id]) {
    const conn = peer.connect(id);
    setupConnection(conn);
  }
};

function setupConnection(conn) {
  connections[conn.peer] = conn;
  peerDetails[conn.peer] = {
    joined: new Date(),
    messages: 0,
    files: 0,
    active: true,
    username: conn.peer,
    avatar: "https://via.placeholder.com/40"
  };
  updatePeerSidebar();
  conn.on("open", () => {
    appendSystemMessage(`Connected to ${conn.peer}`);
    conn.send({ type: 'profile', username: localUsername, avatar: localAvatar });
  });
  conn.on("data", data => {
    if (data.type === 'profile') {
      peerDetails[conn.peer].username = data.username;
      peerDetails[conn.peer].avatar = data.avatar;
      updatePeerSidebar();
    } else {
      displayMessage(data.username, data.message, data.avatar, data.fileType, data.fileData, data.fileName, conn.peer, data.replyTo);
      peerDetails[conn.peer].messages++;
      if (data.fileType) peerDetails[conn.peer].files++;
      Sidebar();
    }
  });
  conn.on("close", () => {
    appendSystemMessage(`Disconnected: ${conn.peer}`);
    peerDetails[conn.peer].active = false;
    updatePeerSidebar();
    delete connections[conn.peer];
  });
}

// Send message
function sendMessage() {
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

// File handlers
[fileInput, plusFileInput].forEach(input => {
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) return appendSystemMessage("❌ File exceeds 30MB limit.");
    const reader = new FileReader();
    reader.onload = () => {
      const payload = {
        type: 'file',
        fileType: file.type,
        fileName: file.name,
        fileData: reader.result,
        message: '',
        replyTo: replyingTo
      };
      broadcast(payload);
      displayMessage(localUsername, '', localAvatar, file.type, reader.result, file.name, peer.id, replyingTo);
      peerDetails[peer.id].files++;
      updatePeerSidebar();
    };
    reader.readAsDataURL(file);
  });
});

function broadcast(data) {
  Object.values(connections).forEach(conn => {
    if (conn.open) conn.send({ ...data, username: localUsername, avatar: localAvatar });
  });
}

function displayMessage(sender, message = '', avatar = '', fileType = '', fileData = '', fileName = '', peerId = null, replyTo = null) {
  const container = document.createElement("div");
  container.className = "message-container flex gap-3 relative group mb-2";
  container.dataset.peerId = peerId || peer.id;

  const img = document.createElement("img");
  img.src = avatar || "https://via.placeholder.com/40";
  img.className = "w-10 h-10 rounded-full avatar";
  img.dataset.peerId = peerId || peer.id;

  const content = document.createElement("div");
  content.className = "flex-1";

  // Reply section
  if (replyTo) {
    const reply = document.createElement("div");
    reply.className = "text-xs text-gray-400 bg-[#2b2d31] p-1 rounded mb-1";
    reply.textContent = `Replying to ${replyTo.sender}: ${replyTo.message.slice(0, 20)}${replyTo.message.length > 20 ? '...' : ''}`;
    reply.addEventListener("click", () => {
      replyingTo = replyTo;
      messageInput.focus();
      updateReplyPreview();
    });
    content.appendChild(reply);
  }

  // Message content wrapper
  const messageWrapper = document.createElement("div");
  messageWrapper.className = "flex flex-col";

  // Sender and timestamp
  const header = document.createElement("div");
  header.className = "flex items-center";
  header.innerHTML = `<span class="font-bold text-blue-400">${sender}</span> <span class="text-xs text-gray-400 ml-2">${new Date().toLocaleTimeString()}</span>`;

  // Message or file content
  const body = document.createElement("div");
  body.className = "text-white";
  if (message) {
    body.textContent = message;
  } else if (fileType && fileData) {
    let el;
    if (fileType.startsWith("image/")) {
      el = document.createElement("img"); el.src = fileData; el.className = "w-64 rounded mt-2";
    } else if (fileType.startsWith("video/")) {
      el = document.createElement("video"); el.src = fileData; el.controls = true; el.className = "w-64 mt-2";
    } else if (fileType.startsWith("audio/")) {
      el = document.createElement("audio"); el.src = fileData; el.controls = true; el.className = "mt-2";
    } else {
      el = document.createElement("a"); el.href = fileData; el.download = fileName; el.textContent = `Download ${fileName}`;
      el.className = "text-yellow-300 underline mt-2";
    }
    body.appendChild(el);
  }

  messageWrapper.appendChild(header);
  messageWrapper.appendChild(body);
  content.appendChild(messageWrapper);

  // Hover overlay
  const hover = document.createElement("div");
  hover.className = "message-hover";
  hover.innerHTML = '<i class="fas fa-reply text-blue-400 mr-2 cursor-pointer"></i><span class="text-white">Reply</span>';
  hover.addEventListener("click", () => {
    const messageData = { sender, message, timestamp: new Date().toLocaleTimeString() };
    replyingTo = messageData;
    messageInput.focus();
    updateReplyPreview();
  });

  content.appendChild(hover);
  container.appendChild(img);
  container.appendChild(content);
  chatBox.appendChild(container);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendSystemMessage(msg) {
  const div = document.createElement("div");
  div.className = "text-center text-gray-400 text-sm";
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Profile editor
function toggleProfilePanel() {
  const panel = document.getElementById("profile-panel");
  panel.classList.toggle("hidden");
  document.getElementById("nickname-input").value = localUsername;
}

function saveProfile() {
  const newName = document.getElementById("nickname-input").value.trim();
  if (newName) {
    localUsername = newName;
    document.getElementById("nickname-display").textContent = newName;
    broadcast({ type: 'profile', username: localUsername, avatar: localAvatar });
    peerDetails[peer.id].username = localUsername;
    updatePeerSidebar();
  }
  const file = document.getElementById("avatar-upload").files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      localAvatar = reader.result;
      document.getElementById("avatar-preview").src = localAvatar;
      broadcast({ type: 'profile', username: localUsername, avatar: localAvatar });
      peerDetails[peer.id].avatar = localAvatar;
      updatePeerSidebar();
    };
    reader.readAsDataURL(file);
  }
  document.getElementById("profile-panel").classList.add("hidden");
}

// Update peer sidebar
function updatePeerSidebar() {
  peerList.innerHTML = '';
  const activePeers = Object.values(peerDetails).filter(p => p.active).length;
  peerCount.textContent = `Online - ${activePeers}`;
  Object.keys(peerDetails).forEach(peerId => {
    const peer = document.createElement("div");
    peer.className = "flex items-center gap-2 p-1 hover:bg-[#3c3f45] rounded cursor-pointer";
    peer.dataset.peerId = peerId;
    peer.innerHTML = `
      <img src="${peerDetails[peerId].avatar || 'https://via.placeholder.com/20'}" class="w-5 h-5 rounded-full" />
      <span class="text-white-500 ml-auto">${peerDetails[peerId].username || peerId}</span>
      <span class="text-xs text-gray-400 ml-auto">${peerDetails[peerId].active ? 'Online' : 'Offline'}</span>
    `;
    peerList.appendChild(peer);
  });
}

// Avatar click for details
document.addEventListener("click", (e) => {
  let avatar = e.target.closest(".avatar");
  if (!avatar) avatar = e.target.closest("[data-peer-id]");
  if (avatar) {
    const peerId = avatar.dataset.peerId;
    if (peerDetails[peerId]) {
      const joined = Math.floor((new Date() - peerDetails[peerId].joined) / 1000 / 60) + 'm ago';
      const detailsDiv = document.createElement("div");
      detailsDiv.className = "user-details";
      detailsDiv.style.left = `${e.pageX + 10}px`;
      detailsDiv.style.top = `${e.pageY - 50}px`;
      detailsDiv.innerHTML = `
        <h3 class="text-sm font-bold">${peerDetails[peerId].username || peerId}</h3>
        <p class="text-xs text-gray-400">Messages: ${peerDetails[peerId].messages}</p>
        <p class="text-xs text-gray-400">Files: ${peerDetails[peerId].files}</p>
        <p class="text-xs text-gray-400">Joined: ${joined}</p>
        <p class="text-xs text-gray-400">Status: ${peerDetails[peerId].active ? 'Connected' : 'Disconnected'}</p>
      `;
      document.body.appendChild(detailsDiv);
      setTimeout(() => detailsDiv.remove(), 5000); // Auto-remove after 5 seconds
    }
  } else {
    document.querySelectorAll(".user-details").forEach(el => el.remove());
  }
});

// Update reply preview
function updateReplyPreview() {
  if (replyingTo) {
    replyPreview.textContent = `Replying to ${replyingTo.sender}: ${replyingTo.message.slice(0, 30)}${replyingTo.message.length > 30 ? '...' : ''}`;
    replyPreview.classList.remove("hidden");
  } else {
    replyPreview.classList.add("hidden");
  }
}

// Emoji picker functionality
emojiBtn.addEventListener("click", () => {
  emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
  if (emojiPicker.style.display === "block") {
    emojiPicker.innerHTML = `
      <span class="cursor-pointer" onclick="addEmoji('😊')">😊</span>
      <span class="cursor-pointer" onclick="addEmoji('👍')">👍</span>
      <span class="cursor-pointer" onclick="addEmoji('❤️')">❤️</span>
      <span class="cursor-pointer" onclick="addEmoji('😂')">😂</span>
    `;
  }
});

function addEmoji(emoji) {
  messageInput.value += emoji;
  emojiPicker.style.display = "none";
}

// Copy peer ID
copyPeerIdBtn.addEventListener("click", () => {
  const peerId = peer.id;
  navigator.clipboard.writeText(peerId).then(() => {
    const notification = document.createElement("div");
    notification.className = "fixed bottom-5 right-5 bg-green-500 text-white p-2 rounded";
    notification.textContent = "Peer ID copied!";
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }).catch(err => console.error("Failed to copy: ", err));
});

document.getElementById("copy-invite-btn").onclick = () => {
  const id = peer.id;
  if (id) {
    const url = `${window.location.origin}?id=${id}`;
    navigator.clipboard.writeText(url);
    showToast("Invite link copied <i class='fas fa-link text-blue-400 ml-1'></i>");
  }
};

function showToast(message) {
  const toast = document.createElement("div");
  toast.innerHTML = message;
  toast.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
