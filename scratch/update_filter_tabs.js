const fs = require('fs');
const file = 'src/app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Bookings Status Filter Tabs
code = code.replace(
  /\{\["all", "pending", "confirmed", "completed", "cancelled"\]\.map\(\(st\) => \([\s\S]*?<\/Button>\s*\)\)\}/,
  `{["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
                          <Button
                            key={st}
                            size="xs"
                            onClick={() => setStatusFilter(st)}
                            bg={statusFilter === st ? "#2563EB" : "#1E293B"}
                            color={statusFilter === st ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={statusFilter === st ? "#3B82F6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: statusFilter === st ? "#1D4ED8" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            textTransform="capitalize"
                            fontWeight={statusFilter === st ? "bold" : "normal"}
                          >
                            {st}
                          </Button>
                        ))}`
);

// 2. Services Vehicle Category Filter Tabs
code = code.replace(
  /\{\[\s*\{ id: "all", label: "All Vehicles" \},\s*\{ id: "4W", label: "4W \(Car\)" \},\s*\{ id: "2W", label: "2W \(Bike\)" \},\s*\]\.map\(\(v\) => \([\s\S]*?<\/Button>\s*\)\)\}/,
  `{[{ id: "all", label: "All Vehicles" }, { id: "4W", label: "4W (Car)" }, { id: "2W", label: "2W (Bike)" }].map((v) => (
                          <Button
                            key={v.id}
                            size="xs"
                            onClick={() => setServiceVehicleFilter(v.id)}
                            bg={serviceVehicleFilter === v.id ? "#2563EB" : "#1E293B"}
                            color={serviceVehicleFilter === v.id ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={serviceVehicleFilter === v.id ? "#3B82F6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: serviceVehicleFilter === v.id ? "#1D4ED8" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            fontWeight={serviceVehicleFilter === v.id ? "bold" : "normal"}
                          >
                            {v.label}
                          </Button>
                        ))}`
);

// 3. Services Body Type Filter Tabs
code = code.replace(
  /\{\["all", "Hatchback", "Sedan", "SUV", "Scooter", "Cruiser"\]\.map\(\(bt\) => \([\s\S]*?<\/Button>\s*\)\)\}/,
  `{["all", "Hatchback", "Sedan", "SUV", "Scooter", "Cruiser"].map((bt) => (
                          <Button
                            key={bt}
                            size="xs"
                            onClick={() => setServiceBodyTypeFilter(bt)}
                            bg={serviceBodyTypeFilter === bt ? "#7C3AED" : "#1E293B"}
                            color={serviceBodyTypeFilter === bt ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={serviceBodyTypeFilter === bt ? "#8B5CF6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: serviceBodyTypeFilter === bt ? "#6D28D9" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            textTransform="capitalize"
                            fontWeight={serviceBodyTypeFilter === bt ? "bold" : "normal"}
                          >
                            {bt}
                          </Button>
                        ))}`
);

// 4. Vehicle Catalog Category Filter Tabs
code = code.replace(
  /\{\[\s*\{ id: "all", label: "All Vehicles" \},\s*\{ id: "Car", label: "Car \(4W\)" \},\s*\{ id: "Bike", label: "Bike \(2W\)" \},\s*\]\.map\(\(vc\) => \([\s\S]*?<\/Button>\s*\)\)\}/,
  `{[{ id: "all", label: "All Vehicles" }, { id: "Car", label: "Car (4W)" }, { id: "Bike", label: "Bike (2W)" }].map((vc) => (
                          <Button
                            key={vc.id}
                            size="xs"
                            onClick={() => setVehicleCategoryFilter(vc.id)}
                            bg={vehicleCategoryFilter === vc.id ? "#7C3AED" : "#1E293B"}
                            color={vehicleCategoryFilter === vc.id ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={vehicleCategoryFilter === vc.id ? "#8B5CF6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: vehicleCategoryFilter === vc.id ? "#6D28D9" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            fontWeight={vehicleCategoryFilter === vc.id ? "bold" : "normal"}
                          >
                            {vc.label}
                          </Button>
                        ))}`
);

// 5. Vehicle Catalog Body Type Filter Tabs
code = code.replace(
  /\{\["all", "Hatchback", "Sedan", "SUV", "Scooter", "Cruiser", "Sports"\]\.map\(\(bt\) => \([\s\S]*?<\/Button>\s*\)\)\}/,
  `{["all", "Hatchback", "Sedan", "SUV", "Scooter", "Cruiser", "Sports"].map((bt) => (
                          <Button
                            key={bt}
                            size="xs"
                            onClick={() => setVehicleBodyTypeFilter(bt)}
                            bg={vehicleBodyTypeFilter === bt ? "#2563EB" : "#1E293B"}
                            color={vehicleBodyTypeFilter === bt ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={vehicleBodyTypeFilter === bt ? "#3B82F6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: vehicleBodyTypeFilter === bt ? "#1D4ED8" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            textTransform="capitalize"
                            fontWeight={vehicleBodyTypeFilter === bt ? "bold" : "normal"}
                          >
                            {bt}
                          </Button>
                        ))}`
);

// 6. API Console Preset Selectors
code = code.replace(
  /\{\[\s*\{ label: "Bookings", ep: "\/api\/admin\/bookings" \},[\s\S]*?\]\.map\(\(preset\) => \([\s\S]*?<\/Button>\s*\)\)\}/,
  `{[{ label: "Bookings", ep: "/api/admin/bookings" }, { label: "Services", ep: "/api/admin/services" }, { label: "Providers", ep: "/api/admin/providers" }, { label: "Users", ep: "/api/admin/users" }, { label: "Slots", ep: "/api/admin/slots" }, { label: "Vehicle Catalog", ep: "/api/admin/vehicles/catalog" }, { label: "Stats", ep: "/api/admin/dashboard/stats" }].map((preset) => (
                          <Button
                            key={preset.ep}
                            size="xs"
                            onClick={() => setApiEndpoint(preset.ep)}
                            bg={apiEndpoint === preset.ep ? "#2563EB" : "#1E293B"}
                            color={apiEndpoint === preset.ep ? "#FFFFFF" : "#E2E8F0"}
                            border="1px solid"
                            borderColor={apiEndpoint === preset.ep ? "#3B82F6" : "rgba(255, 255, 255, 0.2)"}
                            _hover={{ bg: apiEndpoint === preset.ep ? "#1D4ED8" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                            borderRadius="lg"
                            fontWeight={apiEndpoint === preset.ep ? "bold" : "normal"}
                          >
                            {preset.label}
                          </Button>
                        ))}`
);

// 7. API Console HTTP Method Selectors
code = code.replace(
  /\{\["GET", "POST", "PUT", "DELETE"\]\.map\(\(m\) => \([\s\S]*?<\/Button>\s*\)\)\}/,
  `{["GET", "POST", "PUT", "DELETE"].map((m) => (
                            <Button
                              key={m}
                              size="sm"
                              onClick={() => setApiMethod(m)}
                              bg={apiMethod === m ? "#7C3AED" : "#1E293B"}
                              color={apiMethod === m ? "#FFFFFF" : "#E2E8F0"}
                              border="1px solid"
                              borderColor={apiMethod === m ? "#8B5CF6" : "rgba(255, 255, 255, 0.2)"}
                              _hover={{ bg: apiMethod === m ? "#6D28D9" : "rgba(255, 255, 255, 0.15)", color: "#FFFFFF" }}
                              flex="1"
                              fontWeight={apiMethod === m ? "bold" : "normal"}
                            >
                              {m}
                            </Button>
                          ))}`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully updated filter tabs styling in page.tsx');
