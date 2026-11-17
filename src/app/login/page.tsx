"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  Spinner
} from "@chakra-ui/react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      } else {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/");
    }
  };

  if (checkingSession) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="#F5F8F5">
        <Spinner color="#1A6B3C" size="lg" />
        <Text color="#3D4D3E" ml={4}>Checking your session</Text>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#F5F8F5" px="4">
      <Box p={{ base: 6, sm: 8 }} maxW="420px" w="full" bg="white" borderRadius="24px" border="1px solid" borderColor="#D5DDD6">
        <VStack gap={5} align="stretch" as="form" onSubmit={handleLogin}>
          <Box>
            <Text color="#1A6B3C" fontWeight="bold" fontSize="sm">Shrawasti</Text>
            <Heading color="#1A1C1A" size="lg" mt={1}>Desk sign in</Heading>
            <Text color="#3D4D3E" mt={2}>Use the admin email and password.</Text>
          </Box>

          {errorMsg && (
            <Box bg="#FFDAD6" color="#BA1A1A" p={3} borderRadius="12px" fontWeight="semibold">
              {errorMsg}
            </Box>
          )}

          <Box>
            <Text as="label" color="#1A1C1A" mb={2} display="block" fontSize="sm" fontWeight="semibold">Email</Text>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="#F5F8F5"
              color="#1A1C1A"
              border="1px solid"
              borderColor="#C8CFC8"
              h="48px"
              fontSize="16px"
              borderRadius="12px"
              _focus={{ borderColor: "#1A6B3C" }}
              required
            />
          </Box>

          <Box>
            <Text as="label" color="#1A1C1A" mb={2} display="block" fontSize="sm" fontWeight="semibold">Password</Text>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="#F5F8F5"
              color="#1A1C1A"
              border="1px solid"
              borderColor="#C8CFC8"
              h="48px"
              fontSize="16px"
              borderRadius="12px"
              _focus={{ borderColor: "#1A6B3C" }}
              required
            />
          </Box>

          <Button
            type="submit"
            bg="#1A6B3C"
            color="white"
            h="48px"
            fontSize="16px"
            borderRadius="12px"
            _hover={{ bg: "#145A32" }}
            loading={loading}
            loadingText="Signing in"
          >
            Sign in
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
