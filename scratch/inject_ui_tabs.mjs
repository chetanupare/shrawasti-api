import fs from "fs";

const filePath = "c:/Projects/shrawasti-mobile/shrawasti-api/src/app/page.tsx";
let code = fs.readFileSync(filePath, "utf-8");

const tabsUI = `
                {/* TAB 8: COUPONS & PROMOS */}
                {activeTab === "coupons" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Ticket size={20} color="#FBBF24" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          Coupons & Promo Codes ({coupons.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="amber"
                        onClick={() => {
                          setEditingCoupon(null);
                          setCouponForm({ code: "", description: "", discountType: "fixed", discountValue: 100, minOrderAmount: 299, maxDiscountAmount: 500, maxRedemptions: 100, isActive: true });
                          setShowCouponModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Create Coupon
                      </Button>
                    </Flex>

                    {coupons.length === 0 ? (
                      <Flex p="8" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                        <Text color="gray.300" fontSize="sm">
                          No active promo codes. Click "Create Coupon" to add one.
                        </Text>
                      </Flex>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="3">
                        {coupons.map((c) => (
                          <Card.Root key={c.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                            <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                              <Box>
                                <HStack gap="1.5">
                                  <Ticket size={16} color="#FBBF24" />
                                  <Heading size="xs" color="#FDE047" fontWeight="extrabold" letterSpacing="wider">
                                    {c.code}
                                  </Heading>
                                </HStack>
                                <Text fontSize="11px" color="gray.300" mt="1">
                                  {c.description || "Special promotional discount code"}
                                </Text>
                              </Box>
                              <Badge colorScheme={c.isActive ? "green" : "gray"} fontSize="10px" fontWeight="bold">
                                {c.isActive ? "Active" : "Disabled"}
                              </Badge>
                            </Flex>

                            <Stack gap="1.5" bg="#1E293B" p="2.5" borderRadius="lg" my="2" fontSize="11px">
                              <Flex justifyContent="space-between">
                                <Text color="gray.400">Discount:</Text>
                                <Text color="#34D399" fontWeight="bold">
                                  {c.discountType === "percentage" ? \`\${c.discountValue}% OFF\` : \`₹\${c.discountValue} FLAT OFF\`}
                                </Text>
                              </Flex>
                              <Flex justifyContent="space-between">
                                <Text color="gray.400">Min Booking Amount:</Text>
                                <Text color="white" fontWeight="bold">₹{c.minOrderAmount}</Text>
                              </Flex>
                              <Flex justifyContent="space-between">
                                <Text color="gray.400">Redemptions:</Text>
                                <Text color="gray.300">{c.timesRedeemed} / {c.maxRedemptions}</Text>
                              </Flex>
                            </Stack>

                            <Flex justifyContent="flex-end" gap="1.5" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="subtle"
                                onClick={() => {
                                  setEditingCoupon(c);
                                  setCouponForm({
                                    code: c.code,
                                    description: c.description || "",
                                    discountType: c.discountType || "fixed",
                                    discountValue: c.discountValue || 100,
                                    minOrderAmount: c.minOrderAmount || 0,
                                    maxDiscountAmount: c.maxDiscountAmount || 1000,
                                    maxRedemptions: c.maxRedemptions || 100,
                                    isActive: c.isActive ?? true,
                                  });
                                  setShowCouponModal(true);
                                }}
                              >
                                <Edit size={12} style={{ marginRight: "4px" }} /> Edit
                              </Button>
                              <IconButton
                                size="xs"
                                variant="solid"
                                bg="#DC2626"
                                color="#FFFFFF"
                                _hover={{ bg: "#EF4444" }}
                                aria-label="Delete coupon"
                                onClick={() => handleDeleteCoupon(c.id)}
                              >
                                <Trash2 size={14} color="#FFFFFF" />
                              </IconButton>
                            </Flex>
                          </Card.Root>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                )}

                {/* TAB 9: SUBSCRIPTIONS & CAREPASS */}
                {activeTab === "subscriptions" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Sparkles size={20} color="#C084FC" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          CarePass Plans & User Memberships ({subscriptions.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="purple"
                        onClick={() => {
                          setEditingPlan(null);
                          setPlanForm({ name: "", description: "", basePrice: 899, validityDays: "30", popular: false, isActive: true });
                          setShowPlanModal(true);
                        }}
                      >
                        <Plus size={14} style={{ marginRight: "4px" }} /> Create CarePass Plan
                      </Button>
                    </Flex>

                    <Heading size="2xs" color="gray.300" textTransform="uppercase" letterSpacing="wider">
                      Available Subscription Plans
                    </Heading>

                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="3">
                      {subscriptions.map((p) => (
                        <Card.Root key={p.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                          <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                            <Box>
                              <HStack gap="1.5">
                                <Sparkles size={16} color="#C084FC" />
                                <Heading size="xs" color="#FFFFFF" fontWeight="bold">
                                  {p.name}
                                </Heading>
                              </HStack>
                              <Text fontSize="11px" color="gray.400" mt="1">
                                {p.description || "Monthly vehicle care membership plan"}
                              </Text>
                            </Box>
                            {p.popular && (
                              <Badge colorScheme="amber" fontSize="9px" fontWeight="bold">
                                POPULAR
                              </Badge>
                            )}
                          </Flex>

                          <Text fontSize="lg" fontWeight="extrabold" color="#C084FC" my="2">
                            ₹{p.basePrice} <Text as="span" fontSize="xs" fontWeight="normal" color="gray.400">/ {p.validityDays} days</Text>
                          </Text>

                          <VStack align="stretch" gap="1" bg="#1E293B" p="2.5" borderRadius="lg" my="2" fontSize="11px">
                            {(p.benefits || []).map((b: string, i: number) => (
                              <HStack key={i} gap="1.5">
                                <Check size={12} color="#34D399" />
                                <Text color="gray.300">{b}</Text>
                              </HStack>
                            ))}
                          </VStack>

                          <Flex justifyContent="flex-end" gap="1.5" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                            <Button
                              size="xs"
                              colorScheme="blue"
                              variant="subtle"
                              onClick={() => {
                                setEditingPlan(p);
                                setPlanForm({
                                  name: p.name,
                                  description: p.description || "",
                                  basePrice: p.basePrice || 899,
                                  validityDays: String(p.validityDays || "30"),
                                  popular: p.popular ?? false,
                                  isActive: p.isActive ?? true,
                                });
                                setShowPlanModal(true);
                              }}
                            >
                              <Edit size={12} style={{ marginRight: "4px" }} /> Edit
                            </Button>
                            <IconButton
                              size="xs"
                              variant="solid"
                              bg="#DC2626"
                              color="#FFFFFF"
                              _hover={{ bg: "#EF4444" }}
                              aria-label="Delete plan"
                              onClick={() => handleDeletePlan(p.id)}
                            >
                              <Trash2 size={14} color="#FFFFFF" />
                            </IconButton>
                          </Flex>
                        </Card.Root>
                      ))}
                    </Grid>

                    <Heading size="2xs" color="gray.300" textTransform="uppercase" letterSpacing="wider" mt="4">
                      Active Customer Memberships ({userSubscriptions.length})
                    </Heading>

                    {userSubscriptions.length === 0 ? (
                      <Text fontSize="xs" color="gray.400">No active customer subscriptions found.</Text>
                    ) : (
                      <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" overflow="hidden">
                        <Table.Root size="sm" variant="line">
                          <Table.Header bg="#1E293B">
                            <Table.Row>
                              <Table.ColumnHeader color="gray.300">User ID</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.300">Plan</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.300">Billing Period</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.300">Status</Table.ColumnHeader>
                              <Table.ColumnHeader color="gray.300">Start Date</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {userSubscriptions.map((us) => (
                              <Table.Row key={us.id}>
                                <Table.Cell color="white" fontSize="xs" fontWeight="bold">{us.userId?.substring(0, 12)}</Table.Cell>
                                <Table.Cell color="gray.300" fontSize="xs">{us.snapshotPlanName}</Table.Cell>
                                <Table.Cell color="gray.300" fontSize="xs">{us.billingPeriod}</Table.Cell>
                                <Table.Cell>
                                  <Badge colorScheme={us.status === "active" ? "green" : "amber"} fontSize="10px">
                                    {us.status}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell color="gray.400" fontSize="11px">{us.currentPeriodStart ? new Date(us.currentPeriodStart).toLocaleDateString() : "N/A"}</Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Card.Root>
                    )}
                  </Stack>
                )}

                {/* TAB 10: CUSTOMER REVIEWS */}
                {activeTab === "reviews" && (
                  <Stack gap="6">
                    <HStack gap="2">
                      <Star size={20} color="#FBBF24" />
                      <Heading size="xs" color="white" fontWeight="bold">
                        Customer Ratings & Reviews ({reviews.length})
                      </Heading>
                    </HStack>

                    {reviews.length === 0 ? (
                      <Flex p="8" justifyContent="center" alignItems="center" flexDir="column" gap="3">
                        <Text color="gray.300" fontSize="sm">
                          No customer reviews submitted yet.
                        </Text>
                      </Flex>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="3">
                        {reviews.map((r) => (
                          <Card.Root key={r.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                            <Flex justifyContent="space-between" alignItems="center" mb="2">
                              <HStack gap="1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    color={star <= r.rating ? "#FBBF24" : "#475569"}
                                    fill={star <= r.rating ? "#FBBF24" : "transparent"}
                                  />
                                ))}
                              </HStack>
                              <Button
                                size="2xs"
                                onClick={() => handleToggleReviewPublished(r)}
                                bg={r.isPublished ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                                color={r.isPublished ? "#6EE7B7" : "#FCA5A5"}
                                border="1px solid"
                                borderColor={r.isPublished ? "rgba(52, 211, 153, 0.4)" : "rgba(248, 113, 113, 0.4)"}
                                borderRadius="md"
                                px="2"
                                fontSize="10px"
                                fontWeight="bold"
                              >
                                {r.isPublished ? "Published" : "Hidden"}
                              </Button>
                            </Flex>

                            <Text fontSize="xs" color="white" my="2" italic fontStyle="italic">
                              "{r.comment || "Great service overall!"}"
                            </Text>

                            <Flex justifyContent="space-between" alignItems="center" pt="2" borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.12)">
                              <Text fontSize="10px" color="gray.400">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recent"}
                              </Text>
                              <IconButton
                                size="xs"
                                variant="solid"
                                bg="#DC2626"
                                color="#FFFFFF"
                                _hover={{ bg: "#EF4444" }}
                                aria-label="Delete review"
                                onClick={() => handleDeleteReview(r.id)}
                              >
                                <Trash2 size={14} color="#FFFFFF" />
                              </IconButton>
                            </Flex>
                          </Card.Root>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                )}

                {/* TAB 11: BROADCAST PUSH NOTIFICATIONS */}
                {activeTab === "notifications" && (
                  <Stack gap="6">
                    <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="3">
                      <HStack gap="2">
                        <Bell size={20} color="#60A5FA" />
                        <Heading size="xs" color="white" fontWeight="bold">
                          Broadcast Push Notifications & Registered Devices ({deviceTokens.length})
                        </Heading>
                      </HStack>

                      <Button
                        size="xs"
                        colorScheme="blue"
                        onClick={() => {
                          setBroadcastForm({ title: "", message: "", targetAudience: "all" });
                          setShowBroadcastModal(true);
                        }}
                      >
                        <Send size={14} style={{ marginRight: "4px" }} /> Compose Broadcast
                      </Button>
                    </Flex>

                    <Card.Root bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                      <HStack gap="3">
                        <Bell size={24} color="#38BDF8" />
                        <Box>
                          <Heading size="xs" color="white" fontWeight="bold">Active Devices Connected</Heading>
                          <Text fontSize="xs" color="gray.300">
                            Total {deviceTokens.length} active Expo & FCM device tokens registered from mobile users.
                          </Text>
                        </Box>
                      </HStack>
                    </Card.Root>

                    <Heading size="2xs" color="gray.300" textTransform="uppercase" letterSpacing="wider">
                      Broadcast Notification History ({broadcastHistory.length})
                    </Heading>

                    {broadcastHistory.length === 0 ? (
                      <Text fontSize="xs" color="gray.400">No broadcast messages sent yet.</Text>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap="3">
                        {broadcastHistory.map((h) => (
                          <Card.Root key={h.id} bg="#111827" borderColor="rgba(255, 255, 255, 0.12)" borderWidth="1px" borderRadius="xl" p="4">
                            <Flex justifyContent="space-between" alignItems="flex-start" mb="2">
                              <Heading size="xs" color="#38BDF8" fontWeight="bold">
                                {h.title}
                              </Heading>
                              <Badge colorScheme="blue" fontSize="9px">
                                {h.recipientsCount} Devices
                              </Badge>
                            </Flex>
                            <Text fontSize="xs" color="gray.300" mb="2">
                              {h.body}
                            </Text>
                            <Text fontSize="10px" color="gray.400">
                              Sent: {h.sentAt ? new Date(h.sentAt).toLocaleString() : "Recently"}
                            </Text>
                          </Card.Root>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                )}
`;

const modalsUI = `
      {/* 7. Coupon Modal */}
      {showCouponModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingCoupon ? "Edit Coupon Code" : "Create Coupon Code"}
            </Heading>
            <form onSubmit={handleSaveCoupon}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Coupon Code (Uppercase)</Text>
                  <Input required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="SUMMER50" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Description</Text>
                  <Input value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Flat ₹100 off on detailing" />
                </Box>
                <Grid templateColumns="repeat(2, 1fr)" gap="3">
                  <Box>
                    <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Discount Value</Text>
                    <Input type="number" required value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Min Booking (₹)</Text>
                    <Input type="number" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                  </Box>
                </Grid>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowCouponModal(false)}>Cancel</Button>
                  <Button colorScheme="amber" type="submit">Save Coupon</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 8. CarePass Plan Modal */}
      {showPlanModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              {editingPlan ? "Edit CarePass Plan" : "Create CarePass Plan"}
            </Heading>
            <form onSubmit={handleSavePlan}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Plan Name</Text>
                  <Input required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Shrawasti CarePass Platinum" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Base Monthly Price (₹)</Text>
                  <Input type="number" required value={planForm.basePrice} onChange={(e) => setPlanForm({ ...planForm, basePrice: Number(e.target.value) })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowPlanModal(false)}>Cancel</Button>
                  <Button colorScheme="purple" type="submit">Save Plan</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}

      {/* 9. Broadcast Push Modal */}
      {showBroadcastModal && (
        <Flex position="fixed" inset="0" bg="blackAlpha.800" backdropFilter="blur(6px)" zIndex="999" alignItems="center" justifyContent="center" p="4">
          <Box bg="#0F172A" borderColor="rgba(255, 255, 255, 0.2)" borderWidth="1px" borderRadius="2xl" p="6" w="full" maxW="450px">
            <Heading size="md" color="white" mb="4">
              Compose Broadcast Push Notification
            </Heading>
            <form onSubmit={handleSendBroadcast}>
              <Stack gap="4">
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Title</Text>
                  <Input required value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Weekend Special Offer! 🧼" />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.300" mb="1" fontWeight="bold">Message Body</Text>
                  <Input required value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} bg="#1E293B" color="#FFFFFF" borderRadius="lg" placeholder="Get 20% off on vehicle detailing this weekend!" />
                </Box>
                <Flex justifyContent="flex-end" gap="3" pt="4">
                  <Button variant="ghost" color="gray.300" onClick={() => setShowBroadcastModal(false)}>Cancel</Button>
                  <Button colorScheme="blue" type="submit">Send Broadcast</Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Flex>
      )}
`;

code = code.replace('{/* TAB 8: HEALTH */}', tabsUI + '\n                {/* TAB 8: HEALTH */}');
code = code.replace('      {/* 6. User Modal */}', modalsUI + '\n      {/* 6. User Modal */}');

fs.writeFileSync(filePath, code);
console.log("Successfully injected UI Tabs and Modals for Coupons, Subscriptions, Reviews & Notifications into page.tsx!");
