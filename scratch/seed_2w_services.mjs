import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) envVars[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function seed() {
  console.log("Seeding 2W Bike and 4W Car services into Supabase...");
  const initialServices = [
    { name: "2W Bike Quick Pressure Wash", description: "Complete two-wheeler pressure washing, chain lube, and mirror wipe for Scooter.", category: "2w_wash", base_price: 199, duration_minutes: 25, popular: true, is_active: true },
    { name: "2W Premium Bike Foam & Polish", description: "Snow foam bath, Teflon tank polish, engine degreasing, and chain lube for Cruiser.", category: "2w_wash", base_price: 349, duration_minutes: 40, popular: true, is_active: true },
    { name: "2W Ceramic Shield Coating", description: "Hydrophobic 9H ceramic coating for helmet visor, bike tank, and alloy wheels for Sports bike.", category: "2w_wash", base_price: 699, duration_minutes: 60, popular: false, is_active: true },
    { name: "4W Hatchback Express Wash", description: "Complete exterior pressure wash, micro-fiber wipe down, and floor mat cleaning for Hatchback.", category: "4w_wash", base_price: 399, duration_minutes: 40, popular: false, is_active: true },
    { name: "4W Sedan & SUV Premium Foam Bath", description: "pH-neutral snow foam bath, high-gloss wax sealant, interior vacuum & dashboard polish for SUV.", category: "4w_wash", base_price: 699, duration_minutes: 60, popular: true, is_active: true },
    { name: "4W Full Interior Spa & Sanitization", description: "Steam extraction cleaning of seats, carpets, headliner, and anti-bacterial fogging for Sedan.", category: "4w_wash", base_price: 1199, duration_minutes: 90, popular: true, is_active: true },
    { name: "4W Tyre & Underbody Degreasing", description: "High pressure underbody chassis wash and non-slung tire hydrophobic coating.", category: "add_on", base_price: 299, duration_minutes: 20, popular: false, is_active: true },
  ];

  const { data, error } = await supabase.from("services").insert(initialServices).select();
  if (error) {
    console.error("Error seeding services:", error.message);
  } else {
    console.log("Successfully inserted services:", data.length, "items into Supabase DB.");
  }
}

seed();
