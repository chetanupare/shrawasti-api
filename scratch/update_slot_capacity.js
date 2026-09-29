const fs = require('fs');
const file = 'src/app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update showSlotModal form to include Max Capacity and Slot Status controls
const oldSlotModal = `<form onSubmit={handleSaveSlot}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Time Slot</Text>
                  <Input required value={slotForm.slotTime} onChange={(e) => setSlotForm({ ...slotForm, slotTime: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowSlotModal(false)}>Cancel</Button>
                  <Button colorScheme="purple" type="submit">Save Slot</Button>
                </Flex>
              </Stack>
            </form>`;

const newSlotModal = `<form onSubmit={handleSaveSlot}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Time Slot Range</Text>
                  <Input required value={slotForm.slotTime} onChange={(e) => setSlotForm({ ...slotForm, slotTime: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="09:00 AM - 10:00 AM" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Maximum Booking Capacity</Text>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={slotForm.maxCapacity}
                    onChange={(e) => setSlotForm({ ...slotForm, maxCapacity: parseInt(e.target.value) || 1 })}
                    bg="#1E293B"
                    color="#FFFFFF"
                    borderRadius="lg"
                    placeholder="10"
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Slot Status</Text>
                  <HStack gap="2">
                    <Button
                      size="xs"
                      type="button"
                      onClick={() => setSlotForm({ ...slotForm, isActive: true })}
                      variant={slotForm.isActive ? "solid" : "outline"}
                      colorScheme={slotForm.isActive ? "green" : "gray"}
                      flex="1"
                    >
                      Active / Open
                    </Button>
                    <Button
                      size="xs"
                      type="button"
                      onClick={() => setSlotForm({ ...slotForm, isActive: false })}
                      variant={!slotForm.isActive ? "solid" : "outline"}
                      colorScheme={!slotForm.isActive ? "red" : "gray"}
                      flex="1"
                    >
                      Closed / Full
                    </Button>
                  </HStack>
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowSlotModal(false)}>Cancel</Button>
                  <Button colorScheme="purple" type="submit">Save Slot</Button>
                </Flex>
              </Stack>
            </form>`;

code = code.replace(oldSlotModal, newSlotModal);

// Update slots card display to highlight capacity and offer click-to-edit
const oldSlotCard = `<Text fontSize="10px" color="gray.300">
                              Cap: {s.maxCapacity || 10}
                            </Text>`;
const newSlotCard = `<Badge colorScheme="purple" fontSize="10px" fontWeight="bold" px="2" py="0.5">
                              Cap: {s.maxCapacity || s.max_capacity || 10}
                            </Badge>`;

code = code.replace(oldSlotCard, newSlotCard);

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully updated slot capacity controls in page.tsx');
