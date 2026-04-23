"use client";

import type { Booking } from "@/types/booking";

import { renderInvoiceMarkup } from "./invoice";
import { buildBookingPdfFileName } from "./pdf-path";

function waitForDocumentPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 120);
    });
  });
}

export async function generateBookingPdfFile(booking: Booking) {
  const [{ jsPDF }] = await Promise.all([import("jspdf"), import("html2canvas")]);
  const container = document.createElement("div");

  container.dir = "rtl";
  container.lang = "ar";
  container.style.position = "fixed";
  container.style.left = "-200vw";
  container.style.top = "0";
  container.style.width = "820px";
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  container.style.zIndex = "-1";
  container.innerHTML = renderInvoiceMarkup(booking);

  document.body.appendChild(container);
  await waitForDocumentPaint();

  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    await pdf.html(container, {
      autoPaging: "text",
      html2canvas: {
        backgroundColor: "#fff7f0",
        scale: 2,
        useCORS: true,
      },
      margin: [18, 18, 18, 18],
      width: 559,
      windowWidth: 820,
    });

    return new File([pdf.output("blob")], buildBookingPdfFileName(booking), {
      type: "application/pdf",
    });
  } finally {
    container.remove();
  }
}
