import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "art.canvasos.app",
  appName: "CanvasOS",
  webDir: "../web/dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#0f0f0f",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0f0f0f",
    },
  },
};

export default config;
