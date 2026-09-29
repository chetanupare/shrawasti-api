import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    const results: any = {};

    // 1. Seed Services
    const initialServices = [
      { name: "Basic Doorstep Wash", description: "Complete exterior pressure wash, micro-fiber wipe down, and window cleaning.", category: "package", base_price: 399, duration_minutes: 45, popular: false, is_active: true },
      { name: "Premium Foam & Shine", description: "pH-neutral snow foam bath, high-gloss wax sealant, interior vacuum & dashboard polish.", category: "package", base_price: 699, duration_minutes: 60, popular: true, is_active: true },
      { name: "Full Interior Deep Sanitization", description: "Steam extraction cleaning of seats, carpets, headliner, and anti-bacterial fogging.", category: "package", base_price: 999, duration_minutes: 90, popular: false, is_active: true },
      { name: "Tyre & Bumper Dressing", description: "Deep tire degreasing and non-slung hydrophobic shine coating.", category: "add_on", base_price: 199, duration_minutes: 15, popular: false, is_active: true },
      { name: "Engine Bay Detail", description: "Safe waterless engine compartment degreasing and protective rubber dressing.", category: "add_on", base_price: 299, duration_minutes: 20, popular: true, is_active: true },
    ];
    const { data: services, error: sErr } = await supabaseAdmin.from("services").upsert(initialServices, { onConflict: "name" }).select();
    results.services = sErr ? sErr.message : services?.length;

    // 2. Seed Time Slots
    const initialSlots = [
      { slot_time: "09:00 AM - 11:00 AM", max_capacity: 10, is_active: true },
      { slot_time: "11:00 AM - 01:00 PM", max_capacity: 10, is_active: true },
      { slot_time: "01:00 PM - 03:00 PM", max_capacity: 10, is_active: true },
      { slot_time: "03:00 PM - 05:00 PM", max_capacity: 10, is_active: true },
      { slot_time: "05:00 PM - 07:00 PM", max_capacity: 10, is_active: true },
    ];
    const { data: slots, error: slErr } = await supabaseAdmin.from("booking_slots").upsert(initialSlots, { onConflict: "slot_time" }).select();
    results.slots = slErr ? slErr.message : slots?.length;

    // 3. Seed Vehicle Catalog
    const initialVehicles = [
      { brand: "Tata", model: "Nexon", category: "Car", body_type: "SUV" },
      { brand: "Tata", model: "Punch", category: "Car", body_type: "Compact SUV" },
      { brand: "Hyundai", model: "Creta", category: "Car", body_type: "SUV" },
      { brand: "Maruti", model: "Swift", category: "Car", body_type: "Hatchback" },
      { brand: "Honda", model: "City", category: "Car", body_type: "Sedan" },
      { brand: "Mahindra", model: "Thar", category: "Car", body_type: "SUV" },
      { brand: "Hero", model: "Splendor Plus", category: "Bike", body_type: "Standard" },
      { brand: "Honda", model: "Activa 6G", category: "Bike", body_type: "Scooter" },
      { brand: "Royal Enfield", model: "Classic 350", category: "Bike", body_type: "Cruiser" },
      { brand: "TVS", model: "Jupiter", category: "Bike", body_type: "Scooter" },
    ];
    const { data: catalog, error: vErr } = await supabaseAdmin.from("vehicle_catalog").insert(initialVehicles).select();
    results.vehicleCatalog = vErr ? vErr.message : catalog?.length;

    // 4. Seed Providers
    const initialProviders = [
      { name: "Ramesh Kumar", phone: "+91 9876543210", email: "ramesh.k@shrawasti.com", rating: 4.9, total_jobs: 42, is_online: true, status: "active" },
      { name: "Suresh Sharma", phone: "+91 9812345678", email: "suresh.s@shrawasti.com", rating: 4.8, total_jobs: 28, is_online: true, status: "active" },
      { name: "Amit Singh", phone: "+91 9765432109", email: "amit.singh@shrawasti.com", rating: 5.0, total_jobs: 15, is_online: false, status: "active" },
    ];
    const { data: providers, error: pErr } = await supabaseAdmin.from("providers").upsert(initialProviders, { onConflict: "phone" }).select();
    results.providers = pErr ? pErr.message : providers?.length;

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with initial master records!",
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
