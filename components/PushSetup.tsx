"use client";

import { useEffect, useState } from "react";

type State = "loading" | "unsupported" | "not-configured" | "blocked" | "off" | "on" | "working";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Turns desktop alerts on or off for this browser. Each computer (or
 * browser profile) is turned on separately; all of them get every alert.
 */
export default function PushSetup({ publicKey }: { publicKey: string | null }) {
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      if (!publicKey) return setState("not-configured");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setState("unsupported");
      }
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      setState(existing ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [publicKey]);

  async function turnOn() {
    if (!publicKey) return;
    setState("working");
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("save failed");
      setState("on");
      setMessage("Alerts are on for this browser.");
    } catch {
      setState("off");
      setMessage("Couldn't turn alerts on. Try again in a moment.");
    }
  }

  async function turnOff() {
    setState("working");
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }

  async function sendTest() {
    setMessage("");
    const res = await fetch("/api/push/test", { method: "POST" });
    setMessage(res.ok ? "Test alert sent. It should pop up in a few seconds." : "Couldn't send a test alert.");
  }

  return (
    <div className="push-setup">
      <div className="push-setup-text">
        <strong>Desktop alerts</strong>
        <span>
          {state === "on" && "On for this browser. New bookings, cancellations and messages pop up here."}
          {state === "off" && "Get a pop-up on this computer for new bookings, cancellations and messages."}
          {state === "blocked" &&
            "Notifications are blocked for this site. Allow them in your browser's site settings, then reload."}
          {state === "unsupported" && "This browser can't show desktop alerts."}
          {state === "not-configured" && "Desktop alerts need VAPID keys set in Vercel first."}
          {(state === "loading" || state === "working") && "Checking this browser..."}
        </span>
        {message && <span className="push-setup-message">{message}</span>}
      </div>
      <div className="push-setup-actions">
        {state === "off" && (
          <button type="button" className="btn btn-sm" onClick={turnOn}>
            Turn on
          </button>
        )}
        {state === "on" && (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={sendTest}>
              Send a test
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={turnOff}>
              Turn off
            </button>
          </>
        )}
      </div>
    </div>
  );
}
