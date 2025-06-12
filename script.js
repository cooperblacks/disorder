const peer = new Peer();
let conn = null;

// Shows your Peer ID once ready
peer.on('open', id => {
  alert(`Your Peer ID: ${id}`);
  document.getElementById('peer-id-input').placeholder = `Your ID: ${id}`;
});

// Incoming connection
peer.on('connection', connection => {
  conn = connection;
  setupConnection(conn);
});

// Handle connect button
document.getElementById('connect-btn').onclick = () => {
  const targetId = document.getElementById('peer-id-input').value.trim();
  if (targetId) {
    conn = peer.connect(targetId);
    setupConnection(conn);
  }
};

// Send message or file
document.getElementById('send-btn').onclick = () => {
  const text = document.getElementById('message-input').value.trim();
  if (text && conn?.open) {
    conn.send({ type: 'text', content: text });
    appendMessage('You', text);
    document.getElementById('message-input').value = '';
  }
};

// Send file
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && conn?.open) {
    const reader = new FileReader();
    reader.onload = () => {
      conn.send({ type: 'file', filename: file.name, data: reader.result });
      appendFile('You', file.name, reader.result);
    };
    reader.readAsDataURL(file);
  }
});

// Set up a connection
function setupConnection(connection) {
  connection.on('open', () => {
    appendSystemMessage(`Connected to ${connection.peer}`);
  });

  connection.on('data', data => {
    if (data.type === 'text') {
      appendMessage('Stranger', data.content);
    } else if (data.type === 'file') {
      appendFile('Stranger', data.filename, data.data);
    }
  });

  connection.on('close', () => {
    appendSystemMessage('Connection closed.');
  });
}

// UI Helpers
function appendMessage(sender, text) {
  const box = document.getElementById('chat-box');
  const msg = document.createElement('div');
  msg.innerHTML = `<div><span class="font-bold text-blue-400">${sender}</span> <span class="text-gray-400 text-xs ml-2">${new Date().toLocaleTimeString()}</span></div>
  <div class="text-white">${text}</div>`;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

function appendFile(sender, name, dataURL) {
  const box = document.getElementById('chat-box');
  const fileDiv = document.createElement('div');
  fileDiv.className = `p-2 rounded-lg max-w-[70%] break-words ${sender === 'You' ? 'bg-blue-600 self-end ml-auto' : 'bg-gray-700'}`;
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = name;
  link.className = 'underline text-white';
  link.textContent = `${sender} sent: ${name}`;
  fileDiv.appendChild(link);
  box.appendChild(fileDiv);
  box.scrollTop = box.scrollHeight;
}

function appendSystemMessage(msg) {
  const box = document.getElementById('chat-box');
  const sys = document.createElement('div');
  sys.className = 'text-center text-gray-400 text-sm';
  sys.textContent = msg;
  box.appendChild(sys);
  box.scrollTop = box.scrollHeight;
}
