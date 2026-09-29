import fs from "fs";

const filePath = "c:/Projects/shrawasti-mobile/shrawasti-api/src/app/page.tsx";
let code = fs.readFileSync(filePath, "utf-8");

// 1. Add icons to lucide-react import
code = code.replace(
  '  Bike,\n} from "lucide-react";',
  '  Bike,\n  Ticket,\n  Star,\n  Bell,\n  Percent,\n} from "lucide-react";'
);

// 2. Add activeTab types
code = code.replace(
  '    | "vehicles"\n    | "health"\n    | "api"\n  >("overview");',
  '    | "vehicles"\n    | "coupons"\n    | "subscriptions"\n    | "reviews"\n    | "notifications"\n    | "health"\n    | "api"\n  >("overview");'
);

// 3. Add states
const stateInsert = `
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
`;

code = code.replace('  // API console tester', stateInsert + '\n  // API console tester');

// 4. Update fetchAllData
const oldFetchAll = `      const [
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
      ]);`;

const newFetchAll = `      const [
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
        fetch("/api/admin/dashboard/stats").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/bookings").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/users").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/providers").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/services").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/slots").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/vehicles/catalog").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/coupons").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/subscriptions").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/reviews").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/notifications/broadcast").then((r) => r.json()).catch(() => ({})),
      ]);`;

code = code.replace(oldFetchAll, newFetchAll);

// 5. Update state setters in fetchAllData
const oldSetters = `      setSlots(Array.isArray(slotsRes) ? slotsRes : slotsRes.slots || []);
      setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes : vehiclesRes.catalog || vehiclesRes.vehicles || []);`;

const newSetters = `      setSlots(Array.isArray(slotsRes) ? slotsRes : slotsRes.slots || []);
      setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes : vehiclesRes.catalog || vehiclesRes.vehicles || []);
      setCoupons(Array.isArray(couponsRes) ? couponsRes : couponsRes.coupons || []);
      setSubscriptions(Array.isArray(subsRes) ? subsRes : subsRes.plans || []);
      setUserSubscriptions(Array.isArray(subsRes?.userSubscriptions) ? subsRes.userSubscriptions : []);
      setReviews(Array.isArray(reviewsRes) ? reviewsRes : reviewsRes.reviews || []);
      setDeviceTokens(Array.isArray(notifsRes?.deviceTokens) ? notifsRes.deviceTokens : []);
      setBroadcastHistory(Array.isArray(notifsRes?.history) ? notifsRes.history : []);`;

code = code.replace(oldSetters, newSetters);

// 6. Add Handlers for Coupons, Plans, Reviews, Broadcast
const handlersCode = `
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCoupon ? "PUT" : "POST";
      const payload = editingCoupon ? { id: editingCoupon.id, ...couponForm } : couponForm;
      const res = await fetch("/api/admin/coupons", {
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
      const res = await fetch(\`/api/admin/coupons?id=\${id}\`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/subscriptions", {
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
      const res = await fetch(\`/api/admin/subscriptions?id=\${id}\`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/reviews", {
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
      const res = await fetch(\`/api/admin/reviews?id=\${id}\`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(\`Broadcast notification sent to \${data.recipientsCount || 0} registered devices!\`);
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
`;

code = code.replace('  const handleSaveBooking = async () => {', handlersCode + '\n  const handleSaveBooking = async () => {');

// 7. Update sidebarNavItems
const oldSidebarNavItems = `    { id: "slots", label: "Time Slots", icon: Clock, count: slots.length },
    { id: "vehicles", label: "Vehicle Catalog", icon: Car, count: vehicles.length },
  ];`;

const newSidebarNavItems = `    { id: "slots", label: "Time Slots", icon: Clock, count: slots.length },
    { id: "vehicles", label: "Vehicle Catalog", icon: Car, count: vehicles.length },
    { id: "coupons", label: "Coupons & Promos", icon: Ticket, count: coupons.length },
    { id: "subscriptions", label: "CarePass Subscriptions", icon: Sparkles, count: subscriptions.length },
    { id: "reviews", label: "Customer Reviews", icon: Star, count: reviews.length },
    { id: "notifications", label: "Broadcast Push", icon: Bell, count: deviceTokens.length },
  ];`;

code = code.replace(oldSidebarNavItems, newSidebarNavItems);

fs.writeFileSync(filePath, code);
console.log("Successfully updated state, fetcher, handlers & sidebar in page.tsx!");
