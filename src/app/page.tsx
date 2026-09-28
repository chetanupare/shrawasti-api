"use client";

import React, { useState, useEffect } from "react";

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "providers" | "users" | "services" | "api">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [health, setHealth] = useState<any>(null);

  // Modal state for assigning provider
  const [assignModalBooking, setAssignModalBooking] = useState<any>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Health check
      fetch("/api/health").then(res => res.json()).then(data => setHealth(data)).catch(() => {});
      
      // Dashboard Stats
      fetch("/api/admin/dashboard/stats").then(res => res.json()).then(data => setStats(data.stats)).catch(() => {});
      
      // Bookings
      fetch("/api/admin/bookings?limit=10").then(res => res.json()).then(data => setBookings(data.bookings || [])).catch(() => {});
      
      // Providers
      fetch("/api/admin/providers").then(res => res.json()).then(data => setProviders(data.providers || [])).catch(() => {});

      // Users
      fetch("/api/admin/users?limit=10").then(res => res.json()).then(data => setUsers(data.users || [])).catch(() => {});

      // Services
      fetch("/api/services").then(res => res.json()).then(data => setServicesList(data.services || [])).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProvider = async () => {
    if (!assignModalBooking || !selectedProviderId) return;
    try {
      const res = await fetch("/api/admin/bookings/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: assignModalBooking.id, providerId: selectedProviderId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Serviceman assigned successfully!");
        setAssignModalBooking(null);
        fetchData();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const endpoints = [
    { method: "GET", path: "/api/health", desc: "Database health check & status" },
    { method: "GET", path: "/api/admin/dashboard/stats", desc: "Admin overview KPI analytics" },
    { method: "GET", path: "/api/admin/bookings", desc: "Paginated bookings list for admin" },
    { method: "POST", path: "/api/admin/bookings/assign", desc: "Assign serviceman to booking" },
    { method: "GET", path: "/api/admin/users", desc: "List registered users" },
    { method: "GET", path: "/api/admin/providers", desc: "List servicemen & partners" },
    { method: "GET", path: "/api/admin/reports/revenue", desc: "Financial revenue report" },
    { method: "GET", path: "/api/vehicles/catalog", desc: "Master vehicle brand/model catalog" },
    { method: "GET/POST", path: "/api/vehicles", desc: "User garage vehicle CRUD" },
    { method: "GET/POST", path: "/api/locations", desc: "User saved addresses CRUD" },
    { method: "GET", path: "/api/services", desc: "Service catalog & pricing" },
    { method: "GET/POST", path: "/api/bookings", desc: "Customer service bookings" },
    { method: "POST", path: "/api/provider/status", desc: "Serviceman availability toggle" },
    { method: "GET", path: "/api/provider/jobs/available", desc: "Unassigned pending jobs for servicemen" },
    { method: "POST", path: "/api/payments/create-order", desc: "Razorpay order creation" },
    { method: "POST", path: "/api/payments/verify", desc: "Razorpay payment verification" },
  ];

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <div style={styles.logoBadge}>✨</div>
          <div>
            <h1 style={styles.brandTitle}>SHRAWRASTI ADMIN PORTAL</h1>
            <p style={styles.brandSub}>Unified Operations Dashboard & REST API Engine</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.healthTag}>
            <span style={{ ...styles.dot, backgroundColor: health?.status === "healthy" ? "#22C55E" : "#EAB308" }} />
            API Status: {health?.status === "healthy" ? "Healthy (v1.0.0)" : "Connecting..."}
          </div>
          <button style={styles.refreshBtn} onClick={fetchData}>
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.navBar}>
        {[
          { id: "dashboard", label: "📊 Overview" },
          { id: "bookings", label: "🚗 Live Bookings" },
          { id: "providers", label: "👨‍🔧 Servicemen / Partners" },
          { id: "users", label: "👥 Registered Users" },
          { id: "services", label: "🧼 Service Catalog" },
          { id: "api", label: "⚡ API Reference (32 Endpoints)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              ...styles.navItem,
              ...(activeTab === tab.id ? styles.navItemActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main style={styles.main}>
        {activeTab === "dashboard" && (
          <div>
            {/* KPI Cards */}
            <div style={styles.statsGrid}>
              <div style={{ ...styles.card, borderLeft: "4px solid #3B82F6" }}>
                <span style={styles.cardIcon}>💰</span>
                <div>
                  <div style={styles.cardLabel}>Total Revenue</div>
                  <div style={styles.cardValue}>₹{stats?.totalRevenue ?? 0}</div>
                  <div style={styles.cardSub}>Today: ₹{stats?.todayRevenue ?? 0}</div>
                </div>
              </div>

              <div style={{ ...styles.card, borderLeft: "4px solid #10B981" }}>
                <span style={styles.cardIcon}>📦</span>
                <div>
                  <div style={styles.cardLabel}>Total Bookings</div>
                  <div style={styles.cardValue}>{stats?.totalBookings ?? 0}</div>
                  <div style={styles.cardSub}>Today: {stats?.todayBookingsCount ?? 0}</div>
                </div>
              </div>

              <div style={{ ...styles.card, borderLeft: "4px solid #F59E0B" }}>
                <span style={styles.cardIcon}>⌛</span>
                <div>
                  <div style={styles.cardLabel}>Pending Assignments</div>
                  <div style={styles.cardValue}>{stats?.pendingBookings ?? 0}</div>
                  <div style={styles.cardSub}>Awaiting serviceman</div>
                </div>
              </div>

              <div style={{ ...styles.card, borderLeft: "4px solid #8B5CF6" }}>
                <span style={styles.cardIcon}>👨‍🔧</span>
                <div>
                  <div style={styles.cardLabel}>Active Servicemen</div>
                  <div style={styles.cardValue}>{providers.filter(p => p.isOnline).length || stats?.activeProviders || 0}</div>
                  <div style={styles.cardSub}>Total Registered: {providers.length}</div>
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div style={styles.sectionHeader}>
              <h2>⚡ Recent Customer Orders</h2>
              <button style={styles.actionBtn} onClick={() => setActiveTab("bookings")}>
                View All Orders →
              </button>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Schedule</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Assigned Serviceman</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "#94A3B8" }}>
                        No orders recorded yet. Connect mobile app or test via API.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#93C5FD" }}>
                          {b.id.substring(0, 8)}...
                        </td>
                        <td>
                          <strong>{b.user?.name || "Customer"}</strong>
                          <div style={{ fontSize: "12px", color: "#94A3B8" }}>{b.user?.phone || b.userId.substring(0, 8)}</div>
                        </td>
                        <td>
                          {b.vehicleSnapshot?.make} {b.vehicleSnapshot?.model}
                          <div style={{ fontSize: "11px", color: "#64748B" }}>{b.vehicleSnapshot?.bodyType || "Car"}</div>
                        </td>
                        <td>
                          {b.scheduleDate}
                          <div style={{ fontSize: "11px", color: "#64748B" }}>{b.scheduleTime}</div>
                        </td>
                        <td style={{ fontWeight: "700", color: "#38BDF8" }}>₹{b.total}</td>
                        <td>
                          <span style={getStatusBadgeStyle(b.status)}>{b.status.toUpperCase()}</span>
                        </td>
                        <td>
                          {b.assignedProviderId ? (
                            <span style={{ color: "#34D399" }}>Assigned</span>
                          ) : (
                            <span style={{ color: "#FBBF24" }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <button
                            style={styles.assignBtn}
                            onClick={() => {
                              setAssignModalBooking(b);
                              setSelectedProviderId(providers[0]?.id || "");
                            }}
                          >
                            Assign Serviceman
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div>
            <h2>🚗 All Customer Bookings</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Services</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "monospace" }}>{b.id}</td>
                      <td>{b.user?.name || b.userId}</td>
                      <td>
                        {(b.services || []).map((s: any) => s.name || s.id).join(", ") || "Doorstep Wash"}
                      </td>
                      <td>
                        {b.paymentMethod} ({b.paymentStatus})
                      </td>
                      <td style={{ fontWeight: "bold" }}>₹{b.total}</td>
                      <td>
                        <span style={getStatusBadgeStyle(b.status)}>{b.status}</span>
                      </td>
                      <td>
                        <button style={styles.assignBtn} onClick={() => setAssignModalBooking(b)}>
                          Assign / Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "providers" && (
          <div>
            <h2>👨‍🔧 Servicemen & Partners Management</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Partner ID</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Rating</th>
                    <th>Completed Jobs</th>
                    <th>Online Status</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "monospace" }}>{p.id.substring(0, 8)}...</td>
                      <td style={{ fontWeight: "600" }}>{p.name}</td>
                      <td>{p.phone}</td>
                      <td>⭐ {p.rating || "5.0"}</td>
                      <td>{p.totalJobs || 0} Jobs</td>
                      <td>
                        <span style={{ color: p.isOnline ? "#22C55E" : "#EF4444", fontWeight: "600" }}>
                          ● {p.isOnline ? "ONLINE" : "OFFLINE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h2>👥 Registered Users ({users.length})</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: "monospace" }}>{u.id.substring(0, 8)}...</td>
                      <td>{u.name}</td>
                      <td>{u.email || "N/A"}</td>
                      <td>{u.phone || "N/A"}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div>
            <h2>🧼 Service Catalog & Pricing</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Base Price</th>
                    <th>Duration</th>
                    <th>Popular Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesList.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: "600" }}>{s.name}</td>
                      <td>{s.category}</td>
                      <td style={{ color: "#38BDF8", fontWeight: "bold" }}>₹{s.basePrice}</td>
                      <td>{s.durationMinutes || 45} mins</td>
                      <td>{s.popular ? "🔥 Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div>
            <h2>⚡ Production REST API Directory (`/api/...`)</h2>
            <p style={{ color: "#94A3B8" }}>
              All endpoints below run as high-performance Serverless functions on Vercel.
            </p>
            <div style={styles.apiGrid}>
              {endpoints.map((ep, idx) => (
                <div key={idx} style={styles.apiCard}>
                  <div style={styles.apiHeader}>
                    <span style={styles.methodTag}>{ep.method}</span>
                    <code style={styles.apiPath}>{ep.path}</code>
                  </div>
                  <p style={styles.apiDesc}>{ep.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Assign Provider Modal */}
      {assignModalBooking && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3>Assign Serviceman for Order #{assignModalBooking.id.substring(0, 8)}</h3>
            <p style={{ color: "#94A3B8", fontSize: "14px" }}>
              Schedule: {assignModalBooking.scheduleDate} @ {assignModalBooking.scheduleTime}
            </p>

            <label style={{ display: "block", marginTop: "16px", marginBottom: "8px", fontWeight: "600" }}>
              Select Available Serviceman:
            </label>
            <select
              style={styles.select}
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone}) - Rating: ⭐{p.rating || 5}
                </option>
              ))}
            </select>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setAssignModalBooking(null)}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleAssignProvider}>
                Assign Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadgeStyle(status: string) {
  const base: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-block",
  };
  switch (status) {
    case "completed":
      return { ...base, backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#4ADE80" };
    case "pending":
      return { ...base, backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#FBBF24" };
    case "in_progress":
    case "accepted":
      return { ...base, backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60A5FA" };
    case "cancelled":
      return { ...base, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#F87171" };
    default:
      return { ...base, backgroundColor: "#334155", color: "#94A3B8" };
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", backgroundColor: "#0F172A", color: "#F8FAFC" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 32px",
    backgroundColor: "#1E293B",
    borderBottom: "1px solid #334155",
  },
  brandGroup: { display: "flex", alignItems: "center", gap: "16px" },
  logoBadge: { fontSize: "28px", backgroundColor: "#3B82F6", borderRadius: "12px", padding: "6px 10px" },
  brandTitle: { margin: 0, fontSize: "20px", fontWeight: "800", letterSpacing: "0.5px", color: "#F8FAFC" },
  brandSub: { margin: 0, fontSize: "13px", color: "#94A3B8", marginTop: "2px" },
  headerRight: { display: "flex", alignItems: "center", gap: "16px" },
  healthTag: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#0F172A",
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
    border: "1px solid #334155",
  },
  dot: { width: "10px", height: "10px", borderRadius: "50%" },
  refreshBtn: {
    backgroundColor: "#334155",
    color: "#F8FAFC",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  navBar: {
    display: "flex",
    gap: "8px",
    padding: "12px 32px",
    backgroundColor: "#1E293B",
    borderBottom: "1px solid #334155",
    overflowX: "auto",
  },
  navItem: {
    backgroundColor: "transparent",
    color: "#94A3B8",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  navItemActive: { backgroundColor: "#3B82F6", color: "#FFFFFF" },
  main: { padding: "32px", maxWidth: "1400px", margin: "0 auto" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "32px" },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  cardIcon: { fontSize: "32px" },
  cardLabel: { fontSize: "13px", color: "#94A3B8", fontWeight: "600" },
  cardValue: { fontSize: "28px", fontWeight: "800", color: "#F8FAFC", margin: "4px 0" },
  cardSub: { fontSize: "12px", color: "#64748B" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  actionBtn: { backgroundColor: "transparent", color: "#38BDF8", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  tableContainer: { backgroundColor: "#1E293B", borderRadius: "14px", overflow: "hidden", border: "1px solid #334155" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  assignBtn: { backgroundColor: "#0EA5E9", color: "#FFF", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  apiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginTop: "20px" },
  apiCard: { backgroundColor: "#1E293B", borderRadius: "12px", padding: "16px", border: "1px solid #334155" },
  apiHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
  methodTag: { backgroundColor: "#3B82F6", color: "#FFF", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px" },
  apiPath: { color: "#38BDF8", fontSize: "13px", fontWeight: "600" },
  apiDesc: { color: "#94A3B8", fontSize: "13px", margin: 0 },
  modalBackdrop: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { backgroundColor: "#1E293B", padding: "28px", borderRadius: "16px", width: "90%", maxWidth: "480px", border: "1px solid #334155" },
  select: { width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", fontSize: "14px", marginTop: "8px" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { backgroundColor: "#334155", color: "#FFF", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  confirmBtn: { backgroundColor: "#10B981", color: "#FFF", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
};
