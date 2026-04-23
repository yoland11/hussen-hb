"use client";

import type { Booking } from "@/types/booking";

import { renderInvoiceDocument } from "./invoice";

async function waitForFrameReady(frame: HTMLIFrameElement) {
  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("تعذر تهيئة نافذة الطباعة في الوقت المطلوب."));
    }, 5000);

    function cleanup() {
      frame.removeEventListener("load", onLoad);
      window.clearTimeout(timeoutId);
    }

    function onLoad() {
      cleanup();
      resolve();
    }

    frame.addEventListener("load", onLoad, { once: true });
  });

  const frameWindow = frame.contentWindow;
  const frameDocument = frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    throw new Error("تعذر الوصول إلى مستند الطباعة.");
  }

  if ("fonts" in frameDocument && frameDocument.fonts?.ready) {
    try {
      await frameDocument.fonts.ready;
    } catch {
      // Ignore font readiness failures and continue printing.
    }
  }

  await new Promise<void>((resolve) => {
    frameWindow.requestAnimationFrame(() => {
      frameWindow.setTimeout(resolve, 120);
    });
  });

  return frameWindow;
}

export async function printInvoiceDocument(booking: Booking) {
  const frame = document.createElement("iframe");

  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.left = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";

  document.body.appendChild(frame);
  frame.srcdoc = renderInvoiceDocument(booking);

  const cleanup = () => {
    window.setTimeout(() => frame.remove(), 800);
  };

  try {
    const frameWindow = await waitForFrameReady(frame);

    frameWindow.addEventListener("afterprint", cleanup, { once: true });
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 4000);
  } catch (error) {
    frame.remove();
    throw error;
  }
}
