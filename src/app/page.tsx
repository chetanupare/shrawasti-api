"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Grid,
  Stack,
  HStack,
  VStack,
  Heading,
  Text,
  Badge,
  Button,
  Input,
  Spinner,
  Card,
  Table,
  IconButton,
} from "@chakra-ui/react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  UserCheck,
  Wrench,
  Clock,
  Car,
  Activity,
  Terminal,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  Database,
  DollarSign,
  Send,
  Sparkles,
  ShieldCheck,
  Edit,
  Trash2,
  Menu,
  X,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  Bike,
  Ticket,
  Star,
  Bell,
  Percent,
  LogOut,
} from "lucide-react";

const BODY_PRICE_FIELDS = [
  { key: "scooter", label: "Scooter" },
  { key: "bike", label: "Bike" },
  { key: "sport_bike", label: "Sport bike" },
  { key: "cruiser", label: "Cruiser" },
  { key: "hatchback", label: "Hatchback" },
  { key: "sedan", label: "Sedan" },
  { key: "suv", label: "SUV" },
  { key: "7_seater", label: "7 seater" },
] as const;

function blankServiceForm() {
  return {
    name: "",
    category: "car_wash",
    vehicleType: "4W",
    bodyType: "All",
    basePrice: 499,
    durationMinutes: "45",
    description: "",
    prices: Object.fromEntries(BODY_PRICE_FIELDS.map((field) => [field.key, ""])) as Record<string, string>,
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "bookings"
    | "users"
    | "providers"
    | "services"
    | "slots"
    | "vehicles"
    | "coupons"
    | "subscriptions"
    | "reviews"
    | "notifications"
    | "health"
    | "api"
  >("overview");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const router = useRouter();
  
  // Real-time Search & Filter inputs
  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Services filters
  const [serviceVehicleFilter, setServiceVehicleFilter] = useState("all");
  const [serviceBodyTypeFilter, setServiceBodyTypeFilter] = useState("all");

  // Vehicle Catalog filters
  const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState("all");
  const [vehicleBodyTypeFilter, setVehicleBodyTypeFilter] = useState("all");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>({
    totalBookings: 0,
    confirmedBookings: 0,
    totalUsers: 0,
    activeProviders: 0,
    totalRevenue: 0,
    statusBreakdown: {},
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);


  // New Module States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [deviceTokens, setDeviceTokens] = useState<any[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  // Modals for Coupon, Plan, Broadcast
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [couponForm, setCouponForm] = useState({ code: "", description: "", discountType: "fixed", discountValue: 100, minOrderAmount: 299, maxDiscountAmount: 500, maxRedemptions: 100, isActive: true });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({ name: "", description: "", basePrice: 899, validityDays: "30", popular: false, isActive: true });

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", targetAudience: "all" });

  // API console tester
  const [apiEndpoint, setApiEndpoint] = useState("/api/admin/bookings");
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiTesting, setApiTesting] = useState(false);

  // Modal states
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ brand: "", model: "", category: "Car", bodyType: "Hatchback", modelImage: "" });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState(blankServiceForm);

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [providerForm, setProviderForm] = useState({ name: "", phone: "", email: "", rating: "5.0", status: "active" });

  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [slotForm, setSlotForm] = useState({ slotTime: "10:00 AM - 11:00 AM", maxCapacity: 10, isActive: true });

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [bookingStatusForm, setBookingStatusForm] = useState("pending");
  const [bookingProviderForm, setBookingProviderForm] = useState("");

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({ name: "", phone: "", email: "", role: "user" });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [
        statsRes,
        bookingsRes,
        usersRes,
        providersRes,
        servicesRes,
        slotsRes,
        vehiclesRes,
        couponsRes,
        subsRes,
        reviewsRes,
        notifsRes,
      ] = await Promise.all([
        authFetch("/api/admin/dashboard/stats").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/bookings").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/users").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/providers").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/services").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/slots").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/vehicles/catalog").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/coupons").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/subscriptions").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/reviews").then((r) => r.json()).catch(() => ({})),
        authFetch("/api/admin/notifications/broadcast").then((r) => r.json()).catch(() => ({})),
      ]);

      if (statsRes.success) setStats(statsRes.stats);

      setBookings(Array.isArray(bookingsRes) ? bookingsRes : bookingsRes.bookings || []);
      setUsers(Array.isArray(usersRes) ? usersRes : usersRes.users || []);
      setProviders(Array.isArray(providersRes) ? providersRes : providersRes.providers || []);
      setServices(Array.isArray(servicesRes) ? servicesRes : servicesRes.services || []);
      setSlots(Array.isArray(slotsRes) ? slotsRes : slotsRes.slots || []);
      setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes : vehiclesRes.catalog || vehiclesRes.vehicles || []);
      setCoupons(Array.isArray(couponsRes) ? couponsRes : couponsRes.coupons || []);
      setSubscriptions(Array.isArray(subsRes) ? subsRes : subsRes.plans || []);
      setUserSubscriptions(Array.isArray(subsRes?.userSubscriptions) ? subsRes.userSubscriptions : []);
      setReviews(Array.isArray(reviewsRes) ? reviewsRes : reviewsRes.reviews || []);
      setDeviceTokens(Array.isArray(notifsRes?.deviceTokens) ? notifsRes.deviceTokens : []);
      setBroadcastHistory(Array.isArray(notifsRes?.history) ? notifsRes.history : []);

    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      if (err.message && err.message.includes("Forbidden")) {
        setAuthError("You do not have permission to access the admin dashboard.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setAuthChecking(false);
        fetchAllData();
      }
    };
    checkSession();

    const interval = setInterval(() => {
      if (!authChecking) fetchAllData();
    }, 5000);
    return () => clearInterval(interval);
  }, [authChecking, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Database seeded successfully with live records!");
        await fetchAllData(true);
      } else {
        showToast("Seeding result: " + (data.error || "Completed"));
      }
    } catch (err) {
      showToast("Error executing seed");
    } finally {
      setSeeding(false);
    }
  };

  // CRUD Handlers
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingVehicle ? "PUT" : "POST";
      const payload = editingVehicle ? { id: editingVehicle.id, ...vehicleForm } : vehicleForm;
      const res = await authFetch("/api/admin/vehicles/catalog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingVehicle ? "Vehicle model updated!" : "Vehicle model added to catalog!");
        setShowVehicleModal(false);
        setEditingVehicle(null);
        setVehicleForm({ brand: "", model: "", category: "Car", bodyType: "Hatchback", modelImage: "" });
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to save vehicle"));
      }
    } catch (err) {
      showToast("Failed to connect to API");
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle from catalog?")) return;
    try {
      const res = await authFetch(`/api/admin/vehicles/catalog?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Vehicle model deleted!");
        fetchAllData(true);
      } else {
        showToast("Failed to delete vehicle");
      }
    } catch (err) {
      showToast("Error executing delete");
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingService ? "PUT" : "POST";
      const payload = editingService ? { id: editingService.id, ...serviceForm } : serviceForm;
      const res = await authFetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingService ? "Service updated!" : "New service created!");
        setShowServiceModal(false);
        setEditingService(null);
        setServiceForm(blankServiceForm());
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to save service"));
      }
    } catch (err) {
      showToast("Failed to save service");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await authFetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Service deleted!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error deleting service");
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProvider ? "PUT" : "POST";
      const payload = editingProvider ? { id: editingProvider.id, ...providerForm } : providerForm;
      const res = await authFetch("/api/admin/providers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingProvider ? "Provider details updated!" : "New provider registered!");
        setShowProviderModal(false);
        setEditingProvider(null);
        setProviderForm({ name: "", phone: "", email: "", rating: "5.0", status: "active" });
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to save provider"));
      }
    } catch (err) {
      showToast("Failed to save provider");
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Are you sure you want to remove this provider?")) return;
    try {
      const res = await authFetch(`/api/admin/providers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Provider removed!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error removing provider");
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingSlot ? "PUT" : "POST";
      const payload = editingSlot ? { id: editingSlot.id, ...slotForm } : slotForm;
      const res = await authFetch("/api/admin/slots", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingSlot ? "Time slot updated!" : "New time slot created!");
        setShowSlotModal(false);
        setEditingSlot(null);
        setSlotForm({ slotTime: "10:00 AM - 11:00 AM", maxCapacity: 10, isActive: true });
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to save slot"));
      }
    } catch (err) {
      showToast("Failed to save slot");
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return;
    try {
      const res = await authFetch(`/api/admin/slots?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Time slot deleted!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error deleting slot");
    }
  };

  const handleUpdateSlotCapacity = async (slot: any, newCap: number) => {
    if (newCap < 1) return;
    try {
      const res = await authFetch("/api/admin/slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slot.id,
          maxCapacity: newCap,
        }),
      });
      if (res.ok) {
        showToast(`Slot capacity updated to ${newCap}`);
        fetchAllData(true);
      } else {
        showToast("Failed to update slot capacity");
      }
    } catch (err) {
      showToast("Error updating capacity");
    }
  };

  const handleToggleSlotStatus = async (slot: any) => {
    const currentActive = slot.isActive ?? slot.is_active ?? true;
    const newActive = !currentActive;
    try {
      const res = await authFetch("/api/admin/slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slot.id,
          isActive: newActive,
        }),
      });
      if (res.ok) {
        showToast(newActive ? "Slot opened for bookings" : "Slot closed");
        fetchAllData(true);
      } else {
        showToast("Failed to toggle slot status");
      }
    } catch (err) {
      showToast("Error toggling slot status");
    }
  };


  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCoupon ? "PUT" : "POST";
      const payload = editingCoupon ? { id: editingCoupon.id, ...couponForm } : couponForm;
      const res = await authFetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingCoupon ? "Coupon updated!" : "New coupon code created!");
        setShowCouponModal(false);
        setEditingCoupon(null);
        setCouponForm({ code: "", description: "", discountType: "fixed", discountValue: 100, minOrderAmount: 299, maxDiscountAmount: 500, maxRedemptions: 100, isActive: true });
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to save coupon"));
      }
    } catch (err) {
      showToast("Failed to save coupon");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon code?")) return;
    try {
      const res = await authFetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Coupon code deleted!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error deleting coupon");
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingPlan ? "PUT" : "POST";
      const payload = editingPlan ? { id: editingPlan.id, ...planForm } : planForm;
      const res = await authFetch("/api/admin/subscriptions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingPlan ? "CarePass plan updated!" : "New CarePass plan created!");
        setShowPlanModal(false);
        setEditingPlan(null);
        setPlanForm({ name: "", description: "", basePrice: 899, validityDays: "30", popular: false, isActive: true });
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to save plan"));
      }
    } catch (err) {
      showToast("Failed to save plan");
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this CarePass plan?")) return;
    try {
      const res = await authFetch(`/api/admin/subscriptions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("CarePass plan deleted!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error deleting plan");
    }
  };

  const handleToggleReviewPublished = async (review: any) => {
    try {
      const res = await authFetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, isPublished: !review.isPublished }),
      });
      if (res.ok) {
        showToast(!review.isPublished ? "Review published!" : "Review hidden");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error toggling review");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    try {
      const res = await authFetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Review deleted!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error deleting review");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Broadcast notification sent to ${data.recipientsCount || 0} registered devices!`);
        setShowBroadcastModal(false);
        setBroadcastForm({ title: "", message: "", targetAudience: "all" });
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to send notification"));
      }
    } catch (err) {
      showToast("Failed to send broadcast");
    }
  };

  const handleSaveBooking = async () => {
    if (!editingBooking) return;
    try {
      const res = await authFetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBooking.id,
          status: bookingStatusForm,
          assignedProviderId: bookingProviderForm || null,
        }),
      });
      if (res.ok) {
        showToast("Booking updated successfully!");
        setShowBookingModal(false);
        setEditingBooking(null);
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to update booking"));
      }
    } catch (err) {
      showToast("Failed to update booking");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking record?")) return;
    try {
      const res = await authFetch(`/api/admin/bookings?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Booking record deleted!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error deleting booking");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await authFetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      if (res.ok) {
        showToast("User details updated!");
        setShowUserModal(false);
        setEditingUser(null);
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to update user"));
      }
    } catch (err) {
      showToast("Failed to update user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await authFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("User account deleted!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error deleting user");
    }
  };

  const executeApiTest = async () => {
    setApiTesting(true);
    setApiResponse(null);
    try {
      const res = await authFetch(apiEndpoint, { method: apiMethod });
      const data = await res.json();
      setApiResponse({ status: res.status, ok: res.ok, data });
    } catch (err: any) {
      setApiResponse({ status: 500, ok: false, error: err.message });
    } finally {
      setApiTesting(false);
    }
  };

  const copyResponseJson = () => {
    if (apiResponse) {
      navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  // High contrast status color mapper
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return { bg: "rgba(20, 184, 166, 0.25)", color: "#5EEAD4", border: "rgba(45, 212, 191, 0.5)" };
      case "completed":
        return { bg: "rgba(16, 185, 129, 0.25)", color: "#6EE7B7", border: "rgba(52, 211, 153, 0.5)" };
      case "in_progress":
        return { bg: "rgba(59, 130, 246, 0.25)", color: "#93C5FD", border: "rgba(96, 165, 250, 0.5)" };
      case "cancelled":
        return { bg: "rgba(239, 68, 68, 0.25)", color: "#FCA5A5", border: "rgba(248, 113, 113, 0.5)" };
      default:
        return { bg: "rgba(245, 158, 11, 0.25)", color: "#FDE047", border: "rgba(251, 191, 36, 0.5)" };
    }
  };

  // --- FILTERED DATA SETS ---
  const filteredBookings = bookings.filter((b) => {
    const q = globalSearch.toLowerCase();
    const custName = (b.user?.name || b.users?.name || "").toLowerCase();
    const custPhone = (b.user?.phone || b.users?.phone || b.user?.email || b.users?.email || "").toLowerCase();
    const serviceName = (b.services?.name || b.service_name || "").toLowerCase();
    const matchesQuery = !q || b.id?.toLowerCase().includes(q) || custName.includes(q) || custPhone.includes(q) || serviceName.includes(q) || b.status?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || b.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesQuery && matchesStatus;
  });

  const filteredUsers = users.filter((u) => {
    const q = globalSearch.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const filteredProviders = providers.filter((p) => {
    const q = globalSearch.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.status?.toLowerCase().includes(q);
  });

  const filteredServices = services.filter((s) => {
    const q = globalSearch.toLowerCase();
    const matchesQuery = !q || s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    
    const rawVType = (s.vehicleType || s.vehicle_type || "").toUpperCase();
    const rawCat = (s.category || "").toLowerCase();
    const rawName = (s.name || "").toLowerCase();
    const is2W = rawVType.includes("2W") || rawVType.includes("BIKE") || rawCat.includes("2w") || rawCat.includes("bike") || rawName.includes("2w") || rawName.includes("bike");

    let matchesVehicle = true;
    if (serviceVehicleFilter === "2W") {
      matchesVehicle = is2W;
    } else if (serviceVehicleFilter === "4W") {
      matchesVehicle = !is2W;
    }

    const bType = (s.bodyType || s.body_type || "").toLowerCase();
    const matchesBody = serviceBodyTypeFilter === "all" || !bType || bType === "all" || bType.includes(serviceBodyTypeFilter.toLowerCase());

    return matchesQuery && matchesVehicle && matchesBody;
  });

  const filteredSlots = slots.filter((s) => {
    const q = globalSearch.toLowerCase();
    const slotStr = (s.slotTime || s.slot_time || s.time || "").toLowerCase();
    return !q || slotStr.includes(q);
  });

  const filteredVehicles = vehicles.filter((v) => {
    const q = globalSearch.toLowerCase();
    const matchesQuery = !q || v.brand?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q) || v.bodyType?.toLowerCase().includes(q);
    
    const catStr = (v.category || "Car").toLowerCase();
    const matchesCategory = vehicleCategoryFilter === "all" ||
      (vehicleCategoryFilter === "Car" && (catStr.includes("car") || catStr.includes("4w"))) ||
      (vehicleCategoryFilter === "Bike" && (catStr.includes("bike") || catStr.includes("2w")));

    const bodyStr = (v.bodyType || v.body_type || "all").toLowerCase();
    const matchesBody = vehicleBodyTypeFilter === "all" || bodyStr.includes(vehicleBodyTypeFilter.toLowerCase());

    return matchesQuery && matchesCategory && matchesBody;
  });

  const sidebarNavItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings", icon: CalendarCheck, count: bookings.length },
    { id: "users", label: "Registered Users", icon: Users, count: users.length },
    { id: "providers", label: "Service Providers", icon: UserCheck, count: providers.length },
    { id: "services", label: "Services Catalog", icon: Wrench, count: services.length },
    { id: "slots", label: "Time Slots", icon: Clock, count: slots.length },
    { id: "vehicles", label: "Vehicle Catalog", icon: Car, count: vehicles.length },
    { id: "coupons", label: "Coupons & Promos", icon: Ticket, count: coupons.length },
    { id: "subscriptions", label: "CarePass Subscriptions", icon: Sparkles, count: subscriptions.length },
    { id: "reviews", label: "Customer Reviews", icon: Star, count: reviews.length },
    { id: "notifications", label: "Broadcast Push", icon: Bell, count: deviceTokens.length },
  ];

  const sidebarContent = (
    <VStack align="stretch" p="2.5" gap="1" flex="1">
      <Text fontSize="10px" fontWeight="bold" color="#94A3B8" px="2.5" pt="1" pb="1" textTransform="uppercase" letterSpacing="wider">
        Management Modules
      </Text>

      {sidebarNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <Button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as any);
              setIsMobileMenuOpen(false);
            }}
            variant="ghost"
            justifyContent="space-between"
            w="full"
            h="36px"
            px="3"
            borderRadius="lg"
            bg={isActive ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "transparent"}
            color={isActive ? "#FFFFFF" : "#E2E8F0"}
            boxShadow={isActive ? "0 4px 12px rgba(37, 99, 235, 0.4)" : "none"}
            _hover={{ bg: isActive ? "blue.600" : "rgba(255, 255, 255, 0.08)", color: "#FFFFFF" }}
            fontWeight={isActive ? "bold" : "medium"}
            transition="all 0.2s"
          >
            <HStack gap="2.5">
              <Icon size={16} color={isActive ? "#FFFFFF" : "#CBD5E1"} />
              <Text fontSize="xs">{item.label}</Text>
            </HStack>
            {item.count !== undefined && (
              <Badge
                borderRadius="full"
                px="2"
                py="0"
                fontSize="10px"
                bg={isActive ? "whiteAlpha.300" : "rgba(255, 255, 255, 0.15)"}
                color={isActive ? "#FFFFFF" : "#F8FAFC"}
              >
                {item.count}
              </Badge>
            )}
          </Button>
        );
      })}

      <Text fontSize="10px" fontWeight="bold" color="#94A3B8" px="2.5" pt="3" pb="1" textTransform="uppercase" letterSpacing="wider">
        System & Developer
      </Text>

      {[
        { id: "health", label: "Database & Health", icon: Activity },
        { id: "api", label: "API Console", icon: Terminal },
      ].map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <Button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as any);
              setIsMobileMenuOpen(false);
            }}
            variant="ghost"
            justifyContent="flex-start"
            gap="2.5"
            w="full"
            h="36px"
            px="3"
            borderRadius="lg"
            bg={isActive ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "transparent"}
            color={isActive ? "#FFFFFF" : "#E2E8F0"}
            boxShadow={isActive ? "0 4px 12px rgba(37, 99, 235, 0.4)" : "none"}
            _hover={{ bg: isActive ? "blue.600" : "rgba(255, 255, 255, 0.08)", color: "#FFFFFF" }}
          >
            <Icon size={16} color={isActive ? "#FFFFFF" : "#CBD5E1"} />
            <Text fontSize="xs">{item.label}</Text>
          </Button>
        );
      })}
      
      <Button
        mt="auto"
        mb="4"
        mx="3"
        onClick={handleLogout}
        variant="ghost"
        justifyContent="flex-start"
        w="calc(100% - 24px)"
        h="36px"
        px="3"
        borderRadius="lg"
        color="red.400"
        _hover={{ bg: "rgba(239, 68, 68, 0.1)", color: "red.300" }}
      >
        <HStack>
          <LogOut size={16} />
          <Text fontSize="sm">Logout</Text>
        </HStack>
      </Button>
    </VStack>
  );

  return (
    <Flex minH="100vh" bg="#0B0F19" color="#F8FAFC" flexDir="column" fontFamily="'Inter', sans-serif">
      {/* Auth Error Overlay */}
      {authError && (
        <Flex position="fixed" inset={0} bg="#0B0F19" zIndex={10000} align="center" justify="center" direction="column" p={6} textAlign="center">
          <ShieldCheck size={48} color="#EF4444" />
          <Heading mt={4} size="md" color="white">{authError}</Heading>
          <Text mt={2} color="gray.400">Please log in with an administrator account.</Text>
          <Button mt={6} colorScheme="blue" onClick={handleLogout}>Sign Out</Button>
        </Flex>
      )}

      {/* Full Screen Loading Overlay while checking auth */}
      {authChecking && (
        <Flex position="fixed" inset={0} bg="#0B0F19" zIndex={9999} align="center" justify="center" direction="column">
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.400" fontWeight="500">Checking authorization...</Text>
        </Flex>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <Box
          position="fixed"
          top="20px"
          right="20px"
          zIndex="9999"
          bg="blue.600"
          color="white"
          px="4"
          py="3"
          borderRadius="xl"
          boxShadow="0 10px 30px rgba(37, 99, 235, 0.5)"
          fontWeight="semibold"
          display="flex"
          alignItems="center"
          gap="2"
        >
          <Sparkles size={18} />
          <Text fontSize="sm">{toastMessage}</Text>
        </Box>
      )}

      {/* Main Layout Container */}
      <Flex flex="1" overflow="hidden">
        {/* Desktop Sidebar */}
        <Box
          w="230px"
          bg="#0F172A"
          borderRight="1px solid"
          borderColor="rgba(255, 255, 255, 0.12)"
          display={{ base: "none", md: "flex" }}
          flexDir="column"
        >
          {/* Brand */}
          <Flex p="3.5" alignItems="center" gap="2.5" borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
            <Flex
              w="36px"
              h="36px"
              borderRadius="lg"
              bgGradient="linear(to-br, blue.500, purple.600)"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 0 14px rgba(59, 130, 246, 0.4)"
            >
              <ShieldCheck size={20} color="#FFF" />
            </Flex>
            <Box>
              <Heading size="xs" color="white" fontWeight="800" letterSpacing="tight">
                Shrawasti
              </Heading>
              <Badge colorScheme="purple" fontSize="9px" variant="solid" px="1.5" py="0" borderRadius="md">
                Admin Panel
              </Badge>
            </Box>
          </Flex>

          {sidebarContent}

          {/* Database Status footer */}
          <Box p="3" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)" bg="#090D16">
            <Flex alignItems="center" gap="2.5">
              <Box w="7px" h="7px" borderRadius="full" bg="#34D399" boxShadow="0 0 8px #34D399" />
              <Box>
                <Text fontSize="11px" fontWeight="bold" color="white">
                  Supabase DB
                </Text>
                <Text fontSize="9px" color="#94A3B8">
                  Realtime active (5s)
                </Text>
              </Box>
            </Flex>
          </Box>
        </Box>

        {/* Mobile Slide-over Drawer / Menu */}
        {isMobileMenuOpen && (
          <Box position="fixed" inset="0" zIndex="999" bg="blackAlpha.800" backdropFilter="blur(4px)" display={{ base: "block", md: "none" }}>
            <Box w="280px" h="full" bg="#0F172A" display="flex" flexDir="column" boxShadow="2xl">
              <Flex p="4" justifyContent="space-between" alignItems="center" borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                <HStack gap="2">
                  <ShieldCheck size={20} color="#3B82F6" />
                  <Heading size="xs" color="white">Shrawasti Mobile Menu</Heading>
                </HStack>
                <IconButton size="xs" variant="ghost" color="white" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                  <X size={18} />
                </IconButton>
              </Flex>
              {sidebarContent}
            </Box>
          </Box>
        )}

        {/* Main Content Area */}
        <Flex flex="1" flexDir="column" overflowX="hidden" w="full">
          {/* Top Control Bar */}
          <Flex
            h="52px"
            px={{ base: "3", md: "5" }}
            bg="#0F172A"
            borderBottom="1px solid"
            borderColor="rgba(255, 255, 255, 0.12)"
            alignItems="center"
            justifyContent="space-between"
            gap="3"
          >
            <HStack gap="3" flex="1">
              <IconButton
                display={{ base: "inline-flex", md: "none" }}
                onClick={() => setIsMobileMenuOpen(true)}
                size="sm"
                variant="ghost"
                color="white"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </IconButton>

              <Heading size="sm" textTransform="capitalize" color="white" fontSize={{ base: "sm", md: "md" }}>
                {activeTab.replace("_", " ")}
              </Heading>

              {/* REAL-TIME GLOBAL SEARCH INPUT (HIGH CONTRAST TEXT) */}
              <Flex
                alignItems="center"
                bg="#1E293B"
                borderRadius="xl"
                px="3"
                py="1.5"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.2)"
                w="full"
                maxW="340px"
                display={{ base: "none", sm: "flex" }}
              >
                <Search size={15} color="#CBD5E1" style={{ marginRight: "8px" }} />
                <Input
                  placeholder="Search bookings, users, providers..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  fontSize="xs"
                  color="#FFFFFF"
                  _placeholder={{ color: "gray.400" }}
                  bg="transparent"
                  border="none"
                />
                {globalSearch && (
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color="gray.300"
                    aria-label="Clear search"
                    onClick={() => setGlobalSearch("")}
                  >
                    <X size={12} />
                  </IconButton>
                )}
              </Flex>
            </HStack>

            <HStack gap="2.5">
              <Button
                onClick={() => fetchAllData(true)}
                size="xs"
                variant="outline"
                borderColor="rgba(255, 255, 255, 0.25)"
                color="#F8FAFC"
                _hover={{ bg: "whiteAlpha.200", color: "white" }}
                borderRadius="lg"
                px="3"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} style={{ marginRight: "6px" }} />
                Sync
              </Button>

              <Button
                onClick={handleSeedDatabase}
                disabled={seeding}
                size="xs"
                bgGradient="linear(to-r, emerald.500, teal.600)"
                color="white"
                _hover={{ bgGradient: "linear(to-r, emerald.600, teal.700)" }}
                borderRadius="lg"
                px="3"
              >
                {seeding ? <Spinner size="xs" mr="1" /> : <Database size={12} style={{ marginRight: "6px" }} />}
                Seed DB
              </Button>
            </HStack>
          </Flex>

          {/* Mobile Global Search Bar */}
          <Box px="4" pt="3" display={{ base: "block", sm: "none" }}>
            <Flex
              alignItems="center"
              bg="#1E293B"
              borderRadius="xl"
              px="3"
              py="2"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.2)"
            >
              <Search size={15} color="#CBD5E1" style={{ marginRight: "8px" }} />
              <Input
                placeholder="Search across all records..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                fontSize="xs"
                color="#FFFFFF"
                _placeholder={{ color: "gray.400" }}
                bg="transparent"
                border="none"
              />
            </Flex>
          </Box>

          {/* Content Body */}
          <Box p={{ base: "3", md: "5" }} flex="1" overflowY="auto">
            {loading ? (
              <Flex h="300px" alignItems="center" justifyContent="center" flexDir="column" gap="4">
                <Spinner size="xl" color="blue.400" />
                <Text color="gray.300" fontSize="sm">
                  Fetching real-time records from Supabase PostgreSQL...
                </Text>
              </Flex>
            ) : (
              <>
                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                  <Stack gap="4">
                    {/* KPI Cards Grid */}
                    <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }} gap="3">
                      {[
                        {
                          title: "Total Revenue",
                          value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`,
                          icon: DollarSign,
                          color: "#34D399",
                          bg: "rgba(16, 185, 129, 0.25)",
                        },
                        {
                          title: "Total Bookings",
                          value: stats.totalBookings || bookings.length || 0,
                          icon: CalendarCheck,
                          color: "#60A5FA",
                          bg: "rgba(59, 130, 246, 0.25)",
                        },
                        {
                          title: "Confirmed Jobs",
                          value: stats.confirmedBookings || bookings.filter((b) => b.status === "confirmed").length || 0,
                          icon: CheckCircle2,
                          color: "#C084FC",
                          bg: "rgba(168, 85, 247, 0.25)",
                        },
                        {
                          title: "Registered Users",
                          value: stats.totalUsers || users.length || 0,
                          icon: Users,
                          color: "#FDE047",
                          bg: "rgba(245, 158, 11, 0.25)",
                        },
                        {
                          title: "Active Providers",
                          value: stats.activeProviders || providers.length || 0,
                          icon: UserCheck,
                          color: "#5EEAD4",
                          bg: "rgba(20, 184, 166, 0.25)",
                        },
                      ].map((kpi, idx) => {
                        const Icon = kpi.icon;
                        return (
                          <Card.Root
                            key={idx}
                            bg="#111827"
                            borderColor="rgba(255, 255, 255, 0.12)"
                            borderWidth="1px"
                            borderRadius="xl"
                            p="3"
                            boxShadow="0 4px 14px rgba(0,0,0,0.3)"
                          >
                            <Flex justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Text fontSize="11px" fontWeight="bold" color="#E2E8F0" mb="0.5">
                                  {kpi.title}
                                </Text>
                                <Heading size="sm" color="#FFFFFF" fontWeight="800">
                                  {kpi.value}
                                </Heading>
                              </Box>
                              <Flex p="2" borderRadius="lg" bg={kpi.bg}>
                                <Icon size={16} color={kpi.color} />
                              </Flex>
                            </Flex>
                          </Card.Root>
                        );
                      })}
                    </Grid>

                    {/* Recent Bookings & Providers */}
                    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap="6">
                      <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="2xl">
                        <Flex p="4" justifyContent="space-between" alignItems="center" borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                          <HStack gap="2">
                            <CalendarCheck size={18} color="#60A5FA" />
                            <Heading size="xs" color="#FFFFFF" fontWeight="bold">
                              Recent Bookings ({filteredBookings.length})
                            </Heading>
                          </HStack>
                          <Button size="xs" variant="ghost" color="#60A5FA" onClick={() => setActiveTab("bookings")}>
                            View All
                          </Button>
                        </Flex>

                        <Box overflowX="auto" p="2">
                          {filteredBookings.length === 0 ? (
                            <Flex p="6" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                              <Text color="gray.300" fontSize="xs">
                                No matching bookings found in database.
                              </Text>
                            </Flex>
                          ) : (
                            <Table.Root size="sm" variant="outline" colorScheme="whiteAlpha">
                              <Table.Header>
                                <Table.Row borderColor="rgba(255, 255, 255, 0.12)">
                                  <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">ID / Date</Table.ColumnHeader>
                                  <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Customer</Table.ColumnHeader>
                                  <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Service & Price</Table.ColumnHeader>
                                  <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Status</Table.ColumnHeader>
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {filteredBookings.slice(0, 5).map((b) => {
                                  const st = getStatusColor(b.status);
                                  const custName = b.user?.name || b.users?.name || "Customer";
                                  const custPhone = b.user?.phone || b.users?.phone || b.user?.email || b.users?.email || "-";
                                  const serviceName = b.services?.name || b.service_name || "Car Wash & Detailing";
                                  const price = b.total || b.subtotal || b.total_amount || 499;
                                  const dateStr = b.scheduleDate || b.booking_date || b.createdAt?.split("T")[0] || "Today";

                                  return (
                                    <Table.Row key={b.id} _hover={{ bg: "rgba(255,255,255,0.06)" }} borderColor="rgba(255, 255, 255, 0.12)">
                                      <Table.Cell>
                                        <Text fontSize="xs" fontWeight="bold" color="#93C5FD">
                                          #{b.id?.substring(0, 8)}
                                        </Text>
                                        <Text fontSize="10px" color="gray.300">
                                          {dateStr}
                                        </Text>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Text fontSize="xs" fontWeight="bold" color="#FFFFFF">
                                          {custName}
                                        </Text>
                                        <Text fontSize="10px" color="gray.300">
                                          {custPhone}
                                        </Text>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Text fontSize="xs" color="#F1F5F9">
                                          {serviceName}
                                        </Text>
                                        <Text fontSize="xs" fontWeight="bold" color="#34D399">
                                          ₹{price}
                                        </Text>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Badge bg={st.bg} color={st.color} border="1px solid" borderColor={st.border} px="2.5" py="0.5" borderRadius="md" textTransform="capitalize" fontSize="xs" fontWeight="bold">
                                          {b.status || "pending"}
                                        </Badge>
                                      </Table.Cell>
                                    </Table.Row>
                                  );
                                })}
                              </Table.Body>
                            </Table.Root>
                          )}
                        </Box>
                      </Card.Root>

                      {/* Active Providers Card */}
                      <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="2xl">
                        <Flex p="4" justifyContent="space-between" alignItems="center" borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                          <HStack gap="2">
                            <UserCheck size={18} color="#34D399" />
                            <Heading size="xs" color="#FFFFFF" fontWeight="bold">
                              Providers ({filteredProviders.length})
                            </Heading>
                          </HStack>
                          <Button size="xs" variant="ghost" color="#60A5FA" onClick={() => setActiveTab("providers")}>
                            View All
                          </Button>
                        </Flex>

                        <VStack p="3" align="stretch" gap="2.5">
                          {filteredProviders.length === 0 ? (
                            <Text color="gray.300" fontSize="xs" textAlign="center" py="4">
                              No providers found matching search.
                            </Text>
                          ) : (
                            filteredProviders.slice(0, 4).map((p) => (
                              <Flex
                                key={p.id}
                                p="2.5"
                                borderRadius="xl"
                                bg="#1E293B"
                                justifyContent="space-between"
                                alignItems="center"
                                border="1px solid"
                                borderColor="rgba(255, 255, 255, 0.08)"
                              >
                                <HStack gap="2.5">
                                  <Flex w="34px" h="34px" borderRadius="full" bg="blue.900" color="#93C5FD" alignItems="center" justifyContent="center" fontWeight="bold" fontSize="xs">
                                    {p.name?.charAt(0) || "P"}
                                  </Flex>
                                  <Box>
                                    <Text fontSize="xs" fontWeight="bold" color="#FFFFFF">
                                      {p.name}
                                    </Text>
                                    <Text fontSize="10px" color="gray.300">
                                      {p.phone}
                                    </Text>
                                  </Box>
                                </HStack>
                                <Badge colorScheme={p.isOnline ?? p.is_available ? "green" : "gray"} fontSize="10px" fontWeight="bold">
                                  {p.isOnline ?? p.is_available ? "Available" : "Busy"}
                                </Badge>
                              </Flex>
                            ))
                          )}
                        </VStack>
                      </Card.Root>
                    </Grid>
                  </Stack>
                )}

                {/* TAB 2: BOOKINGS */}
                {activeTab === "bookings" && (
                  <Stack gap="6">
                    <Flex gap="3" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                      <HStack gap="2" flex="1" maxW={{ base: "full", sm: "360px" }}>
                        <Input
                          placeholder="Search bookings..."
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                          bg="#1E293B"
                          borderColor="rgba(255, 255, 255, 0.2)"
                          color="#FFFFFF"
                          size="sm"
                          borderRadius="xl"
                        />
                      </HStack>

                      <HStack gap="1.5" overflowX="auto" w={{ base: "full", sm: "auto" }}>
                        {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
                          <Button
                            key={st}
                            size="xs"
                            onClick={() => setStatusFilter(st)}
                            bg={statusFilter === st ? "#2563EB" : "#1E293B"}
                            color={statusFilter === st ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={statusFilter === st ? "#3B82F6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: statusFilter === st ? "#1D4ED8" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            textTransform="capitalize"
                            fontWeight={statusFilter === st ? "bold" : "normal"}
                          >
                            {st}
                          </Button>
                        ))}
                      </HStack>
                    </Flex>

                    <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="2xl">
                      <Box overflowX="auto" p="3">
                        {filteredBookings.length === 0 ? (
                          <Flex p="6" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                            <Text color="gray.300" fontSize="sm">
                              No bookings match your search filters.
                            </Text>
                          </Flex>
                        ) : (
                          <Table.Root size="sm" variant="outline" colorScheme="whiteAlpha">
                            <Table.Header>
                              <Table.Row borderColor="rgba(255, 255, 255, 0.12)">
                                <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Booking ID</Table.ColumnHeader>
                                <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Customer</Table.ColumnHeader>
                                <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Service Info</Table.ColumnHeader>
                                <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Provider</Table.ColumnHeader>
                                <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Amount</Table.ColumnHeader>
                                <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Status</Table.ColumnHeader>
                                <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Actions</Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {filteredBookings.map((b) => {
                                const st = getStatusColor(b.status);
                                const custName = b.user?.name || b.users?.name || "Customer";
                                const custPhone = b.user?.phone || b.users?.phone || b.user?.email || b.users?.email || "N/A";
                                const serviceName = b.services?.name || b.service_name || "Full Washing";
                                const timeSlot = b.scheduleTime || b.booking_slot || b.time_slot || "10:00 AM";
                                const price = b.total || b.subtotal || b.total_amount || 499;
                                const providerName = b.provider?.name || b.providers?.name;

                                return (
                                  <Table.Row key={b.id} _hover={{ bg: "rgba(255,255,255,0.06)" }} borderColor="rgba(255, 255, 255, 0.12)">
                                    <Table.Cell fontWeight="bold" color="#93C5FD" fontSize="xs">
                                      #{b.id?.substring(0, 8)}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text fontSize="xs" fontWeight="bold" color="#FFFFFF">
                                        {custName}
                                      </Text>
                                      <Text fontSize="10px" color="gray.300">
                                        {custPhone}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text fontSize="xs" color="#F1F5F9">
                                        {serviceName}
                                      </Text>
                                      <Text fontSize="10px" color="gray.300">
                                        {timeSlot}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {providerName ? (
                                        <Badge colorScheme="teal" fontSize="xs" fontWeight="bold">
                                          {providerName}
                                        </Badge>
                                      ) : (
                                        <Text fontSize="xs" color="#FDE047" fontWeight="bold">
                                          Unassigned
                                        </Text>
                                      )}
                                    </Table.Cell>
                                    <Table.Cell fontWeight="bold" color="#34D399" fontSize="xs">
                                      ₹{price}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Badge bg={st.bg} color={st.color} border="1px solid" borderColor={st.border} px="2" py="0.5" borderRadius="md" textTransform="capitalize" fontSize="xs" fontWeight="bold">
                                        {b.status || "pending"}
                                      </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <HStack gap="1">
                                        <Button
                                          size="xs"
                                          colorScheme="purple"
                                          variant="subtle"
                                          onClick={() => {
                                            setEditingBooking(b);
                                            setBookingStatusForm(b.status || "pending");
                                            setBookingProviderForm(b.assignedProviderId || b.assigned_provider_id || "");
                                            setShowBookingModal(true);
                                          }}
                                        >
                                          <Edit size={12} />
                                        </Button>
                                        <IconButton
                                  size="xs"
                                  variant="solid"
                                  bg="#DC2626"
                                  color="#FFFFFF"
                                  _hover={{ bg: "#EF4444" }}
                                  aria-label="Delete booking"
                                  onClick={() => handleDeleteBooking(b.id)}
                                >
                                  <Trash2 size={14} color="#FFFFFF" />
                                </IconButton>
                                      </HStack>
                                    </Table.Cell>
                                  </Table.Row>
                                );
                              })}
                            </Table.Body>
                          </Table.Root>
                        )}
                      </Box>
                    </Card.Root>
                  </Stack>
                )}

                {/* TAB 3: USERS */}
                {activeTab === "users" && (
                  <Stack gap="6">
                    <Heading size="xs" color="white" fontWeight="bold">
                      Users ({filteredUsers.length})
                    </Heading>

                    <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="2xl">
                      <Box overflowX="auto" p="3">
                        <Table.Root size="sm" variant="outline">
                          <Table.Header>
                            <Table.Row borderColor="rgba(255, 255, 255, 0.12)">
                              <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Name</Table.ColumnHeader>
                              <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Email</Table.ColumnHeader>
                              <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Phone</Table.ColumnHeader>
                              <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Role</Table.ColumnHeader>
                              <Table.ColumnHeader color="#CBD5E1" fontWeight="bold">Actions</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {filteredUsers.map((u) => (
                              <Table.Row key={u.id} _hover={{ bg: "rgba(255,255,255,0.06)" }} borderColor="rgba(255, 255, 255, 0.12)">
                                <Table.Cell fontWeight="bold" color="#FFFFFF" fontSize="xs">
                                  {u.name}
                                </Table.Cell>
                                <Table.Cell color="#E2E8F0" fontSize="xs">
                                  {u.email}
                                </Table.Cell>
                                <Table.Cell color="#E2E8F0" fontSize="xs">
                                  {u.phone || "N/A"}
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge colorScheme={u.role === "admin" ? "purple" : "blue"} fontSize="xs" fontWeight="bold">
                                    {u.role || "user"}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                  <HStack gap="1">
                                    <Button
                                      size="xs"
                                      colorScheme="blue"
                                      variant="subtle"
                                      onClick={() => {
                                        setEditingUser(u);
                                        setUserForm({ name: u.name || "", phone: u.phone || "", email: u.email || "", role: u.role || "user" });
                                        setShowUserModal(true);
                                      }}
                                    >
                                      <Edit size={12} />
                                    </Button>
                                    <IconButton
                                  size="xs"
                                  variant="solid"
                                  bg="#DC2626"
                                  color="#FFFFFF"
                                  _hover={{ bg: "#EF4444" }}
                                  aria-label="Delete user"
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  <Trash2 size={14} color="#FFFFFF" />
                                </IconButton>
                                  </HStack>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    </Card.Root>
                  </Stack>
                )}

                {/* TAB 4: PROVIDERS */}
                {activeTab === "providers" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading size="xs" color="white" fontWeight="bold">
                        Providers ({filteredProviders.length})
                      </Heading>
                      <Button
                        size="xs"
                        colorScheme="teal"
                        onClick={() => {
                          setEditingProvider(null);
                          setProviderForm({ name: "", phone: "", email: "", rating: "5.0", status: "active" });
                          setShowProviderModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Register
                      </Button>
                    </Flex>

                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="4">
                      {filteredProviders.map((p) => (
                        <Card.Root key={p.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="2xl" p="4">
                          <Flex justifyContent="space-between" alignItems="flex-start" mb="3">
                            <HStack gap="2.5">
                              <Flex w="36px" h="36px" borderRadius="xl" bg="teal.900" color="#5EEAD4" alignItems="center" justifyContent="center" fontWeight="bold">
                                {p.name?.charAt(0) || "P"}
                              </Flex>
                              <Box>
                                <Heading size="xs" color="#FFFFFF" fontWeight="bold">
                                  {p.name}
                                </Heading>
                                <Text fontSize="10px" color="gray.300">
                                  {p.phone}
                                </Text>
                              </Box>
                            </HStack>
                            <Badge colorScheme={p.status === "active" || p.isOnline || p.is_available ? "green" : "red"} fontSize="xs" fontWeight="bold">
                              {p.status || "Active"}
                            </Badge>
                          </Flex>

                          <Flex justifyContent="flex-end" gap="2" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                            <Button
                              size="xs"
                              colorScheme="blue"
                              variant="subtle"
                              onClick={() => {
                                setEditingProvider(p);
                                setProviderForm({ name: p.name || "", phone: p.phone || "", email: p.email || "", rating: String(p.rating || "5.0"), status: p.status || "active" });
                                setShowProviderModal(true);
                              }}
                            >
                              <Edit size={12} />
                            </Button>
                            <IconButton
                                  size="xs"
                                  variant="solid"
                                  bg="#DC2626"
                                  color="#FFFFFF"
                                  _hover={{ bg: "#EF4444" }}
                                  aria-label="Delete provider"
                                  onClick={() => handleDeleteProvider(p.id)}
                                >
                                  <Trash2 size={14} color="#FFFFFF" />
                                </IconButton>
                          </Flex>
                        </Card.Root>
                      ))}
                    </Grid>
                  </Stack>
                )}

                {/* TAB 5: SERVICES */}
                {activeTab === "services" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Wrench size={18} color="#60A5FA" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          Services Catalog ({filteredServices.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="blue"
                        onClick={() => {
                          setEditingService(null);
                          setServiceForm(blankServiceForm());
                          setShowServiceModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Add Service
                      </Button>
                    </Flex>

                    {/* VEHICLE TYPE & BODY TYPE FILTER BAR */}
                    <Flex gap="3" flexWrap="wrap" alignItems="center" bg="#111827" p="3" borderRadius="xl" border="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                      <Text fontSize="xs" fontWeight="bold" color="gray.300" display="flex" alignItems="center" gap="1">
                        <SlidersHorizontal size={14} /> Category:
                      </Text>

                      <HStack gap="1.5">
                        {[{ id: "all", label: "All Vehicles" }, { id: "4W", label: "4W (Car)" }, { id: "2W", label: "2W (Bike)" }].map((v) => (
                          <Button
                            key={v.id}
                            size="xs"
                            onClick={() => { setServiceVehicleFilter(v.id); setServiceBodyTypeFilter("all"); }}
                            bg={serviceVehicleFilter === v.id ? "#2563EB" : "#1E293B"}
                            color={serviceVehicleFilter === v.id ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={serviceVehicleFilter === v.id ? "#3B82F6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: serviceVehicleFilter === v.id ? "#1D4ED8" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            fontWeight={serviceVehicleFilter === v.id ? "bold" : "normal"}
                          >
                            {v.label}
                          </Button>
                        ))}
                      </HStack>

                      <Box w="1px" h="20px" bg="rgba(255, 255, 255, 0.15)" mx="1" display={{ base: "none", sm: "block" }} />

                      <Text fontSize="xs" fontWeight="bold" color="gray.300" display="flex" alignItems="center" gap="1">
                        Body Type:
                      </Text>
                      <HStack gap="1.5" overflowX="auto">
                        {["all", "Hatchback", "Sedan", "SUV", "Scooter", "Cruiser"].map((bt) => (
                          <Button
                            key={bt}
                            size="xs"
                            onClick={() => setServiceBodyTypeFilter(bt)}
                            bg={serviceBodyTypeFilter === bt ? "#7C3AED" : "#1E293B"}
                            color={serviceBodyTypeFilter === bt ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={serviceBodyTypeFilter === bt ? "#8B5CF6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: serviceBodyTypeFilter === bt ? "#6D28D9" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            textTransform="capitalize"
                            fontWeight={serviceBodyTypeFilter === bt ? "bold" : "normal"}
                          >
                            {bt}
                          </Button>
                        ))}
                      </HStack>
                    </Flex>

                    {filteredServices.length === 0 ? (
                      <Flex p="8" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                        <Text color="gray.300" fontSize="sm">
                          No services match your vehicle & body type filters.
                        </Text>
                      </Flex>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap="3">
                        {filteredServices.map((s) => {
                          const is2W = (s.vehicleType || s.vehicle_type || "").includes("2W") || (s.category || "").includes("2w") || (s.category || "").includes("bike");
                          return (
                            <Card.Root key={s.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="3">
                              <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                                <Box>
                                  <Heading size="xs" color="#FFFFFF" fontWeight="bold" mb="1">
                                    {s.name}
                                  </Heading>
                                  <HStack gap="1">
                                    <Badge colorScheme={is2W ? "amber" : "blue"} fontSize="9px" fontWeight="bold">
                                      {is2W ? "2W Bike" : "4W Car"}
                                    </Badge>
                                    {s.bodyType && s.bodyType !== "All" && (
                                      <Badge colorScheme="purple" fontSize="9px" fontWeight="bold">
                                        {s.bodyType}
                                      </Badge>
                                    )}
                                  </HStack>
                                </Box>
                                <Badge colorScheme="gray" fontSize="9px">
                                  {s.category || "Service"}
                                </Badge>
                              </Flex>

                              <Text fontSize="11px" color="#CBD5E1" my="1.5" lineClamp={2}>
                                {s.description || "Professional vehicle wash and maintenance service."}
                              </Text>

                              <Flex justifyContent="space-between" alignItems="flex-start" my="2" gap="2">
                                <Text fontSize="11px" fontWeight="bold" color="#34D399">
                                  {s.prices && Object.keys(s.prices).length > 0
                                    ? BODY_PRICE_FIELDS.filter((field) => s.prices[field.key] != null).map((field) => `${field.label} ₹${s.prices[field.key]}`).join(" · ")
                                    : `₹${s.basePrice || s.price}`}
                                </Text>
                                <Text fontSize="11px" color="#E2E8F0">
                                  ⏱️ {s.durationMinutes ? `${s.durationMinutes} mins` : s.duration || "45 mins"}
                                </Text>
                              </Flex>

                              <Flex justifyContent="flex-end" gap="1.5" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="subtle"
                                  onClick={() => {
                                    setEditingService(s);
                                    setServiceForm({
                                      name: s.name || "",
                                      category: s.category || "car_wash",
                                      vehicleType: is2W ? "2W" : "4W",
                                      bodyType: s.bodyType || "All",
                                      basePrice: s.basePrice || s.price || 499,
                                      durationMinutes: String(s.durationMinutes || "45"),
                                      description: s.description || "",
                                      prices: Object.fromEntries(
                                        BODY_PRICE_FIELDS.map((field) => [field.key, s.prices?.[field.key] ?? ""])
                                      ),
                                    });
                                    setShowServiceModal(true);
                                  }}
                                >
                                  <Edit size={12} />
                                </Button>
                                <IconButton
                                  size="xs"
                                  variant="solid"
                                  bg="#DC2626"
                                  color="#FFFFFF"
                                  _hover={{ bg: "#EF4444" }}
                                  aria-label="Delete service"
                                  onClick={() => handleDeleteService(s.id)}
                                >
                                  <Trash2 size={14} color="#FFFFFF" />
                                </IconButton>
                              </Flex>
                            </Card.Root>
                          );
                        })}
                      </Grid>
                    )}
                  </Stack>
                )}

                {/* TAB 6: SLOTS */}
                {activeTab === "slots" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Clock size={18} color="#C084FC" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          Slots ({filteredSlots.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="purple"
                        onClick={() => {
                          setEditingSlot(null);
                          setSlotForm({ slotTime: "10:00 AM - 11:00 AM", maxCapacity: 10, isActive: true });
                          setShowSlotModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Create Slot
                      </Button>
                    </Flex>

                    {filteredSlots.length === 0 ? (
                      <Flex p="8" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                        <Text color="gray.300" fontSize="sm">
                          No time slots available. Click "Create Slot" to add one.
                        </Text>
                      </Flex>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap="3">
                        {filteredSlots.map((s) => {
                          const cap = s.maxCapacity || s.max_capacity || 10;
                          const active = s.isActive ?? s.is_active ?? true;
                          return (
                            <Card.Root key={s.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="3.5">
                              <Flex justifyContent="space-between" alignItems="center" mb="3">
                                <HStack gap="1.5">
                                  <Clock size={14} color="#A7F3D0" />
                                  <Text fontSize="xs" fontWeight="bold" color="#FFFFFF">
                                    {s.slotTime || s.slot_time || s.time}
                                  </Text>
                                </HStack>
                                <Button
                                  size="2xs"
                                  onClick={() => handleToggleSlotStatus(s)}
                                  bg={active ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                                  color={active ? "#6EE7B7" : "#FCA5A5"}
                                  border="1px solid"
                                  borderColor={active ? "rgba(52, 211, 153, 0.4)" : "rgba(248, 113, 113, 0.4)"}
                                  _hover={{ bg: active ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)" }}
                                  borderRadius="md"
                                  px="2"
                                  py="0.5"
                                  fontSize="10px"
                                  fontWeight="bold"
                                >
                                  {active ? "Active / Open" : "Closed"}
                                </Button>
                              </Flex>

                              <Box bg="#1E293B" p="2.5" borderRadius="lg" border="1px solid" borderColor="rgba(255, 255, 255, 0.1)" mb="3">
                                <Text fontSize="10px" color="gray.400" fontWeight="bold" mb="1.5" textAlign="center">
                                  SLOT CAPACITY MANAGEMENT
                                </Text>
                                <Flex justifyContent="space-between" alignItems="center">
                                  <Button
                                    size="xs"
                                    onClick={() => handleUpdateSlotCapacity(s, cap - 1)}
                                    disabled={cap <= 1}
                                    bg="#334155"
                                    color="white"
                                    _hover={{ bg: "#475569" }}
                                    borderRadius="md"
                                    px="2"
                                    minW="32px"
                                    h="28px"
                                  >
                                    <Minus size={14} />
                                  </Button>
                                  <VStack gap="0" align="center">
                                    <Text fontSize="md" fontWeight="extrabold" color="#38BDF8">
                                      {cap}
                                    </Text>
                                    <Text fontSize="9px" color="gray.300">
                                      max bookings
                                    </Text>
                                  </VStack>
                                  <Button
                                    size="xs"
                                    onClick={() => handleUpdateSlotCapacity(s, cap + 1)}
                                    bg="#334155"
                                    color="white"
                                    _hover={{ bg: "#475569" }}
                                    borderRadius="md"
                                    px="2"
                                    minW="32px"
                                    h="28px"
                                  >
                                    <Plus size={14} />
                                  </Button>
                                </Flex>
                              </Box>

                              <Flex justifyContent="flex-end" gap="1.5" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="subtle"
                                  onClick={() => {
                                    setEditingSlot(s);
                                    setSlotForm({
                                      slotTime: s.slotTime || s.slot_time || "",
                                      maxCapacity: cap,
                                      isActive: active,
                                    });
                                    setShowSlotModal(true);
                                  }}
                                >
                                  <Edit size={12} style={{ marginRight: "4px" }} /> Edit
                                </Button>
                                <IconButton
                                  size="xs"
                                  variant="solid"
                                  bg="#DC2626"
                                  color="#FFFFFF"
                                  _hover={{ bg: "#EF4444" }}
                                  aria-label="Delete slot"
                                  onClick={() => handleDeleteSlot(s.id)}
                                >
                                  <Trash2 size={14} color="#FFFFFF" />
                                </IconButton>
                              </Flex>
                            </Card.Root>
                          );
                        })}
                      </Grid>
                    )}
                  </Stack>
                )}

                {/* TAB 7: VEHICLE CATALOG */}
                {activeTab === "vehicles" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Car size={18} color="#C084FC" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          Vehicle Catalog ({filteredVehicles.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="purple"
                        onClick={() => {
                          setEditingVehicle(null);
                          setVehicleForm({ brand: "", model: "", category: "Car", bodyType: "Hatchback", modelImage: "" });
                          setShowVehicleModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Add Model
                      </Button>
                    </Flex>

                    {/* VEHICLE CATALOG FILTERS BAR */}
                    <Flex gap="3" flexWrap="wrap" alignItems="center" bg="#111827" p="3" borderRadius="xl" border="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                      <Text fontSize="xs" fontWeight="bold" color="gray.300" display="flex" alignItems="center" gap="1">
                        <SlidersHorizontal size={14} /> Category:
                      </Text>

                      <HStack gap="1.5">
                        {[{ id: "all", label: "All Vehicles" }, { id: "Car", label: "Car (4W)" }, { id: "Bike", label: "Bike (2W)" }].map((vc) => (
                          <Button
                            key={vc.id}
                            size="xs"
                            onClick={() => { setVehicleCategoryFilter(vc.id); setVehicleBodyTypeFilter("all"); }}
                            bg={vehicleCategoryFilter === vc.id ? "#7C3AED" : "#1E293B"}
                            color={vehicleCategoryFilter === vc.id ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={vehicleCategoryFilter === vc.id ? "#8B5CF6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: vehicleCategoryFilter === vc.id ? "#6D28D9" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            fontWeight={vehicleCategoryFilter === vc.id ? "bold" : "normal"}
                          >
                            {vc.label}
                          </Button>
                        ))}
                      </HStack>

                      <Box w="1px" h="20px" bg="rgba(255, 255, 255, 0.15)" mx="1" display={{ base: "none", sm: "block" }} />

                      <Text fontSize="xs" fontWeight="bold" color="gray.300" display="flex" alignItems="center" gap="1">
                        Body Type:
                      </Text>
                      <HStack gap="1.5" overflowX="auto">
                        {["all", "Hatchback", "Sedan", "SUV", "Scooter", "Cruiser", "Sports"].map((bt) => (
                          <Button
                            key={bt}
                            size="xs"
                            onClick={() => setVehicleBodyTypeFilter(bt)}
                            bg={vehicleBodyTypeFilter === bt ? "#2563EB" : "#1E293B"}
                            color={vehicleBodyTypeFilter === bt ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={vehicleBodyTypeFilter === bt ? "#3B82F6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: vehicleBodyTypeFilter === bt ? "#1D4ED8" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            textTransform="capitalize"
                            fontWeight={vehicleBodyTypeFilter === bt ? "bold" : "normal"}
                          >
                            {bt}
                          </Button>
                        ))}
                      </HStack>
                    </Flex>

                    {filteredVehicles.length === 0 ? (
                      <Flex p="8" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                        <Text color="gray.300" fontSize="sm">
                          No vehicle models match your category & body type filters.
                        </Text>
                      </Flex>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap="3">
                        {filteredVehicles.map((v) => {
                          const isBike = (v.category || "").toLowerCase().includes("bike") || (v.category || "").toLowerCase().includes("2w");
                          const imgUrl = v.modelImage || v.model_image;
                          return (
                            <Card.Root key={v.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="3">
                              <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                                <HStack gap="2">
                                  {imgUrl ? (
                                    <Flex w="40px" h="40px" borderRadius="lg" overflow="hidden" bg="#1E293B" border="1px solid" borderColor="rgba(255, 255, 255, 0.2)" flexShrink={0} alignItems="center" justifyContent="center">
                                      <img
                                        src={imgUrl}
                                        alt={`${v.brand} ${v.model}`}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        onError={(e) => {
                                          (e.currentTarget as HTMLElement).style.display = "none";
                                        }}
                                      />
                                    </Flex>
                                  ) : (
                                    <Flex w="36px" h="36px" borderRadius="lg" bg={isBike ? "rgba(245, 158, 11, 0.25)" : "rgba(168, 85, 247, 0.25)"} color={isBike ? "#FDE047" : "#C084FC"} alignItems="center" justifyContent="center">
                                      {isBike ? <Bike size={18} color="#FDE047" /> : <Car size={18} color="#C084FC" />}
                                    </Flex>
                                  )}
                                  <Box>
                                    <Heading size="xs" color="#FFFFFF" fontWeight="bold">
                                      {v.brand} {v.model}
                                    </Heading>
                                    <Text fontSize="10px" color="#CBD5E1">
                                      {v.category || "Car"} ({v.bodyType || v.body_type || "Hatchback"})
                                    </Text>
                                  </Box>
                                </HStack>
                                <Badge colorScheme={isBike ? "amber" : "purple"} fontSize="9px" fontWeight="bold">
                                  {v.category || "Car"}
                                </Badge>
                              </Flex>

                              <Flex justifyContent="flex-end" gap="1.5" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="subtle"
                                  onClick={() => {
                                    setEditingVehicle(v);
                                    setVehicleForm({
                                      brand: v.brand || "",
                                      model: v.model || "",
                                      category: v.category || "Car",
                                      bodyType: v.bodyType || v.body_type || "Hatchback",
                                      modelImage: v.modelImage || v.model_image || "",
                                    });
                                    setShowVehicleModal(true);
                                  }}
                                >
                                  <Edit size={12} />
                                </Button>
                                <IconButton
                                  size="xs"
                                  variant="solid"
                                  bg="#DC2626"
                                  color="#FFFFFF"
                                  _hover={{ bg: "#EF4444" }}
                                  aria-label="Delete vehicle"
                                  onClick={() => handleDeleteVehicle(v.id)}
                                >
                                  <Trash2 size={14} color="#FFFFFF" />
                                </IconButton>
                              </Flex>
                            </Card.Root>
                          );
                        })}
                      </Grid>
                    )}
                  </Stack>
                )}

                
                {/* TAB 8: COUPONS & PROMOS */}
                {activeTab === "coupons" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Ticket size={20} color="#FBBF24" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          Coupons & Promo Codes ({coupons.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="amber"
                        onClick={() => {
                          setEditingCoupon(null);
                          setCouponForm({ code: "", description: "", discountType: "fixed", discountValue: 100, minOrderAmount: 299, maxDiscountAmount: 500, maxRedemptions: 100, isActive: true });
                          setShowCouponModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Create Coupon
                      </Button>
                    </Flex>

                    {coupons.length === 0 ? (
                      <Flex p="8" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                        <Text color="gray.300" fontSize="sm">
                          No active promo codes. Click "Create Coupon" to add one.
                        </Text>
                      </Flex>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="3">
                        {coupons.map((c) => (
                          <Card.Root key={c.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                            <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                              <Box>
                                <HStack gap="1.5">
                                  <Ticket size={16} color="#FBBF24" />
                                  <Heading size="xs" color="#FDE047" fontWeight="extrabold" letterSpacing="wider">
                                    {c.code}
                                  </Heading>
                                </HStack>
                                <Text fontSize="11px" color="gray.300" mt="1">
                                  {c.description || "Special promotional discount code"}
                                </Text>
                              </Box>
                              <Badge colorScheme={c.isActive ? "green" : "gray"} fontSize="10px" fontWeight="bold">
                                {c.isActive ? "Active" : "Disabled"}
                              </Badge>
                            </Flex>

                            <Stack gap="1.5" bg="#1E293B" p="2.5" borderRadius="lg" my="2" fontSize="11px">
                              <Flex justifyContent="space-between">
                                <Text color="gray.400">Discount:</Text>
                                <Text color="#34D399" fontWeight="bold">
                                  {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                                </Text>
                              </Flex>
                              <Flex justifyContent="space-between">
                                <Text color="gray.400">Min Booking Amount:</Text>
                                <Text color="white" fontWeight="bold">₹{c.minOrderAmount}</Text>
                              </Flex>
                              <Flex justifyContent="space-between">
                                <Text color="gray.400">Redemptions:</Text>
                                <Text color="gray.300">{c.timesRedeemed} / {c.maxRedemptions}</Text>
                              </Flex>
                            </Stack>

                            <Flex justifyContent="flex-end" gap="1.5" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="subtle"
                                onClick={() => {
                                  setEditingCoupon(c);
                                  setCouponForm({
                                    code: c.code,
                                    description: c.description || "",
                                    discountType: c.discountType || "fixed",
                                    discountValue: c.discountValue || 100,
                                    minOrderAmount: c.minOrderAmount || 0,
                                    maxDiscountAmount: c.maxDiscountAmount || 1000,
                                    maxRedemptions: c.maxRedemptions || 100,
                                    isActive: c.isActive ?? true,
                                  });
                                  setShowCouponModal(true);
                                }}
                              >
                                <Edit size={12} style={{ marginRight: "4px" }} /> Edit
                              </Button>
                              <IconButton
                                size="xs"
                                variant="solid"
                                bg="#DC2626"
                                color="#FFFFFF"
                                _hover={{ bg: "#EF4444" }}
                                aria-label="Delete coupon"
                                onClick={() => handleDeleteCoupon(c.id)}
                              >
                                <Trash2 size={14} color="#FFFFFF" />
                              </IconButton>
                            </Flex>
                          </Card.Root>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                )}

                {/* TAB 9: SUBSCRIPTIONS & CAREPASS */}
                {activeTab === "subscriptions" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Sparkles size={20} color="#C084FC" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          CarePass Plans & User Memberships ({subscriptions.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="purple"
                        onClick={() => {
                          setEditingPlan(null);
                          setPlanForm({ name: "", description: "", basePrice: 899, validityDays: "30", popular: false, isActive: true });
                          setShowPlanModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Create CarePass Plan
                      </Button>
                    </Flex>

                    <Heading size="xs" color="gray.300" textTransform="uppercase" letterSpacing="wider">
                      Available Subscription Plans
                    </Heading>

                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="3">
                      {subscriptions.map((p) => (
                        <Card.Root key={p.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                          <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                            <Box>
                              <HStack gap="1.5">
                                <Sparkles size={16} color="#C084FC" />
                                <Heading size="xs" color="#FFFFFF" fontWeight="bold">
                                  {p.name}
                                </Heading>
                              </HStack>
                              <Text fontSize="11px" color="gray.400" mt="1">
                                {p.description || "Monthly vehicle care membership plan"}
                              </Text>
                            </Box>
                            {p.popular && (
                              <Badge colorScheme="amber" fontSize="9px" fontWeight="bold">
                                POPULAR
                              </Badge>
                            )}
                          </Flex>

                          <Text fontSize="lg" fontWeight="extrabold" color="#C084FC" my="2">
                            ₹{p.basePrice} <Text as="span" fontSize="xs" fontWeight="normal" color="gray.400">/ {p.validityDays} days</Text>
                          </Text>

                          <VStack align="stretch" gap="1" bg="#1E293B" p="2.5" borderRadius="lg" my="2" fontSize="11px">
                            {(p.benefits || []).map((b: string, i: number) => (
                              <HStack key={i} gap="1.5">
                                <Check size={12} color="#34D399" />
                                <Text color="gray.300">{b}</Text>
                              </HStack>
                            ))}
                          </VStack>

                          <Flex justifyContent="flex-end" gap="1.5" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                            <Button
                              size="xs"
                              colorScheme="blue"
                              variant="subtle"
                              onClick={() => {
                                setEditingPlan(p);
                                setPlanForm({
                                  name: p.name,
                                  description: p.description || "",
                                  basePrice: p.basePrice || 899,
                                  validityDays: String(p.validityDays || "30"),
                                  popular: p.popular ?? false,
                                  isActive: p.isActive ?? true,
                                });
                                setShowPlanModal(true);
                              }}
                            >
                              <Edit size={12} style={{ marginRight: "4px" }} /> Edit
                            </Button>
                            <IconButton
                              size="xs"
                              variant="solid"
                              bg="#DC2626"
                              color="#FFFFFF"
                              _hover={{ bg: "#EF4444" }}
                              aria-label="Delete plan"
                              onClick={() => handleDeletePlan(p.id)}
                            >
                              <Trash2 size={14} color="#FFFFFF" />
                            </IconButton>
                          </Flex>
                        </Card.Root>
                      ))}
                    </Grid>

                    <Heading size="xs" color="gray.300" textTransform="uppercase" letterSpacing="wider" mt="4">
                      Active Customer Memberships ({userSubscriptions.length})
                    </Heading>

                    {userSubscriptions.length === 0 ? (
                      <Text fontSize="xs" color="gray.400">No active customer subscriptions found.</Text>
                    ) : (
                      <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" overflow="hidden">
                        <Table.Root size="sm" variant="line">
                          <Table.Header bg="#1E293B">
                            <Table.Row>
                              <Table.ColumnHeader color="gray.300">User ID</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.300">Plan</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.300">Billing Period</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.300">Status</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.300">Start Date</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {userSubscriptions.map((us) => (
                              <Table.Row key={us.id}>
                                <Table.Cell color="white" fontSize="xs" fontWeight="bold">{us.userId?.substring(0, 12)}</Table.Cell>
                                <Table.Cell color="gray.300" fontSize="xs">{us.snapshotPlanName}</Table.Cell>
                                <Table.Cell color="gray.300" fontSize="xs">{us.billingPeriod}</Table.Cell>
                                <Table.Cell>
                                  <Badge colorScheme={us.status === "active" ? "green" : "amber"} fontSize="10px">
                                    {us.status}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell color="gray.400" fontSize="11px">{us.currentPeriodStart ? new Date(us.currentPeriodStart).toLocaleDateString() : "N/A"}</Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Card.Root>
                    )}
                  </Stack>
                )}

                {/* TAB 10: CUSTOMER REVIEWS */}
                {activeTab === "reviews" && (
                  <Stack gap="6">
                    <HStack gap="2">
                      <Star size={20} color="#FBBF24" />
                      <Heading size="xs" color="white" fontWeight="bold">
                        Customer Ratings & Reviews ({reviews.length})
                      </Heading>
                    </HStack>

                    {reviews.length === 0 ? (
                      <Flex p="8" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                        <Text color="gray.300" fontSize="sm">
                          No customer reviews submitted yet.
                        </Text>
                      </Flex>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="3">
                        {reviews.map((r) => (
                          <Card.Root key={r.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                            <Flex justifyContent="space-between" alignItems="center" mb="2">
                              <HStack gap="1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    color={star <= r.rating ? "#FBBF24" : "#475569"}
                                    fill={star <= r.rating ? "#FBBF24" : "transparent"}
                                  />
                                ))}
                              </HStack>
                              <Button
                                size="xs"
                                onClick={() => handleToggleReviewPublished(r)}
                                bg={r.isPublished ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                                color={r.isPublished ? "#6EE7B7" : "#FCA5A5"}
                                border="1px solid"
                                borderColor={r.isPublished ? "rgba(52, 211, 153, 0.4)" : "rgba(248, 113, 113, 0.4)"}
                                borderRadius="md"
                                px="2"
                                fontSize="10px"
                                fontWeight="bold"
                              >
                                {r.isPublished ? "Published" : "Hidden"}
                              </Button>
                            </Flex>

                            <Text fontSize="xs" color="white" my="2" fontStyle="italic">
                              "{r.comment || "Great service overall!"}"
                            </Text>

                            <Flex justifyContent="space-between" alignItems="center" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                              <Text fontSize="10px" color="gray.400">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recent"}
                              </Text>
                              <IconButton
                                size="xs"
                                variant="solid"
                                bg="#DC2626"
                                color="#FFFFFF"
                                _hover={{ bg: "#EF4444" }}
                                aria-label="Delete review"
                                onClick={() => handleDeleteReview(r.id)}
                              >
                                <Trash2 size={14} color="#FFFFFF" />
                              </IconButton>
                            </Flex>
                          </Card.Root>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                )}

                {/* TAB 11: BROADCAST PUSH NOTIFICATIONS */}
                {activeTab === "notifications" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Bell size={20} color="#60A5FA" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          Broadcast Push Notifications & Registered Devices ({deviceTokens.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="blue"
                        onClick={() => {
                          setBroadcastForm({ title: "", message: "", targetAudience: "all" });
                          setShowBroadcastModal(true);
                        }}
                      >
                        <Send size={14} style={{ marginRight: "4px" }} /> Compose Broadcast
                      </Button>
                    </Flex>

                    <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                      <HStack gap="3">
                        <Bell size={24} color="#38BDF8" />
                        <Box>
                          <Heading size="xs" color="white" fontWeight="bold">Active Devices Connected</Heading>
                          <Text fontSize="xs" color="gray.300">
                            Total {deviceTokens.length} active Expo & FCM device tokens registered from mobile users.
                          </Text>
                        </Box>
                      </HStack>
                    </Card.Root>

                    <Heading size="xs" color="gray.300" textTransform="uppercase" letterSpacing="wider">
                      Broadcast Notification History ({broadcastHistory.length})
                    </Heading>

                    {broadcastHistory.length === 0 ? (
                      <Text fontSize="xs" color="gray.400">No broadcast messages sent yet.</Text>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap="3">
                        {broadcastHistory.map((h) => (
                          <Card.Root key={h.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                            <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                              <Heading size="xs" color="#38BDF8" fontWeight="bold">
                                {h.title}
                              </Heading>
                              <Badge colorScheme="blue" fontSize="9px">
                                {h.recipientsCount} Devices
                              </Badge>
                            </Flex>
                            <Text fontSize="xs" color="gray.300" mb="2">
                              {h.body}
                            </Text>
                            <Text fontSize="10px" color="gray.400">
                              Sent: {h.sentAt ? new Date(h.sentAt).toLocaleString() : "Recently"}
                            </Text>
                          </Card.Root>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                )}

                {/* TAB 8: HEALTH */}
                {activeTab === "health" && (
                  <Stack gap="6">
                    <Heading size="xs" color="white" fontWeight="bold">
                      Database Health & Monitoring
                    </Heading>

                    <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="2xl" p="4">
                      <HStack gap="3" mb="3">
                        <CheckCircle2 size={20} color="#34D399" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          PostgreSQL RLS & Service Role Authentication
                        </Heading>
                      </HStack>
                      <VStack align="stretch" gap="2" fontSize="xs">
                        <Flex justifyContent="space-between" py="1.5" borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                          <Text color="gray.300">Connection Status:</Text>
                          <Text color="#34D399" fontWeight="bold">Active & Online</Text>
                        </Flex>
                        <Flex justifyContent="space-between" py="1.5">
                          <Text color="gray.300">Polling Interval:</Text>
                          <Text color="white" fontWeight="bold">5 seconds</Text>
                        </Flex>
                      </VStack>
                    </Card.Root>
                  </Stack>
                )}

                {/* TAB 9: API CONSOLE */}
                {activeTab === "api" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center">
                      <HStack gap="2">
                        <Terminal size={20} color="#60A5FA" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          Interactive API Console
                        </Heading>
                      </HStack>
                      <Badge colorScheme="purple" fontSize="10px">
                        JSON Tester
                      </Badge>
                    </Flex>

                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.300" mb="2">
                        Quick Endpoint Selectors:
                      </Text>
                      <Flex gap="2" flexWrap="wrap">
                        {[{ label: "Bookings", ep: "/api/admin/bookings" }, { label: "Services", ep: "/api/admin/services" }, { label: "Providers", ep: "/api/admin/providers" }, { label: "Users", ep: "/api/admin/users" }, { label: "Slots", ep: "/api/admin/slots" }, { label: "Vehicle Catalog", ep: "/api/admin/vehicles/catalog" }, { label: "Stats", ep: "/api/admin/dashboard/stats" }].map((preset) => (
                          <Button
                            key={preset.ep}
                            size="xs"
                            onClick={() => setApiEndpoint(preset.ep)}
                            bg={apiEndpoint === preset.ep ? "#2563EB" : "#1E293B"}
                            color={apiEndpoint === preset.ep ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={apiEndpoint === preset.ep ? "#3B82F6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: apiEndpoint === preset.ep ? "#1D4ED8" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            fontWeight={apiEndpoint === preset.ep ? "bold" : "normal"}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </Flex>
                    </Box>

                    <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="2xl" p={{ base: "4", sm: "6" }}>
                      <Flex flexDir={{ base: "column", sm: "row" }} gap="3" mb="4">
                        <Flex gap="2" w={{ base: "full", sm: "auto" }}>
                          {["GET", "POST", "PUT", "DELETE"].map((m) => (
                            <Button
                              key={m}
                              size="sm"
                              onClick={() => setApiMethod(m)}
                              bg={apiMethod === m ? "#7C3AED" : "#1E293B"}
                              color={apiMethod === m ? "#FFFFFF" : "#E2E8F0"}
                              border="1px solid"
                              borderColor={apiMethod === m ? "#8B5CF6" : "rgba(255, 255, 255, 0.2)"}
                              _hover={{ bg: apiMethod === m ? "#6D28D9" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                              flex="1"
                              fontWeight={apiMethod === m ? "bold" : "normal"}
                            >
                              {m}
                            </Button>
                          ))}
                        </Flex>

                        <Input
                          value={apiEndpoint}
                          onChange={(e) => setApiEndpoint(e.target.value)}
                          placeholder="/api/admin/bookings"
                          bg="#1E293B"
                          borderColor="rgba(255, 255, 255, 0.2)"
                          color="#FFFFFF"
                          size="sm"
                          flex="1"
                          borderRadius="xl"
                        />

                        <Button
                          colorScheme="blue"
                          size="sm"
                          onClick={executeApiTest}
                          loading={apiTesting}
                          w={{ base: "full", sm: "auto" }}
                          borderRadius="xl"
                        >
                          <Send size={14} style={{ marginRight: "6px" }} /> Execute
                        </Button>
                      </Flex>

                      {apiResponse ? (
                        <Box bg="#0B1120" p="4" borderRadius="xl" position="relative">
                          <Flex justifyContent="space-between" alignItems="center" mb="3" pb="2" borderBottom="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                            <HStack gap="2">
                              <Badge colorScheme={apiResponse.ok ? "green" : "red"} fontSize="xs" fontWeight="bold">
                                HTTP {apiResponse.status}
                              </Badge>
                              <Text fontSize="xs" color="gray.300">
                                Response Payload
                              </Text>
                            </HStack>
                            <Button size="xs" variant="ghost" color="#93C5FD" onClick={copyResponseJson}>
                              {copiedJson ? <Check size={12} style={{ marginRight: "4px" }} /> : <Copy size={12} style={{ marginRight: "4px" }} />}
                              {copiedJson ? "Copied!" : "Copy JSON"}
                            </Button>
                          </Flex>

                          <Box
                            overflowX="auto"
                            maxH="450px"
                            fontSize="xs"
                            fontFamily="mono"
                            color="#34D399"
                          >
                            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {JSON.stringify(apiResponse, null, 2)}
                            </pre>
                          </Box>
                        </Box>
                      ) : (
                        <Flex h="120px" alignItems="center" justifyContent="center" bg="#0B1120" borderRadius="xl">
                          <Text color="gray.300" fontSize="xs">
                            Select endpoint and tap &quot;Execute&quot; to test live JSON payloads.
                          </Text>
                        </Flex>
                      )}
                    </Card.Root>
                  </Stack>
                )}
              </>
            )}
          </Box>
        </Flex>
      </Flex>

      {/* --- ALL CRUD MODALS --- */}
      {/* 1. Vehicle Catalog Modal */}
      {showVehicleModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingVehicle ? "Edit Vehicle Model" : "Add New Vehicle Model"}
            </Heading>
            <form onSubmit={handleSaveVehicle}>
              <Stack gap="4">
                <Grid templateColumns="repeat(2, 1fr)" gap="3">
                  <Box>
                    <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Category</Text>
                    <HStack gap="1">
                      {["Car", "Bike"].map((cat) => (
                        <Button
                          key={cat}
                          size="xs"
                          type="button"
                          onClick={() => setVehicleForm({ ...vehicleForm, category: cat })}
                          variant={vehicleForm.category === cat ? "solid" : "outline"}
                          colorScheme={vehicleForm.category === cat ? "purple" : "gray"}
                          flex="1"
                        >
                          {cat}
                        </Button>
                      ))}
                    </HStack>
                  </Box>

                  <Box>
                    <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Body Type</Text>
                    <Input value={vehicleForm.bodyType} onChange={(e) => setVehicleForm({ ...vehicleForm, bodyType: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Hatchback / SUV / Scooter" />
                  </Box>
                </Grid>

                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Brand</Text>
                  <Input required value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="e.g. Maruti Suzuki, Honda, Royal Enfield" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Model Name</Text>
                  <Input required value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="e.g. Swift, Creta, Classic 350" />
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Model Picture / Image URL</Text>
                  <Input value={vehicleForm.modelImage} onChange={(e) => setVehicleForm({ ...vehicleForm, modelImage: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="https://images.unsplash.com/photo-1549399542-7e3f8b79c341" />
                </Box>

                {vehicleForm.modelImage && (
                  <Flex alignItems="center" gap="3" p="2.5" bg="#1E293B" borderRadius="xl" border="1px dashed" borderColor="purple.400">
                    <img
                      src={vehicleForm.modelImage}
                      alt="Model Preview"
                      style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px" }}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                    />
                    <Text fontSize="xs" color="gray.300" fontWeight="bold">
                      Live Picture Preview
                    </Text>
                  </Flex>
                )}

                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
                  <Button colorScheme="purple" type="submit">Save Vehicle</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 2. Service Modal */}
      {showServiceModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="640px" maxH="90vh" overflowY="auto">
            <Heading size="md" color="white" mb="4">
              {editingService ? "Edit Service" : "Add New Service"}
            </Heading>
            <form onSubmit={handleSaveService}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Service Name</Text>
                  <Input required value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="e.g. Foam Washing & Ceramic Coating" />
                </Box>
                
                <Grid templateColumns="repeat(2, 1fr)" gap="3">
                  <Box>
                    <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Vehicle Category</Text>
                    <HStack gap="1">
                      {["4W", "2W"].map((vt) => (
                        <Button
                          key={vt}
                          size="xs"
                          type="button"
                          onClick={() => setServiceForm({ ...serviceForm, vehicleType: vt })}
                          variant={serviceForm.vehicleType === vt ? "solid" : "outline"}
                          colorScheme={serviceForm.vehicleType === vt ? "blue" : "gray"}
                          flex="1"
                        >
                          {vt === "4W" ? "4W Car" : "2W Bike"}
                        </Button>
                      ))}
                    </HStack>
                  </Box>

                  <Box>
                    <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Body Type Target</Text>
                    <Input value={serviceForm.bodyType} onChange={(e) => setServiceForm({ ...serviceForm, bodyType: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Hatchback / SUV / All" />
                  </Box>
                </Grid>

                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Fallback price (₹)</Text>
                  <Input type="number" required value={serviceForm.basePrice} onChange={(e) => setServiceForm({ ...serviceForm, basePrice: Number(e.target.value) })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                  <Text fontSize="10px" color="gray.400" mt="1">Used only when a body type below is left blank.</Text>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.300" mb="2" fontWeight="bold">Price by body type (₹)</Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap="2">
                    {BODY_PRICE_FIELDS.map((field) => (
                      <Box key={field.key}>
                        <Text fontSize="10px" color="gray.400" mb="1">{field.label}</Text>
                        <Input
                          type="number"
                          value={serviceForm.prices?.[field.key] ?? ""}
                          onChange={(e) => setServiceForm({
                            ...serviceForm,
                            prices: { ...serviceForm.prices, [field.key]: e.target.value },
                          })}
                          bg="#1E293B"
                          color="#FFFFFF"
                          borderRadius="lg"
                          placeholder="—"
                        />
                      </Box>
                    ))}
                  </Grid>
                </Box>
                
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Duration (Minutes)</Text>
                  <Input value={serviceForm.durationMinutes} onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                </Box>

                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowServiceModal(false)}>Cancel</Button>
                  <Button colorScheme="blue" type="submit">Save Service</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 3. Provider Modal */}
      {showProviderModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingProvider ? "Edit Provider" : "Register Provider"}
            </Heading>
            <form onSubmit={handleSaveProvider}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Full Name</Text>
                  <Input required value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Phone</Text>
                  <Input required value={providerForm.phone} onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowProviderModal(false)}>Cancel</Button>
                  <Button colorScheme="teal" type="submit">Save Provider</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 4. Slot Modal */}
      {showSlotModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingSlot ? "Edit Time Slot" : "Create Time Slot"}
            </Heading>
            <form onSubmit={handleSaveSlot}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Time Slot Range</Text>
                  <Input required value={slotForm.slotTime} onChange={(e) => setSlotForm({ ...slotForm, slotTime: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="09:00 AM - 10:00 AM" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Maximum Booking Capacity</Text>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={slotForm.maxCapacity}
                    onChange={(e) => setSlotForm({ ...slotForm, maxCapacity: parseInt(e.target.value) || 1 })}
                    bg="#1E293B"
                    color="#FFFFFF"
                    borderRadius="lg"
                    placeholder="10"
                    mb="2"
                  />
                  <Text fontSize="10px" color="gray.400" mb="1">Quick capacity presets:</Text>
                  <HStack gap="1.5" flexWrap="wrap">
                    {[5, 10, 15, 20, 25, 50].map((presetCap) => (
                      <Button
                        key={presetCap}
                        size="2xs"
                        type="button"
                        onClick={() => setSlotForm({ ...slotForm, maxCapacity: presetCap })}
                        bg={slotForm.maxCapacity === presetCap ? "#7C3AED" : "#1E293B"}
                        color={slotForm.maxCapacity === presetCap ? "#FFFFFF" : "#CBD5E1"}
                        border="1px solid"
                        borderColor={slotForm.maxCapacity === presetCap ? "#8B5CF6" : "rgba(255, 255, 255, 0.2)"}
                        borderRadius="md"
                        px="2.5"
                        py="1"
                      >
                        {presetCap} max
                      </Button>
                    ))}
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Slot Status</Text>
                  <HStack gap="2">
                    <Button
                      size="xs"
                      type="button"
                      onClick={() => setSlotForm({ ...slotForm, isActive: true })}
                      variant={slotForm.isActive ? "solid" : "outline"}
                      colorScheme={slotForm.isActive ? "green" : "gray"}
                      flex="1"
                    >
                      Active / Open
                    </Button>
                    <Button
                      size="xs"
                      type="button"
                      onClick={() => setSlotForm({ ...slotForm, isActive: false })}
                      variant={!slotForm.isActive ? "solid" : "outline"}
                      colorScheme={!slotForm.isActive ? "red" : "gray"}
                      flex="1"
                    >
                      Closed / Full
                    </Button>
                  </HStack>
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowSlotModal(false)}>Cancel</Button>
                  <Button colorScheme="purple" type="submit">Save Slot</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 5. Booking Modal */}
      {showBookingModal && editingBooking && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="2">
              Manage Booking #{editingBooking.id?.substring(0, 8)}
            </Heading>

            <Stack gap="4" mt="4">
              <Box>
                <Text fontSize="xs" color="gray.300" mb="2" fontWeight="bold">Update Status:</Text>
                <HStack gap="2" flexWrap="wrap">
                  {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((st) => (
                    <Button
                      key={st}
                      size="xs"
                      onClick={() => setBookingStatusForm(st)}
                      variant={bookingStatusForm === st ? "solid" : "outline"}
                      colorScheme={bookingStatusForm === st ? "blue" : "gray"}
                      textTransform="capitalize"
                    >
                      {st}
                    </Button>
                  ))}
                </HStack>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.300" mb="2" fontWeight="bold">Assign Provider:</Text>
                <VStack align="stretch" gap="2">
                  {providers.map((p) => (
                    <Button
                      key={p.id}
                      size="sm"
                      onClick={() => setBookingProviderForm(p.id)}
                      variant={bookingProviderForm === p.id ? "solid" : "outline"}
                      colorScheme={bookingProviderForm === p.id ? "teal" : "gray"}
                      justifyContent="space-between"
                    >
                      <Text fontSize="xs">{p.name}</Text>
                      <Text fontSize="10px">{p.phone}</Text>
                    </Button>
                  ))}
                </VStack>
              </Box>

              <Flex justifyContent="flex-end" gap="3" pt="4">
                <Button variant="ghost" color="gray.300" onClick={() => setShowBookingModal(false)}>Cancel</Button>
                <Button colorScheme="purple" onClick={handleSaveBooking}>Update Booking</Button>
              </Flex>
            </Stack>
          </Box>
        </Flex>
      )}


      {/* 7. Coupon Modal */}
      {showCouponModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingCoupon ? "Edit Coupon Code" : "Create Coupon Code"}
            </Heading>
            <form onSubmit={handleSaveCoupon}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Coupon Code (Uppercase)</Text>
                  <Input required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="SUMMER50" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Description</Text>
                  <Input value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Flat ₹100 off on detailing" />
                </Box>
                <Grid templateColumns="repeat(2, 1fr)" gap="3">
                  <Box>
                    <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Discount Value</Text>
                    <Input type="number" required value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Min Booking (₹)</Text>
                    <Input type="number" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                  </Box>
                </Grid>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowCouponModal(false)}>Cancel</Button>
                  <Button colorScheme="amber" type="submit">Save Coupon</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 8. CarePass Plan Modal */}
      {showPlanModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingPlan ? "Edit CarePass Plan" : "Create CarePass Plan"}
            </Heading>
            <form onSubmit={handleSavePlan}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Plan Name</Text>
                  <Input required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Shrawasti CarePass Platinum" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Base Monthly Price (₹)</Text>
                  <Input type="number" required value={planForm.basePrice} onChange={(e) => setPlanForm({ ...planForm, basePrice: Number(e.target.value) })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowPlanModal(false)}>Cancel</Button>
                  <Button colorScheme="purple" type="submit">Save Plan</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 9. Broadcast Push Modal */}
      {showBroadcastModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              Compose Broadcast Push Notification
            </Heading>
            <form onSubmit={handleSendBroadcast}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Title</Text>
                  <Input required value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Weekend Special Offer! 🧼" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Message Body</Text>
                  <Input required value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Get 20% off on vehicle detailing this weekend!" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowBroadcastModal(false)}>Cancel</Button>
                  <Button colorScheme="blue" type="submit">Send Broadcast</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 6. User Modal */}
      {showUserModal && editingUser && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              Edit User Profile
            </Heading>
            <form onSubmit={handleSaveUser}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">User Name</Text>
                  <Input required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Phone</Text>
                  <Input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowUserModal(false)}>Cancel</Button>
                  <Button colorScheme="blue" type="submit">Save User</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}
    </Flex>
  );
}
