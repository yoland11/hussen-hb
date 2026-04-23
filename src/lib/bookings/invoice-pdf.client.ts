"use client";

import type { Booking } from "@/types/booking";

import {
  INVOICE_PAGE_WIDTH_PX,
  renderInvoiceMarkup,
} from "./invoice";
import { buildBookingPdfFileName } from "./pdf-path";

async function waitForInvoicePaint(root: HTMLElement) {
  if ("fonts" in document && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font readiness fails.
    }
  }

  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => image.decode?.().catch(() => undefined) ?? Promise.resolve()),
  );

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(resolve, 140);
      });
    });
  });
}

function createInvoiceStage(booking: Booking) {
  const stage = document.createElement("div");

  stage.dir = "rtl";
  stage.lang = "ar";
  stage.style.position = "fixed";
  stage.style.left = "-200vw";
  stage.style.top = "0";
  stage.style.width = `${INVOICE_PAGE_WIDTH_PX}px`;
  stage.style.pointerEvents = "none";
  stage.style.opacity = "0";
  stage.style.zIndex = "-1";
  stage.innerHTML = renderInvoiceMarkup(booking);

  document.body.appendChild(stage);

  const page = stage.querySelector<HTMLElement>(".invoice-page");

  if (!page) {
    stage.remove();
    throw new Error("تعذر تجهيز قالب الفاتورة للتصدير.");
  }

  return { stage, page };
}

export async function generateBookingPdfFile(booking: Booking) {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasModule.default;
  const { stage, page } = createInvoiceStage(booking);

  await waitForInvoicePaint(stage);

  try {
    const canvas = await html2canvas(page, {
      backgroundColor: "#fff7f0",
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      logging: false,
      width: page.scrollWidth,
      height: page.scrollHeight,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    let renderWidth = maxWidth;
    let renderHeight = (canvas.height * renderWidth) / canvas.width;

    if (renderHeight > maxHeight) {
      renderHeight = maxHeight;
      renderWidth = (canvas.width * renderHeight) / canvas.height;
    }

    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      offsetX,
      offsetY,
      renderWidth,
      renderHeight,
      undefined,
      "FAST",
    );

    return new File([pdf.output("blob")], buildBookingPdfFileName(booking), {
      type: "application/pdf",
    });
  } finally {
    stage.remove();
  }
}
