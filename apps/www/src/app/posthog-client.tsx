"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";

export const PostHogClient = () => {
  const user = useUser();

  useEffect(() => {
    if (!user.isLoaded) return;
    if (!user.isSignedIn) posthog.reset();
    else {
      const {
        firstName,
        lastName,
        fullName,
        imageUrl,
        primaryEmailAddress,
        lastSignInAt,
      } = user?.user;
      posthog.identify(user?.user?.id, {
        firstName,
        lastName,
        fullName,
        imageUrl,
        email: primaryEmailAddress?.emailAddress,
        lastSignInAt: lastSignInAt?.toISOString(),
      });
    }
    console.log("NEW USER STATE", user);
  }, [user.isLoaded, user?.user?.id]);
  return null;
};
