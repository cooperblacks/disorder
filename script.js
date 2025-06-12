const peer = new Peer();
const connections = {}; // Track multiple connections
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const fileInput = document.getElementById("file-input");
const plusFileInput = document.getElementById("plus-file-input");
const sendBtn = document.getElementById("send-btn");
const peerList = document.getElementById("peer-list");

// Local user data
let localUsername = `Stranger #${Math.floor(1000 + Math.random() * 9000)}`;
let localAvatar = document.getElementById("avatar-preview").src;
let peerDetails = {}; // Track peer connection times and stats
let replyingTo = null;

// PeerJS Setup
peer.on("open", id => {
  alert(`Your Peer ID: ${id}`);
  document.getElementById("peer-id-input").placeholder = `Your ID: ${id}`;
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
    active: true
  };
  updatePeerSidebar();
  conn.on("open", () => appendSystemMessage(`Connected to ${conn.peer}`));
  conn.on("data", data => {
    displayMessage(data.username, data.message, data.avatar, data.fileType, data.fileData, data.fileName, conn.peer, data.replyTo);
    peerDetails[conn.peer].messages++;
    if (data.fileType) peerDetails[conn.peer].files++;
    updatePeerSidebar();
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
    });
    content.appendChild(reply);
  }

  // Message content
  const messageDiv = document.createElement("div");
  messageDiv.innerHTML = `
    <div class="font-bold text-blue-400">${sender} <span class="text-xs text-gray-400 ml-2">${new Date().toLocaleTimeString()}</span></div>
    <div class="text-white">${message}</div>
  `;

  // File preview
  if (fileType && fileData) {
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
    content.appendChild(el);
  }

  // Hover overlay
  const hover = document.createElement("div");
  hover.className = "message-hover";
  hover.innerHTML = '<i class="fas fa-reply text-blue-400 mr-2 cursor-pointer" title="Reply"></i>Reply';
  hover.addEventListener("click", () => {
    const messageData = { sender, message, timestamp: new Date().toLocaleTimeString() };
    replyingTo = messageData;
    messageInput.focus();
  });

  content.appendChild(messageDiv);
  container.appendChild(img);
  container.appendChild(content);
  container.appendChild(hover);
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
  }
  const file = document.getElementById("avatar-upload").files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      localAvatar = reader.result;
      document.getElementById("avatar-preview").src = localAvatar;
    };
    reader.readAsDataURL(file);
  }
  document.getElementById("profile-panel").classList.add("hidden");
}

// Update peer sidebar
function updatePeerSidebar() {
  peerList.innerHTML = '';
  Object.keys(peerDetails).forEach(peerId => {
    const peer = document.createElement("div");
    peer.className = "flex items-center gap-2 p-1 hover:bg-[#3c3f45] rounded";
    peer.innerHTML = `
      <img src="https://via.placeholder.com/20" class="w-5 h-5 rounded-full" />
      <span>${peerId}</span>
      <span class="text-xs text-gray-400 ml-auto">${peerDetails[peerId].active ? 'Online' : 'Offline'}</span>
    `;
    peerList.appendChild(peer);
  });
}

// Avatar click for details
chatBox.addEventListener("click", (e) => {
  const avatar = e.target.closest(".avatar");
  if (avatar) {
    const peerId = avatar.dataset.peerId;
    if (peerDetails[peerId]) {
      const joined = Math.floor((new Date() - peerDetails[peerId].joined) / 1000 / 60) + 'm ago';
      const detailsDiv = document.createElement("div");
      detailsDiv.className = "user-details";
      detailsDiv.style.left = `${e.pageX + 10}px`;
      detailsDiv.style.top = `${e.pageY - 50}px`;
      detailsDiv.innerHTML = `
        <h3 class="text-sm font-bold">${peerId}</h3>
        <p class="text-xs text-gray-400">Messages: ${peerDetails[peerId].messages}</p>
        <p class="text-xs text-gray-400">Files: ${peerDetails[peerId].files}</p>
        <p class="text-xs text-gray-400">Joined: ${joined}</p>
        <p class="text-xs text-gray-400">Status: ${peerDetails[peerId].active ? 'Connected' : 'Disconnected'}</p>
      `;
      document.body.appendChild(detailsDiv);
      setTimeout(() => detailsDiv.remove(), 5000); // Auto-remove after 5 seconds
    }
  }
});
