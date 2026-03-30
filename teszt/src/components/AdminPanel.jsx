import { useState, useEffect } from "react";

const fixImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) return url;
  return "/" + url;
};

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23475569'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23cbd5e1'%3E%3F%3C/text%3E%3C/svg%3E";

export default function AdminPanel({ username, onClose }) {
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const adminHeaders = {
    "Content-Type": "application/json",
    "x-admin-username": username,
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/admin/stats?username=${username}`, {
        headers: adminHeaders,
      });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?username=${username}`, {
        headers: adminHeaders,
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error("Users fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?username=${username}`, {
        headers: adminHeaders,
      });
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error("Products fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "products") fetchProducts();
  }, [activeTab]);

  const handleDeleteUser = async (userId, uname) => {
    if (
      !window.confirm(
        `Biztos törölni akarod "${uname}" felhasználót és minden adatát?`,
      )
    )
      return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Hiba történt");
      }
    } catch (e) {
      alert("Hiba a törlés során");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Biztos törölni akarod "${productName}" terméket?`))
      return;
    setActionLoading(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Hiba történt");
      }
    } catch (e) {
      alert("Hiba a törlés során");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onClose}>
            ← Vissza
          </button>
          <h1 style={styles.title}>⚙ Admin Panel</h1>
        </div>

        <div style={styles.tabs}>
          {[
            { key: "stats", label: "📊 Statisztikák" },
            { key: "users", label: "👥 Felhasználók" },
            { key: "products", label: "📦 Termékek" },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={styles.content}>
          {activeTab === "stats" && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{stats?.userCount ?? "..."}</div>
                <div style={styles.statLabel}>Felhasználók</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>
                  {stats?.productCount ?? "..."}
                </div>
                <div style={styles.statLabel}>Termékek</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>
                  {stats?.messageCount ?? "..."}
                </div>
                <div style={styles.statLabel}>Üzenetek</div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div style={styles.tableWrapper}>
              {loading ? (
                <p style={styles.loadingText}>Betöltés...</p>
              ) : users.length === 0 ? (
                <p style={styles.loadingText}>Nincsenek felhasználók</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Profilkép</th>
                      <th style={styles.th}>Felhasználónév</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Admin</th>
                      <th style={styles.th}>Művelet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} style={styles.tr}>
                        <td style={styles.td}>
                          <img
                            src={fixImageUrl(user.picture) || DEFAULT_AVATAR}
                            alt={user.username}
                            style={styles.avatar}
                            onError={(e) => {
                              e.target.src = DEFAULT_AVATAR;
                            }}
                          />
                        </td>
                        <td style={styles.td}>
                          <span style={styles.username}>{user.username}</span>
                        </td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>
                          {user.isAdmin ? (
                            <span style={styles.badgeAdmin}>Admin</span>
                          ) : (
                            <span style={styles.badgeUser}>User</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {user.username === username ? (
                            <span style={styles.youLabel}>Te</span>
                          ) : (
                            <button
                              style={styles.deleteBtn}
                              disabled={actionLoading === user._id}
                              onClick={() =>
                                handleDeleteUser(user._id, user.username)
                              }
                            >
                              {actionLoading === user._id ? "..." : "Törlés"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div style={styles.tableWrapper}>
              {loading ? (
                <p style={styles.loadingText}>Betöltés...</p>
              ) : products.length === 0 ? (
                <p style={styles.loadingText}>Nincsenek termékek</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Kép</th>
                      <th style={styles.th}>Terméknév</th>
                      <th style={styles.th}>Ár</th>
                      <th style={styles.th}>Eladó</th>
                      <th style={styles.th}>Dátum</th>
                      <th style={styles.th}>Művelet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} style={styles.tr}>
                        <td style={styles.td}>
                          <img
                            src={fixImageUrl(
                              product.imageUrl ||
                                (product.images && product.images[0]),
                            )}
                            alt={product.productName}
                            style={styles.productImg}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </td>
                        <td style={styles.td}>
                          <span style={styles.productName}>
                            {product.productName}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {product.price?.toLocaleString("hu-HU")} Ft
                        </td>
                        <td style={styles.td}>{product.createdBy}</td>
                        <td style={styles.td}>
                          {product.createdAt
                            ? new Date(product.createdAt).toLocaleDateString(
                                "hu-HU",
                              )
                            : "-"}
                        </td>
                        <td style={styles.td}>
                          <button
                            style={styles.deleteBtn}
                            disabled={actionLoading === product._id}
                            onClick={() =>
                              handleDeleteProduct(
                                product._id,
                                product.productName,
                              )
                            }
                          >
                            {actionLoading === product._id ? "..." : "Törlés"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "2rem",
    minHeight: "calc(100vh - 200px)",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  backBtn: {
    background: "none",
    border: "1px solid #475569",
    color: "#cbd5e1",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#f1f5f9",
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    borderBottom: "1px solid #334155",
    paddingBottom: "0.5rem",
  },
  tab: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    padding: "0.7rem 1.5rem",
    borderRadius: "6px 6px 0 0",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#1e293b",
    color: "#f1f5f9",
    borderBottom: "2px solid #3b82f6",
  },
  content: {
    background: "#1e293b",
    borderRadius: "10px",
    padding: "1.5rem",
    border: "1px solid #334155",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  statCard: {
    background: "#0f172a",
    borderRadius: "10px",
    padding: "2rem",
    textAlign: "center",
    border: "1px solid #334155",
  },
  statNumber: {
    fontSize: "2.5rem",
    fontWeight: "800",
    color: "#3b82f6",
    marginBottom: "0.5rem",
  },
  statLabel: {
    fontSize: "1rem",
    color: "#94a3b8",
    fontWeight: "500",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "0.8rem 1rem",
    borderBottom: "1px solid #334155",
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tr: {
    borderBottom: "1px solid #1e293b",
    transition: "background 0.15s",
  },
  td: {
    padding: "0.8rem 1rem",
    verticalAlign: "middle",
    borderBottom: "1px solid #283548",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  productImg: {
    width: "50px",
    height: "50px",
    borderRadius: "6px",
    objectFit: "cover",
  },
  username: {
    fontWeight: "600",
    color: "#e2e8f0",
  },
  productName: {
    fontWeight: "600",
    color: "#e2e8f0",
  },
  badgeAdmin: {
    background: "#1e3a5f",
    color: "#60a5fa",
    padding: "0.2rem 0.7rem",
    borderRadius: "9999px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  badgeUser: {
    background: "#1a2e1a",
    color: "#86efac",
    padding: "0.2rem 0.7rem",
    borderRadius: "9999px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  youLabel: {
    color: "#64748b",
    fontStyle: "italic",
    fontSize: "0.9rem",
  },
  deleteBtn: {
    background: "#7f1d1d",
    color: "#fca5a5",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    transition: "background 0.2s",
  },
  loadingText: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "2rem 0",
  },
};
