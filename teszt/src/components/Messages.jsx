import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import "./Messages.css";

const fixImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) return url;
  return "/" + url;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString("hu-HU") +
    " " +
    date.toLocaleTimeString("hu-HU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Messages({
  username,
  onClose,
  onProfileClick,
  onProductClick,
  initialPartner,
  initialProductName,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [view, setView] = useState("inbox"); // "inbox" or "chat"
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const chatBodyRef = useRef(null);
  const selectedConvRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const searchBoxRef = useRef(null);
  const autoOpenedRef = useRef(false);

  // Auto-open conversation when navigated from ProductDetail message
  useEffect(() => {
    if (
      initialPartner &&
      !loading &&
      conversations.length > 0 &&
      !autoOpenedRef.current
    ) {
      const conv = conversations.find((c) => c.partner === initialPartner);
      if (conv) {
        openChat(conv);
        autoOpenedRef.current = true;
      }
    }
  }, [conversations, initialPartner, loading]);

  // Keep ref in sync with state
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  // Socket.io connection
  useEffect(() => {
    const socketUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : window.location.origin;

    socketRef.current = io(socketUrl);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("register", username);
    });

    socketRef.current.on("newMessage", (message) => {
      // Frissítjük a chat üzeneteket ha épp abban a beszélgetésben vagyunk
      if (
        selectedConvRef.current &&
        ((message.fromUser === selectedConvRef.current.partner &&
          message.toUser === username) ||
          (message.fromUser === username &&
            message.toUser === selectedConvRef.current.partner))
      ) {
        setChatMessages((prev) => [...prev, message]);
      }

      // Frissítjük a beszélgetések listáját
      fetchConversations();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [username]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/conversations/${username}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        const total = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadTotal(total);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [username]);

  // Fetch chat messages for selected conversation
  const openChat = async (conv) => {
    setSelectedConv(conv);
    setView("chat");

    try {
      const response = await fetch(`/api/messages/${username}/${conv.partner}`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);

        // Mark as read
        const unreadIds = data
          .filter((m) => m.toUser === username && !m.isRead)
          .map((m) => m._id);
        if (unreadIds.length > 0) {
          await fetch("/api/messages/mark-read", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds: unreadIds }),
          });
          if (socketRef.current) {
            socketRef.current.emit("markAsRead", { messageIds: unreadIds });
          }
          fetchConversations();
        }
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  };

  // Send message via socket
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const messageData = {
      fromUser: username,
      toUser: selectedConv.partner,
      message: newMessage.trim(),
      productId: selectedConv.productId || null,
      productName: selectedConv.productName || null,
    };

    if (socketRef.current) {
      socketRef.current.emit("sendMessage", messageData);
    }

    // Optimistic update
    setChatMessages((prev) => [
      ...prev,
      {
        ...messageData,
        timestamp: Date.now(),
        isRead: false,
        _id: "temp-" + Date.now(),
      },
    ]);
    setNewMessage("");
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Search API call with debounce
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, performSearch]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter conversations by search (local filter for conversation list)
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.partner.toLowerCase().includes(q) ||
      (conv.productName && conv.productName.toLowerCase().includes(q))
    );
  });

  // Get all received messages for inbox view
  const allReceivedMessages = conversations
    .map((conv) => ({
      ...conv,
      subject: conv.productName ? `Érdeklődés: ${conv.productName}` : "Üzenet",
    }))
    .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

  return (
    <div className="messages-page">
      <div className="messages-wrapper">
        <div className="messages-main">
          {/* Close button */}
          <button
            className="messages-page-close-btn"
            onClick={onClose}
            title="Bezárás"
          >
            ✕
          </button>
          {/* Left Panel - Conversations */}
          <div className="messages-left-panel">
            <div className="messages-search-box" ref={searchBoxRef}>
              <input
                type="text"
                className="messages-search-input"
                placeholder="Keresés felhasználóra vagy termékre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults && (
                <div className="messages-search-dropdown">
                  {searchLoading ? (
                    <div className="messages-search-dropdown-empty">
                      Keresés...
                    </div>
                  ) : (
                    <>
                      {searchResults.users &&
                        searchResults.users.length > 0 && (
                          <div className="messages-search-section">
                            <div className="messages-search-section-title">
                              Felhasználók
                            </div>
                            {searchResults.users.map((user) => (
                              <div
                                key={user.username}
                                className="messages-search-item"
                                onClick={() => {
                                  if (onProfileClick)
                                    onProfileClick(user.username);
                                  setSearchQuery("");
                                  setSearchResults(null);
                                }}
                              >
                                <img
                                  className="messages-search-item-avatar"
                                  src={
                                    fixImageUrl(user.picture) ||
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30'%3E%3Ccircle cx='15' cy='15' r='15' fill='%23475569'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%23cbd5e1'%3E%3F%3C/text%3E%3C/svg%3E"
                                  }
                                  alt={user.username}
                                />
                                <span>{user.username}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      {searchResults.products &&
                        searchResults.products.length > 0 && (
                          <div className="messages-search-section">
                            <div className="messages-search-section-title">
                              Termékek
                            </div>
                            {searchResults.products.map((product) => (
                              <div
                                key={product._id}
                                className="messages-search-item"
                                onClick={() => {
                                  if (onProductClick)
                                    onProductClick(product._id);
                                  setSearchQuery("");
                                  setSearchResults(null);
                                }}
                              >
                                {product.imageUrl && (
                                  <img
                                    className="messages-search-item-avatar"
                                    src={fixImageUrl(product.imageUrl)}
                                    alt={product.productName}
                                  />
                                )}
                                <div className="messages-search-item-info">
                                  <span>{product.productName}</span>
                                  <span className="messages-search-item-price">
                                    {product.price.toLocaleString("hu-HU")} Ft
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      {(!searchResults.users ||
                        searchResults.users.length === 0) &&
                        (!searchResults.products ||
                          searchResults.products.length === 0) && (
                          <div className="messages-search-dropdown-empty">
                            Nincs találat
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="messages-conversation-list">
              {loading ? (
                <p className="messages-no-conversations">Betöltés...</p>
              ) : filteredConversations.length === 0 ? (
                <p className="messages-no-conversations">
                  Nincsenek beszélgetések
                </p>
              ) : (
                filteredConversations.map((conv, idx) => (
                  <div
                    key={`${conv.partner}-${conv.productName || idx}`}
                    className={`messages-conv-item ${
                      selectedConv && selectedConv.partner === conv.partner
                        ? "active"
                        : ""
                    }`}
                    onClick={() => openChat(conv)}
                  >
                    <img
                      className="messages-conv-avatar"
                      src={
                        fixImageUrl(conv.partnerPicture) ||
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23475569'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23cbd5e1'%3E%3F%3C/text%3E%3C/svg%3E"
                      }
                      alt={conv.partner}
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23475569'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23cbd5e1'%3E%3F%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="messages-conv-info">
                      <div className="messages-conv-name">{conv.partner}</div>
                      <div className="messages-conv-product">
                        {conv.productNames && conv.productNames.length > 0
                          ? `Érdeklődés: ${conv.productNames.join(", ")}`
                          : "Üzenet"}
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="messages-conv-badge">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="messages-right-panel">
            {view === "inbox" ? (
              <>
                <div className="messages-inbox-header">
                  <h2>Beérkezett üzenetek</h2>
                  <p>
                    {unreadTotal === 0
                      ? "Nincs olvasatlan üzenet"
                      : `${unreadTotal} olvasatlan üzenet`}
                  </p>
                </div>
                <div className="messages-inbox-table-header">
                  <span>Téma</span>
                  <span>Feladó</span>
                  <span style={{ textAlign: "right" }}>Dátum</span>
                </div>
                <div className="messages-inbox-list">
                  {allReceivedMessages.length === 0 ? (
                    <div className="messages-empty-inbox">
                      Nincsenek üzenetek
                    </div>
                  ) : (
                    allReceivedMessages.map((msg, idx) => (
                      <div
                        key={`${msg.partner}-${msg.productName || idx}`}
                        className={`messages-inbox-row ${msg.unreadCount > 0 ? "unread" : ""}`}
                        onClick={() => openChat(msg)}
                      >
                        <div>
                          <div className="messages-inbox-subject">
                            {msg.subject}
                          </div>
                          {msg.lastMessage && (
                            <div className="messages-inbox-preview">
                              {msg.lastMessage}
                            </div>
                          )}
                        </div>
                        <div className="messages-inbox-sender">
                          {msg.partner}
                        </div>
                        <div className="messages-inbox-date">
                          {formatDate(msg.lastTimestamp)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="messages-chat-header">
                  <button
                    className="messages-chat-back-btn"
                    onClick={() => {
                      setView("inbox");
                      setSelectedConv(null);
                      fetchConversations();
                    }}
                  >
                    ←
                  </button>
                  <div className="messages-chat-partner-info">
                    <div
                      className="messages-chat-partner-name messages-chat-partner-name-clickable"
                      onClick={() => {
                        if (onProfileClick)
                          onProfileClick(selectedConv?.partner);
                      }}
                      title="Profil megtekintése"
                    >
                      {selectedConv?.partner}
                    </div>
                    {selectedConv?.productName && (
                      <div className="messages-chat-product-name">
                        Érdeklődés: {selectedConv.productName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="messages-chat-body" ref={chatBodyRef}>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className={`messages-chat-bubble ${
                        msg.fromUser === username ? "sent" : "received"
                      }`}
                    >
                      <div>{msg.message}</div>
                      <div className="messages-chat-time">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  className="messages-chat-input-area"
                  onSubmit={handleSendMessage}
                >
                  <textarea
                    className="messages-chat-input"
                    placeholder="Írj üzenetet..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows="1"
                  />
                  <button
                    type="submit"
                    className="messages-chat-send-btn"
                    disabled={!newMessage.trim()}
                  >
                    Küldés
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
