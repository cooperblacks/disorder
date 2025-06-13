// /asset/js/emojiHandling.js
import { emojiBtn, emojiPicker, messageInput } from "./globals.js";

emojiBtn.addEventListener("click", () => {
  emojiPicker.style.display =
    emojiPicker.style.display === "block" ? "none" : "block";
  if (emojiPicker.style.display === "block") {
    emojiPicker.innerHTML = `
      <span class="cursor-pointer" onclick="addEmoji('😊')">😊</span>
      <span class="cursor-pointer" onclick="addEmoji('👍')">👍</span>
      <span class="cursor-pointer" onclick="addEmoji('❤️')">❤️</span>
      <span class="cursor-pointer" onclick="addEmoji('😂')">😂</span>
    `;
  }
});

window.addEmoji = function (emoji) {
  messageInput.value += emoji;
  emojiPicker.style.display = "none";
};

// Previous code had an 'emoji-click' event
