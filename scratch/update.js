const fs = require('fs');
const path = 'src/app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update filteredServices
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

    const bType = (s.bodyType || s.body_type || "all").toLowerCase();
    const matchesBody = serviceBodyTypeFilter === "all" || bType.includes(serviceBodyTypeFilter.toLowerCase()) || bType === "all";

    return matchesQuery && matchesVehicle && matchesBody;
  });`
);

// 2. Replace all delete icon buttons with solid bright red buttons
code = code.replace(/<IconButton\s+size="xs"\s+colorScheme="red"\s+variant="ghost"\s+aria-label="(Delete[^"]+)"\s+onClick=\{([^}]+)\}\s*>\s*<Trash2 size=\{12\} \/>\s*<\/IconButton>/g, (match, label, clickHandler) => {
  return `<IconButton
                                  size="xs"
                                  variant="solid"
                                  bg="#DC2626"
                                  color="#FFFFFF"
                                  _hover={{ bg: "#EF4444" }}
                                  aria-label="${label}"
                                  onClick={${clickHandler}}
                                >
                                  <Trash2 size={14} color="#FFFFFF" />
                                </IconButton>`;
});

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated page.tsx');
