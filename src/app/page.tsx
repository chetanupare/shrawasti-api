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

  // Search & Filter state
  const [vehicleSearch, setVehicleSearch] = useState<string>("");

  // Modals state
  const [assignModalBooking, setAssignModalBooking] = useState<any>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  // Serviceman Modal (Add / Edit)
  const [providerModal, setProviderModal] = useState<{ open: boolean; isEdit: boolean; data: any }>({
    open: false,
    isEdit: false,
    data: { name: "", phone: "", email: "", status: "active", rating: 5.0 },
  });

  // Vehicle Modal (Add / Edit)
  const [vehicleModal, setVehicleModal] = useState<{ open: boolean; isEdit: boolean; data: any }>({
    open: false,
    isEdit: false,
    data: { brand: "", model: "", category: "Car", bodyType: "Hatchback", brandIcon: "", modelImage: "" },
  });

  // Slot Modal (Add / Edit)
  const [slotModal, setSlotModal] = useState<{ open: boolean; isEdit: boolean; data: any }>({
    open: false,
    isEdit: false,
    data: { slotTime: "", maxCapacity: 10, isActive: true },
  });

  // Service Modal (Add / Edit)
  const [serviceModal, setServiceModal] = useState<{ open: boolean; isEdit: boolean; data: any }>({
    open: false,
    isEdit: false,
    data: { name: "", description: "", category: "package", basePrice: "", durationMinutes: 45, popular: false, isActive: true },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      fetch("/api/health").then(res => res.json()).then(data => setHealth(data)).catch(() => {});
      fetch("/api/admin/dashboard/stats").then(res => res.json()).then(data => setStats(data.stats)).catch(() => {});
      fetch("/api/admin/bookings?limit=20").then(res => res.json()).then(data => setBookings(data.bookings || [])).catch(() => {});
      fetch("/api/admin/providers").then(res => res.json()).then(data => setProviders(data.providers || [])).catch(() => {});
      fetch("/api/admin/vehicles/catalog").then(res => res.json()).then(data => setVehicleCatalog(data.catalog || [])).catch(() => {});
      fetch("/api/admin/slots").then(res => res.json()).then(data => setSlotsList(data.slots || [])).catch(() => {});
      fetch("/api/admin/users?limit=20").then(res => res.json()).then(data => setUsers(data.users || [])).catch(() => {});
      fetch("/api/admin/services").then(res => res.json()).then(data => setServicesList(data.services || [])).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Assign Provider Handler ---
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

  // --- Serviceman CRUD Handlers ---
  const handleSaveProvider = async () => {
    const { isEdit, data } = providerModal;
    if (!data.name || !data.phone) {
      alert("Name and Phone are required.");
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
        alert(`Serviceman ${isEdit ? "updated" : "added"} successfully!`);
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
    if (!confirm("Are you sure you want to delete this serviceman?")) return;
    try {
      const res = await fetch(`/api/admin/providers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Serviceman deleted!");
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- Vehicle CRUD Handlers ---
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
        alert(`Vehicle ${isEdit ? "updated" : "added"} successfully!`);
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
    if (!confirm("Are you sure you want to delete this vehicle model from the catalog?")) return;
    try {
      const res = await fetch(`/api/admin/vehicles/catalog?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Vehicle deleted!");
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- Slot CRUD Handlers ---
  const handleSaveSlot = async () => {
    const { isEdit, data } = slotModal;
    if (!data.slotTime) {
      alert("Slot Time string is required.");
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
        alert(`Slot ${isEdit ? "updated" : "added"} successfully!`);
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
      if (res.ok) {
        alert("Slot deleted!");
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- Service CRUD Handlers ---
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
        alert(`Service ${isEdit ? "updated" : "created"} successfully!`);
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
    if (!confirm("Delete this service item?")) return;
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Service deleted!");
        fetchData();
      }
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

  const endpoints = [
    { method: "GET", path: "/api/health", desc: "Database health check & status" },
    { method: "GET", path: "/api/admin/dashboard/stats", desc: "Admin overview KPI analytics" },
    { method: "GET", path: "/api/admin/bookings", desc: "Paginated bookings list for admin" },
    { method: "POST", path: "/api/admin/bookings/assign", desc: "Assign serviceman to booking" },
    { method: "GET/POST/PUT/DELETE", path: "/api/admin/providers", desc: "Servicemen & partners management CRUD" },
    { method: "GET/POST/PUT/DELETE", path: "/api/admin/vehicles/catalog", desc: "Master vehicle brand/model catalog CRUD" },
    { method: "GET/POST/PUT/DELETE", path: "/api/admin/slots", desc: "Booking time slots management CRUD" },
    { method: "GET/POST/PUT/DELETE", path: "/api/admin/services", desc: "Services & pricing catalog CRUD" },
    { method: "GET", path: "/api/admin/users", desc: "List registered users" },
    { method: "GET", path: "/api/admin/reports/revenue", desc: "Financial revenue report" },
    { method: "GET/POST", path: "/api/bookings", desc: "Customer service bookings" },
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
            <p style={styles.brandSub}>Unified Operations Dashboard & Full CRUD Management System</p>
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
          { id: "vehicles", label: "🏎️ Vehicle Catalog" },
          { id: "slots", label: "⏰ Time Slots" },
          { id: "services", label: "🧼 Services & Pricing" },
          { id: "users", label: "👥 Users" },
          { id: "api", label: "⚡ API Directory" },
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
        {/* OVERVIEW TAB */}
        {activeTab === "dashboard" && (
          <div>
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
                  <div style={styles.cardValue}>{providers.length}</div>
                  <div style={styles.cardSub}>Registered partners</div>
                </div>
              </div>
            </div>

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

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div>
            <h2>🚗 Customer Bookings Management</h2>
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

        {/* SERVICEMEN MANAGEMENT TAB */}
        {activeTab === "providers" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>👨‍🔧 Servicemen & Partners Management ({providers.length})</h2>
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
                ➕ Add Serviceman
              </button>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Partner ID</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Rating</th>
                    <th>Completed Jobs</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "monospace" }}>{p.id.substring(0, 8)}...</td>
                      <td style={{ fontWeight: "600" }}>{p.name}</td>
                      <td>
                        {p.phone}
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>{p.email || "No email"}</div>
                      </td>
                      <td>⭐ {p.rating || "5.0"}</td>
                      <td>{p.totalJobs || 0} Jobs</td>
                      <td>
                        <span style={{ color: p.isOnline ? "#22C55E" : "#EF4444", fontWeight: "600" }}>
                          ● {p.isOnline ? "ONLINE" : "OFFLINE"} ({p.status || "active"})
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: "8px" }}>
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

        {/* VEHICLE CATALOG TAB */}
        {activeTab === "vehicles" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>🏎️ Master Vehicle Catalog & Brands ({vehicleCatalog.length})</h2>
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
                ➕ Add Vehicle Model / Brand
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="🔍 Search brand, model, category..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Category</th>
                    <th>Body Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: "700", color: "#38BDF8" }}>{v.brand}</td>
                      <td>{v.model}</td>
                      <td>{v.category}</td>
                      <td>{v.bodyType || "Standard"}</td>
                      <td style={{ display: "flex", gap: "8px" }}>
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

        {/* TIME SLOTS TAB */}
        {activeTab === "slots" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>⏰ Booking Time Slots Management ({slotsList.length})</h2>
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

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Slot Time</th>
                    <th>Max Daily Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsList.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: "700", fontSize: "16px", color: "#F8FAFC" }}>{s.slotTime}</td>
                      <td>{s.maxCapacity || 10} Bookings/Day</td>
                      <td>
                        <span style={{ color: s.isActive ? "#22C55E" : "#EF4444", fontWeight: "600" }}>
                          {s.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: "8px" }}>
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

        {/* SERVICES & PRICING TAB */}
        {activeTab === "services" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>🧼 Services Catalog & Pricing ({servicesList.length})</h2>
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
                ➕ Add New Service / Add-on
              </button>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Base Price</th>
                    <th>Duration</th>
                    <th>Popular</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesList.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: "600" }}>
                        {s.name}
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>{s.description}</div>
                      </td>
                      <td>{s.category}</td>
                      <td style={{ color: "#38BDF8", fontWeight: "bold" }}>₹{s.basePrice}</td>
                      <td>{s.durationMinutes || 45} mins</td>
                      <td>{s.popular ? "🔥 Yes" : "No"}</td>
                      <td style={{ display: "flex", gap: "8px" }}>
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

        {/* USERS TAB */}
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

        {/* API DIRECTORY TAB */}
        {activeTab === "api" && (
          <div>
            <h2>⚡ Production REST API Directory (`/api/...`)</h2>
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

      {/* Serviceman Modal */}
      {providerModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3>{providerModal.isEdit ? "Edit Serviceman / Partner" : "Add New Serviceman"}</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={providerModal.data.name || ""}
              onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, name: e.target.value } })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={providerModal.data.phone || ""}
              onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, phone: e.target.value } })}
              style={styles.input}
            />
            <input
              type="email"
              placeholder="Email Address (optional)"
              value={providerModal.data.email || ""}
              onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, email: e.target.value } })}
              style={styles.input}
            />
            <input
              type="number"
              step="0.1"
              placeholder="Rating (e.g. 4.8)"
              value={providerModal.data.rating || ""}
              onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, rating: e.target.value } })}
              style={styles.input}
            />

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setProviderModal({ open: false, isEdit: false, data: {} })}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleSaveProvider}>
                Save Serviceman
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {vehicleModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3>{vehicleModal.isEdit ? "Edit Vehicle Model" : "Add Vehicle Model / Brand"}</h3>
            <input
              type="text"
              placeholder="Brand (e.g. Tata, Honda, Hero)"
              value={vehicleModal.data.brand || ""}
              onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, brand: e.target.value } })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Model (e.g. Nexon, Activa, Swift)"
              value={vehicleModal.data.model || ""}
              onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, model: e.target.value } })}
              style={styles.input}
            />
            <select
              value={vehicleModal.data.category || "Car"}
              onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, category: e.target.value } })}
              style={styles.select}
            >
              <option value="Car">Car (4-Wheeler)</option>
              <option value="Bike">Bike (2-Wheeler)</option>
            </select>
            <input
              type="text"
              placeholder="Body Type (e.g. SUV, Hatchback, Scooter, Cruiser)"
              value={vehicleModal.data.bodyType || ""}
              onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, bodyType: e.target.value } })}
              style={styles.input}
            />

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setVehicleModal({ open: false, isEdit: false, data: {} })}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleSaveVehicle}>
                Save Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {slotModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3>{slotModal.isEdit ? "Edit Time Slot" : "Add Booking Time Slot"}</h3>
            <input
              type="text"
              placeholder="Slot Time (e.g. 08:00 AM - 10:00 AM)"
              value={slotModal.data.slotTime || ""}
              onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, slotTime: e.target.value } })}
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Max Daily Capacity"
              value={slotModal.data.maxCapacity || ""}
              onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, maxCapacity: e.target.value } })}
              style={styles.input}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={slotModal.data.isActive ?? true}
                onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, isActive: e.target.checked } })}
              />
              Enable / Active Slot
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
            <h3>{serviceModal.isEdit ? "Edit Service Item" : "Add New Service / Add-on"}</h3>
            <input
              type="text"
              placeholder="Service Name (e.g. Basic Wash)"
              value={serviceModal.data.name || ""}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, name: e.target.value } })}
              style={styles.input}
            />
            <textarea
              placeholder="Description..."
              value={serviceModal.data.description || ""}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, description: e.target.value } })}
              style={{ ...styles.input, minHeight: "60px" }}
            />
            <select
              value={serviceModal.data.category || "package"}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, category: e.target.value } })}
              style={styles.select}
            >
              <option value="package">Main Package</option>
              <option value="add_on">Add-on Service</option>
            </select>
            <input
              type="number"
              placeholder="Base Price (₹)"
              value={serviceModal.data.basePrice || ""}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, basePrice: e.target.value } })}
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Duration (Minutes)"
              value={serviceModal.data.durationMinutes || ""}
              onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, durationMinutes: e.target.value } })}
              style={styles.input}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={serviceModal.data.popular ?? false}
                onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, popular: e.target.checked } })}
              />
              Highlight as Popular 🔥
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
    whiteSpace: "nowrap",
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
  primaryAddBtn: { backgroundColor: "#10B981", color: "#FFFFFF", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
  tableContainer: { backgroundColor: "#1E293B", borderRadius: "14px", overflow: "hidden", border: "1px solid #334155" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  assignBtn: { backgroundColor: "#0EA5E9", color: "#FFF", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  editBtn: { backgroundColor: "#3B82F6", color: "#FFF", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  deleteBtn: { backgroundColor: "#EF4444", color: "#FFF", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  searchInput: { width: "100%", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#1E293B", color: "#F8FAFC", border: "1px solid #334155", fontSize: "14px" },
  apiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginTop: "20px" },
  apiCard: { backgroundColor: "#1E293B", borderRadius: "12px", padding: "16px", border: "1px solid #334155" },
  apiHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
  methodTag: { backgroundColor: "#3B82F6", color: "#FFF", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px" },
  apiPath: { color: "#38BDF8", fontSize: "13px", fontWeight: "600" },
  apiDesc: { color: "#94A3B8", fontSize: "13px", margin: 0 },
  modalBackdrop: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { backgroundColor: "#1E293B", padding: "28px", borderRadius: "16px", width: "90%", maxWidth: "480px", border: "1px solid #334155" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", fontSize: "14px", marginTop: "12px" },
  select: { width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0F172A", color: "#F8FAFC", border: "1px solid #334155", fontSize: "14px", marginTop: "12px" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { backgroundColor: "#334155", color: "#FFF", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  confirmBtn: { backgroundColor: "#10B981", color: "#FFF", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
};
