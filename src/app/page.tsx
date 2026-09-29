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
  const [globalSearch, setGlobalSearch] = useState<string>("");

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
      fetch("/api/admin/bookings?limit=50").then((res) => res.json()).then((data) => setBookings(data.bookings || [])).catch(() => {});
      fetch("/api/admin/providers").then((res) => res.json()).then((data) => setProviders(data.providers || [])).catch(() => {});
      fetch("/api/admin/vehicles/catalog").then((res) => res.json()).then((data) => setVehicleCatalog(data.catalog || [])).catch(() => {});
      fetch("/api/admin/slots").then((res) => res.json()).then((data) => setSlotsList(data.slots || [])).catch(() => {});
      fetch("/api/admin/users?limit=50").then((res) => res.json()).then((data) => setUsers(data.users || [])).catch(() => {});
      fetch("/api/admin/services").then((res) => res.json()).then((data) => setServicesList(data.services || [])).catch(() => {});
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm("Populate Supabase cloud database with master initial records (Services, Slots, Vehicle Catalog, Servicemen)?")) return;
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
    if (!confirm("Are you sure you want to remove this serviceman partner?")) return;
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

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") {
      return { background: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" };
    }
    if (s === "pending") {
      return { background: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" };
    }
    if (s === "accepted" || s === "in_progress") {
      return { background: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" };
    }
    return { background: "rgba(244, 63, 94, 0.15)", color: "#FB7185", border: "1px solid rgba(244, 63, 94, 0.3)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" };
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: "📊" },
    { id: "bookings", label: "Live Bookings", icon: "🚗", count: bookings.length },
    { id: "providers", label: "Servicemen & Partners", icon: "👨‍🔧", count: providers.length },
    { id: "vehicles", label: "Vehicle Catalog", icon: "🏎️", count: vehicleCatalog.length },
    { id: "slots", label: "Time Slots", icon: "⏰", count: slotsList.length },
    { id: "services", label: "Services & Pricing", icon: "🧼", count: servicesList.length },
    { id: "users", label: "Users Directory", icon: "👥", count: users.length },
    { id: "api", label: "API Console", icon: "⚡" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#090D16", color: "#F8FAFC", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside style={{ width: "270px", backgroundColor: "#0F172A", borderRight: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Brand Section */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "0.5px", color: "#F8FAFC" }}>SHRAWRASTI</span>
              <span style={{ backgroundColor: "rgba(99, 102, 241, 0.18)", color: "#818CF8", fontSize: "9px", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(99, 102, 241, 0.3)" }}>PRO OS</span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#94A3B8" }}>Operations & API Control Panel</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: "16px 12px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "1px", color: "#64748B", padding: "8px 12px" }}>MAIN MENU</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: isActive ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                  backgroundColor: isActive ? "rgba(99, 102, 241, 0.12)" : "transparent",
                  color: isActive ? "#F8FAFC" : "#94A3B8",
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      backgroundColor: isActive ? "#6366F1" : "rgba(255, 255, 255, 0.06)",
                      color: isActive ? "#FFFFFF" : "#94A3B8",
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Database Live Health Box */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", margin: "12px", borderRadius: "12px", backgroundColor: "rgba(255, 255, 255, 0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8" }}>SUPABASE DB</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", color: health?.status === "healthy" ? "#34D399" : "#FBBF24", fontWeight: "700" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: health?.status === "healthy" ? "#10B981" : "#F59E0B" }} />
              {health?.status === "healthy" ? "CONNECTED" : "CHECKING"}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748B", display: "flex", justifyContent: "space-between" }}>
            <span>Auto Sync: 5s</span>
            <span>{lastUpdated || "Live"}</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        {/* TOP HEADER CONTROL BAR */}
        <header style={{ height: "70px", backgroundColor: "#0F172A", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexShrink: 0 }}>
          {/* Global Search Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "10px", padding: "8px 14px", width: "360px" }}>
            <span style={{ color: "#64748B", fontSize: "14px" }}>🔍</span>
            <input
              type="text"
              placeholder="Search bookings, servicemen, vehicles..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "#F8FAFC", fontSize: "13px", width: "100%" }}
            />
          </div>

          {/* Action Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#34D399",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "700",
                transition: "all 0.2s ease",
              }}
            >
              <span>🌱</span>
              <span>{isSeeding ? "Seeding..." : "Seed Master DB"}</span>
            </button>

            <button
              onClick={fetchData}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(99, 102, 241, 0.12)",
                color: "#818CF8",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              <span>Sync Now</span>
            </button>

            {/* Profile Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "12px", borderLeft: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px", color: "#FFF" }}>
                A
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#F8FAFC" }}>Admin Master</div>
                <div style={{ fontSize: "10px", color: "#64748B" }}>Super Operator</div>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE BODY */}
        <main style={{ padding: "32px", flexGrow: 1 }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "dashboard" && (
            <div>
              {/* Page Title Row */}
              <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Executive Command Center</h1>
                  <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>Real-time overview of orders, revenue, servicemen dispatch & platform metrics</p>
                </div>
              </div>

              {/* KPI CARDS GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                {/* Total Revenue */}
                <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", color: "#94A3B8" }}>TOTAL REVENUE</span>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.15)", color: "#818CF8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>💰</div>
                  </div>
                  <div style={{ fontSize: "30px", fontWeight: "900", color: "#F8FAFC", margin: "14px 0 6px 0" }}>₹{stats?.totalRevenue ?? 0}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                    <span style={{ color: "#34D399", fontWeight: "700" }}>↑ Live</span> Today: ₹{stats?.todayRevenue ?? 0}
                  </div>
                </div>

                {/* Total Bookings */}
                <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", color: "#94A3B8" }}>TOTAL ORDERS</span>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📦</div>
                  </div>
                  <div style={{ fontSize: "30px", fontWeight: "900", color: "#F8FAFC", margin: "14px 0 6px 0" }}>{stats?.totalBookings ?? bookings.length ?? 0}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                    <span style={{ color: "#34D399", fontWeight: "700" }}>● Active</span> Today: {stats?.todayBookingsCount ?? 0} orders
                  </div>
                </div>

                {/* Pending Dispatch */}
                <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", color: "#94A3B8" }}>PENDING DISPATCH</span>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⌛</div>
                  </div>
                  <div style={{ fontSize: "30px", fontWeight: "900", color: "#FBBF24", margin: "14px 0 6px 0" }}>{stats?.pendingBookings ?? 0}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>Awaiting technician assignment</div>
                </div>

                {/* Servicemen Workforce */}
                <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", color: "#94A3B8" }}>SERVICEMEN WORKFORCE</span>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.15)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>👨‍🔧</div>
                  </div>
                  <div style={{ fontSize: "30px", fontWeight: "900", color: "#F8FAFC", margin: "14px 0 6px 0" }}>{providers.length || stats?.activeProviders || 0}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                    <span style={{ color: "#34D399", fontWeight: "700" }}>● {providers.filter((p) => p.isOnline).length} Online</span> Partners
                  </div>
                </div>
              </div>

              {/* RECENT ORDERS TABLE FRAME */}
              <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Recent Customer Orders</h3>
                    <p style={{ fontSize: "12px", color: "#94A3B8", margin: "2px 0 0 0" }}>Live customer dispatches and service tracking</p>
                  </div>
                  <button onClick={() => setActiveTab("bookings")} style={{ background: "transparent", color: "#818CF8", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                    View All Orders ({bookings.length}) →
                  </button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", color: "#64748B", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        <th style={{ padding: "14px 20px" }}>BOOKING ID</th>
                        <th style={{ padding: "14px 20px" }}>CUSTOMER</th>
                        <th style={{ padding: "14px 20px" }}>VEHICLE</th>
                        <th style={{ padding: "14px 20px" }}>SCHEDULE</th>
                        <th style={{ padding: "14px 20px" }}>AMOUNT</th>
                        <th style={{ padding: "14px 20px" }}>STATUS</th>
                        <th style={{ padding: "14px 20px" }}>SERVICEMAN</th>
                        <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "#64748B", fontSize: "14px" }}>
                            No orders recorded yet. Connect mobile app or test via API.
                          </td>
                        </tr>
                      ) : (
                        bookings.slice(0, 8).map((b) => (
                          <tr key={b.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)", transition: "background-color 0.15s ease" }}>
                            <td style={{ padding: "14px 20px", fontFamily: "monospace", color: "#818CF8", fontWeight: "700" }}>#{b.id.substring(0, 8)}</td>
                            <td style={{ padding: "14px 20px" }}>
                              <div style={{ fontWeight: "700", color: "#F8FAFC" }}>{b.user?.name || "Customer"}</div>
                              <div style={{ fontSize: "11px", color: "#64748B" }}>{b.user?.phone || b.userId.substring(0, 8)}</div>
                            </td>
                            <td style={{ padding: "14px 20px" }}>
                              <div style={{ fontWeight: "600", color: "#CBD5E1" }}>{b.vehicleSnapshot?.make || "Car"} {b.vehicleSnapshot?.model || ""}</div>
                              <div style={{ fontSize: "11px", color: "#64748B" }}>{b.vehicleSnapshot?.bodyType || "Standard"}</div>
                            </td>
                            <td style={{ padding: "14px 20px" }}>
                              <div style={{ color: "#E2E8F0", fontWeight: "500" }}>{b.scheduleDate}</div>
                              <div style={{ fontSize: "11px", color: "#64748B" }}>{b.scheduleTime}</div>
                            </td>
                            <td style={{ padding: "14px 20px", fontWeight: "800", color: "#34D399", fontSize: "14px" }}>₹{b.total}</td>
                            <td style={{ padding: "14px 20px" }}>
                              <span style={getStatusBadge(b.status)}>{b.status.toUpperCase()}</span>
                            </td>
                            <td style={{ padding: "14px 20px" }}>
                              {b.assignedProviderId ? (
                                <span style={{ color: "#34D399", fontSize: "12px", fontWeight: "700" }}>
                                  ✓ {providers.find((p) => p.id === b.assignedProviderId)?.name || "Assigned"}
                                </span>
                              ) : (
                                <span style={{ color: "#FBBF24", fontSize: "12px", fontWeight: "600" }}>⚡ Unassigned</span>
                              )}
                            </td>
                            <td style={{ padding: "14px 20px", textAlign: "right" }}>
                              <button
                                onClick={() => {
                                  setAssignModalBooking(b);
                                  setSelectedProviderId(providers[0]?.id || "");
                                }}
                                style={{
                                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                                  color: "#818CF8",
                                  border: "1px solid rgba(99, 102, 241, 0.3)",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                }}
                              >
                                Dispatch Partner
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE BOOKINGS */}
          {activeTab === "bookings" && (
            <div>
              <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Customer Live Bookings ({filteredBookings.length})</h1>
                  <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>Manage customer requests, payments & serviceman dispatching</p>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  {["all", "pending", "accepted", "in_progress", "completed", "cancelled"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setBookingFilterStatus(st)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        border: bookingFilterStatus === st ? "1px solid #6366F1" : "1px solid rgba(255, 255, 255, 0.08)",
                        backgroundColor: bookingFilterStatus === st ? "#6366F1" : "transparent",
                        color: bookingFilterStatus === st ? "#FFF" : "#94A3B8",
                      }}
                    >
                      {st.replace("_", " ").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", color: "#64748B", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <th style={{ padding: "14px 20px" }}>ID</th>
                      <th style={{ padding: "14px 20px" }}>CUSTOMER</th>
                      <th style={{ padding: "14px 20px" }}>SERVICES</th>
                      <th style={{ padding: "14px 20px" }}>PAYMENT</th>
                      <th style={{ padding: "14px 20px" }}>TOTAL</th>
                      <th style={{ padding: "14px 20px" }}>STATUS</th>
                      <th style={{ padding: "14px 20px", textAlign: "right" }}>DISPATCH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "#64748B", fontSize: "14px" }}>
                          No bookings found for the selected status.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <td style={{ padding: "14px 20px", fontFamily: "monospace", color: "#818CF8", fontWeight: "700" }}>#{b.id.substring(0, 8)}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontWeight: "700", color: "#F8FAFC" }}>{b.user?.name || b.userId}</div>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>{b.user?.phone || "N/A"}</div>
                          </td>
                          <td style={{ padding: "14px 20px", color: "#93C5FD", fontWeight: "600" }}>
                            {(b.services || []).map((s: any) => s.name || s.id).join(", ") || "Vehicle Wash"}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ fontSize: "12px", color: "#CBD5E1" }}>
                              {b.paymentMethod || "COD"} ({b.paymentStatus || "pending"})
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", fontWeight: "800", color: "#34D399", fontSize: "14px" }}>₹{b.total}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={getStatusBadge(b.status)}>{b.status.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "right" }}>
                            <button
                              onClick={() => {
                                setAssignModalBooking(b);
                                setSelectedProviderId(providers[0]?.id || "");
                              }}
                              style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                            >
                              Dispatch Partner
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

          {/* TAB 3: SERVICEMEN & PARTNERS */}
          {activeTab === "providers" && (
            <div>
              <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Servicemen & Partners ({filteredProviders.length})</h1>
                  <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>Manage serviceman profiles, availability, ratings & job metrics</p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search serviceman name, phone..."
                    value={servicemanSearch}
                    onChange={(e) => setServicemanSearch(e.target.value)}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 14px", color: "#FFF", fontSize: "13px", width: "240px" }}
                  />
                  <button
                    onClick={() =>
                      setProviderModal({
                        open: true,
                        isEdit: false,
                        data: { name: "", phone: "", email: "", status: "active", rating: 5.0 },
                      })
                    }
                    style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}
                  >
                    ➕ Add Serviceman
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", color: "#64748B", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <th style={{ padding: "14px 20px" }}>SERVICEMAN ID</th>
                      <th style={{ padding: "14px 20px" }}>NAME</th>
                      <th style={{ padding: "14px 20px" }}>CONTACT</th>
                      <th style={{ padding: "14px 20px" }}>RATING</th>
                      <th style={{ padding: "14px 20px" }}>COMPLETED JOBS</th>
                      <th style={{ padding: "14px 20px" }}>STATUS</th>
                      <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProviders.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "#64748B", fontSize: "14px" }}>
                          No servicemen registered yet. Click "Add Serviceman" to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredProviders.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <td style={{ padding: "14px 20px", fontFamily: "monospace", color: "#818CF8", fontWeight: "700" }}>#{p.id.substring(0, 8)}</td>
                          <td style={{ padding: "14px 20px", fontWeight: "700", color: "#F8FAFC" }}>{p.name}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <div>{p.phone}</div>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>{p.email || "No email"}</div>
                          </td>
                          <td style={{ padding: "14px 20px", fontWeight: "800", color: "#F59E0B" }}>⭐ {p.rating || "5.0"}</td>
                          <td style={{ padding: "14px 20px", fontWeight: "600", color: "#CBD5E1" }}>{p.totalJobs || 0} Jobs</td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ color: p.isOnline ? "#34D399" : "#F43F5E", fontWeight: "700", fontSize: "12px" }}>
                              ● {p.isOnline ? "ONLINE" : "OFFLINE"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "right" }}>
                            <button
                              onClick={() => setProviderModal({ open: true, isEdit: true, data: { ...p } })}
                              style={{ backgroundColor: "rgba(255, 255, 255, 0.06)", color: "#CBD5E1", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontSize: "12px" }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProvider(p.id)}
                              style={{ backgroundColor: "rgba(244, 63, 94, 0.15)", color: "#FB7185", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                            >
                              🗑️ Remove
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

          {/* TAB 4: VEHICLE CATALOG */}
          {activeTab === "vehicles" && (
            <div>
              <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Master Vehicle Catalog ({filteredVehicles.length})</h1>
                  <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>Configure 2W & 4W vehicle brands, models and body types</p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search brand, model, category..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 14px", color: "#FFF", fontSize: "13px", width: "240px" }}
                  />
                  <button
                    onClick={() =>
                      setVehicleModal({
                        open: true,
                        isEdit: false,
                        data: { brand: "", model: "", category: "Car", bodyType: "Hatchback", brandIcon: "", modelImage: "" },
                      })
                    }
                    style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}
                  >
                    ➕ Add Model
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", color: "#64748B", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <th style={{ padding: "14px 20px" }}>BRAND</th>
                      <th style={{ padding: "14px 20px" }}>MODEL</th>
                      <th style={{ padding: "14px 20px" }}>CATEGORY</th>
                      <th style={{ padding: "14px 20px" }}>BODY TYPE</th>
                      <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.slice(0, 100).map((v) => (
                      <tr key={v.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "14px 20px", fontWeight: "800", color: "#38BDF8", fontSize: "14px" }}>{v.brand}</td>
                        <td style={{ padding: "14px 20px", fontWeight: "700", color: "#F8FAFC" }}>{v.model}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", backgroundColor: v.category?.includes("Bike") ? "rgba(139, 92, 246, 0.15)" : "rgba(59, 130, 246, 0.15)", color: v.category?.includes("Bike") ? "#A78BFA" : "#60A5FA" }}>
                            {v.category}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ backgroundColor: "rgba(255, 255, 255, 0.06)", color: "#CBD5E1", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>{v.bodyType || "Standard"}</span>
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <button
                            onClick={() => setVehicleModal({ open: true, isEdit: true, data: { ...v } })}
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.06)", color: "#CBD5E1", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontSize: "12px" }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id)}
                            style={{ backgroundColor: "rgba(244, 63, 94, 0.15)", color: "#FB7185", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                          >
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
              <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Booking Time Slots ({slotsList.length})</h1>
                  <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>Set daily dispatch time windows & max booking capacity</p>
                </div>

                <button
                  onClick={() =>
                    setSlotModal({
                      open: true,
                      isEdit: false,
                      data: { slotTime: "", maxCapacity: 10, isActive: true },
                    })
                  }
                  style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}
                >
                  ➕ Add Time Slot
                </button>
              </div>

              <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", color: "#64748B", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <th style={{ padding: "14px 20px" }}>TIME WINDOW</th>
                      <th style={{ padding: "14px 20px" }}>MAX DAILY CAPACITY</th>
                      <th style={{ padding: "14px 20px" }}>STATUS</th>
                      <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotsList.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "14px 20px", fontWeight: "700", color: "#F8FAFC", fontSize: "15px" }}>⏰ {s.slotTime}</td>
                        <td style={{ padding: "14px 20px", fontWeight: "700", color: "#60A5FA" }}>{s.maxCapacity || 10} Orders / Day</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ color: s.isActive ? "#34D399" : "#F43F5E", fontWeight: "700", fontSize: "12px" }}>
                            ● {s.isActive ? "ACTIVE & OPEN" : "DISABLED"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <button
                            onClick={() => setSlotModal({ open: true, isEdit: true, data: { ...s } })}
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.06)", color: "#CBD5E1", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontSize: "12px" }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(s.id)}
                            style={{ backgroundColor: "rgba(244, 63, 94, 0.15)", color: "#FB7185", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                          >
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
              <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Services & Dynamic Pricing Catalog ({servicesList.length})</h1>
                  <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>Configure vehicle wash packages, add-ons, pricing & service duration</p>
                </div>

                <button
                  onClick={() =>
                    setServiceModal({
                      open: true,
                      isEdit: false,
                      data: { name: "", description: "", category: "package", basePrice: "", durationMinutes: 45, popular: false, isActive: true },
                    })
                  }
                  style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}
                >
                  ➕ Add New Service
                </button>
              </div>

              <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", color: "#64748B", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <th style={{ padding: "14px 20px" }}>SERVICE NAME</th>
                      <th style={{ padding: "14px 20px" }}>CATEGORY</th>
                      <th style={{ padding: "14px 20px" }}>BASE PRICE</th>
                      <th style={{ padding: "14px 20px" }}>DURATION</th>
                      <th style={{ padding: "14px 20px" }}>FEATURED</th>
                      <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesList.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ fontWeight: "700", color: "#F8FAFC", fontSize: "14px" }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748B" }}>{s.description}</div>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", backgroundColor: s.category === "package" ? "rgba(99, 102, 241, 0.15)" : "rgba(245, 158, 11, 0.15)", color: s.category === "package" ? "#818CF8" : "#FBBF24" }}>
                            {s.category?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", fontWeight: "900", color: "#34D399", fontSize: "15px" }}>₹{s.basePrice}</td>
                        <td style={{ padding: "14px 20px", color: "#CBD5E1" }}>{s.durationMinutes || 45} mins</td>
                        <td style={{ padding: "14px 20px" }}>
                          {s.popular ? <span style={{ color: "#F59E0B", fontWeight: "800" }}>⭐ POPULAR</span> : <span style={{ color: "#64748B" }}>Standard</span>}
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <button
                            onClick={() => setServiceModal({ open: true, isEdit: true, data: { ...s } })}
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.06)", color: "#CBD5E1", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontSize: "12px" }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteService(s.id)}
                            style={{ backgroundColor: "rgba(244, 63, 94, 0.15)", color: "#FB7185", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                          >
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

          {/* TAB 7: USERS DIRECTORY */}
          {activeTab === "users" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Registered Customers ({users.length})</h1>
                <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>User profile directory and mobile app registered accounts</p>
              </div>

              <div style={{ backgroundColor: "#0F172A", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", color: "#64748B", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <th style={{ padding: "14px 20px" }}>USER ID</th>
                      <th style={{ padding: "14px 20px" }}>NAME</th>
                      <th style={{ padding: "14px 20px" }}>PHONE</th>
                      <th style={{ padding: "14px 20px" }}>EMAIL</th>
                      <th style={{ padding: "14px 20px" }}>REGISTERED ON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "48px", color: "#64748B", fontSize: "14px" }}>
                          No users registered yet.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <td style={{ padding: "14px 20px", fontFamily: "monospace", color: "#818CF8", fontWeight: "700" }}>#{u.id.substring(0, 8)}</td>
                          <td style={{ padding: "14px 20px", fontWeight: "700", color: "#F8FAFC" }}>{u.name}</td>
                          <td style={{ padding: "14px 20px", color: "#CBD5E1" }}>{u.phone || "N/A"}</td>
                          <td style={{ padding: "14px 20px", color: "#94A3B8" }}>{u.email || "N/A"}</td>
                          <td style={{ padding: "14px 20px", color: "#64748B" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: API CONSOLE */}
          {activeTab === "api" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>API Endpoints Console</h1>
                <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>Live RESTful API documentation and mobile backend endpoints</p>
              </div>

              <div style={{ display: "grid", gap: "16px" }}>
                {[
                  { method: "GET", path: "/api/health", desc: "Database health check & connection monitor" },
                  { method: "GET", path: "/api/admin/dashboard/stats", desc: "Admin analytics KPI aggregator" },
                  { method: "GET", path: "/api/admin/bookings", desc: "Paginated customer bookings & status manager" },
                  { method: "POST", path: "/api/admin/bookings/assign", desc: "Dispatch & assign serviceman to booking" },
                  { method: "GET / POST / PUT / DELETE", path: "/api/admin/providers", desc: "Servicemen & partner workforce CRUD" },
                  { method: "GET / POST / PUT / DELETE", path: "/api/admin/vehicles/catalog", desc: "Master vehicle brand & model catalog CRUD" },
                  { method: "GET / POST / PUT / DELETE", path: "/api/admin/slots", desc: "Booking time slots & capacity manager CRUD" },
                  { method: "GET / POST / PUT / DELETE", path: "/api/admin/services", desc: "Service offerings & dynamic pricing catalog CRUD" },
                  { method: "GET", path: "/api/admin/users", desc: "Customer user directory & profile records" },
                  { method: "POST", path: "/api/admin/seed", desc: "Seed database with initial master catalog records" },
                ].map((api, idx) => (
                  <div key={idx} style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ backgroundColor: api.method.includes("POST") ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)", color: api.method.includes("POST") ? "#34D399" : "#818CF8", fontSize: "11px", fontWeight: "800", padding: "6px 12px", borderRadius: "6px", fontFamily: "monospace" }}>
                        {api.method}
                      </span>
                      <code style={{ fontSize: "14px", fontWeight: "700", color: "#F8FAFC" }}>{api.path}</code>
                    </div>
                    <div style={{ fontSize: "13px", color: "#94A3B8" }}>{api.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DISPATCH ASSIGN PROVIDER MODAL */}
      {assignModalBooking && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "16px", padding: "28px", width: "440px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>Dispatch Serviceman Partner</h3>
            <p style={{ fontSize: "12px", color: "#94A3B8", margin: "6px 0 20px 0" }}>Assign an active serviceman to Booking #{assignModalBooking.id.substring(0, 8)}</p>

            <label style={{ fontSize: "12px", fontWeight: "700", color: "#CBD5E1", display: "block", marginBottom: "8px" }}>Select Serviceman:</label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px", outline: "none", marginBottom: "24px" }}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone}) - {p.isOnline ? "🟢 Online" : "🔴 Offline"}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setAssignModalBooking(null)} style={{ backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                Cancel
              </button>
              <button onClick={handleAssignProvider} style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROVIDER MODAL */}
      {providerModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "16px", padding: "28px", width: "460px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>{providerModal.isEdit ? "Edit Serviceman Profile" : "Add New Serviceman"}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Full Name *</label>
                <input
                  type="text"
                  value={providerModal.data.name || ""}
                  onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, name: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Phone Number *</label>
                <input
                  type="text"
                  value={providerModal.data.phone || ""}
                  onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, phone: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Email Address</label>
                <input
                  type="text"
                  value={providerModal.data.email || ""}
                  onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, email: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setProviderModal({ open: false, isEdit: false, data: {} })} style={{ backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                Cancel
              </button>
              <button onClick={handleSaveProvider} style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                Save Serviceman
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE MODAL */}
      {vehicleModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "16px", padding: "28px", width: "460px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>{vehicleModal.isEdit ? "Edit Vehicle Model" : "Add Vehicle Model"}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tata, Hyundai, Honda"
                  value={vehicleModal.data.brand || ""}
                  onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, brand: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Model Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Nexon, Creta, Activa 6G"
                  value={vehicleModal.data.model || ""}
                  onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, model: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Category</label>
                <select
                  value={vehicleModal.data.category || "Car"}
                  onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, category: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                >
                  <option value="Car">Car (4W)</option>
                  <option value="Bike">Bike / Two Wheeler (2W)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Body Type Classification</label>
                <input
                  type="text"
                  placeholder="e.g. SUV, Sedan, Hatchback, Scooter"
                  value={vehicleModal.data.bodyType || ""}
                  onChange={(e) => setVehicleModal({ ...vehicleModal, data: { ...vehicleModal.data, bodyType: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setVehicleModal({ open: false, isEdit: false, data: {} })} style={{ backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                Cancel
              </button>
              <button onClick={handleSaveVehicle} style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                Save Vehicle Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE MODAL */}
      {serviceModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "16px", padding: "28px", width: "480px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>{serviceModal.isEdit ? "Edit Service Offering" : "Add New Service Offering"}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Snow Foam Wash"
                  value={serviceModal.data.name || ""}
                  onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, name: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Description</label>
                <textarea
                  placeholder="Detailed description of cleaning service..."
                  value={serviceModal.data.description || ""}
                  onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, description: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px", height: "70px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Base Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="699"
                    value={serviceModal.data.basePrice ?? ""}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, basePrice: e.target.value } })}
                    style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Category</label>
                  <select
                    value={serviceModal.data.category || "package"}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, category: e.target.value } })}
                    style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                  >
                    <option value="package">Package</option>
                    <option value="add_on">Add-On</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setServiceModal({ open: false, isEdit: false, data: {} })} style={{ backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                Cancel
              </button>
              <button onClick={handleSaveService} style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLOT MODAL */}
      {slotModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "16px", padding: "28px", width: "440px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>{slotModal.isEdit ? "Edit Booking Slot" : "Add Booking Slot"}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Time Slot Window *</label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM - 11:00 AM"
                  value={slotModal.data.slotTime || ""}
                  onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, slotTime: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Max Capacity Per Day</label>
                <input
                  type="number"
                  placeholder="10"
                  value={slotModal.data.maxCapacity ?? 10}
                  onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, maxCapacity: e.target.value } })}
                  style={{ width: "100%", backgroundColor: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "10px", color: "#FFF", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setSlotModal({ open: false, isEdit: false, data: {} })} style={{ backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                Cancel
              </button>
              <button onClick={handleSaveSlot} style={{ backgroundColor: "#6366F1", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                Save Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
