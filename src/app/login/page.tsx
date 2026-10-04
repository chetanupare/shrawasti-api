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
      <Flex minH="100vh" align="center" justify="center" bg="#090D16">
        <Spinner color="blue.500" size="xl" />
        <Text color="gray.400" ml={4}>Checking authentication...</Text>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#090D16">
      <Box p={8} maxW="md" w="full" bg="#1A202C" borderRadius="xl" boxShadow="2xl">
        <VStack gap={6} align="stretch" as="form" onSubmit={handleLogin}>
          <Box textAlign="center">
            <Heading color="white" size="lg">Shrawasti Admin</Heading>
            <Text color="gray.400" mt={2}>Sign in to access the dashboard</Text>
          </Box>

          {errorMsg && (
            <Box bg="red.500" color="white" p={3} borderRadius="md" textAlign="center">
              {errorMsg}
            </Box>
          )}

          <Box>
            <Text as="label" color="gray.300" mb={2} display="block" fontSize="sm" fontWeight="medium">Email Address</Text>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="whiteAlpha.100"
              color="white"
              border="none"
              _focus={{ ring: 2, ringColor: "blue.500" }}
              required
            />
          </Box>

          <Box>
            <Text as="label" color="gray.300" mb={2} display="block" fontSize="sm" fontWeight="medium">Password</Text>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="whiteAlpha.100"
              color="white"
              border="none"
              _focus={{ ring: 2, ringColor: "blue.500" }}
              required
            />
          </Box>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            fontSize="md"
            loading={loading}
            loadingText="Signing in..."
          >
            Sign In
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
