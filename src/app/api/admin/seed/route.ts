import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    const results: any = {};

    // 1. Seed Services (2W Bike & 4W Car Catalogs)
    const initialServices = [
      { name: "2W Bike Quick Pressure Wash", description: "Complete two-wheeler pressure washing, chain lube, and mirror wipe.", category: "2w_wash", vehicle_type: "2W", body_type: "Scooter", base_price: 199, duration_minutes: 25, popular: true, is_active: true },
      { name: "2W Premium Bike Foam & Polish", description: "Snow foam bath, Teflon tank polish, engine degreasing, and chain lube.", category: "2w_wash", vehicle_type: "2W", body_type: "Cruiser", base_price: 349, duration_minutes: 40, popular: true, is_active: true },
      { name: "2W Ceramic Shield Coating", description: "Hydrophobic 9H ceramic coating for helmet visor, bike tank, and alloy wheels.", category: "2w_wash", vehicle_type: "2W", body_type: "Sports", base_price: 699, duration_minutes: 60, popular: false, is_active: true },
      { name: "4W Hatchback Express Wash", description: "Complete exterior pressure wash, micro-fiber wipe down, and floor mat cleaning.", category: "4w_wash", vehicle_type: "4W", body_type: "Hatchback", base_price: 399, duration_minutes: 40, popular: false, is_active: true },
      { name: "4W Sedan & SUV Premium Foam Bath", description: "pH-neutral snow foam bath, high-gloss wax sealant, interior vacuum & dashboard polish.", category: "4w_wash", vehicle_type: "4W", body_type: "SUV", base_price: 699, duration_minutes: 60, popular: true, is_active: true },
      { name: "4W Full Interior Spa & Sanitization", description: "Steam extraction cleaning of seats, carpets, headliner, and anti-bacterial fogging.", category: "4w_wash", vehicle_type: "4W", body_type: "Sedan", base_price: 1199, duration_minutes: 90, popular: true, is_active: true },
      { name: "4W Tyre & Underbody Degreasing", description: "High pressure underbody chassis wash and non-slung tire hydrophobic coating.", category: "add_on", vehicle_type: "4W", body_type: "SUV", base_price: 299, duration_minutes: 20, popular: false, is_active: true },
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
      { brand: "Tata", model: "Nexon", category: "Car", body_type: "SUV", model_image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80" },
      { brand: "Tata", model: "Punch", category: "Car", body_type: "Compact SUV", model_image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80" },
      { brand: "Hyundai", model: "Creta", category: "Car", body_type: "SUV", model_image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80" },
      { brand: "Maruti", model: "Swift", category: "Car", body_type: "Hatchback", model_image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80" },
      { brand: "Honda", model: "City", category: "Car", body_type: "Sedan", model_image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80" },
      { brand: "Mahindra", model: "Thar", category: "Car", body_type: "SUV", model_image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80" },
      { brand: "Hero", model: "Splendor Plus", category: "Bike", body_type: "Standard", model_image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80" },
      { brand: "Honda", model: "Activa 6G", category: "Bike", body_type: "Scooter", model_image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&q=80" },
      { brand: "Royal Enfield", model: "Classic 350", category: "Bike", body_type: "Cruiser", model_image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&q=80" },
      { brand: "TVS", model: "Jupiter", category: "Bike", body_type: "Scooter", model_image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80" },
    ];
    const { data: catalog, error: vErr } = await supabaseAdmin.from("vehicle_catalog").insert(initialVehicles).select();
    results.vehicleCatalog = vErr ? vErr.message : catalog?.length;

    // 4. Seed Providers
    const initialProviders = [
      { name: "Ramesh Kumar", phone: "+91 9876543210", email: "ramesh.k@shrawasti.com", rating: 4.9, total_jobs: 42, is_online: true, status: "active" },
      { name: "Suresh Sharma", phone: "+91 9812345678", email: "suresh.s@shrawasti.com", rating: 4.8, total_jobs: 28, is_online: true, status: "active" },
      { name: "Amit Singh", phone: "+91 9765432109", email: "amit.singh@shrawasti.com", rating: 5.0, total_jobs: 15, is_online: false, status: "active" },
      { name: "Saurabh Meshram", phone: "+91 91111 11111", email: "saurabh.meshram@shrawasti.com", rating: 5.0, total_jobs: 0, is_online: true, status: "active" },
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
