// /asset/js/emojiHandling.js
import { emojiBtn, emojiPicker, messageInput } from "./globals.js";

emojiBtn.addEventListener("click", () => {Add commentMore actions
  emojiPicker.style.display =
    emojiPicker.style.display === "block" ? "none" : "block";
});

window.addEmoji = function (emoji) {
  messageInput.value += emoji;
  emojiPicker.style.display = "none";
};
