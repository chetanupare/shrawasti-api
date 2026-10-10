import { supabaseAdmin } from "@/lib/supabase";
import { normalizeBodyType, readListedPrice } from "@/lib/pricing";

export type PriceMap = Record<string, Record<string, number>>;

/** Body-type prices live in service_prices, not on the services row. */
export async function loadServicePrices(serviceIds: string[]): Promise<PriceMap> {
  const ids = [...new Set(serviceIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const { data, error } = await supabaseAdmin
    .from("service_prices")
    .select("service_id, vehicle_type, price")
    .in("service_id", ids);

  if (error || !data) return {};

  const map: PriceMap = {};
  for (const row of data) {
    const serviceId = row.service_id as string | undefined;
    if (!serviceId) continue;
    const key = normalizeBodyType(row.vehicle_type) || String(row.vehicle_type || "").trim().toLowerCase();
    const amount = readListedPrice({ value: row.price }, "value");
    if (!key || amount === undefined) continue;
    if (!map[serviceId]) map[serviceId] = {};
    map[serviceId][key] = amount;
  }
  return map;
}

/** Persist admin-edited body-type prices. Empty values remove that row. */
export async function saveServicePrices(
  serviceId: string,
  prices: Record<string, unknown> | undefined
) {
  if (!serviceId || !prices || typeof prices !== "object") return;

  for (const [rawKey, rawValue] of Object.entries(prices)) {
    const key = normalizeBodyType(rawKey);
    if (!key) continue;

    const cleared = rawValue === "" || rawValue === null || rawValue === undefined;
    if (cleared) {
      const { error } = await supabaseAdmin
        .from("service_prices")
        .delete()
        .eq("service_id", serviceId)
        .eq("vehicle_type", key);
      if (error) throw new Error(error.message);
      continue;
    }

    const amount = Number(rawValue);
    if (!Number.isFinite(amount)) continue;

    const { error } = await supabaseAdmin.from("service_prices").upsert(
      { service_id: serviceId, vehicle_type: key, price: amount },
      { onConflict: "service_id,vehicle_type" }
    );
    if (error) throw new Error(error.message);
  }
}
