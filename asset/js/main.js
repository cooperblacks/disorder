// /asset/js/main.js
import "./peerConnection.js";
import "./messaging.js";
import "./fileHandling.js";
import "./uiUpdates.js";
import "./profileManagement.js";
import "./emojiHandling.js";
import "./voiceVideoChat.js";
import "./utils.js";

// Expose profile functions to global scope for HTML onclick handlers
window.toggleProfilePanel = () => {
  import("./profileManagement.js").then(({ toggleProfilePanel }) =>
    toggleProfilePanel()
  );
};

window.saveProfile = () => {
  import("./profileManagement.js").then(({ saveProfile }) => saveProfile());
};

window.joinVoiceChannel = () => {
  import("./voiceVideoChat.js").then(({ joinVoiceChannel }) =>
    joinVoiceChannel()
  );
};
