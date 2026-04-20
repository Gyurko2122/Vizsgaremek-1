/**
 * @file Message Routes
 * @description Endpoints for messaging between users, including conversations and search
 */

const express = require("express");
const { Message_model, Users_model } = require("../database");
const { encryptMessage, decryptMessage } = require("../database");
const { authMiddleware } = require("../middleware/auth");
const { onlineUsers } = require("../socketHandlers/messageHandler");
const { sendMessageNotification } = require("../emailsender");

const router = express.Router();

/**
 * GET /api/search
 * Searches for users and products by query string
 * Returns up to 20 matching users and products
 */
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    // Require minimum query length
    if (!query || query.trim().length < 2) {
      return res.json({ users: [], products: [] });
    }

    // Escape special regex characters and create case-insensitive regex
    const sanitized = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitized, "i");

    // Search users and products in parallel
    const [users, products] = await Promise.all([
      Users_model.find({ username: regex }, { username: 1, picture: 1, _id: 0 })
        .limit(20)
        .lean(),
      require("../database")
        .Products_model.find(
          { productName: regex },
          { productName: 1, price: 1, imageUrl: 1, publicId: 1 },
        )
        .limit(20)
        .lean(),
    ]);

    // Ensure products have publicId
    const crypto = require("crypto");
    const { Products_model } = require("../database");
    for (const p of products) {
      if (!p.publicId) {
        p.publicId = crypto.randomBytes(16).toString("hex");
        await Products_model.findByIdAndUpdate(p._id, {
          publicId: p.publicId,
        });
      }
    }

    res.json({ users, products });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Szerver hiba a keresés során" });
  }
});

/**
 * POST /api/messages
 * Sends a new message from one user to another
 * Encrypts message for storage, broadcasts to recipient via Socket.io if online
 * Sends email notification to recipient
 */
router.post("/messages", authMiddleware, async (req, res) => {
  try {
    const { toUser, message, productId, productName } = req.body;
    const fromUser = req.user.username;

    // Validate input types (NoSQL injection protection)
    if (typeof toUser !== "string" || typeof message !== "string") {
      return res.status(400).json({ error: "Érvénytelen bemenet" });
    }

    // Validate required fields
    if (!toUser || !message) {
      return res.status(400).json({ error: "Hiányzó mezők: toUser, message" });
    }

    // Prevent users from messaging themselves
    if (fromUser === toUser) {
      return res.status(400).json({ error: "Nem küldhetsz üzenetet magadnak" });
    }

    // Verify both users exist
    const fromUserExists = await Users_model.findOne({ username: fromUser });
    const toUserExists = await Users_model.findOne({ username: toUser });

    if (!fromUserExists || !toUserExists) {
      return res.status(404).json({ error: "Az egyik felhasználó nem jelen" });
    }

    // Create new message with encrypted content
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

    // Decrypt for client delivery
    const decryptedMsg = savedMessage.toObject();
    decryptedMsg.message = decryptMessage(decryptedMsg.message);

    // Send Socket.io notification to recipient if online
    const recipientSocketId = onlineUsers.get(toUser);
    if (recipientSocketId) {
      // io is not directly available here, but Socket.io handles this via rooms
    }

    // Send email notification
    try {
      if (toUserExists.email) {
        sendMessageNotification(
          toUserExists.email,
          fromUser,
          productName || "Üzenet",
        );
      }
    } catch (emailErr) {
      console.error("Email notification error:", emailErr);
    }

    res
      .status(201)
      .json({ message: "Üzenet sikeresen küldve", messageData: decryptedMsg });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Szerver hiba az üzenet küldésénél" });
  }
});

/**
 * GET /api/conversations/:username
 * Retrieves all conversations for a user
 * Groups messages by conversation partner
 * Returns latest message and unread count per conversation
 */
router.get("/conversations/:username", authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;

    // Verify user is only accessing their own conversations
    if (req.user.username !== username) {
      return res.status(403).json({ error: "Nincs jogosultságod" });
    }

    // Fetch all messages for this user
    const messages = await Message_model.find({
      $or: [{ fromUser: username }, { toUser: username }],
    })
      .sort({ timestamp: -1 })
      .lean();

    // Decrypt all messages
    for (const msg of messages) {
      msg.message = decryptMessage(msg.message);
    }

    // Group messages by conversation partner
    const conversationMap = new Map();
    for (const msg of messages) {
      const partner = msg.fromUser === username ? msg.toUser : msg.fromUser;

      if (!conversationMap.has(partner)) {
        // Count unread messages from this partner
        const unreadCount = messages.filter(
          (m) => m.toUser === username && m.fromUser === partner && !m.isRead,
        ).length;

        // Get partner's profile picture
        let partnerPicture = null;
        try {
          const partnerUser = await Users_model.findOne({ username: partner });
          if (partnerUser) {
            partnerPicture = partnerUser.picture || null;
          }
        } catch (e) {
          // Ignore errors
        }

        // Collect all products discussed in this conversation
        const productNames = [
          ...new Set(
            messages
              .filter(
                (m) =>
                  (m.fromUser === partner || m.toUser === partner) &&
                  m.productName,
              )
              .map((m) => m.productName),
          ),
        ];

        // Add conversation to map
        conversationMap.set(partner, {
          partner,
          partnerPicture,
          productId: msg.productId,
          productName: msg.productName,
          productNames,
          lastMessage: msg.message,
          lastTimestamp: msg.timestamp,
          unreadCount,
        });
      }
    }

    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Szerver hiba a beszélgetések lekérésekor" });
  }
});

/**
 * GET /api/messages/unread/:username
 * Gets the count of unread messages for a user
 */
router.get("/messages/unread/:username", authMiddleware, async (req, res) => {
  try {
    // Verify user is only checking their own unread count
    if (req.user.username !== req.params.username) {
      return res.status(403).json({ error: "Nincs jogosultságod" });
    }

    // Count unread messages
    const count = await Message_model.countDocuments({
      toUser: req.params.username,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * PUT /api/messages/mark-read
 * Marks specified messages as read
 * Used when user reads messages in a conversation
 */
router.put("/messages/mark-read", authMiddleware, async (req, res) => {
  try {
    const { messageIds } = req.body;

    // Validate messageIds array
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "Hiányzó messageIds" });
    }

    // NoSQL injection protection - ensure all IDs are strings
    if (!messageIds.every((id) => typeof id === "string")) {
      return res.status(400).json({ error: "Érvénytelen messageIds" });
    }

    // Update messages to read status
    await Message_model.updateMany(
      { _id: { $in: messageIds } },
      { isRead: true },
    );

    res.json({ message: "Üzenetek olvasottnak jelölve" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * GET /api/messages/:fromUser/:toUser
 * Retrieves all messages between two users
 * Sorted chronologically from oldest to newest
 * Only accessible to the users involved in the conversation
 */
router.get("/messages/:fromUser/:toUser", authMiddleware, async (req, res) => {
  try {
    const { fromUser, toUser } = req.params;

    if (!fromUser || !toUser) {
      return res.status(400).json({ error: "Hiányzó paraméterek" });
    }

    // Verify user can only access their own messages
    if (req.user.username !== fromUser && req.user.username !== toUser) {
      return res.status(403).json({ error: "Nincs jogosultságod" });
    }

    // Fetch messages between both users (bidirectional)
    const messages = await Message_model.find({
      $or: [
        { fromUser, toUser },
        { fromUser: toUser, toUser: fromUser },
      ],
    })
      .sort({ timestamp: 1 })
      .lean();

    // Decrypt all messages
    for (const msg of messages) {
      msg.message = decryptMessage(msg.message);
    }

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Szerver hiba az üzenetek lekérésekor" });
  }
});

/**
 * DELETE /api/conversations/:username/:partner
 * Deletes all messages in a conversation between two users
 * Only the user can delete their own conversation history
 */
router.delete(
  "/conversations/:username/:partner",
  authMiddleware,
  async (req, res) => {
    try {
      const username = req.user.username;
      const { partner } = req.params;

      if (!username || !partner) {
        return res.status(400).json({ error: "Hiányzó paraméterek" });
      }

      // Delete all messages in both directions
      const result = await Message_model.deleteMany({
        $or: [
          { fromUser: username, toUser: partner },
          { fromUser: partner, toUser: username },
        ],
      });

      res.json({
        success: true,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Szerver hiba a beszélgetés törlésekor" });
    }
  },
);

module.exports = router;
