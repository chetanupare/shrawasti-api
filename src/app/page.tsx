"use client";

import React, { useState, useEffect } from "react";

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "bookings" | "providers" | "vehicles" | "slots" | "services" | "users" | "api"
  >("dashboard");

  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [vehicleCatalog, setVehicleCatalog] = useState<any[]>([]);
  const [slotsList, setSlotsList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [health, setHealth] = useState<any>(null);

  // Search & Filters
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>("all");
  const [vehicleSearch, setVehicleSearch] = useState<string>("");
  const [servicemanSearch, setServicemanSearch] = useState<string>("");

  // Modals
  const [assignModalBooking, setAssignModalBooking] = useState<any>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  // Provider Modal
  const [providerModal, setProviderModal] = useState<{ open: boolean; isEdit: boolean; data: any }>({
    open: false,
    isEdit: false,
    data: { name: "", phone: "", email: "", status: "active", rating: 5.0 },
  });

  // Vehicle Modal
  const [vehicleModal, setVehicleModal] = useState<{ open: boolean; isEdit: boolean; data: any }>({
    open: false,
    isEdit: false,
    data: { brand: "", model: "", category: "Car", bodyType: "Hatchback", brandIcon: "", modelImage: "" },
  });

  // Slot Modal
  const [slotModal, setSlotModal] = useState<{ open: boolean; isEdit: boolean; data: any }>({
    open: false,
    isEdit: false,
    data: { slotTime: "", maxCapacity: 10, isActive: true },
  });

  // Service Modal
  const [serviceModal, setServiceModal] = useState<{ open: boolean; isEdit: boolean; data: any }>({
    open: false,
    isEdit: false,
    data: { name: "", description: "", category: "package", basePrice: "", durationMinutes: 45, popular: false, isActive: true },
  });

  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      fetch("/api/health").then((res) => res.json()).then((data) => setHealth(data)).catch(() => {});
      fetch("/api/admin/dashboard/stats").then((res) => res.json()).then((data) => setStats(data.stats)).catch(() => {});
      fetch("/api/admin/bookings?limit=30").then((res) => res.json()).then((data) => setBookings(data.bookings || [])).catch(() => {});
      fetch("/api/admin/providers").then((res) => res.json()).then((data) => setProviders(data.providers || [])).catch(() => {});
      fetch("/api/admin/vehicles/catalog").then((res) => res.json()).then((data) => setVehicleCatalog(data.catalog || [])).catch(() => {});
      fetch("/api/admin/slots").then((res) => res.json()).then((data) => setSlotsList(data.slots || [])).catch(() => {});
      fetch("/api/admin/users?limit=30").then((res) => res.json()).then((data) => setUsers(data.users || [])).catch(() => {});
      fetch("/api/admin/services").then((res) => res.json()).then((data) => setServicesList(data.services || [])).catch(() => {});
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm("Populate Supabase database with initial master records (services, slots, vehicle catalog, providers)?")) return;
    setIsSeeding(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Database seeded successfully!");
        fetchData();
      } else {
        alert(`Seeding failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Assign Provider
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
        setAssignModalBooking(null);
        fetchData();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Provider CRUD
  const handleSaveProvider = async () => {
    const { isEdit, data } = providerModal;
    if (!data.name || !data.phone) {
      alert("Serviceman Name and Phone number are required.");
      return;
    }
    try {
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch("/api/admin/providers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setProviderModal({ open: false, isEdit: false, data: {} });
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Are you sure you want to remove this serviceman?")) return;
    try {
      const res = await fetch(`/api/admin/providers?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Vehicle CRUD
  const handleSaveVehicle = async () => {
    const { isEdit, data } = vehicleModal;
    if (!data.brand || !data.model) {
      alert("Brand and Model are required.");
      return;
    }
    try {
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch("/api/admin/vehicles/catalog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setVehicleModal({ open: false, isEdit: false, data: {} });
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Delete vehicle model from master catalog?")) return;
    try {
      const res = await fetch(`/api/admin/vehicles/catalog?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Slot CRUD
  const handleSaveSlot = async () => {
    const { isEdit, data } = slotModal;
    if (!data.slotTime) {
      alert("Time Slot string is required.");
      return;
    }
    try {
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch("/api/admin/slots", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSlotModal({ open: false, isEdit: false, data: {} });
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Delete this booking time slot?")) return;
    try {
      const res = await fetch(`/api/admin/slots?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Service CRUD
  const handleSaveService = async () => {
    const { isEdit, data } = serviceModal;
    if (!data.name || data.basePrice === "") {
      alert("Service Name and Base Price are required.");
      return;
    }
    try {
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setServiceModal({ open: false, isEdit: false, data: {} });
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Delete this service item from catalog?")) return;
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredVehicles = vehicleCatalog.filter(
    (v) =>
      v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.category.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const filteredProviders = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(servicemanSearch.toLowerCase()) ||
      p.phone.includes(servicemanSearch)
  );

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilterStatus === "all") return true;
    return b.status === bookingFilterStatus;
  });

  const endpoints = [
    { method: "GET", path: "/api/health", desc: "Database health check & connection monitor" },
    { method: "GET", path: "/api/admin/dashboard/stats", desc: "Admin analytics KPI aggregator" },
    { method: "GET", path: "/api/admin/bookings", desc: "Paginated customer bookings & status manager" },
    { method: "POST", path: "/api/admin/bookings/assign", desc: "Dispatch & assign serviceman to booking" },
    { method: "GET / POST / PUT / DELETE", path: "/api/admin/providers", desc: "Servicemen & partner workforce CRUD" },
    { method: "GET / POST / PUT / DELETE", path: "/api/admin/vehicles/catalog", desc: "Master vehicle brand & model catalog CRUD" },
    { method: "GET / POST / PUT / DELETE", path: "/api/admin/slots", desc: "Booking time slots & capacity manager CRUD" },
    { method: "GET / POST / PUT / DELETE", path: "/api/admin/services", desc: "Service offerings & dynamic pricing catalog CRUD" },
    { method: "GET", path: "/api/admin/users", desc: "Customer user directory & profile records" },
    { method: "GET", path: "/api/admin/reports/revenue", desc: "Revenue & transaction ledger reports" },
    { method: "GET / POST", path: "/api/bookings", desc: "Mobile client booking engine" },
    { method: "POST", path: "/api/payments/create-order", desc: "Razorpay payment gateway order initialization" },
    { method: "POST", path: "/api/payments/verify", desc: "Razorpay cryptographic signature verification" },
  ];

  return (
    <div style={styles.appShell}>
      {/* Sleek Enterprise Top Navbar */}
      <header style={styles.header}>
        <div style={styles.brandContainer}>
          <div style={styles.brandIconGlow}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div style={styles.brandBadgeRow}>
              <h1 style={styles.brandTitle}>SHRAWRASTI</h1>
              <span style={styles.enterpriseBadge}>ENTERPRISE OS</span>
            </div>
            <p style={styles.brandSub}>Unified Operations Center & API Management Engine</p>
          </div>
        </div>

        <div style={styles.headerControls}>
          <div style={styles.statusPill}>
            <span style={{ ...styles.pulseDot, backgroundColor: health?.status === "healthy" ? "#10B981" : "#F59E0B" }} />
            <span style={styles.statusText}>
              System: <strong style={{ color: "#F8FAFC" }}>{health?.status === "healthy" ? "Healthy" : "Connecting..."}</strong>
            </span>
          </div>

          <div style={styles.statusPill}>
            <span style={{ ...styles.pulseDot, backgroundColor: "#3B82F6" }} />
            <span style={styles.statusText}>
              Live Sync: <strong style={{ color: "#F8FAFC" }}>{lastUpdated || "Active (5s)"}</strong>
            </span>
          </div>

          <button style={{ ...styles.refreshBtn, background: "rgba(16, 185, 129, 0.2)", borderColor: "#10B981", color: "#10B981" }} onClick={handleSeedDatabase} disabled={isSeeding}>
            {isSeeding ? "Seeding DB..." : "🌱 Seed Master DB"}
          </button>

          <button style={styles.refreshBtn} onClick={fetchData}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Sync Data
          </button>
        </div>
      </header>

      {/* Main Navigation Bar */}
      <nav style={styles.navBar}>
        {[
          { id: "dashboard", label: "Overview", icon: "📊" },
          { id: "bookings", label: "Live Bookings", icon: "🚗", count: bookings.length },
          { id: "providers", label: "Servicemen & Partners", icon: "👨‍🔧", count: providers.length },
          { id: "vehicles", label: "Vehicle Catalog", icon: "🏎️", count: vehicleCatalog.length },
          { id: "slots", label: "Time Slots", icon: "⏰", count: slotsList.length },
          { id: "services", label: "Services & Pricing", icon: "🧼", count: servicesList.length },
          { id: "users", label: "Users Directory", icon: "👥", count: users.length },
          { id: "api", label: "API Reference", icon: "⚡" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              ...styles.navTab,
              ...(activeTab === tab.id ? styles.navTabActive : {}),
            }}
          >
            <span style={{ fontSize: "16px" }}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span style={{ ...styles.navBadge, ...(activeTab === tab.id ? styles.navBadgeActive : {}) }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Dashboard Main Workspace */}
      <main style={styles.workspace}>
        {/* TAB 1: OVERVIEW */}
        {activeTab === "dashboard" && (
          <div>
            {/* KPI Cards Grid */}
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiTopRow}>
                  <span style={styles.kpiLabel}>TOTAL REVENUE</span>
                  <div style={{ ...styles.kpiIconBox, background: "rgba(99, 102, 241, 0.15)", color: "#818CF8" }}>💰</div>
                </div>
                <div style={styles.kpiValue}>₹{stats?.totalRevenue ?? 0}</div>
                <div style={styles.kpiSub}>
                  <span style={{ color: "#10B981", fontWeight: "700" }}>↑ Live</span> Today: ₹{stats?.todayRevenue ?? 0}
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiTopRow}>
                  <span style={styles.kpiLabel}>TOTAL BOOKINGS</span>
                  <div style={{ ...styles.kpiIconBox, background: "rgba(16, 185, 129, 0.15)", color: "#34D399" }}>📦</div>
                </div>
                <div style={styles.kpiValue}>{stats?.totalBookings ?? bookings.length ?? 0}</div>
                <div style={styles.kpiSub}>
                  <span style={{ color: "#34D399", fontWeight: "700" }}>● Active</span> Today: {stats?.todayBookingsCount ?? 0}
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiTopRow}>
                  <span style={styles.kpiLabel}>PENDING DISPATCH</span>
                  <div style={{ ...styles.kpiIconBox, background: "rgba(245, 158, 11, 0.15)", color: "#FBBF24" }}>⌛</div>
                </div>
                <div style={{ ...styles.kpiValue, color: "#FBBF24" }}>{stats?.pendingBookings ?? 0}</div>
                <div style={styles.kpiSub}>Awaiting technician assignment</div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiTopRow}>
                  <span style={styles.kpiLabel}>SERVICE WORKFORCE</span>
                  <div style={{ ...styles.kpiIconBox, background: "rgba(139, 92, 246, 0.15)", color: "#A78BFA" }}>👨‍🔧</div>
                </div>
                <div style={styles.kpiValue}>{providers.length}</div>
                <div style={styles.kpiSub}>
                  <span style={{ color: "#10B981" }}>● {providers.filter((p) => p.isOnline).length} Online</span> Partners
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Recent Customer Orders</h2>
                <p style={styles.sectionSub}>Live dispatch and booking status tracking</p>
              </div>
              <button style={styles.ghostBtn} onClick={() => setActiveTab("bookings")}>
                View All Orders →
              </button>
            </div>

            <div style={styles.cardFrame}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Schedule</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Assigned Serviceman</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={styles.emptyCell}>
                        No orders recorded yet. Connect mobile app or test via API.
                      </td>
                    </tr>
                  ) : (
                    bookings.slice(0, 8).map((b) => (
                      <tr key={b.id} style={styles.tableRow}>
                        <td style={styles.monoId}>#{b.id.substring(0, 8)}</td>
                        <td>
                          <div style={{ fontWeight: "600", color: "#F8FAFC" }}>{b.user?.name || "Customer"}</div>
                          <div style={styles.subText}>{b.user?.phone || b.userId.substring(0, 8)}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "500", color: "#E2E8F0" }}>
                            {b.vehicleSnapshot?.make || "Car"} {b.vehicleSnapshot?.model || ""}
                          </div>
                          <div style={styles.subText}>{b.vehicleSnapshot?.bodyType || "Standard"}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "500", color: "#CBD5E1" }}>{b.scheduleDate}</div>
                          <div style={styles.subText}>{b.scheduleTime}</div>
                        </td>
                        <td style={styles.priceTag}>₹{b.total}</td>
                        <td>
                          <span style={getStatusBadge(b.status)}>{b.status.toUpperCase()}</span>
                        </td>
                        <td>
                          {b.assignedProviderId ? (
                            <span style={styles.assignedPill}>
                              ✓ {providers.find((p) => p.id === b.assignedProviderId)?.name || "Assigned"}
                            </span>
                          ) : (
                            <span style={styles.unassignedPill}>⚡ Unassigned</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            style={styles.actionPillBtn}
                            onClick={() => {
                              setAssignModalBooking(b);
                              setSelectedProviderId(providers[0]?.id || "");
                            }}
                          >
                            Assign Partner
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

        {/* TAB 2: LIVE BOOKINGS */}
        {activeTab === "bookings" && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Customer Bookings ({filteredBookings.length})</h2>
                <p style={styles.sectionSub}>Filter and manage live customer service dispatches</p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {["all", "pending", "accepted", "in_progress", "completed", "cancelled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingFilterStatus(st)}
                    style={{
                      ...styles.filterPill,
                      ...(bookingFilterStatus === st ? styles.filterPillActive : {}),
                    }}
                  >
                    {st.replace("_", " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.cardFrame}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Services Requested</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Dispatch Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id} style={styles.tableRow}>
                      <td style={styles.monoId}>#{b.id.substring(0, 8)}</td>
                      <td>
                        <div style={{ fontWeight: "600", color: "#F8FAFC" }}>{b.user?.name || b.userId}</div>
                        <div style={styles.subText}>{b.user?.phone || "N/A"}</div>
                      </td>
                      <td>
                        <div style={{ color: "#93C5FD", fontWeight: "500" }}>
                          {(b.services || []).map((s: any) => s.name || s.id).join(", ") || "Doorstep Cleaning"}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "#CBD5E1" }}>
                          {b.paymentMethod || "COD"} ({b.paymentStatus || "pending"})
                        </span>
                      </td>
                      <td style={styles.priceTag}>₹{b.total}</td>
                      <td>
                        <span style={getStatusBadge(b.status)}>{b.status.toUpperCase()}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button style={styles.actionPillBtn} onClick={() => setAssignModalBooking(b)}>
                          Dispatch Partner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICEMEN & PARTNERS */}
        {activeTab === "providers" && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Servicemen & Partner Workforce ({filteredProviders.length})</h2>
                <p style={styles.sectionSub}>Manage technician accounts, ratings, and availability</p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="🔍 Search serviceman name, phone..."
                  value={servicemanSearch}
                  onChange={(e) => setServicemanSearch(e.target.value)}
                  style={styles.searchInput}
                />
                <button
                  style={styles.primaryAddBtn}
                  onClick={() =>
                    setProviderModal({
                      open: true,
                      isEdit: false,
                      data: { name: "", phone: "", email: "", status: "active", rating: 5.0 },
                    })
                  }
                >
                  ➕ Add New Partner
                </button>
              </div>
            </div>

            <div style={styles.cardFrame}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Partner ID</th>
                    <th>Name</th>
                    <th>Contact Info</th>
                    <th>Rating</th>
                    <th>Completed Jobs</th>
                    <th>Online Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((p) => (
                    <tr key={p.id} style={styles.tableRow}>
                      <td style={styles.monoId}>#{p.id.substring(0, 8)}</td>
                      <td style={{ fontWeight: "600", color: "#F8FAFC" }}>{p.name}</td>
                      <td>
                        <div>{p.phone}</div>
                        <div style={styles.subText}>{p.email || "No email registered"}</div>
                      </td>
                      <td>
                        <span style={{ color: "#F59E0B", fontWeight: "700" }}>⭐ {p.rating || "5.0"}</span>
                      </td>
                      <td style={{ fontWeight: "600", color: "#CBD5E1" }}>{p.totalJobs || 0} Orders</td>
                      <td>
                        <span style={{ color: p.isOnline ? "#10B981" : "#EF4444", fontWeight: "700", fontSize: "12px" }}>
                          ● {p.isOnline ? "ONLINE" : "OFFLINE"} ({p.status})
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          style={styles.editBtn}
                          onClick={() => setProviderModal({ open: true, isEdit: true, data: { ...p } })}
                        >
                          ✏️ Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => handleDeleteProvider(p.id)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: VEHICLE CATALOG */}
        {activeTab === "vehicles" && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Master Vehicle Catalog & Brands ({filteredVehicles.length})</h2>
                <p style={styles.sectionSub}>Configure 2W & 4W brands, models, and body types</p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="🔍 Search brand, model, body type..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  style={styles.searchInput}
                />
                <button
                  style={styles.primaryAddBtn}
                  onClick={() =>
                    setVehicleModal({
                      open: true,
                      isEdit: false,
                      data: { brand: "", model: "", category: "Car", bodyType: "Hatchback", brandIcon: "", modelImage: "" },
                    })
                  }
                >
                  ➕ Add Vehicle Model
                </button>
              </div>
            </div>

            <div style={styles.cardFrame}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Category</th>
                    <th>Body Type Classification</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((v) => (
                    <tr key={v.id} style={styles.tableRow}>
                      <td style={{ fontWeight: "700", color: "#38BDF8", fontSize: "15px" }}>{v.brand}</td>
                      <td style={{ fontWeight: "600", color: "#F8FAFC" }}>{v.model}</td>
                      <td>
                        <span style={v.category.includes("Bike") ? styles.tagBike : styles.tagCar}>{v.category}</span>
                      </td>
                      <td>
                        <span style={styles.bodyTypeBadge}>{v.bodyType || "Standard"}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          style={styles.editBtn}
                          onClick={() => setVehicleModal({ open: true, isEdit: true, data: { ...v } })}
                        >
                          ✏️ Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => handleDeleteVehicle(v.id)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: TIME SLOTS */}
        {activeTab === "slots" && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Booking Time Slots ({slotsList.length})</h2>
                <p style={styles.sectionSub}>Set operational time windows and daily dispatch limits</p>
              </div>

              <button
                style={styles.primaryAddBtn}
                onClick={() =>
                  setSlotModal({
                    open: true,
                    isEdit: false,
                    data: { slotTime: "", maxCapacity: 10, isActive: true },
                  })
                }
              >
                ➕ Add Time Slot
              </button>
            </div>

            <div style={styles.cardFrame}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Time Slot Window</th>
                    <th>Max Daily Capacity</th>
                    <th>Active Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsList.map((s) => (
                    <tr key={s.id} style={styles.tableRow}>
                      <td style={{ fontWeight: "700", fontSize: "16px", color: "#F8FAFC" }}>⏰ {s.slotTime}</td>
                      <td style={{ fontWeight: "600", color: "#93C5FD" }}>{s.maxCapacity || 10} Bookings/Day</td>
                      <td>
                        <span style={s.isActive ? styles.activeBadge : styles.disabledBadge}>
                          ● {s.isActive ? "ACTIVE & OPEN" : "DISABLED"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          style={styles.editBtn}
                          onClick={() => setSlotModal({ open: true, isEdit: true, data: { ...s } })}
                        >
                          ✏️ Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => handleDeleteSlot(s.id)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SERVICES & PRICING */}
        {activeTab === "services" && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Services & Dynamic Pricing Catalog ({servicesList.length})</h2>
                <p style={styles.sectionSub}>Configure cleaning packages, add-ons, and duration</p>
              </div>

              <button
                style={styles.primaryAddBtn}
                onClick={() =>
                  setServiceModal({
                    open: true,
                    isEdit: false,
                    data: { name: "", description: "", category: "package", basePrice: "", durationMinutes: 45, popular: false, isActive: true },
                  })
                }
              >
                ➕ Add New Service
              </button>
            </div>

            <div style={styles.cardFrame}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Base Price</th>
                    <th>Duration</th>
                    <th>Featured Badge</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesList.map((s) => (
                    <tr key={s.id} style={styles.tableRow}>
                      <td>
                        <div style={{ fontWeight: "700", color: "#F8FAFC", fontSize: "15px" }}>{s.name}</div>
                        <div style={styles.subText}>{s.description}</div>
                      </td>
                      <td>
                        <span style={s.category === "add_on" ? styles.tagAddOn : styles.tagPackage}>
                          {s.category === "add_on" ? "Add-on" : "Main Package"}
                        </span>
                      </td>
                      <td style={styles.priceTag}>₹{s.basePrice}</td>
                      <td style={{ fontWeight: "500", color: "#CBD5E1" }}>{s.durationMinutes || 45} mins</td>
                      <td>{s.popular ? <span style={styles.popularBadge}>🔥 Popular</span> : <span style={styles.subText}>Standard</span>}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          style={styles.editBtn}
                          onClick={() => setServiceModal({ open: true, isEdit: true, data: { ...s } })}
                        >
                          ✏️ Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => handleDeleteService(s.id)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: USERS */}
        {activeTab === "users" && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Registered Customers ({users.length})</h2>
                <p style={styles.sectionSub}>Mobile app user records and registration logs</p>
              </div>
            </div>

            <div style={styles.cardFrame}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={styles.tableRow}>
                      <td style={styles.monoId}>#{u.id.substring(0, 8)}</td>
                      <td style={{ fontWeight: "600", color: "#F8FAFC" }}>{u.name}</td>
                      <td>{u.email || "N/A"}</td>
                      <td style={{ color: "#38BDF8" }}>{u.phone || "N/A"}</td>
                      <td style={{ color: "#CBD5E1" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: API DIRECTORY */}
        {activeTab === "api" && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>REST API Operations Directory</h2>
                <p style={styles.sectionSub}>Serverless API routes for mobile app integration</p>
              </div>
            </div>

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

      {/* --- MODALS --- */}

      {/* Assign Provider Modal */}
      {assignModalBooking && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Dispatch Partner for Order #{assignModalBooking.id.substring(0, 8)}</h3>
            <p style={{ color: "#94A3B8", fontSize: "14px", marginTop: "4px" }}>
              Scheduled for: {assignModalBooking.scheduleDate} @ {assignModalBooking.scheduleTime}
            </p>

            <label style={styles.label}>Select Available Serviceman:</label>
            <select
              style={styles.select}
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone}) — Rating: ⭐{p.rating || 5}
                </option>
              ))}
            </select>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setAssignModalBooking(null)}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleAssignProvider}>
                Dispatch Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Modal */}
      {providerModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>{providerModal.isEdit ? "Edit Serviceman Details" : "Add New Serviceman"}</h3>

            <label style={styles.label}>Full Name:</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={providerModal.data.name || ""}
              onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, name: e.target.value } })}
              style={styles.input}
            />

            <label style={styles.label}>Phone Number:</label>
            <input
              type="text"
              placeholder="+91 9876543210"
              value={providerModal.data.phone || ""}
              onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, phone: e.target.value } })}
              style={styles.input}
            />

            <label style={styles.label}>Email Address (Optional):</label>
            <input
              type="email"
              placeholder="ramesh@shrawasti.com"
              value={providerModal.data.email || ""}
              onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, email: e.target.value } })}
              style={styles.input}
            />

            <label style={styles.label}>Rating:</label>
            <input
              type="number"
              step="0.1"
              placeholder="5.0"
              value={providerModal.data.rating || ""}
              onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, rating: e.target.value } })}
              style={styles.input}
            />

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setProviderModal({ open: false, isEdit: false, data: {} })}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleSaveProvider}>
                Save Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {vehicleModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>{vehicleModal.isEdit ? "Edit Vehicle Catalog Model" : "Add Vehicle Model"}</h3>

            <label style={styles.label}>Brand Name:</label>
            <input
              type="text"
              placeholder="e.g. Tata, Hero, Honda, Hyundai"
              value={vehicleModal.data.brand || ""}
              onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, brand: e.target.value } })}
              style={styles.input}
            />

            <label style={styles.label}>Model Name:</label>
            <input
              type="text"
              placeholder="e.g. Nexon, Activa, Swift, Splendor"
              value={vehicleModal.data.model || ""}
              onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, model: e.target.value } })}
              style={styles.input}
            />

            <label style={styles.label}>Vehicle Category:</label>
            <select
              value={vehicleModal.data.category || "Car"}
              onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, category: e.target.value } })}
              style={styles.select}
            >
              <option value="Car">Car (4-Wheeler)</option>
              <option value="Bike">Bike (2-Wheeler)</option>
            </select>

            <label style={styles.label}>Body Type Classification:</label>
            <input
              type="text"
              placeholder="e.g. SUV, Hatchback, Scooter, Cruiser, 7 Seater"
              value={vehicleModal.data.bodyType || ""}
              onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, bodyType: e.target.value } })}
              style={styles.input}
            />

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setVehicleModal({ open: false, isEdit: false, data: {} })}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleSaveVehicle}>
                Save Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {slotModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>{slotModal.isEdit ? "Edit Time Slot" : "Add Booking Time Slot"}</h3>

            <label style={styles.label}>Time Window String:</label>
            <input
              type="text"
              placeholder="e.g. 08:00 AM - 10:00 AM"
              value={slotModal.data.slotTime || ""}
              onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, slotTime: e.target.value } })}
              style={styles.input}
            />

            <label style={styles.label}>Max Daily Capacity:</label>
            <input
              type="number"
              placeholder="10"
              value={slotModal.data.maxCapacity || ""}
              onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, maxCapacity: e.target.value } })}
              style={styles.input}
            />

            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", cursor: "pointer", color: "#E2E8F0" }}>
              <input
                type="checkbox"
                checked={slotModal.data.isActive ?? true}
                onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, isActive: e.target.checked } })}
              />
              Enable Active Booking Slot
            </label>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setSlotModal({ open: false, isEdit: false, data: {} })}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleSaveSlot}>
                Save Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {serviceModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>{serviceModal.isEdit ? "Edit Service Offering" : "Add New Service Offering"}</h3>

            <label style={styles.label}>Service Title:</label>
            <input
              type="text"
              placeholder="e.g. Premium Foam Wash"
              value={serviceModal.data.name || ""}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, name: e.target.value } })}
              style={styles.input}
            />

            <label style={styles.label}>Description:</label>
            <textarea
              placeholder="Full exterior foam bath, interior vacuum, tyre polish..."
              value={serviceModal.data.description || ""}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, description: e.target.value } })}
              style={{ ...styles.input, minHeight: "60px" }}
            />

            <label style={styles.label}>Category:</label>
            <select
              value={serviceModal.data.category || "package"}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, category: e.target.value } })}
              style={styles.select}
            >
              <option value="package">Main Service Package</option>
              <option value="add_on">Add-on Service</option>
            </select>

            <label style={styles.label}>Base Price (₹):</label>
            <input
              type="number"
              placeholder="499"
              value={serviceModal.data.basePrice || ""}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, basePrice: e.target.value } })}
              style={styles.input}
            />

            <label style={styles.label}>Duration (Minutes):</label>
            <input
              type="number"
              placeholder="45"
              value={serviceModal.data.durationMinutes || ""}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, durationMinutes: e.target.value } })}
              style={styles.input}
            />

            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", cursor: "pointer", color: "#E2E8F0" }}>
              <input
                type="checkbox"
                checked={serviceModal.data.popular ?? false}
                onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, popular: e.target.checked } })}
              />
              Highlight with 🔥 Popular Badge
            </label>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setServiceModal({ open: false, isEdit: false, data: {} })}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleSaveService}>
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Status Badges
function getStatusBadge(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    display: "inline-block",
  };
  switch (status) {
    case "completed":
      return { ...base, background: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.3)" };
    case "pending":
      return { ...base, background: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", border: "1px solid rgba(245, 158, 11, 0.3)" };
    case "in_progress":
    case "accepted":
      return { ...base, background: "rgba(99, 102, 241, 0.15)", color: "#818CF8", border: "1px solid rgba(99, 102, 241, 0.3)" };
    case "cancelled":
      return { ...base, background: "rgba(239, 68, 68, 0.15)", color: "#F87171", border: "1px solid rgba(239, 68, 68, 0.3)" };
    default:
      return { ...base, background: "#334155", color: "#94A3B8" };
  }
}

// Enterprise Dark Aesthetic Styles
const styles: Record<string, React.CSSProperties> = {
  appShell: {
    minHeight: "100vh",
    backgroundColor: "#0B0F19",
    color: "#F8FAFC",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: "#111827",
    borderBottom: "1px solid #1F2937",
    backdropFilter: "blur(12px)",
  },
  brandContainer: { display: "flex", alignItems: "center", gap: "14px" },
  brandIconGlow: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
  },
  brandBadgeRow: { display: "flex", alignItems: "center", gap: "10px" },
  brandTitle: { margin: 0, fontSize: "18px", fontWeight: "900", letterSpacing: "1px", color: "#F8FAFC" },
  enterpriseBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    color: "#818CF8",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    letterSpacing: "0.5px",
  },
  brandSub: { margin: 0, fontSize: "12px", color: "#9CA3AF", marginTop: "2px" },
  headerControls: { display: "flex", alignItems: "center", gap: "16px" },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#1F2937",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    border: "1px solid #374151",
  },
  pulseDot: { width: "8px", height: "8px", borderRadius: "50%" },
  statusText: { color: "#9CA3AF" },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#1F2937",
    color: "#F8FAFC",
    border: "1px solid #374151",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  navBar: {
    display: "flex",
    gap: "6px",
    padding: "10px 32px",
    backgroundColor: "#111827",
    borderBottom: "1px solid #1F2937",
    overflowX: "auto",
  },
  navTab: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    color: "#9CA3AF",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  navTabActive: { backgroundColor: "#6366F1", color: "#FFFFFF", boxShadow: "0 0 16px rgba(99, 102, 241, 0.3)" },
  navBadge: { backgroundColor: "#1F2937", color: "#9CA3AF", fontSize: "11px", fontWeight: "700", padding: "2px 6px", borderRadius: "10px" },
  navBadgeActive: { backgroundColor: "rgba(255, 255, 255, 0.2)", color: "#FFFFFF" },
  workspace: { padding: "32px", maxWidth: "1440px", margin: "0 auto" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "32px" },
  kpiCard: {
    backgroundColor: "#111827",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #1F2937",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
  },
  kpiTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  kpiLabel: { fontSize: "11px", fontWeight: "800", letterSpacing: "1px", color: "#9CA3AF" },
  kpiIconBox: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
  kpiValue: { fontSize: "32px", fontWeight: "900", color: "#F8FAFC", margin: "10px 0 4px 0" },
  kpiSub: { fontSize: "12px", color: "#6B7280" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  sectionTitle: { margin: 0, fontSize: "20px", fontWeight: "800", color: "#F8FAFC" },
  sectionSub: { margin: 0, fontSize: "13px", color: "#9CA3AF", marginTop: "2px" },
  ghostBtn: { backgroundColor: "transparent", color: "#818CF8", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px" },
  primaryAddBtn: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 0 16px rgba(16, 185, 129, 0.3)",
  },
  cardFrame: { backgroundColor: "#111827", borderRadius: "16px", border: "1px solid #1F2937", overflow: "hidden", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" },
  dataTable: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableRow: { borderBottom: "1px solid #1F2937" },
  emptyCell: { textAlign: "center", padding: "40px", color: "#6B7280", fontSize: "14px" },
  monoId: { fontFamily: "monospace", fontSize: "13px", color: "#818CF8", fontWeight: "700" },
  subText: { fontSize: "12px", color: "#6B7280" },
  priceTag: { fontSize: "15px", fontWeight: "800", color: "#38BDF8" },
  assignedPill: { color: "#34D399", fontSize: "12px", fontWeight: "600" },
  unassignedPill: { color: "#FBBF24", fontSize: "12px", fontWeight: "600" },
  actionPillBtn: { backgroundColor: "#6366F1", color: "#FFFFFF", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" },
  editBtn: { backgroundColor: "#374151", color: "#F8FAFC", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", marginRight: "6px" },
  deleteBtn: { backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#F87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  searchInput: { width: "260px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "#1F2937", color: "#F8FAFC", border: "1px solid #374151", fontSize: "13px" },
  filterPill: { backgroundColor: "#1F2937", color: "#9CA3AF", border: "1px solid #374151", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer" },
  filterPillActive: { backgroundColor: "#6366F1", color: "#FFFFFF", borderColor: "#6366F1" },
  tagCar: { backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" },
  tagBike: { backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34D399", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" },
  bodyTypeBadge: { backgroundColor: "#1F2937", color: "#E2E8F0", padding: "3px 8px", borderRadius: "4px", fontSize: "12px" },
  activeBadge: { color: "#34D399", fontWeight: "700", fontSize: "12px" },
  disabledBadge: { color: "#F87171", fontWeight: "700", fontSize: "12px" },
  tagPackage: { backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#818CF8", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" },
  tagAddOn: { backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" },
  popularBadge: { color: "#F59E0B", fontWeight: "700", fontSize: "12px" },
  apiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" },
  apiCard: { backgroundColor: "#111827", borderRadius: "12px", padding: "18px", border: "1px solid #1F2937" },
  apiHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
  methodTag: { backgroundColor: "#6366F1", color: "#FFF", fontSize: "10px", fontWeight: "900", padding: "3px 8px", borderRadius: "4px" },
  apiPath: { color: "#38BDF8", fontSize: "13px", fontWeight: "600" },
  apiDesc: { color: "#9CA3AF", fontSize: "13px", margin: 0 },
  modalBackdrop: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { backgroundColor: "#111827", padding: "28px", borderRadius: "20px", width: "90%", maxWidth: "460px", border: "1px solid #1F2937", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" },
  modalTitle: { margin: 0, fontSize: "18px", fontWeight: "800", color: "#F8FAFC", marginBottom: "16px" },
  label: { display: "block", marginTop: "14px", fontSize: "12px", fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#1F2937", color: "#F8FAFC", border: "1px solid #374151", fontSize: "14px", marginTop: "6px", outline: "none" },
  select: { width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#1F2937", color: "#F8FAFC", border: "1px solid #374151", fontSize: "14px", marginTop: "6px", outline: "none" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { backgroundColor: "#1F2937", color: "#9CA3AF", border: "1px solid #374151", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  confirmBtn: { backgroundColor: "#10B981", color: "#FFF", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", boxShadow: "0 0 16px rgba(16, 185, 129, 0.3)" },
};
