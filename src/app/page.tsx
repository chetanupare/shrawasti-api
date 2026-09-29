"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "bookings"
    | "users"
    | "providers"
    | "services"
    | "slots"
    | "vehicles"
    | "health"
    | "api"
  >("overview");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  // API console tester
  const [apiEndpoint, setApiEndpoint] = useState("/api/admin/bookings");
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiTesting, setApiTesting] = useState(false);

  // --- CRUD MODAL STATES ---
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ brand: "", model: "", category: "Car", bodyType: "Hatchback" });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "car_wash", basePrice: 499, durationMinutes: "45", description: "" });

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
      ] = await Promise.all([
        fetch("/api/admin/dashboard/stats").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/bookings").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/users").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/providers").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/services").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/slots").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/vehicles/catalog").then((r) => r.json()).catch(() => ({})),
      ]);

      if (statsRes.success) setStats(statsRes.stats);

      setBookings(Array.isArray(bookingsRes) ? bookingsRes : bookingsRes.bookings || []);
      setUsers(Array.isArray(usersRes) ? usersRes : usersRes.users || []);
      setProviders(Array.isArray(providersRes) ? providersRes : providersRes.providers || []);
      setServices(Array.isArray(servicesRes) ? servicesRes : servicesRes.services || []);
      setSlots(Array.isArray(slotsRes) ? slotsRes : slotsRes.slots || []);
      setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes : vehiclesRes.catalog || vehiclesRes.vehicles || []);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      const res = await fetch("/api/admin/vehicles/catalog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingVehicle ? "Vehicle model updated!" : "Vehicle model added to catalog!");
        setShowVehicleModal(false);
        setEditingVehicle(null);
        setVehicleForm({ brand: "", model: "", category: "Car", bodyType: "Hatchback" });
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
      const res = await fetch(`/api/admin/vehicles/catalog?id=${id}`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingService ? "Service updated!" : "New service created!");
        setShowServiceModal(false);
        setEditingService(null);
        setServiceForm({ name: "", category: "car_wash", basePrice: 499, durationMinutes: "45", description: "" });
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
      const res = await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/providers", {
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
      const res = await fetch(`/api/admin/providers?id=${id}`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/slots", {
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
      const res = await fetch(`/api/admin/slots?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Time slot deleted!");
        fetchAllData(true);
      }
    } catch (err) {
      showToast("Error deleting slot");
    }
  };

  const handleSaveBooking = async () => {
    if (!editingBooking) return;
    try {
      const res = await fetch("/api/admin/bookings", {
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
      const res = await fetch(`/api/admin/bookings?id=${id}`, { method: "DELETE" });
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
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
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
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
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
      const res = await fetch(apiEndpoint, { method: apiMethod });
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

  // Status color mapper
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return { bg: "teal.900", color: "teal.200", border: "teal.700" };
      case "completed":
        return { bg: "green.900", color: "green.200", border: "green.700" };
      case "in_progress":
        return { bg: "blue.900", color: "blue.200", border: "blue.700" };
      case "cancelled":
        return { bg: "red.900", color: "red.200", border: "red.700" };
      default:
        return { bg: "yellow.900", color: "yellow.200", border: "yellow.700" };
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const custName = b.user?.name || b.users?.name || "";
    const custEmail = b.user?.email || b.users?.email || "";
    const matchesSearch =
      b.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.status?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const sidebarContent = (
    <VStack align="stretch" p="4" gap="1.5" flex="1">
      <Text fontSize="xs" fontWeight="bold" color="gray.400" px="3" pt="2" textTransform="uppercase" letterSpacing="wider">
        Main Management
      </Text>

      {[
        { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
        { id: "bookings", label: "Bookings", icon: CalendarCheck, count: bookings.length },
        { id: "users", label: "Registered Users", icon: Users, count: users.length },
        { id: "providers", label: "Service Providers", icon: UserCheck, count: providers.length },
        { id: "services", label: "Services Catalog", icon: Wrench, count: services.length },
        { id: "slots", label: "Time Slots", icon: Clock, count: slots.length },
        { id: "vehicles", label: "Vehicle Catalog", icon: Car, count: vehicles.length },
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
            justifyContent="space-between"
            w="full"
            h="44px"
            px="3"
            borderRadius="lg"
            bg={isActive ? "blue.600" : "transparent"}
            color={isActive ? "white" : "gray.300"}
            _hover={{ bg: isActive ? "blue.600" : "whiteAlpha.100", color: "white" }}
            fontWeight={isActive ? "semibold" : "medium"}
          >
            <HStack gap="3">
              <Icon size={18} color={isActive ? "#FFF" : "#94A3B8"} />
              <Text fontSize="sm">{item.label}</Text>
            </HStack>
            {item.count !== undefined && (
              <Badge
                borderRadius="full"
                px="2"
                py="0.5"
                fontSize="xs"
                bg={isActive ? "whiteAlpha.300" : "whiteAlpha.100"}
                color={isActive ? "white" : "gray.300"}
              >
                {item.count}
              </Badge>
            )}
          </Button>
        );
      })}

      <Text fontSize="xs" fontWeight="bold" color="gray.400" px="3" pt="4" textTransform="uppercase" letterSpacing="wider">
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
            gap="3"
            w="full"
            h="44px"
            px="3"
            borderRadius="lg"
            bg={isActive ? "blue.600" : "transparent"}
            color={isActive ? "white" : "gray.300"}
            _hover={{ bg: isActive ? "blue.600" : "whiteAlpha.100", color: "white" }}
          >
            <Icon size={18} color={isActive ? "#FFF" : "#94A3B8"} />
            <Text fontSize="sm">{item.label}</Text>
          </Button>
        );
      })}
    </VStack>
  );

  return (
    <Flex minH="100vh" bg="#090D16" color="#F8FAFC" flexDir="column">
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
          borderRadius="lg"
          boxShadow="2xl"
          fontWeight="semibold"
          display="flex"
          alignItems="center"
          gap="2"
        >
          <Sparkles size={18} />
          <Text fontSize="sm">{toastMessage}</Text>
        </Box>
      )}

      {/* Main Flex Layout */}
      <Flex flex="1" overflow="hidden">
        {/* Desktop Sidebar */}
        <Box
          w="260px"
          bg="#0F172A"
          borderRight="1px solid"
          borderColor="whiteAlpha.100"
          display={{ base: "none", md: "flex" }}
          flexDir="column"
        >
          {/* Brand */}
          <Flex p="6" alignItems="center" gap="3" borderBottom="1px solid" borderColor="whiteAlpha.100">
            <Flex
              w="40px"
              h="40px"
              borderRadius="xl"
              bgGradient="linear(to-br, blue.500, purple.600)"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 0 15px rgba(59, 130, 246, 0.4)"
            >
              <ShieldCheck size={24} color="#FFF" />
            </Flex>
            <Box>
              <Heading size="md" color="white" fontWeight="bold" letterSpacing="tight">
                Shrawasti
              </Heading>
              <Badge colorScheme="purple" fontSize="xs" variant="solid" px="2" py="0.5" borderRadius="md">
                Chakra Mobile Admin
              </Badge>
            </Box>
          </Flex>

          {sidebarContent}

          {/* Database Status footer */}
          <Box p="4" borderTop="1px solid" borderColor="whiteAlpha.100" bg="#0B1120">
            <Flex alignItems="center" gap="3">
              <Box w="8px" h="8px" borderRadius="full" bg="green.400" boxShadow="0 0 10px #48BB78" />
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="white">
                  Supabase Connected
                </Text>
                <Text fontSize="10px" color="gray.400">
                  Auto-syncing every 5s
                </Text>
              </Box>
            </Flex>
          </Box>
        </Box>

        {/* Mobile Slide-over Drawer / Menu */}
        {isMobileMenuOpen && (
          <Box position="fixed" inset="0" zIndex="999" bg="blackAlpha.800" display={{ base: "block", md: "none" }}>
            <Box w="280px" h="full" bg="#0F172A" display="flex" flexDir="column" boxShadow="2xl">
              <Flex p="4" justifyContent="space-between" alignItems="center" borderBottom="1px solid" borderColor="whiteAlpha.100">
                <HStack gap="2">
                  <ShieldCheck size={20} color="#3B82F6" />
                  <Heading size="xs" color="white">Shrawasti Menu</Heading>
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
          {/* Top Header */}
          <Flex
            h="70px"
            px={{ base: "4", md: "8" }}
            bg="#0F172A"
            borderBottom="1px solid"
            borderColor="whiteAlpha.100"
            alignItems="center"
            justifyContent="space-between"
          >
            <HStack gap="3">
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

              <Badge colorScheme="blue" variant="subtle" px="2.5" py="1" borderRadius="full" fontSize="xs" display={{ base: "none", sm: "inline-block" }}>
                Live DB
              </Badge>
            </HStack>

            <HStack gap="2">
              <Button
                onClick={() => fetchAllData(true)}
                size="xs"
                variant="outline"
                borderColor="whiteAlpha.200"
                color="gray.200"
                _hover={{ bg: "whiteAlpha.100", color: "white" }}
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} style={{ marginRight: "4px" }} />
                Sync
              </Button>

              <Button
                onClick={handleSeedDatabase}
                disabled={seeding}
                size="xs"
                bgGradient="linear(to-r, emerald.500, teal.600)"
                color="white"
                _hover={{ bgGradient: "linear(to-r, emerald.600, teal.700)" }}
              >
                {seeding ? <Spinner size="xs" mr="1" /> : <Database size={12} style={{ marginRight: "4px" }} />}
                Seed DB
              </Button>
            </HStack>
          </Flex>

          {/* Content Body */}
          <Box p={{ base: "4", md: "8" }} flex="1" overflowY="auto">
            {loading ? (
              <Flex h="300px" alignItems="center" justifyContent="center" flexDir="column" gap="4">
                <Spinner size="xl" color="blue.400" />
                <Text color="gray.400" fontSize="sm">
                  Fetching real-time records from Supabase PostgreSQL...
                </Text>
              </Flex>
            ) : (
              <>
                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                  <Stack gap="8">
                    {/* KPI Cards Grid */}
                    <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }} gap="4">
                      {[
                        {
                          title: "Total Revenue",
                          value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`,
                          icon: DollarSign,
                          color: "emerald.400",
                          bg: "rgba(16, 185, 129, 0.1)",
                        },
                        {
                          title: "Total Bookings",
                          value: stats.totalBookings || bookings.length || 0,
                          icon: CalendarCheck,
                          color: "blue.400",
                          bg: "rgba(59, 130, 246, 0.1)",
                        },
                        {
                          title: "Confirmed Jobs",
                          value: stats.confirmedBookings || bookings.filter((b) => b.status === "confirmed").length || 0,
                          icon: CheckCircle2,
                          color: "purple.400",
                          bg: "rgba(168, 85, 247, 0.1)",
                        },
                        {
                          title: "Registered Users",
                          value: stats.totalUsers || users.length || 0,
                          icon: Users,
                          color: "amber.400",
                          bg: "rgba(245, 158, 11, 0.1)",
                        },
                        {
                          title: "Active Providers",
                          value: stats.activeProviders || providers.length || 0,
                          icon: UserCheck,
                          color: "teal.400",
                          bg: "rgba(20, 184, 166, 0.1)",
                        },
                      ].map((kpi, idx) => {
                        const Icon = kpi.icon;
                        return (
                          <Card.Root
                            key={idx}
                            bg="#0F172A"
                            borderColor="whiteAlpha.100"
                            borderWidth="1px"
                            borderRadius="xl"
                            p="4"
                          >
                            <Flex justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb="1">
                                  {kpi.title}
                                </Text>
                                <Heading size="md" color="white" fontWeight="bold">
                                  {kpi.value}
                                </Heading>
                              </Box>
                              <Flex p="2" borderRadius="lg" bg={kpi.bg}>
                                <Icon size={18} color="#3B82F6" />
                              </Flex>
                            </Flex>
                          </Card.Root>
                        );
                      })}
                    </Grid>

                    {/* Recent Bookings & Providers */}
                    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap="6">
                      {/* Recent Bookings Card */}
                      <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl">
                        <Flex p="4" justifyContent="space-between" alignItems="center" borderBottom="1px solid" borderColor="whiteAlpha.100">
                          <HStack gap="2">
                            <CalendarCheck size={18} color="#3B82F6" />
                            <Heading size="xs" color="white">
                              Recent Dynamic Bookings ({bookings.length})
                            </Heading>
                          </HStack>
                          <Button size="xs" variant="ghost" color="blue.400" onClick={() => setActiveTab("bookings")}>
                            View All
                          </Button>
                        </Flex>

                        <Box overflowX="auto" p="2">
                          {bookings.length === 0 ? (
                            <Flex p="6" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                              <Text color="gray.400" fontSize="xs">
                                No bookings found in database yet.
                              </Text>
                              <Button size="xs" colorScheme="blue" onClick={handleSeedDatabase} disabled={seeding}>
                                Seed Database Now
                              </Button>
                            </Flex>
                          ) : (
                            <Table.Root size="sm" variant="outline" colorScheme="whiteAlpha">
                              <Table.Header>
                                <Table.Row borderColor="whiteAlpha.100">
                                  <Table.ColumnHeader color="gray.400">ID / Date</Table.ColumnHeader>
                                  <Table.ColumnHeader color="gray.400">Customer</Table.ColumnHeader>
                                  <Table.ColumnHeader color="gray.400">Service & Price</Table.ColumnHeader>
                                  <Table.ColumnHeader color="gray.400">Status</Table.ColumnHeader>
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {bookings.slice(0, 5).map((b) => {
                                  const st = getStatusColor(b.status);
                                  const custName = b.user?.name || b.users?.name || "Customer";
                                  const custPhone = b.user?.phone || b.users?.phone || b.user?.email || b.users?.email || "-";
                                  const serviceName = b.services?.name || b.service_name || "Car Wash & Detailing";
                                  const price = b.total || b.subtotal || b.total_amount || 499;
                                  const dateStr = b.scheduleDate || b.booking_date || b.createdAt?.split("T")[0] || "Today";

                                  return (
                                    <Table.Row key={b.id} _hover={{ bg: "whiteAlpha.50" }} borderColor="whiteAlpha.100">
                                      <Table.Cell>
                                        <Text fontSize="xs" fontWeight="bold" color="blue.300">
                                          #{b.id?.substring(0, 8)}
                                        </Text>
                                        <Text fontSize="10px" color="gray.400">
                                          {dateStr}
                                        </Text>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Text fontSize="xs" fontWeight="semibold" color="white">
                                          {custName}
                                        </Text>
                                        <Text fontSize="10px" color="gray.400">
                                          {custPhone}
                                        </Text>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Text fontSize="xs" color="gray.200">
                                          {serviceName}
                                        </Text>
                                        <Text fontSize="xs" fontWeight="bold" color="emerald.400">
                                          ₹{price}
                                        </Text>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Badge bg={st.bg} color={st.color} border="1px solid" borderColor={st.border} px="2" py="0.5" borderRadius="md" textTransform="capitalize" fontSize="xs">
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
                      <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl">
                        <Flex p="4" justifyContent="space-between" alignItems="center" borderBottom="1px solid" borderColor="whiteAlpha.100">
                          <HStack gap="2">
                            <UserCheck size={18} color="#10B981" />
                            <Heading size="xs" color="white">
                              Providers ({providers.length})
                            </Heading>
                          </HStack>
                          <Button size="xs" variant="ghost" color="blue.400" onClick={() => setActiveTab("providers")}>
                            View All
                          </Button>
                        </Flex>

                        <VStack p="3" align="stretch" gap="2.5">
                          {providers.length === 0 ? (
                            <Text color="gray.400" fontSize="xs" textAlign="center" py="4">
                              No service providers configured.
                            </Text>
                          ) : (
                            providers.slice(0, 4).map((p) => (
                              <Flex
                                key={p.id}
                                p="2.5"
                                borderRadius="lg"
                                bg="#1E293B"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <HStack gap="2.5">
                                  <Flex w="32px" h="32px" borderRadius="full" bg="blue.900" color="blue.300" alignItems="center" justifyContent="center" fontWeight="bold" fontSize="xs">
                                    {p.name?.charAt(0) || "P"}
                                  </Flex>
                                  <Box>
                                    <Text fontSize="xs" fontWeight="bold" color="white">
                                      {p.name}
                                    </Text>
                                    <Text fontSize="10px" color="gray.400">
                                      {p.phone}
                                    </Text>
                                  </Box>
                                </HStack>
                                <Badge colorScheme={p.isOnline ?? p.is_available ? "green" : "gray"} fontSize="10px">
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
                      <Input
                        placeholder="Search ID, Customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        bg="#0F172A"
                        borderColor="whiteAlpha.200"
                        size="sm"
                        borderRadius="lg"
                        maxW={{ base: "full", sm: "300px" }}
                      />

                      <HStack gap="1.5" overflowX="auto" w={{ base: "full", sm: "auto" }}>
                        {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
                          <Button
                            key={st}
                            size="xs"
                            onClick={() => setStatusFilter(st)}
                            variant={statusFilter === st ? "solid" : "outline"}
                            colorScheme={statusFilter === st ? "blue" : "gray"}
                            borderRadius="md"
                            textTransform="capitalize"
                          >
                            {st}
                          </Button>
                        ))}
                      </HStack>
                    </Flex>

                    <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl">
                      <Box overflowX="auto" p="3">
                        {filteredBookings.length === 0 ? (
                          <Flex p="6" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                            <Text color="gray.400" fontSize="sm">
                              No bookings match query.
                            </Text>
                          </Flex>
                        ) : (
                          <Table.Root size="sm" variant="outline" colorScheme="whiteAlpha">
                            <Table.Header>
                              <Table.Row borderColor="whiteAlpha.100">
                                <Table.ColumnHeader color="gray.400">Booking ID</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400">Customer</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400">Service Info</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400">Provider</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400">Amount</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400">Status</Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400">Actions</Table.ColumnHeader>
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
                                  <Table.Row key={b.id} _hover={{ bg: "whiteAlpha.50" }} borderColor="whiteAlpha.100">
                                    <Table.Cell fontWeight="bold" color="blue.300" fontSize="xs">
                                      #{b.id?.substring(0, 8)}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text fontSize="xs" fontWeight="bold" color="white">
                                        {custName}
                                      </Text>
                                      <Text fontSize="10px" color="gray.400">
                                        {custPhone}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text fontSize="xs" color="gray.200">
                                        {serviceName}
                                      </Text>
                                      <Text fontSize="10px" color="gray.400">
                                        {timeSlot}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {providerName ? (
                                        <Badge colorScheme="teal" fontSize="xs">
                                          {providerName}
                                        </Badge>
                                      ) : (
                                        <Text fontSize="xs" color="yellow.400">
                                          Unassigned
                                        </Text>
                                      )}
                                    </Table.Cell>
                                    <Table.Cell fontWeight="bold" color="emerald.400" fontSize="xs">
                                      ₹{price}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Badge bg={st.bg} color={st.color} border="1px solid" borderColor={st.border} px="2" py="0.5" borderRadius="md" textTransform="capitalize" fontSize="xs">
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
                                          colorScheme="red"
                                          variant="ghost"
                                          aria-label="Delete booking"
                                          onClick={() => handleDeleteBooking(b.id)}
                                        >
                                          <Trash2 size={12} />
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
                    <Heading size="xs" color="white">
                      Users ({users.length})
                    </Heading>

                    <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl">
                      <Box overflowX="auto" p="3">
                        <Table.Root size="sm" variant="outline">
                          <Table.Header>
                            <Table.Row borderColor="whiteAlpha.100">
                              <Table.ColumnHeader color="gray.400">Name</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.400">Email</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.400">Phone</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.400">Role</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.400">Actions</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {users.map((u) => (
                              <Table.Row key={u.id} _hover={{ bg: "whiteAlpha.50" }} borderColor="whiteAlpha.100">
                                <Table.Cell fontWeight="bold" color="white" fontSize="xs">
                                  {u.name}
                                </Table.Cell>
                                <Table.Cell color="gray.300" fontSize="xs">
                                  {u.email}
                                </Table.Cell>
                                <Table.Cell color="gray.300" fontSize="xs">
                                  {u.phone || "N/A"}
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge colorScheme={u.role === "admin" ? "purple" : "blue"} fontSize="xs">
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
                                      colorScheme="red"
                                      variant="ghost"
                                      aria-label="Delete user"
                                      onClick={() => handleDeleteUser(u.id)}
                                    >
                                      <Trash2 size={12} />
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
                      <Heading size="xs" color="white">
                        Providers ({providers.length})
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
                      {providers.map((p) => (
                        <Card.Root key={p.id} bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="4">
                          <Flex justifyContent="space-between" alignItems="flex-start" mb="3">
                            <HStack gap="2.5">
                              <Flex w="36px" h="36px" borderRadius="xl" bg="teal.900" color="teal.300" alignItems="center" justifyContent="center" fontWeight="bold">
                                {p.name?.charAt(0) || "P"}
                              </Flex>
                              <Box>
                                <Heading size="xs" color="white">
                                  {p.name}
                                </Heading>
                                <Text fontSize="10px" color="gray.400">
                                  {p.phone}
                                </Text>
                              </Box>
                            </HStack>
                            <Badge colorScheme={p.status === "active" || p.isOnline || p.is_available ? "green" : "red"} fontSize="xs">
                              {p.status || "Active"}
                            </Badge>
                          </Flex>

                          <Flex justifyContent="flex-end" gap="2" pt="2" borderTop="1px solid" borderColor="whiteAlpha.100">
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
                              colorScheme="red"
                              variant="ghost"
                              aria-label="Delete provider"
                              onClick={() => handleDeleteProvider(p.id)}
                            >
                              <Trash2 size={12} />
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
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading size="xs" color="white">
                        Services ({services.length})
                      </Heading>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        onClick={() => {
                          setEditingService(null);
                          setServiceForm({ name: "", category: "car_wash", basePrice: 499, durationMinutes: "45", description: "" });
                          setShowServiceModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Add Service
                      </Button>
                    </Flex>

                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="4">
                      {services.map((s) => (
                        <Card.Root key={s.id} bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="4">
                          <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                            <Heading size="xs" color="white">
                              {s.name}
                            </Heading>
                            <Badge colorScheme="blue" fontSize="xs">
                              {s.category || "Service"}
                            </Badge>
                          </Flex>

                          <Flex justifyContent="space-between" alignItems="center" my="3">
                            <Text fontSize="md" fontWeight="bold" color="emerald.400">
                              ₹{s.basePrice || s.price}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              ⏱️ {s.durationMinutes ? `${s.durationMinutes} mins` : s.duration || "45 mins"}
                            </Text>
                          </Flex>

                          <Flex justifyContent="flex-end" gap="2" pt="2" borderTop="1px solid" borderColor="whiteAlpha.100">
                            <Button
                              size="xs"
                              colorScheme="blue"
                              variant="subtle"
                              onClick={() => {
                                setEditingService(s);
                                setServiceForm({
                                  name: s.name || "",
                                  category: s.category || "car_wash",
                                  basePrice: s.basePrice || s.price || 499,
                                  durationMinutes: String(s.durationMinutes || "45"),
                                  description: s.description || "",
                                });
                                setShowServiceModal(true);
                              }}
                            >
                              <Edit size={12} />
                            </Button>
                            <IconButton
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              aria-label="Delete service"
                              onClick={() => handleDeleteService(s.id)}
                            >
                              <Trash2 size={12} />
                            </IconButton>
                          </Flex>
                        </Card.Root>
                      ))}
                    </Grid>
                  </Stack>
                )}

                {/* TAB 6: SLOTS */}
                {activeTab === "slots" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading size="xs" color="white">
                        Slots ({slots.length})
                      </Heading>
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

                    <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }} gap="3">
                      {slots.map((s) => (
                        <Card.Root key={s.id} bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="3">
                          <Flex justifyContent="space-between" alignItems="center" mb="2">
                            <Text fontSize="xs" fontWeight="bold" color="white">
                              {s.slotTime || s.slot_time || s.time}
                            </Text>
                            <Badge colorScheme={s.isActive ?? s.is_available ? "green" : "gray"} fontSize="10px">
                              {s.isActive ?? s.is_available ? "Open" : "Booked"}
                            </Badge>
                          </Flex>

                          <Flex justifyContent="space-between" alignItems="center">
                            <Text fontSize="10px" color="gray.400">
                              Cap: {s.maxCapacity || 10}
                            </Text>
                            <HStack gap="1">
                              <IconButton
                                size="xs"
                                colorScheme="blue"
                                variant="ghost"
                                aria-label="Edit slot"
                                onClick={() => {
                                  setEditingSlot(s);
                                  setSlotForm({
                                    slotTime: s.slotTime || s.slot_time || "",
                                    maxCapacity: s.maxCapacity || 10,
                                    isActive: s.isActive ?? true,
                                  });
                                  setShowSlotModal(true);
                                }}
                              >
                                <Edit size={12} />
                              </IconButton>
                              <IconButton
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                aria-label="Delete slot"
                                onClick={() => handleDeleteSlot(s.id)}
                              >
                                <Trash2 size={12} />
                              </IconButton>
                            </HStack>
                          </Flex>
                        </Card.Root>
                      ))}
                    </Grid>
                  </Stack>
                )}

                {/* TAB 7: VEHICLE CATALOG (FULL CRUD) */}
                {activeTab === "vehicles" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading size="xs" color="white">
                        Vehicle Catalog ({vehicles.length})
                      </Heading>
                      <Button
                        size="xs"
                        colorScheme="purple"
                        onClick={() => {
                          setEditingVehicle(null);
                          setVehicleForm({ brand: "", model: "", category: "Car", bodyType: "Hatchback" });
                          setShowVehicleModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Add Model
                      </Button>
                    </Flex>

                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="4">
                      {vehicles.map((v) => (
                        <Card.Root key={v.id} bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="4">
                          <Flex justifyContent="space-between" alignItems="flex-start" mb="3">
                            <HStack gap="2.5">
                              <Flex w="36px" h="36px" borderRadius="lg" bg="purple.900" color="purple.300" alignItems="center" justifyContent="center">
                                <Car size={18} />
                              </Flex>
                              <Box>
                                <Heading size="xs" color="white">
                                  {v.brand} {v.model}
                                </Heading>
                                <Text fontSize="10px" color="gray.400">
                                  {v.category || "Car"} ({v.bodyType || v.body_type || "Hatchback"})
                                </Text>
                              </Box>
                            </HStack>
                            <Badge colorScheme="purple" fontSize="10px">
                              {v.category || "Car"}
                            </Badge>
                          </Flex>

                          <Flex justifyContent="flex-end" gap="2" pt="2" borderTop="1px solid" borderColor="whiteAlpha.100">
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
                                });
                                setShowVehicleModal(true);
                              }}
                            >
                              <Edit size={12} />
                            </Button>
                            <IconButton
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              aria-label="Delete vehicle"
                              onClick={() => handleDeleteVehicle(v.id)}
                            >
                              <Trash2 size={12} />
                            </IconButton>
                          </Flex>
                        </Card.Root>
                      ))}
                    </Grid>
                  </Stack>
                )}

                {/* TAB 8: HEALTH */}
                {activeTab === "health" && (
                  <Stack gap="6">
                    <Heading size="xs" color="white">
                      Database Health
                    </Heading>

                    <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="4">
                      <HStack gap="3" mb="3">
                        <CheckCircle2 size={20} color="#10B981" />
                        <Heading size="xs" color="white">
                          PostgreSQL RLS & Connection
                        </Heading>
                      </HStack>
                      <VStack align="stretch" gap="2" fontSize="xs">
                        <Flex justifyContent="space-between" py="1.5" borderBottom="1px solid" borderColor="whiteAlpha.100">
                          <Text color="gray.400">Status:</Text>
                          <Text color="emerald.400" fontWeight="bold">Healthy / Live</Text>
                        </Flex>
                        <Flex justifyContent="space-between" py="1.5">
                          <Text color="gray.400">Auto Polling:</Text>
                          <Text color="white" fontWeight="bold">Every 5 seconds</Text>
                        </Flex>
                      </VStack>
                    </Card.Root>
                  </Stack>
                )}

                {/* TAB 9: API CONSOLE (MOBILE RESPONSIVE) */}
                {activeTab === "api" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center">
                      <HStack gap="2">
                        <Terminal size={20} color="#3B82F6" />
                        <Heading size="xs" color="white">
                          Mobile-Responsive API Console
                        </Heading>
                      </HStack>
                      <Badge colorScheme="purple" fontSize="10px">
                        JSON Tester
                      </Badge>
                    </Flex>

                    {/* Quick Endpoint Preset Buttons */}
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.400" mb="2">
                        Quick Endpoint Selectors:
                      </Text>
                      <Flex gap="2" flexWrap="wrap">
                        {[
                          { label: "Bookings", ep: "/api/admin/bookings" },
                          { label: "Services", ep: "/api/admin/services" },
                          { label: "Providers", ep: "/api/admin/providers" },
                          { label: "Users", ep: "/api/admin/users" },
                          { label: "Slots", ep: "/api/admin/slots" },
                          { label: "Vehicle Catalog", ep: "/api/admin/vehicles/catalog" },
                          { label: "Stats", ep: "/api/admin/dashboard/stats" },
                        ].map((preset) => (
                          <Button
                            key={preset.ep}
                            size="xs"
                            variant={apiEndpoint === preset.ep ? "solid" : "outline"}
                            colorScheme={apiEndpoint === preset.ep ? "blue" : "gray"}
                            onClick={() => setApiEndpoint(preset.ep)}
                            borderRadius="md"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </Flex>
                    </Box>

                    <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p={{ base: "4", sm: "6" }}>
                      {/* Method + Endpoint + Execute Input Stack */}
                      <Flex flexDir={{ base: "column", sm: "row" }} gap="3" mb="4">
                        <Flex gap="2" w={{ base: "full", sm: "auto" }}>
                          {["GET", "POST", "PUT", "DELETE"].map((m) => (
                            <Button
                              key={m}
                              size="sm"
                              variant={apiMethod === m ? "solid" : "outline"}
                              colorScheme={apiMethod === m ? "purple" : "gray"}
                              onClick={() => setApiMethod(m)}
                              flex="1"
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
                          borderColor="whiteAlpha.200"
                          color="white"
                          size="sm"
                          flex="1"
                          borderRadius="lg"
                        />

                        <Button
                          colorScheme="blue"
                          size="sm"
                          onClick={executeApiTest}
                          loading={apiTesting}
                          w={{ base: "full", sm: "auto" }}
                        >
                          <Send size={14} style={{ marginRight: "6px" }} /> Execute
                        </Button>
                      </Flex>

                      {/* JSON Response Window */}
                      {apiResponse ? (
                        <Box bg="#0B1120" p="4" borderRadius="lg" position="relative">
                          <Flex justifyContent="space-between" alignItems="center" mb="3" pb="2" borderBottom="1px solid" borderColor="whiteAlpha.100">
                            <HStack gap="2">
                              <Badge colorScheme={apiResponse.ok ? "green" : "red"} fontSize="xs">
                                HTTP {apiResponse.status}
                              </Badge>
                              <Text fontSize="xs" color="gray.400">
                                Response Payload
                              </Text>
                            </HStack>
                            <Button size="xs" variant="ghost" color="blue.300" onClick={copyResponseJson}>
                              {copiedJson ? <Check size={12} style={{ marginRight: "4px" }} /> : <Copy size={12} style={{ marginRight: "4px" }} />}
                              {copiedJson ? "Copied!" : "Copy JSON"}
                            </Button>
                          </Flex>

                          <Box
                            overflowX="auto"
                            maxH="450px"
                            fontSize="xs"
                            fontFamily="mono"
                            color="emerald.300"
                            css={{
                              "&::-webkit-scrollbar": { height: "6px", width: "6px" },
                              "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: "3px" },
                            }}
                          >
                            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {JSON.stringify(apiResponse, null, 2)}
                            </pre>
                          </Box>
                        </Box>
                      ) : (
                        <Flex h="120px" alignItems="center" justifyContent="center" bg="#0B1120" borderRadius="lg">
                          <Text color="gray.400" fontSize="xs">
                            Select an endpoint and tap &quot;Execute&quot; to inspect live JSON payload.
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
      {/* Vehicle Modal */}
      {showVehicleModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingVehicle ? "Edit Vehicle Model" : "Add New Vehicle Model"}
            </Heading>
            <form onSubmit={handleSaveVehicle}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Brand</Text>
                  <Input required value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} bg="#1E293B" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Model</Text>
                  <Input required value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} bg="#1E293B" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Category</Text>
                  <Input value={vehicleForm.category} onChange={(e) => setVehicleForm({ ...vehicleForm, category: e.target.value })} bg="#1E293B" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Body Type</Text>
                  <Input value={vehicleForm.bodyType} onChange={(e) => setVehicleForm({ ...vehicleForm, bodyType: e.target.value })} bg="#1E293B" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
                  <Button colorScheme="purple" type="submit">Save Vehicle</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingService ? "Edit Service" : "Add New Service"}
            </Heading>
            <form onSubmit={handleSaveService}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Service Name</Text>
                  <Input required value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} bg="#1E293B" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Price (₹)</Text>
                  <Input type="number" required value={serviceForm.basePrice} onChange={(e) => setServiceForm({ ...serviceForm, basePrice: Number(e.target.value) })} bg="#1E293B" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" onClick={() => setShowServiceModal(false)}>Cancel</Button>
                  <Button colorScheme="blue" type="submit">Save Service</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* Provider Modal */}
      {showProviderModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingProvider ? "Edit Provider" : "Register Provider"}
            </Heading>
            <form onSubmit={handleSaveProvider}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Full Name</Text>
                  <Input required value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} bg="#1E293B" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Phone</Text>
                  <Input required value={providerForm.phone} onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })} bg="#1E293B" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" onClick={() => setShowProviderModal(false)}>Cancel</Button>
                  <Button colorScheme="teal" type="submit">Save Provider</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingSlot ? "Edit Time Slot" : "Create Time Slot"}
            </Heading>
            <form onSubmit={handleSaveSlot}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Time Slot</Text>
                  <Input required value={slotForm.slotTime} onChange={(e) => setSlotForm({ ...slotForm, slotTime: e.target.value })} bg="#1E293B" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" onClick={() => setShowSlotModal(false)}>Cancel</Button>
                  <Button colorScheme="purple" type="submit">Save Slot</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* Booking Modal */}
      {showBookingModal && editingBooking && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="2">
              Manage Booking #{editingBooking.id?.substring(0, 8)}
            </Heading>

            <Stack gap="4" mt="4">
              <Box>
                <Text fontSize="xs" color="gray.400" mb="2">Update Status:</Text>
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
                <Text fontSize="xs" color="gray.400" mb="2">Assign Provider:</Text>
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
                <Button variant="ghost" onClick={() => setShowBookingModal(false)}>Cancel</Button>
                <Button colorScheme="purple" onClick={handleSaveBooking}>Update Booking</Button>
              </Flex>
            </Stack>
          </Box>
        </Flex>
      )}

      {/* User Modal */}
      {showUserModal && editingUser && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              Edit User Profile
            </Heading>
            <form onSubmit={handleSaveUser}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">User Name</Text>
                  <Input required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} bg="#1E293B" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">Phone</Text>
                  <Input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} bg="#1E293B" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" onClick={() => setShowUserModal(false)}>Cancel</Button>
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
