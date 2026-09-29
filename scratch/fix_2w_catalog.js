const fs = require('fs');
const file = 'src/app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix filteredServices logic
code = code.replace(
  /const filteredServices = services\.filter\(\(s\) => \{[\s\S]*?return matchesQuery && matchesVehicle && matchesBody;\s*\}\);/,
  `const filteredServices = services.filter((s) => {
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
  });`
);

// 2. Automatically reset body type filter when switching vehicle type filter in Services catalog
code = code.replace(
  /onClick=\{\(\) => setServiceVehicleFilter\(v\.id\)\}/g,
  'onClick={() => { setServiceVehicleFilter(v.id); setServiceBodyTypeFilter("all"); }}'
);

// 3. Automatically reset body type filter when switching vehicle category filter in Vehicle catalog
code = code.replace(
  /onClick=\{\(\) => setVehicleCategoryFilter\(vc\.id\)\}/g,
  'onClick={() => { setVehicleCategoryFilter(vc.id); setVehicleBodyTypeFilter("all"); }}'
);

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully updated 2W/4W service catalog filtering in page.tsx');
