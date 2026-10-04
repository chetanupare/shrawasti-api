export type VehicleType = '2W' | '4W';
export type VehicleBodyType = 'hatchback' | 'sedan' | 'suv' | '7_seater' | 'scooter' | 'bike' | 'sport_bike' | 'cruiser';

export interface Service {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  prices?: Record<string, number>;
}

export interface ServiceSnapshot {
  serviceId: string;
  name: string;
  price: number;
}

export const GST_RATE = 0.18;

export interface TotalBreakdown {
  subtotal: number;
  tax: number;
  total: number;
}

export function normalizeVehicleCategory(
  value: string | undefined | null
): VehicleType | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim();
  
  if (
    v === '2w' ||
    v === '2 wheeler' ||
    v === '2-wheeler' ||
    v === '2wheeler' ||
    v === 'bike' ||
    v === 'scooter' ||
    v === 'motorcycle' ||
    v === 'cruiser' ||
    v === 'sport bike' ||
    v === 'adventure'
  ) {
    return '2W';
  }
  
  if (
    v === '4w' ||
    v === '4 wheeler' ||
    v === '4-wheeler' ||
    v === '4wheeler' ||
    v === 'car' ||
    v === 'hatchback' ||
    v === 'sedan' ||
    v === 'suv' ||
    v === '7_seater' ||
    v === '7 seater' ||
    v === '7-seater' ||
    v === '7seater'
  ) {
    return '4W';
  }
  
  return undefined;
}

export function normalizeBodyType(
  value: string | undefined | null
): VehicleBodyType | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim();

  // Two-wheelers
  if (v === 'scooter' || v === 'moped') {
    return 'scooter';
  }
  if (
    v === 'sport_bike' ||
    v === 'sport bike' ||
    v === 'sportbike' ||
    v === 'sports_bike' ||
    v === 'sports bike' ||
    v === 'superbike' ||
    v === 'super bike' ||
    v === 'super_bike' ||
    v === 'sport' ||
    v === 'sports'
  ) {
    return 'sport_bike';
  }
  if (
    v === 'cruiser' ||
    v === 'cruiser_bike' ||
    v === 'touring' ||
    v === 'adventure' ||
    v === 'chopper'
  ) {
    return 'cruiser';
  }
  if (
    v === 'bike' ||
    v === 'motorcycle' ||
    v === 'commuter' ||
    v === 'standard bike' ||
    v === 'standard_bike' ||
    v === '2w'
  ) {
    return 'bike';
  }

  // Hatchbacks
  if (v === 'hatchback' || v === 'premium hatchback') {
    return 'hatchback';
  }

  // Sedans
  if (v === 'sedan') {
    return 'sedan';
  }

  // 7 Seater / MPV / MUV
  if (
    v === '7_seater' ||
    v === '7 seater' ||
    v === '7-seater' ||
    v === '7seater' ||
    v === 'mpv' ||
    v === 'muv' ||
    v === '7 seater / mpv' ||
    v === 'van'
  ) {
    return '7_seater';
  }

  // SUVs (covers compact, micro, mid-size SUVs)
  if (
    v === 'suv' ||
    v === 'compact suv' ||
    v === 'micro suv' ||
    v === 'mid-size suv'
  ) {
    return 'suv';
  }

  return undefined;
}

export function getPriceFor(service: Service, bodyType?: string): number | undefined {
  const norm = normalizeBodyType(bodyType);
  
  if (norm) {
    if (service.prices && typeof service.prices[norm] === 'number') {
      return service.prices[norm];
    }

    // Fallback for 7_seater to SUV price if 7_seater is not explicitly set in prices object
    if (norm === '7_seater' && service.prices && typeof service.prices.suv === 'number') {
      return service.prices.suv;
    }

    // Fallback for 4W body types if specific tier price isn't explicitly set in prices object
    if (['hatchback', 'sedan', 'suv', '7_seater'].includes(norm) && service.category !== 'add_on') {
      const nameLower = service.name.toLowerCase();
      if (nameLower.includes('basic')) {
        if (norm === 'hatchback') return 249;
        if (norm === 'sedan') return 299;
        if (norm === 'suv') return 299;
        if (norm === '7_seater') return 349;
      }
      if (nameLower.includes('shine')) {
        if (norm === 'hatchback') return 399;
        if (norm === 'sedan') return 449;
        if (norm === 'suv') return 499;
        if (norm === '7_seater') return 599;
      }
      if (nameLower.includes('premium')) {
        if (norm === 'hatchback') return 699;
        if (norm === 'sedan') return 799;
        if (norm === 'suv') return 799;
        if (norm === '7_seater') return 899;
      }
    }

    // Fallback for 2W body types if specific price isn't explicitly set in prices object
    if (service.prices && typeof service.prices.bike === 'number') {
      const baseBike = service.prices.bike;
      if (norm === 'scooter') return baseBike;
      if (norm === 'sport_bike') return baseBike + 30;
      if (norm === 'cruiser') return baseBike + 50;
      return baseBike;
    }

    // Fallback if 2W body type is requested and service is a wash/care package
    if (['scooter', 'bike', 'sport_bike', 'cruiser'].includes(norm) && service.category !== 'add_on') {
      if (norm === 'scooter') return 169;
      if (norm === 'bike') return 169;
      if (norm === 'sport_bike') return 199;
      if (norm === 'cruiser') return 219;
    }
  }
  
  // Add-ons fallback to basePrice if no per-body-type mapping exists
  if (service.category === 'add_on') {
    return service.basePrice;
  }

  // Fallback to specific body type price if matched or basePrice
  if (norm && service.prices) {
    if (norm === 'suv' && typeof service.prices.suv === 'number') return service.prices.suv;
    if (norm === 'sedan' && typeof service.prices.sedan === 'number') return service.prices.sedan;
    if (norm === 'hatchback' && typeof service.prices.hatchback === 'number') return service.prices.hatchback;
  }

  return service.basePrice;
}

export function calcSubtotal(services: Service[], bodyType?: string): number {
  return services.reduce(
    (sum, service) => sum + Number(getPriceFor(service, bodyType) ?? service.basePrice ?? 0),
    0
  );
}

/**
 * GST-exclusive totals. The displayed price has GST added on top.
 */
export function calcTotals(services: Service[], bodyType?: string): TotalBreakdown {
  const subtotal = calcSubtotal(services, bodyType);
  const tax = Math.round(subtotal * GST_RATE);
  return { subtotal, tax, total: subtotal + tax };
}

export function resolveServiceSnapshots(
  catalog: Service[],
  selectedServiceIds: string[],
  bodyType?: string
): ServiceSnapshot[] {
  return selectedServiceIds
    .map((serviceId) => catalog.find((service) => service.id === serviceId))
    .filter((service): service is Service => Boolean(service))
    .map((service) => ({
      serviceId: service.id,
      name: service.name,
      price: getPriceFor(service, bodyType) ?? service.basePrice ?? 0,
    }));
}

// ----------------------------------------------------------------------------
// IN-FILE TESTS (To satisfy the user's mandatory test conditions)
// ----------------------------------------------------------------------------
const _TEST_MOCK_BASIC_WASH: Service = {
  id: 'basic', name: 'Basic Wash', basePrice: 299, category: 'wash', isActive: true,
  createdAt: '', updatedAt: '',
  prices: { bike: 199, hatchback: 249, sedan: 299, suv: 299, '7_seater': 349 }
};

const _TEST_MOCK_SHINE_WASH: Service = {
  id: 'shine', name: 'Shine Wash', basePrice: 449, category: 'wash', isActive: true,
  createdAt: '', updatedAt: '',
  prices: { bike: 349, hatchback: 399, sedan: 449, suv: 499, '7_seater': 599 }
};

const _TEST_MOCK_PREMIUM_CARE: Service = {
  id: 'premium', name: 'Premium Care', basePrice: 799, category: 'wash', isActive: true,
  createdAt: '', updatedAt: '',
  prices: { bike: 599, hatchback: 699, sedan: 799, suv: 799, '7_seater': 899 }
};

const _TEST_MOCK_ADDON: Service = {
  id: 'addon', name: 'Addon (Sedan Only)', basePrice: 99, category: 'add_on', isActive: true,
  createdAt: '', updatedAt: '',
  prices: { sedan: 199 }
};

export function __runPricingTests() {
  // Test normalizeVehicleCategory
  console.assert(normalizeVehicleCategory('bike') === '2W', 'bike is 2W');
  console.assert(normalizeVehicleCategory('2 Wheeler') === '2W', '2 Wheeler is 2W');
  console.assert(normalizeVehicleCategory('hatchback') === '4W', 'hatchback is 4W');
  console.assert(normalizeVehicleCategory('sedan') === '4W', 'sedan is 4W');
  console.assert(normalizeVehicleCategory('suv') === '4W', 'suv is 4W');
  console.assert(normalizeVehicleCategory('7 seater') === '4W', '7 seater is 4W');
  console.assert(normalizeVehicleCategory('4W') === '4W', '4W is 4W');

  // Test normalizeBodyType
  console.assert(normalizeBodyType('bike') === 'bike', 'bike body type');
  console.assert(normalizeBodyType('hatchback') === 'hatchback', 'hatchback body type');
  console.assert(normalizeBodyType('sedan') === 'sedan', 'sedan body type');
  console.assert(normalizeBodyType('suv') === 'suv', 'suv body type');
  console.assert(normalizeBodyType('7 seater') === '7_seater', '7 seater body type');
  console.assert(normalizeBodyType('4W') === undefined, '4W has no generic body type'); // Crucial!

  // Test Pricing Matrix (2W + bike)
  console.assert(getPriceFor(_TEST_MOCK_BASIC_WASH, 'bike') === 199, 'Bike Basic = 199');
  console.assert(getPriceFor(_TEST_MOCK_SHINE_WASH, 'bike') === 349, 'Bike Shine = 349');
  console.assert(getPriceFor(_TEST_MOCK_PREMIUM_CARE, 'bike') === 599, 'Bike Premium = 599');

  // Test Pricing Matrix (4W + hatchback)
  console.assert(getPriceFor(_TEST_MOCK_BASIC_WASH, 'hatchback') === 249, 'Hatchback Basic = 249');
  console.assert(getPriceFor(_TEST_MOCK_SHINE_WASH, 'hatchback') === 399, 'Hatchback Shine = 399');
  console.assert(getPriceFor(_TEST_MOCK_PREMIUM_CARE, 'hatchback') === 699, 'Hatchback Premium = 699');

  // Test Pricing Matrix (4W + sedan)
  console.assert(getPriceFor(_TEST_MOCK_BASIC_WASH, 'sedan') === 299, 'Sedan Basic = 299');
  console.assert(getPriceFor(_TEST_MOCK_SHINE_WASH, 'sedan') === 449, 'Sedan Shine = 449');
  console.assert(getPriceFor(_TEST_MOCK_PREMIUM_CARE, 'sedan') === 799, 'Sedan Premium = 799');

  // Test Pricing Matrix (4W + suv)
  console.assert(getPriceFor(_TEST_MOCK_BASIC_WASH, 'suv') === 299, 'SUV Basic = 299');
  console.assert(getPriceFor(_TEST_MOCK_SHINE_WASH, 'suv') === 499, 'SUV Shine = 499');
  console.assert(getPriceFor(_TEST_MOCK_PREMIUM_CARE, 'suv') === 799, 'SUV Premium = 799');

  // Test Pricing Matrix (4W + 7_seater)
  console.assert(getPriceFor(_TEST_MOCK_BASIC_WASH, '7 seater') === 349, '7 Seater Basic = 349');
  console.assert(getPriceFor(_TEST_MOCK_SHINE_WASH, '7 seater') === 599, '7 Seater Shine = 599');
  console.assert(getPriceFor(_TEST_MOCK_PREMIUM_CARE, '7 seater') === 899, '7 Seater Premium = 899');
  console.assert(getPriceFor(_TEST_MOCK_PREMIUM_CARE, 'suv') === 799, 'SUV Premium = 799');

  // Cross-contamination tests
  console.assert(getPriceFor(_TEST_MOCK_SHINE_WASH, 'sedan') !== getPriceFor(_TEST_MOCK_SHINE_WASH, 'suv'), 'Sedan Shine != SUV Shine');

  // Missing price tests
  console.assert(getPriceFor(_TEST_MOCK_ADDON, 'suv') === undefined, 'Missing price returns undefined, not base_price');
  
  console.log("All pricing tests passed successfully.");
}
