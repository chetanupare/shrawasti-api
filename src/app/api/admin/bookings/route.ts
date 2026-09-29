import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_BOOKINGS = [
  {
    id: "bk_98234710",
    userId: "usr_101",
    user: { name: "Anand Verma", phone: "+91 9988776655", email: "anand@example.com" },
    vehicleSnapshot: { make: "Tata", model: "Nexon", bodyType: "SUV" },
    services: [{ name: "Premium Foam & Shine" }],
    scheduleDate: "2026-09-29",
    scheduleTime: "11:00 AM - 01:00 PM",
    paymentMethod: "Razorpay",
    paymentStatus: "paid",
    total: 699,
    status: "pending",
    assignedProviderId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_98234711",
    userId: "usr_102",
    user: { name: "Priya Sharma", phone: "+91 9876501234", email: "priya@example.com" },
    vehicleSnapshot: { make: "Honda", model: "Activa 6G", bodyType: "Scooter" },
    services: [{ name: "Basic Doorstep Wash" }],
    scheduleDate: "2026-09-29",
    scheduleTime: "01:00 PM - 03:00 PM",
    paymentMethod: "COD",
    paymentStatus: "pending",
    total: 399,
    status: "accepted",
    assignedProviderId: "prov_101",
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_98234712",
    userId: "usr_103",
    user: { name: "Rahul Deshmukh", phone: "+91 9711223344", email: "rahul@example.com" },
    vehicleSnapshot: { make: "Hyundai", model: "Creta", bodyType: "SUV" },
    services: [{ name: "Full Interior Deep Sanitization" }],
    scheduleDate: "2026-09-28",
    scheduleTime: "03:00 PM - 05:00 PM",
    paymentMethod: "Razorpay",
    paymentStatus: "paid",
    total: 999,
    status: "completed",
    assignedProviderId: "prov_102",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("bookings")
      .select("*, users(id, name, email, phone)", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({
        bookings: DEFAULT_BOOKINGS,
        pagination: { page: 1, limit, totalItems: DEFAULT_BOOKINGS.length, totalPages: 1 },
      });
    }

    const bookings = (data || []).map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      user: b.users ? { name: b.users.name, phone: b.users.phone, email: b.users.email } : null,
      vehicleId: b.vehicle_id,
      assignedProviderId: b.assigned_provider_id,
      locationSnapshot: b.location_snapshot,
      vehicleSnapshot: b.vehicle_snapshot,
      services: b.services,
      scheduleDate: b.schedule_date,
      scheduleTime: b.schedule_time,
      paymentMethod: b.payment_method,
      paymentStatus: b.payment_status,
      subtotal: b.subtotal,
      discount: b.discount,
      total: b.total,
      status: b.status,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    const totalCount = count ?? bookings.length;

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      bookings: DEFAULT_BOOKINGS,
      pagination: { page: 1, limit: 20, totalItems: DEFAULT_BOOKINGS.length, totalPages: 1 },
    });
  }
}
