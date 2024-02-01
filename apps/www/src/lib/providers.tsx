"use client";

import React from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import Pusher from "pusher-js";
import { env } from "@/env.mjs";
import { PusherContext } from "@/context/pusher";
import { ThemeProvider, useTheme } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const pusher = new Pusher("app-key", {
  wsHost: "x21-ws.mattbergwall.com",
  cluster: "",
  wsPort: 80,
  forceTLS: true,
  disableStats: true,
  enabledTransports: ["ws", "wss"],
});

if (typeof window !== "undefined") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: "https://app.posthog.com",
  });
}

function Providers({ children }: React.PropsWithChildren) {
  const [client] = React.useState(new QueryClient());

  return (
    <PostHogProvider client={posthog}>
      <PusherContext.Provider value={{ pusher }}>
        <QueryClientProvider client={client}>
          <ReactQueryStreamedHydration>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ClerkProviderWrapped>{children}</ClerkProviderWrapped>
            </ThemeProvider>
          </ReactQueryStreamedHydration>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </PusherContext.Provider>
    </PostHogProvider>
  );
}

// appearance={{
//   variables: {
//     colorPrimary: "#FFF",
//     colorBackground: "#000",
//     colorText: "#FFF",
//     colorTextOnPrimaryBackground: "#000",
//     colorInputText: "#FFF",
//     colorAlphaShade: "white",
//     colorInputBackground: "#000",
//     // colorDanger: "hsl(var(--destructive))",
//   },
// }}
const ClerkProviderWrapped = ({ children }: React.PropsWithChildren) => {
  const theme = useTheme();
  const isDark = theme.resolvedTheme == "dark";
  return (
    <ClerkProvider
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: isDark ? "#FFF" : "#000",
          colorTextOnPrimaryBackground: isDark ? "#000" : "#FFF",
        },
        elements: {},
      }}
    >
      {children}
    </ClerkProvider>
  );
};
export default Providers;
