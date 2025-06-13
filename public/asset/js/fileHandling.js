// /asset/js/fileHandling.js
import {
  fileInput,
  plusFileInput,
  peerDetails,
  peer,
  localUsername,
  localAvatar,
  replyingTo,
} from "./globals.js";
import { broadcast  } from "./messaging.js";
import { appendSystemMessage, updatePeerSidebar, displayMessage } from "./uiUpdates.js";

[fileInput, plusFileInput].forEach((input) => {
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024)
      return appendSystemMessage("❌ File exceeds 30MB limit.");
    const reader = new FileReader();
    reader.onload = () => {
      const payload = {
        type: "file",
        fileType: file.type,
        fileName: file.name,
        fileData: reader.result,
        message: "",
        replyTo: replyingTo,
      };
      broadcast(payload);
      displayMessage(
        localUsername,
        "",
        localAvatar,
        file.type,
        reader.result,
        file.name,
        peer.id,
        replyingTo
      );
      peerDetails[peer.id].files++;
      updatePeerSidebar();
    };
    reader.readAsDataURL(file);
  });
});
