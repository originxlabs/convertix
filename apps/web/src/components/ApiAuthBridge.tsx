"use client";

import { useEffect, useMemo } from "react";

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = parseJwtExp(token);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
}

export default function ApiAuthBridge() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055",
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch.bind(window);

    const patchedFetch: typeof window.fetch = async (input, init) => {
      const token = window.localStorage.getItem("convertix-auth-token");
      if (token && isTokenExpired(token)) {
        window.localStorage.removeItem("convertix-auth-token");
        window.localStorage.removeItem("convertix-user-id");
        window.dispatchEvent(new Event("convertix-auth-expired"));
      }

      const nextInit: RequestInit = { ...(init ?? {}) };
      const headers = new Headers(nextInit.headers ?? {});

      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : "";

      const shouldAttach =
        Boolean(token) &&
        (url.startsWith(apiBase) || url.startsWith(`${apiBase}/`));

      if (shouldAttach && token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
        nextInit.headers = headers;
      }

      const response = await originalFetch(input as any, nextInit);

      const alreadyRetried = headers.get("x-convertix-retry") === "1";
      if (response.status === 401 && token && !alreadyRetried) {
        try {
          const refreshResponse = await originalFetch(`${apiBase}/api/session/refresh`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "x-convertix-retry": "1"
            }
          });
          if (refreshResponse.ok) {
            const payload = await refreshResponse.json().catch(() => ({}));
            if (payload?.token) {
              window.localStorage.setItem("convertix-auth-token", payload.token);
              headers.set("Authorization", `Bearer ${payload.token}`);
              headers.set("x-convertix-retry", "1");
              nextInit.headers = headers;
              return originalFetch(input as any, nextInit);
            }
          }
        } catch {
          // ignore refresh errors
        }
        window.localStorage.removeItem("convertix-auth-token");
        window.localStorage.removeItem("convertix-user-id");
        window.dispatchEvent(new Event("convertix-auth-expired"));
      }

      return response;
    };

    window.fetch = patchedFetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [apiBase]);

  return null;
}
