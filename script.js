const peer = new Peer();
let conn = null;

const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const fileInput = document.getElementById("file-input");
const sendBtn = document.getElementById("send-btn");

// On Peer Open
peer.on("open", id => {
  alert(`Your Peer ID: ${id}`);
  document.getElementById("peer-id-input").placeholder = `Your ID: ${id}`;
});

// Incoming connection
peer.on("connection", connection => {
  conn = connection;
  setupConnection(conn);
});

// Connect manually
document.getElementById("connect-btn").onclick = () => {
  const targetId = document.getElementById("peer-id-input").value.trim();
  if (targetId) {
    conn = peer.connect(targetId);
    setupConnection(conn);
  }
};

// Set up DataChannel
function setupConnection(connection) {
  connection.on("open", () => {
    appendSystemMessage(`Connected to ${connection.peer}`);
  });

  connection.on("data", data => {
    if (data.type === "text") {
      displayMessage("Stranger", data.message);
    } else if (data.type === "file") {
      displayMessage("Stranger", data.message, data.fileType, data.fileData, data.fileName);
    }
  });

  connection.on("close", () => {
    appendSystemMessage("Connection closed.");
  });
}

// Handle message send
sendBtn.onclick = () => {
  const message = messageInput.value.trim();
  if (!message || !conn?.open) return;

  displayMessage("You", message);
  conn.send({
    type: "text",
    message: message
  });

  messageInput.value = "";
};

// Handle enter key
messageInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendBtn.click();
});

// Handle file upload
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file || !conn?.open) return;

  const maxSize = 30 * 1024 * 1024; // 30MB
  if (file.size > maxSize) {
    appendSystemMessage("❌ File exceeds 30MB limit.");
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    displayMessage("You", "", file.type, dataUrl, file.name);

    conn.send({
      type: "file",
      message: "",
      fileType: file.type,
      fileData: dataUrl,
      fileName: file.name
    });

    fileInput.value = "";
  };
  reader.readAsDataURL(file);
});

// Main display logic
function displayMessage(sender, message = "", fileType = "", fileData = "", fileName = "file") {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-1";

  // Header (username + time)
  const header = document.createElement("div");
  header.innerHTML = `<span class="font-bold text-blue-400">${sender}</span>
                      <span class="text-xs text-gray-400 ml-2">${new Date().toLocaleTimeString()}</span>`;
  wrapper.appendChild(header);

  // Text
  if (message) {
    const text = document.createElement("div");
    text.className = "text-white";
    text.textContent = message;
    wrapper.appendChild(text);
  }

  // File
  if (fileType && fileData) {
    if (fileType.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = fileData;
      img.className = "w-64 rounded border border-gray-700";
      wrapper.appendChild(img);
    } else if (fileType.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = fileData;
      video.controls = true;
      video.className = "w-64 rounded";
      wrapper.appendChild(video);
    } else if (fileType.startsWith("audio/")) {
      const audio = document.createElement("audio");
      audio.src = fileData;
      audio.controls = true;
      wrapper.appendChild(audio);
    } else if (fileType === "application/pdf") {
      const link = document.createElement("a");
      const blob = dataUrlToBlob(fileData);
      link.href = URL.createObjectURL(blob);
      link.target = "_blank";
      link.textContent = fileName;
      link.className = "text-green-400 underline";
      wrapper.appendChild(link);
    } else {
      const link = document.createElement("a");
      link.href = fileData;
      link.download = fileName;
      link.textContent = `Download: ${fileName}`;
      link.className = "text-yellow-300 underline";
      wrapper.appendChild(link);
    }
  }

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "text-center text-gray-400 text-sm";
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Utility to convert DataURL to Blob
function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}
