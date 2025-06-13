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
  alert(`All messages and content will be gone when all members disconnect. Your peer ID will change if you refresh or leave the chat. EVERYTHING IS LOST WHEN YOU LEAVE.`);
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
    
    // Automatically send voice stream if already active
  if (localStream) {
    const call = peer.call(conn.peer, localStream);
    mediaConnections[conn.peer] = call;
    call.on('stream', remoteStream => {
      addUserToVoiceUI(conn.peer, peerDetails[conn.peer]?.username || "Unknown", peerDetails[conn.peer]?.avatar || "https://via.placeholder.com/20");
    });
    call.on('close', () => removeUserFromVoiceUI(conn.peer));
  }
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

  // Check for mentions
  const mentionRegex = new RegExp(`@${localUsername}\\b`, 'gi');
  const isMentioned = message.match(mentionRegex);
  if (isMentioned) {
    container.classList.add("mentioned"); // Add highlight class
  }

  if (message) {
    // Highlight mentions in the message text
    body.innerHTML = message.replace(mentionRegex, `<span class="bg-blue-600 text-white px-1 rounded">@${localUsername}</span>`);
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
      // Create Blob from data URL
      const byteString = atob(fileData.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ia], { type: fileType });
      const blobUrl = URL.createObjectURL(blob);
      const fileSizeKB = Math.round(blob.size / 1024);

      // Create Discord-style embed
      const embed = document.createElement("div");
      embed.className = "bg-[#2b2d31] text-white p-3 rounded mt-2 max-w-xs border border-gray-600";

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
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

// Avatar click for profile card
document.addEventListener("click", (e) => {
  // Remove any existing profile cards
  document.querySelectorAll(".user-profile-card").forEach(el => el.remove());

  let avatar = e.target.closest(".avatar");
  if (!avatar) avatar = e.target.closest("[data-peer-id]");
  if (avatar) {
    const peerId = avatar.dataset.peerId;
    if (peerDetails[peerId]) {
      const joined = Math.floor((new Date() - peerDetails[peerId].joined) / 1000 / 60) + 'm ago';
      
      // Create profile card
      const profileCard = document.createElement("div");
      profileCard.className = "user-profile-card fixed bg-[#2b2d31] text-white rounded-lg shadow-lg p-4 w-64 z-50 border border-gray-600";
      
      // Position the card near the click
      const rect = avatar.getBoundingClientRect();
      profileCard.style.left = `${rect.right + 10}px`;
      profileCard.style.top = `${rect.top - 50}px`;

      // Ensure the card stays within viewport bounds
      const cardRect = profileCard.getBoundingClientRect();
      if (cardRect.right > window.innerWidth) {
        profileCard.style.left = `${rect.left - cardRect.width - 10}px`;
      }
      if (cardRect.top < 0) {
        profileCard.style.top = `${rect.top + 10}px`;
      }

      // Profile card content
      profileCard.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
          <img src="${peerDetails[peerId].avatar || 'https://via.placeholder.com/40'}" class="w-12 h-12 rounded-full" />
          <div>
            <h3 class="text-lg font-bold">${peerDetails[peerId].username || peerId}</h3>
            <p class="text-xs text-gray-400">ID: ${peerId}</p>
          </div>
        </div>
        <hr class="border-gray-600 mb-3">
        <p class="text-sm text-gray-300">Messages: ${peerDetails[peerId].messages}</p>
        <p class="text-sm text-gray-300">Files: ${peerDetails[peerId].files}</p>
        <p class="text-sm text-gray-300">Joined: ${joined}</p>
        <p class="text-sm text-gray-300">Status: ${peerDetails[peerId].active ? 'Connected' : 'Disconnected'}</p>
        <button class="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-1 rounded text-sm">Mention @</button>
      `;

      // Append to body
      document.body.appendChild(profileCard);

      // Handle "Mention @" button click
      profileCard.querySelector("button").addEventListener("click", () => {
        messageInput.value += `@${peerDetails[peerId].username} `;
        messageInput.focus();
        profileCard.remove();
      });

      // Close card when clicking outside
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

// Toggle emoji picker
emojiBtn.addEventListener("click", () => {
  emojiPicker.classList.toggle("hidden");
});

// Insert emoji into input
emojiPicker.addEventListener("emoji-click", event => {
  const emoji = event.detail.unicode;
  messageInput.value += emoji;
  messageInput.focus();
});

// Voice Chat
let localStream;
let mediaConnections = {};

function joinVoiceChannel() {
  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
    localStream = stream;
    addUserToVoiceUI(peer.id, localUsername, localAvatar);

    // Call everyone you're connected to
    for (const id in connections) {
      if (!mediaConnections[id]) {
        const call = peer.call(id, stream);
        mediaConnections[id] = call;
        call.on('stream', remoteStream => {
          addUserToVoiceUI(call.peer, peerDetails[call.peer]?.username || "Unknown", peerDetails[call.peer]?.avatar || "https://via.placeholder.com/20");
        });
        call.on('close', () => removeUserFromVoiceUI(call.peer));
      }
    }
  }).catch(err => {
    console.error('Failed to access microphone', err);
  });
}

peer.on('call', call => {
  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
    localStream = stream;
    call.answer(stream);
    mediaConnections[call.peer] = call;
    call.on('stream', remoteStream => {
      addUserToVoiceUI(call.peer, peerDetails[call.peer]?.username || "Unknown", peerDetails[call.peer]?.avatar || "https://via.placeholder.com/20");
    });
    call.on('close', () => removeUserFromVoiceUI(call.peer));
  });
});

function addUserToVoiceUI(id, username, avatar) {
  if (document.getElementById(`voice-user-${id}`)) return;
  const voiceUsers = document.getElementById("voice-users");
  const div = document.createElement("div");
  div.id = `voice-user-${id}`;
  div.className = "voice-user";
  div.innerHTML = `<img src="${avatar}" alt="${username}"><span>${username}</span>`;
  voiceUsers.appendChild(div);
}

function removeUserFromVoiceUI(id) {
  const el = document.getElementById(`voice-user-${id}`);
  if (el) el.remove();
}

let localVideoStream;
let localScreenStream;
let videoEnabled = false;
let micEnabled = true;

document.getElementById('toggle-mic').onclick = () => {
  micEnabled = !micEnabled;
  if (localStream) {
    localStream.getAudioTracks().forEach(track => track.enabled = micEnabled);
  }
  document.getElementById('toggle-mic').innerHTML = micEnabled
    ? '<i class="fas fa-microphone"></i>'
    : '<i class="fas fa-microphone-slash text-red-400"></i>';
};

document.getElementById('toggle-cam').onclick = async () => {
  if (!videoEnabled) {
    try {
      localVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      replaceTracks(localVideoStream.getVideoTracks()[0]);
      videoEnabled = true;
      document.getElementById('toggle-cam').innerHTML = '<i class="fas fa-video"></i>';
    } catch (e) {
      console.error("Failed to access webcam:", e);
    }
  } else {
    if (localVideoStream) {
      localVideoStream.getTracks().forEach(t => t.stop());
    }
    replaceTracks(null); // stop sending video
    videoEnabled = false;
    document.getElementById('toggle-cam').innerHTML = '<i class="fas fa-video-slash text-red-400"></i>';
  }
};

document.getElementById('share-screen').onclick = async () => {
  try {
    localScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    replaceTracks(localScreenStream.getVideoTracks()[0]);
    localScreenStream.getVideoTracks()[0].onended = () => {
      // Automatically revert when screen share stops
      replaceTracks(null);
    };
  } catch (e) {
    console.error("Screen share cancelled or failed", e);
  }
};

document.getElementById('leave-voice').onclick = () => {
  if (localStream) localStream.getTracks().forEach(t => t.stop());
  if (localVideoStream) localVideoStream.getTracks().forEach(t => t.stop());
  if (localScreenStream) localScreenStream.getTracks().forEach(t => t.stop());

  Object.values(mediaConnections).forEach(call => call.close());
  mediaConnections = {};

  document.getElementById("voice-users").innerHTML = "";
};

function replaceTracks(newVideoTrack) {
  Object.values(mediaConnections).forEach(call => {
    const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === "video");
    if (sender) {
      if (newVideoTrack) sender.replaceTrack(newVideoTrack);
      else sender.replaceTrack(null); // stop video
    }
  });
}
