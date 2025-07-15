import { Ionicons } from "@expo/vector-icons";
import { Analytics } from '@vercel/analytics/react';
import { useFonts } from "expo-font";
import { Stack } from "expo-router";



export default function RootLayout() {
   const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return null; // Ou un loader personnalisé pendant le chargement des polices
  }
  return (
    <>
      <Stack />
      {/* Note: The InfoBulleIA component is not rendered here, it should be included in the layout if needed. */}
      {/* If you want to include it, you can add it inside the return statement of the RootLayout function. */}
      {/* <InfoBulleIA /> */}
      <Analytics />
    </>
  );
}
