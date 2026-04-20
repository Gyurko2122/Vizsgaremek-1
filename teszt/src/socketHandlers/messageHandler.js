/**
 * @file Socket.io Message Handlers
 * @description Real-time messaging functionality using WebSockets
 */

const {
  Message_model,
  Users_model,
  encryptMessage,
  decryptMessage,
} = require("../database");
const { sendMessageNotification } = require("../emailsender");

// Map to track online users: username -> socket.id
const onlineUsers = new Map();

/**
 * Initializes Socket.io event handlers
 * Sets up real-time messaging between users
 * @param {Server} io - Socket.io server instance
 */
function initializeSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /**
     * Register event handler
     * Called when user connects and identifies themselves
     */
    socket.on("register", (username) => {
      if (username) {
        onlineUsers.set(username, socket.id);
        console.log(`User registered: ${username} -> ${socket.id}`);
      }
    });

    /**
     * Send message event handler
     * Handles incoming messages and broadcasts them to recipient
     * Encrypts message for storage, sends decrypted version to clients
     */
    socket.on("sendMessage", async (data) => {
      try {
        const { fromUser, toUser, message, productId, productName } = data;

        // Validate required fields
        if (!fromUser || !toUser || !message) return;

        // NoSQL injection protection - ensure proper data types
        if (
          typeof fromUser !== "string" ||
          typeof toUser !== "string" ||
          typeof message !== "string"
        )
          return;

        // Create new message document with encrypted message
        const newMessage = new Message_model({
          fromUser: fromUser.trim(),
          toUser: toUser.trim(),
          message: encryptMessage(message.trim()),
          productId: productId || null,
          productName: productName || null,
          timestamp: Date.now(),
          isRead: false,
        });

        // Save to database
        const savedMessage = await newMessage.save();

        // Decrypt message for client delivery
        const decryptedMsg = savedMessage.toObject();
        decryptedMsg.message = decryptMessage(decryptedMsg.message);

        // Send to recipient if online
        const recipientSocketId = onlineUsers.get(toUser);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("newMessage", decryptedMsg);
        }

        // Send confirmation back to sender
        socket.emit("messageSent", decryptedMsg);

        // Send email notification to recipient
        try {
          const toUserData = await Users_model.findOne({ username: toUser });
          if (toUserData && toUserData.email) {
            sendMessageNotification(
              toUserData.email,
              fromUser,
              productName || "Üzenet",
            );
          }
        } catch (emailErr) {
          console.error("Email notification error:", emailErr);
        }
      } catch (err) {
        console.error("Socket sendMessage error:", err);
        socket.emit("messageError", { error: "Hiba az üzenet küldésénél" });
      }
    });

    /**
     * Mark messages as read event handler
     * Updates message read status in database
     */
    socket.on("markAsRead", async (data) => {
      try {
        const { messageIds } = data;

        // Validate messageIds array
        if (
          messageIds &&
          Array.isArray(messageIds) &&
          messageIds.every((id) => typeof id === "string") &&
          messageIds.length > 0
        ) {
          // Update all messages to read=true
          await Message_model.updateMany(
            { _id: { $in: messageIds } },
            { isRead: true },
          );
        }
      } catch (err) {
        console.error("Mark as read error:", err);
      }
    });

    /**
     * Disconnect event handler
     * Removes user from online users map when disconnecting
     */
    socket.on("disconnect", () => {
      // Find and remove the user from online users
      for (const [username, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(username);
          console.log(`User disconnected: ${username}`);
          break;
        }
      }
    });
  });
}

module.exports = {
  initializeSocketHandlers,
  onlineUsers,
};
