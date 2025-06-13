// /asset/js/emojiHandling.js
import { emojiBtn, emojiPicker, messageInput } from "./globals.js";

// Toggle emoji picker visibility
emojiBtn.addEventListener("click", () => {
  emojiPicker.classList.toggle("hidden");
});

// Handle emoji selection from the <emoji-picker> element
emojiPicker.addEventListener("emoji-click", (event) => {
  const emoji = event.detail.unicode;
  messageInput.value += emoji;
  messageInput.focus();
  emojiPicker.classList.add("hidden"); // Hide picker after selection
});
