import jsPDF from "jspdf";
import { SHIPPING_CHARGE, parseAmount, formatAED } from "./Pricing";

/**
 * Generates and downloads a one-page PDF invoice for a single order.
 * @param {object} order - order doc ({ id, productName, productDetails, price, status, orderedAt, ... })
 * @param {object} child - the child's user doc ({ name, email })
 * @param {object} admin - the admin's user doc ({ name, email })
 */
export function generateInvoicePDF(order, child, admin) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  const invoiceNumber = order.id.slice(0, 8).toUpperCase();
  const invoiceDate = order.orderedAt
    ? new Date(order.orderedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - margin, y - 18, { align: "right" });
  doc.text(`Date: ${invoiceDate}`, pageWidth - margin, y - 4, { align: "right" });

  y += 26;
  doc.setDrawColor(210);
  doc.line(margin, y, pageWidth - margin, y);
  y += 32;

  // From / Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("From", margin, y);
  doc.text("Bill To", pageWidth / 2, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(admin?.name || "Admin", margin, y);
  doc.text(child?.name || "Customer", pageWidth / 2, y);
  y += 14;
  doc.text(admin?.email || "-", margin, y);
  doc.text(child?.email || "-", pageWidth / 2, y);

  y += 44;

  // Table header
  const col = {
    product: margin,
    details: margin + 150,
    status: margin + 330,
    price: pageWidth - margin,
  };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Product", col.product, y);
  doc.text("Details", col.details, y);
  doc.text("Status", col.status, y);
  doc.text("Price", col.price, y, { align: "right" });
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Row
  doc.setFont("helvetica", "normal");
  const productLines = doc.splitTextToSize(order.productName || "-", 140);
  const detailLines = doc.splitTextToSize(order.productDetails || "-", 160);
  doc.text(productLines, col.product, y);
  doc.text(detailLines, col.details, y);
  doc.text(order.status || "-", col.status, y);
  doc.text(String(order.price ?? "-"), col.price, y, { align: "right" });

  const rowHeight = Math.max(productLines.length, detailLines.length) * 12 + 20;
  y += rowHeight;

  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  const shipping =
    order.shippingCharges !== undefined && order.shippingCharges !== null
      ? parseAmount(order.shippingCharges)
      : SHIPPING_CHARGE;
  const total = parseAmount(order.price) + shipping;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Shipping Charges", col.status, y);
  doc.text(formatAED(shipping), col.price, y, { align: "right" });
  y += 22;

  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total", col.status, y);
  doc.text(formatAED(total), col.price, y, { align: "right" });

  y += 50;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Thank you for your order.", margin, y);

  doc.save(`invoice-${invoiceNumber}.pdf`);
}