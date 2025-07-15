import '@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf';
import { Analytics } from '@vercel/analytics/react';
import { Stack } from "expo-router";




export default function RootLayout() {
 
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
