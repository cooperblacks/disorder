const peer = new Peer();
const connections = {}; // Track multiple connections
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const fileInput = document.getElementById("file-input");
const plusFileInput = document.getElementById("plus-file-input");
const sendBtn = document.getElementById("send-btn");

// Local user data
let localUsername = `Stranger #${Math.floor(1000 + Math.random() * 9000)}`;
let localAvatar = document.getElementById("avatar-preview").src;

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
  conn.on("open", () => appendSystemMessage(`Connected to ${conn.peer}`));
  conn.on("data", data => {
    displayMessage(data.username, data.message, data.avatar, data.fileType, data.fileData, data.fileName);
  });
  conn.on("close", () => {
    appendSystemMessage(`Disconnected: ${conn.peer}`);
    delete connections[conn.peer];
  });
}

// Send message
function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;
  broadcast({ type: 'text', message: msg });
  displayMessage(localUsername, msg, localAvatar);
  messageInput.value = "";
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
      };
      broadcast(payload);
      displayMessage(localUsername, '', localAvatar, file.type, reader.result, file.name);
    };
    reader.readAsDataURL(file);
  });
});

function broadcast(data) {
  Object.values(connections).forEach(conn => {
    if (conn.open) conn.send({ ...data, username: localUsername, avatar: localAvatar });
  });
}

function displayMessage(sender, message = '', avatar = '', fileType = '', fileData = '', fileName = '') {
  const container = document.createElement("div");
  container.className = "flex gap-3";

  const img = document.createElement("img");
  img.src = avatar || "https://via.placeholder.com/40";
  img.className = "w-10 h-10 rounded-full";

  const content = document.createElement("div");
  content.innerHTML = `
    <div class="font-bold text-blue-400">${sender} <span class="text-xs text-gray-400 ml-2">${new Date().toLocaleTimeString()}</span></div>
    <div class="text-white">${message}</div>
  `;

  // File preview
  if (fileType && fileData) {
    let el;
    if (fileType.startsWith("image/")) {
      el = document.createElement("img"); el.src = fileData; el.className = "w-64 rounded";
    } else if (fileType.startsWith("video/")) {
      el = document.createElement("video"); el.src = fileData; el.controls = true; el.className = "w-64";
    } else if (fileType.startsWith("audio/")) {
      el = document.createElement("audio"); el.src = fileData; el.controls = true;
    } else {
      el = document.createElement("a"); el.href = fileData; el.download = fileName; el.textContent = `Download ${fileName}`;
      el.className = "text-yellow-300 underline";
    }
    content.appendChild(el);
  }

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
