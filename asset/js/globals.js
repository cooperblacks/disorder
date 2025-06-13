// /asset/js/globals.js
export const peer = new Peer();
export const connections = {};
export const peerDetails = {};
export let localUsername = `Stranger #${Math.floor(1000 + Math.random() * 9000)}`;
export let localAvatar = document.getElementById("avatar-preview").src;
export let replyingTo = null;
export let localStream = null;
export let localVideoStream = null;
export let localScreenStream = null;
export let videoEnabled = false;
export let micEnabled = true;
export const mediaConnections = {};

// DOM elements
export const chatBox = document.getElementById("chat-box");
export const messageInput = document.getElementById("message-input");
export const fileInput = document.getElementById("file-input");
export const plusFileInput = document.getElementById("plus-file-input");
export const sendBtn = document.getElementById("send-btn");
export const peerList = document.getElementById("peer-list");
export const peerCount = document.getElementById("peer-count");
export const replyPreview = document.getElementById("reply-preview");
export const emojiBtn = document.getElementById("emoji-btn");
export const emojiPicker = document.getElementById("emoji-picker");
export const currentPeerId = document.getElementById("current-peer-id");
export const copyPeerIdBtn = document.getElementById("copy-peer-id");

// Update functions for shared variables
export function setLocalUsername(username) {
  localUsername = username;
}

export function setLocalAvatar(avatar) {
  localAvatar = avatar;
}

export function setReplyingTo(value) {
  replyingTo = value;
}

export function setLocalStream(stream) {
  localStream = stream;
}

export function setLocalVideoStream(stream) {
  localVideoStream = stream;
}

export function setLocalScreenStream(stream) {
  localScreenStream = stream;
}

export function setVideoEnabled(enabled) {
  videoEnabled = enabled;
}

export function setMicEnabled(enabled) {
  micEnabled = enabled;
}
