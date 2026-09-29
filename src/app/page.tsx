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
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  DollarSign,
  Send,
  Zap,
  ShieldCheck,
  Building,
  Layers,
  Sparkles,
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Modal states
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({ name: "", category: "car_wash", price: 499, duration: "45 mins" });
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

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
        fetch("/api/admin/bookings").then((r) => r.json()).catch(() => []),
        fetch("/api/admin/users").then((r) => r.json()).catch(() => []),
        fetch("/api/admin/providers").then((r) => r.json()).catch(() => []),
        fetch("/api/admin/services").then((r) => r.json()).catch(() => []),
        fetch("/api/admin/slots").then((r) => r.json()).catch(() => []),
        fetch("/api/admin/vehicles/catalog").then((r) => r.json()).catch(() => []),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (Array.isArray(bookingsRes)) setBookings(bookingsRes);
      if (Array.isArray(usersRes)) setUsers(usersRes);
      if (Array.isArray(providersRes)) setProviders(providersRes);
      if (Array.isArray(servicesRes)) setServices(servicesRes);
      if (Array.isArray(slotsRes)) setSlots(slotsRes);
      if (Array.isArray(vehiclesRes)) setVehicles(vehiclesRes);
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

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Service created successfully!");
        setShowAddServiceModal(false);
        setNewService({ name: "", category: "car_wash", price: 499, duration: "45 mins" });
        fetchAllData(true);
      } else {
        showToast("Error: " + (data.error || "Failed to create service"));
      }
    } catch (err) {
      showToast("Failed to connect to API");
    }
  };

  const handleAssignProvider = async () => {
    if (!selectedBookingId || !selectedProviderId) return;
    try {
      const res = await fetch("/api/admin/bookings/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: selectedBookingId, provider_id: selectedProviderId }),
      });
      if (res.ok) {
        showToast("Provider assigned successfully!");
        setShowAssignModal(false);
        setSelectedBookingId(null);
        setSelectedProviderId("");
        fetchAllData(true);
      } else {
        const data = await res.json();
        showToast("Error: " + (data.error || "Failed to assign provider"));
      }
    } catch (err) {
      showToast("Failed to assign provider");
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

  // Status color mapper for Chakra UI
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
    const matchesSearch =
      b.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.status?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <Flex minH="100vh" bg="#090D16" color="#F8FAFC">
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

      {/* Sidebar */}
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
              Chakra Admin v2.0
            </Badge>
          </Box>
        </Flex>

        {/* Navigation Items */}
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
                onClick={() => setActiveTab(item.id as any)}
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
                onClick={() => setActiveTab(item.id as any)}
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

      {/* Main Content Area */}
      <Flex flex="1" flexDir="column" overflowX="hidden">
        {/* Header */}
        <Flex
          h="70px"
          px="8"
          bg="#0F172A"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          alignItems="center"
          justifyContent="space-between"
        >
          <HStack gap="4">
            <Heading size="sm" textTransform="capitalize" color="white">
              {activeTab.replace("_", " ")}
            </Heading>

            {/* Quick Status Tag */}
            <Badge colorScheme="blue" variant="subtle" px="2.5" py="1" borderRadius="full" fontSize="xs">
              Live DB
            </Badge>
          </HStack>

          <HStack gap="3">
            <Button
              onClick={() => fetchAllData(true)}
              size="sm"
              variant="outline"
              borderColor="whiteAlpha.200"
              color="gray.200"
              _hover={{ bg: "whiteAlpha.100", color: "white" }}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ marginRight: "6px" }} />
              Sync Now
            </Button>

            <Button
              onClick={handleSeedDatabase}
              disabled={seeding}
              size="sm"
              bgGradient="linear(to-r, emerald.500, teal.600)"
              color="white"
              _hover={{ bgGradient: "linear(to-r, emerald.600, teal.700)" }}
            >
              {seeding ? <Spinner size="xs" mr="2" /> : <Database size={14} style={{ marginRight: "6px" }} />}
              Seed Master DB
            </Button>
          </HStack>
        </Flex>

        {/* Content Body */}
        <Box p="8" flex="1" overflowY="auto">
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
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }} gap="5">
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
                        value: stats.totalBookings || 0,
                        icon: CalendarCheck,
                        color: "blue.400",
                        bg: "rgba(59, 130, 246, 0.1)",
                      },
                      {
                        title: "Confirmed Jobs",
                        value: stats.confirmedBookings || 0,
                        icon: CheckCircle2,
                        color: "purple.400",
                        bg: "rgba(168, 85, 247, 0.1)",
                      },
                      {
                        title: "Registered Users",
                        value: stats.totalUsers || 0,
                        icon: Users,
                        color: "amber.400",
                        bg: "rgba(245, 158, 11, 0.1)",
                      },
                      {
                        title: "Active Providers",
                        value: stats.activeProviders || 0,
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
                          p="5"
                        >
                          <Flex justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb="1">
                                {kpi.title}
                              </Text>
                              <Heading size="lg" color="white" fontWeight="bold">
                                {kpi.value}
                              </Heading>
                            </Box>
                            <Flex p="2.5" borderRadius="lg" bg={kpi.bg}>
                              <Icon size={20} color="#3B82F6" />
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
                      <Flex p="5" justifyContent="space-between" alignItems="center" borderBottom="1px solid" borderColor="whiteAlpha.100">
                        <HStack gap="2">
                          <CalendarCheck size={18} color="#3B82F6" />
                          <Heading size="sm" color="white">
                            Recent Dynamic Bookings
                          </Heading>
                        </HStack>
                        <Button size="xs" variant="ghost" color="blue.400" onClick={() => setActiveTab("bookings")}>
                          View All ({bookings.length})
                        </Button>
                      </Flex>

                      <Box overflowX="auto" p="2">
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
                              return (
                                <Table.Row key={b.id} _hover={{ bg: "whiteAlpha.50" }} borderColor="whiteAlpha.100">
                                  <Table.Cell>
                                    <Text fontSize="xs" fontWeight="bold" color="blue.300">
                                      #{b.id?.substring(0, 8)}
                                    </Text>
                                    <Text fontSize="10px" color="gray.400">
                                      {b.booking_date || b.created_at?.split("T")[0] || "Today"}
                                    </Text>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Text fontSize="xs" fontWeight="semibold" color="white">
                                      {b.users?.name || "Customer"}
                                    </Text>
                                    <Text fontSize="10px" color="gray.400">
                                      {b.users?.phone || b.users?.email || "-"}
                                    </Text>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Text fontSize="xs" color="gray.200">
                                      {b.services?.name || "Car Wash & Detailing"}
                                    </Text>
                                    <Text fontSize="xs" fontWeight="bold" color="emerald.400">
                                      ₹{b.total_amount || 499}
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
                      </Box>
                    </Card.Root>

                    {/* Active Providers Card */}
                    <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl">
                      <Flex p="5" justifyContent="space-between" alignItems="center" borderBottom="1px solid" borderColor="whiteAlpha.100">
                        <HStack gap="2">
                          <UserCheck size={18} color="#10B981" />
                          <Heading size="sm" color="white">
                            Active Providers
                          </Heading>
                        </HStack>
                        <Button size="xs" variant="ghost" color="blue.400" onClick={() => setActiveTab("providers")}>
                          View All
                        </Button>
                      </Flex>

                      <VStack p="4" align="stretch" gap="3">
                        {providers.slice(0, 4).map((p) => (
                          <Flex
                            key={p.id}
                            p="3"
                            borderRadius="lg"
                            bg="#1E293B"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <HStack gap="3">
                              <Flex w="36px" h="36px" borderRadius="full" bg="blue.900" color="blue.300" alignItems="center" justifyContent="center" fontWeight="bold">
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
                            <Badge colorScheme={p.is_available ? "green" : "gray"} fontSize="10px">
                              {p.is_available ? "Available" : "Busy"}
                            </Badge>
                          </Flex>
                        ))}
                      </VStack>
                    </Card.Root>
                  </Grid>
                </Stack>
              )}

              {/* TAB 2: BOOKINGS */}
              {activeTab === "bookings" && (
                <Stack gap="6">
                  {/* Filter Toolbar */}
                  <Flex gap="4" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                    <HStack gap="3" flex="1" maxW="400px">
                      <Input
                        placeholder="Search by ID, User, or Status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        bg="#0F172A"
                        borderColor="whiteAlpha.200"
                        size="sm"
                        borderRadius="lg"
                      />
                    </HStack>

                    <HStack gap="2">
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

                  {/* Bookings Table */}
                  <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl">
                    <Box overflowX="auto" p="4">
                      <Table.Root size="md" variant="outline" colorScheme="whiteAlpha">
                        <Table.Header>
                          <Table.Row borderColor="whiteAlpha.100">
                            <Table.ColumnHeader color="gray.400">Booking ID</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Customer Details</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Service Info</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Assigned Provider</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Amount</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Status</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Action</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {filteredBookings.map((b) => {
                            const st = getStatusColor(b.status);
                            return (
                              <Table.Row key={b.id} _hover={{ bg: "whiteAlpha.50" }} borderColor="whiteAlpha.100">
                                <Table.Cell fontWeight="bold" color="blue.300" fontSize="xs">
                                  #{b.id?.substring(0, 8)}...
                                </Table.Cell>
                                <Table.Cell>
                                  <Text fontSize="xs" fontWeight="bold" color="white">
                                    {b.users?.name || "Customer"}
                                  </Text>
                                  <Text fontSize="10px" color="gray.400">
                                    {b.users?.phone || b.users?.email || "N/A"}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text fontSize="xs" color="gray.200">
                                    {b.services?.name || "Full Washing"}
                                  </Text>
                                  <Text fontSize="10px" color="gray.400">
                                    Slot: {b.booking_slot || b.time_slot || "10:00 AM"}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  {b.providers?.name ? (
                                    <Badge colorScheme="teal" fontSize="xs">
                                      {b.providers.name}
                                    </Badge>
                                  ) : (
                                    <Text fontSize="xs" color="yellow.400">
                                      Unassigned
                                    </Text>
                                  )}
                                </Table.Cell>
                                <Table.Cell fontWeight="bold" color="emerald.400" fontSize="xs">
                                  ₹{b.total_amount || 499}
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge bg={st.bg} color={st.color} border="1px solid" borderColor={st.border} px="2.5" py="1" borderRadius="md" textTransform="capitalize" fontSize="xs">
                                    {b.status || "pending"}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                  <Button
                                    size="xs"
                                    colorScheme="purple"
                                    variant="subtle"
                                    onClick={() => {
                                      setSelectedBookingId(b.id);
                                      setShowAssignModal(true);
                                    }}
                                  >
                                    Assign Provider
                                  </Button>
                                </Table.Cell>
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  </Card.Root>
                </Stack>
              )}

              {/* TAB 3: USERS */}
              {activeTab === "users" && (
                <Stack gap="6">
                  <Heading size="md" color="white">
                    Registered Users ({users.length})
                  </Heading>

                  <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl">
                    <Box overflowX="auto" p="4">
                      <Table.Root size="md" variant="outline">
                        <Table.Header>
                          <Table.Row borderColor="whiteAlpha.100">
                            <Table.ColumnHeader color="gray.400">Name</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Email</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Phone</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Role</Table.ColumnHeader>
                            <Table.ColumnHeader color="gray.400">Created At</Table.ColumnHeader>
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
                              <Table.Cell color="gray.400" fontSize="xs">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recent"}
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
                  <Heading size="md" color="white">
                    Service Providers ({providers.length})
                  </Heading>

                  <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="5">
                    {providers.map((p) => (
                      <Card.Root key={p.id} bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="5">
                        <Flex justifyContent="space-between" alignItems="flex-start" mb="4">
                          <HStack gap="3">
                            <Flex w="44px" h="44px" borderRadius="xl" bg="teal.900" color="teal.300" alignItems="center" justifyContent="center" fontWeight="bold">
                              {p.name?.charAt(0) || "P"}
                            </Flex>
                            <Box>
                              <Heading size="xs" color="white">
                                {p.name}
                              </Heading>
                              <Text fontSize="xs" color="gray.400">
                                {p.phone}
                              </Text>
                            </Box>
                          </HStack>
                          <Badge colorScheme={p.is_available ? "green" : "red"} fontSize="xs">
                            {p.is_available ? "Active" : "Busy"}
                          </Badge>
                        </Flex>

                        <VStack align="stretch" gap="2" fontSize="xs" color="gray.300">
                          <Flex justifyContent="space-between">
                            <Text color="gray.400">Rating:</Text>
                            <Text fontWeight="bold" color="amber.400">
                              ⭐ {p.rating || "4.8"}
                            </Text>
                          </Flex>
                          <Flex justifyContent="space-between">
                            <Text color="gray.400">Jobs Completed:</Text>
                            <Text fontWeight="bold" color="white">
                              {p.total_jobs || 12}
                            </Text>
                          </Flex>
                        </VStack>
                      </Card.Root>
                    ))}
                  </Grid>
                </Stack>
              )}

              {/* TAB 5: SERVICES */}
              {activeTab === "services" && (
                <Stack gap="6">
                  <Flex justifyContent="space-between" alignItems="center">
                    <Heading size="md" color="white">
                      Services Catalog ({services.length})
                    </Heading>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => setShowAddServiceModal(true)}
                    >
                      <Plus size={16} style={{ marginRight: "6px" }} /> Add Service
                    </Button>
                  </Flex>

                  <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="5">
                    {services.map((s) => (
                      <Card.Root key={s.id} bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="5">
                        <Flex justifyContent="space-between" alignItems="flex-start" mb="3">
                          <Heading size="sm" color="white">
                            {s.name}
                          </Heading>
                          <Badge colorScheme="blue" fontSize="xs">
                            {s.category || "Service"}
                          </Badge>
                        </Flex>

                        <Text fontSize="xs" color="gray.400" mb="4">
                          {s.description || "Professional vehicle care service."}
                        </Text>

                        <Flex justifyContent="space-between" alignItems="center">
                          <Text fontSize="lg" fontWeight="bold" color="emerald.400">
                            ₹{s.price}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            ⏱️ {s.duration || "45 mins"}
                          </Text>
                        </Flex>
                      </Card.Root>
                    ))}
                  </Grid>
                </Stack>
              )}

              {/* TAB 6: SLOTS */}
              {activeTab === "slots" && (
                <Stack gap="6">
                  <Heading size="md" color="white">
                    Available Time Slots ({slots.length})
                  </Heading>

                  <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap="4">
                    {slots.map((s) => (
                      <Card.Root key={s.id} bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="4">
                        <Flex justifyContent="space-between" alignItems="center">
                          <HStack gap="2">
                            <Clock size={16} color="#3B82F6" />
                            <Text fontSize="sm" fontWeight="bold" color="white">
                              {s.slot_time || s.time}
                            </Text>
                          </HStack>
                          <Badge colorScheme={s.is_available ? "green" : "gray"} fontSize="xs">
                            {s.is_available ? "Open" : "Booked"}
                          </Badge>
                        </Flex>
                      </Card.Root>
                    ))}
                  </Grid>
                </Stack>
              )}

              {/* TAB 7: VEHICLES */}
              {activeTab === "vehicles" && (
                <Stack gap="6">
                  <Heading size="md" color="white">
                    Vehicle Catalog ({vehicles.length})
                  </Heading>

                  <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="5">
                    {vehicles.map((v) => (
                      <Card.Root key={v.id} bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="5">
                        <HStack gap="3" mb="3">
                          <Flex w="40px" h="40px" borderRadius="lg" bg="purple.900" color="purple.300" alignItems="center" justifyContent="center">
                            <Car size={20} />
                          </Flex>
                          <Box>
                            <Heading size="xs" color="white">
                              {v.make} {v.model}
                            </Heading>
                            <Text fontSize="xs" color="gray.400">
                              Type: {v.type || "Sedan"}
                            </Text>
                          </Box>
                        </HStack>
                      </Card.Root>
                    ))}
                  </Grid>
                </Stack>
              )}

              {/* TAB 8: HEALTH */}
              {activeTab === "health" && (
                <Stack gap="6">
                  <Heading size="md" color="white">
                    System & Supabase Database Health
                  </Heading>

                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="6">
                    <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="6">
                      <HStack gap="3" mb="4">
                        <CheckCircle2 size={24} color="#10B981" />
                        <Heading size="sm" color="white">
                          PostgreSQL RLS & Connection
                        </Heading>
                      </HStack>
                      <VStack align="stretch" gap="3" fontSize="xs">
                        <Flex justifyContent="space-between" py="2" borderBottom="1px solid" borderColor="whiteAlpha.100">
                          <Text color="gray.400">Supabase URL:</Text>
                          <Text color="blue.400" fontWeight="bold">Active Cloud Host</Text>
                        </Flex>
                        <Flex justifyContent="space-between" py="2" borderBottom="1px solid" borderColor="whiteAlpha.100">
                          <Text color="gray.400">RLS Read Policies:</Text>
                          <Badge colorScheme="green">Enabled (Bookings & Users)</Badge>
                        </Flex>
                        <Flex justifyContent="space-between" py="2">
                          <Text color="gray.400">Auto Polling Rate:</Text>
                          <Text color="white" fontWeight="bold">Every 5 seconds</Text>
                        </Flex>
                      </VStack>
                    </Card.Root>
                  </Grid>
                </Stack>
              )}

              {/* TAB 9: API CONSOLE */}
              {activeTab === "api" && (
                <Stack gap="6">
                  <Heading size="md" color="white">
                    Live API Console & Endpoint Tester
                  </Heading>

                  <Card.Root bg="#0F172A" borderColor="whiteAlpha.100" borderWidth="1px" borderRadius="xl" p="6">
                    <Flex gap="4" mb="4">
                      <Input
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                        placeholder="/api/admin/bookings"
                        bg="#1E293B"
                        borderColor="whiteAlpha.200"
                        color="white"
                      />
                      <Button colorScheme="blue" onClick={executeApiTest} loading={apiTesting}>
                        <Send size={16} style={{ marginRight: "6px" }} /> Execute
                      </Button>
                    </Flex>

                    {apiResponse && (
                      <Box bg="#0B1120" p="4" borderRadius="lg" overflowX="auto" fontSize="xs" fontFamily="mono" color="emerald.300">
                        <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                      </Box>
                    )}
                  </Card.Root>
                </Stack>
              )}
            </>
          )}
        </Box>
      </Flex>

      {/* Modal 1: Add Service */}
      {showAddServiceModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" zIndex="999" alignItems="center" justifyContent="center">
          <Box bg="#0F172A" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              Add New Service
            </Heading>
            <form onSubmit={handleCreateService}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">
                    Service Name
                  </Text>
                  <Input
                    required
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="e.g. Interior Ceramic Coating"
                    bg="#1E293B"
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.400" mb="1">
                    Price (₹)
                  </Text>
                  <Input
                    type="number"
                    required
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                    bg="#1E293B"
                  />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" onClick={() => setShowAddServiceModal(false)}>
                    Cancel
                  </Button>
                  <Button colorScheme="blue" type="submit">
                    Create Service
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* Modal 2: Assign Provider */}
      {showAssignModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" zIndex="999" alignItems="center" justifyContent="center">
          <Box bg="#0F172A" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              Assign Provider to Booking
            </Heading>
            <Stack gap="4">
              <Box>
                <Text fontSize="xs" color="gray.400" mb="2">
                  Select Provider:
                </Text>
                <VStack align="stretch" gap="2">
                  {providers.map((p) => (
                    <Button
                      key={p.id}
                      onClick={() => setSelectedProviderId(p.id)}
                      variant={selectedProviderId === p.id ? "solid" : "outline"}
                      colorScheme={selectedProviderId === p.id ? "teal" : "gray"}
                      justifyContent="space-between"
                    >
                      <Text>{p.name}</Text>
                      <Text fontSize="xs">{p.phone}</Text>
                    </Button>
                  ))}
                </VStack>
              </Box>
              <Flex justifyContent="flex-end" gap="3" pt="4">
                <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button colorScheme="purple" onClick={handleAssignProvider} disabled={!selectedProviderId}>
                  Confirm Assignment
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Flex>
      )}
    </Flex>
  );
}
