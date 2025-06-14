# disorder
Anonymous peer-to-peer chat and file sharing platform with **no** database, **no** persistent storage and **no** server. Everything can be hosted as a static site, yet work dynamically. So much privacy that even the developers have no control over the data or userbase.

Currently, the latest version looks like this:

![](/asset/img/screenshot_v0.2.png)

## Current Team
- [Abrar A.](#), core chatting functionality
- [Cooper B.](#), UI/UX designer and engineer
- [muxto](#), QA and marketing

Thanks to the following resources:
- [PeerJS](https://peerjs.com/), for the serverless P2P logic handling
- [TailwindCSS](https://tailwindcss.com/), for the preset UI components
- [FontAwesome](https://fontawesome.com/), for the vector icons

## Current Features

### 📡 Connectivity
- [x] Peer-to-peer connections via PeerJS
- [x] Support for multiple simultaneous peer connections
- [x] Auto-connect via URL parameter (?id=)
- [x] Manual peer ID input connection
- [x] Copy peer ID, invite link to clipboard

### 💬 Messaging
- [x] Text messaging with Enter-to-send shortcut
- [x] Message mentions with highlighting (@username)
- [x] Message replying
- [x] System messages (e.g., join/leave notices)
- [x] Sender name and timestamp display
- [x] Scroll-to-latest on new message
- [x] Emoji picker

### 📎 File Sharing
- [x] Upload and send files (images, videos, audio, docs, etc.)
- [x] File size limit (30MB)
- [x] Inline preview for supported types (images, videos, audio, PDFs and Word docs)
- [x] Download link for unsupported types

### 🙋 User Profiles
- [x] Display name and avatar customization (including animated GIFs)
- [x] Broadcasting updated profile to peers
- [x] Profile preview on avatar click (popup card)
- [x] Mentioning a user from their profile card

