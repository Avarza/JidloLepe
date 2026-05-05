import { Stack } from "expo-router";
import'./globals.css';
import { AuthProvider } from "@/context/authContext";
export default function RootLayout() {
  return (
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
          <Stack.Screen name="Product/[id]" options={{headerShown: false}}/>
        </Stack>
      </AuthProvider>
  );
}
