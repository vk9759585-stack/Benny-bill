export interface ReceiptData {
  id?: string;
  tableNumber: number;
  guestCount?: number;
  guestName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
    priceAtOrder?: number;
  }>;
  subtotal: number;
  serviceCharge: number;
  tax: number;
  total: number;
  timestamp?: string;
  paymentMethod?: 'UPI' | 'Cash' | 'Card';
}

/**
 * Renders a crisp high-DPI canvas resembling a real-life thermal paper receipt roll.
 */
export function generateReceiptCanvas(data: ReceiptData): HTMLCanvasElement {
  const width = 450;
  const itemHeight = 32;
  const padding = 35;
  const headerHeight = 160;
  const totalsHeight = 145;
  const footerHeight = 160;
  
  let height = headerHeight + (data.items.length * itemHeight) + totalsHeight + footerHeight;
  if (data.paymentMethod) {
    height += 25;
  }
  if (data.guestName) {
    height += 18;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(2, 2);

  // Background - vintage thermal white-gray paper
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Draw soft gray receipt border
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#E5E7EB';
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Draw receipt serrated edge top & bottom
  ctx.fillStyle = '#F3F4F6';
  for (let x = 10; x < width - 10; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x + 5, 14);
    ctx.lineTo(x + 10, 10);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, height - 10);
    ctx.lineTo(x + 5, height - 14);
    ctx.lineTo(x + 10, height - 10);
    ctx.fill();
  }

  // Draw Header details
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('BESPOKE DINING CO.', width / 2, 55);

  ctx.fillStyle = '#4B5563';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`Table ${data.tableNumber} • Digital Receipt`, width / 2, 78);

  const idString = data.id ? data.id.slice(-5).toUpperCase() : 'TEMP';
  const dateString = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();
  
  if (data.guestName) {
    ctx.fillStyle = '#4B5563';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Guest: ${data.guestName}`, width / 2, 94);
    
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px monospace';
    ctx.fillText(`Receipt ID: #${idString}`, width / 2, 108);
    ctx.fillText(`Date: ${dateString}`, width / 2, 122);
  } else {
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px monospace';
    ctx.fillText(`Receipt ID: #${idString}`, width / 2, 95);
    ctx.fillText(`Date: ${dateString}`, width / 2, 110);
  }

  // Dash divider
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const dividerY = data.guestName ? 138 : 130;
  ctx.moveTo(padding, dividerY);
  ctx.lineTo(width - padding, dividerY);
  ctx.stroke();

  // Column headers
  ctx.setLineDash([]);
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  const labelY = data.guestName ? 158 : 150;
  ctx.fillText('QTY/DISPATCH', padding, labelY);
  ctx.textAlign = 'right';
  ctx.fillText('VALUE', width - padding, labelY);

  // Items List
  let currentY = data.guestName ? 183 : 175;
  ctx.font = '13px monospace';
  
  data.items.forEach(item => {
    const price = item.price ?? item.priceAtOrder ?? 0;
    const finalPrice = price * item.quantity;

    // Dispatch item description name
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'left';
    ctx.fillText(`${item.quantity}x ${item.name}`, padding, currentY);

    // Cost amount
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'right';
    ctx.fillText(`₹${finalPrice.toFixed(2)}`, width - padding, currentY);

    currentY += itemHeight;
  });

  // Dash divider
  ctx.strokeStyle = '#374151';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padding, currentY - 5);
  ctx.lineTo(width - padding, currentY - 5);
  ctx.stroke();

  // Totals calculations
  currentY += 15;
  ctx.setLineDash([]);
  ctx.font = '12px monospace';
  ctx.fillStyle = '#4B5563';

  // Subtotal
  ctx.textAlign = 'left';
  ctx.fillText('Subtotal:', padding + 10, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`₹${data.subtotal.toFixed(2)}`, width - padding, currentY);

  // Service Charge
  currentY += 24;
  ctx.textAlign = 'left';
  ctx.fillText('Service Charge (10%):', padding + 10, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`₹${data.serviceCharge.toFixed(2)}`, width - padding, currentY);

  // VAT Taxes
  currentY += 24;
  ctx.textAlign = 'left';
  ctx.fillText('VAT Sales Taxes (8%):', padding + 10, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`₹${data.tax.toFixed(2)}`, width - padding, currentY);

  // Grand total billing
  currentY += 32;
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('GRAND TOTAL PAID:', padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`₹${data.total.toFixed(2)}`, width - padding, currentY);

  if (data.paymentMethod) {
    currentY += 22;
    ctx.fillStyle = '#4B5563';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PAYMENT METHOD:', padding + 10, currentY);
    ctx.textAlign = 'right';
    let icon = '';
    if (data.paymentMethod === 'UPI') icon = 'UPI 📱';
    else if (data.paymentMethod === 'Cash') icon = 'CASH 💵';
    else if (data.paymentMethod === 'Card') icon = 'CARD 💳';
    ctx.fillText(icon || data.paymentMethod, width - padding, currentY);
  }

  // Bottom padding line
  currentY += 35;
  ctx.strokeStyle = '#E5E7EB';
  ctx.beginPath();
  ctx.moveTo(padding, currentY);
  ctx.lineTo(width - padding, currentY);
  ctx.stroke();

  // Fine print and greetings
  currentY += 25;
  ctx.fillStyle = '#6B7280';
  ctx.font = 'italic 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('~~~ Thank you for dining with us! ~~~', width / 2, currentY);
  
  currentY += 16;
  ctx.font = '10px monospace';
  ctx.fillText('Generated client-side via Bespoke Applet', width / 2, currentY);

  // Simulate structural print barcode lines
  currentY += 25;
  ctx.fillStyle = '#111827';
  ctx.font = '12px monospace';
  ctx.fillText('||| | |||| | || ||| || ||', width / 2, currentY);

  currentY += 12;
  ctx.font = '8px monospace';
  ctx.fillText('*BESPOKE-PAY-STORE*', width / 2, currentY);

  return canvas;
}

/**
 * Triggers standard system print workflow specifically configured to only print a neat thermal slip format
 */
export function printReceipt(data: ReceiptData): void {
  // Add a styled HTML node that is block visible on print only, overriding general page layouts
  const style = document.createElement('style');
  style.id = 'receipt-print-style';
  style.innerHTML = `
    @media print {
      body > * {
        display: none !important;
      }
      #receipt-print-container {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        background: white !important;
        color: black !important;
        font-family: monospace !important;
        padding: 20px !important;
      }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'receipt-print-container';
  container.style.display = 'none'; // hidden during normal screen navigation

  const idString = data.id ? data.id.slice(-5).toUpperCase() : 'TEMP';
  const dateString = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();

  container.innerHTML = `
    <div style="font-family: monospace; max-width: 380px; margin: 0 auto; padding: 10px; color: #000; line-height: 1.4; font-size: 13px;">
      <div style="text-align: center; margin-bottom: 15px;">
        <span style="font-size: 24px;">🍽</span>
        <h2 style="font-size: 18px; margin: 5px 0; font-weight: bold; text-transform: uppercase;">Bespoke Dining Co.</h2>
        <p style="margin: 2px 0; font-size: 11px; color: #555;">Bespoke Dining Applet • Table ${data.tableNumber}</p>
        <p style="margin: 2px 0; font-size: 11px; color: #555;">Receipt ID: #${idString}</p>
      </div>

      <div style="border-bottom: 1px dashed #000; margin-bottom: 10px; padding-bottom: 5px;">
        <p style="margin: 3px 0; display: flex; justify-content: space-between;">
          <span>Date:</span> <span>${dateString}</span>
        </p>
        ${data.guestName ? `
        <p style="margin: 3px 0; display: flex; justify-content: space-between;">
          <span>Guest Name:</span> <span>${data.guestName}</span>
        </p>` : ''}
        ${data.guestCount ? `
        <p style="margin: 3px 0; display: flex; justify-content: space-between;">
          <span>Guests:</span> <span>${data.guestCount} pax</span>
        </p>` : ''}
      </div>

      <div style="border-bottom: 1px dashed #000; margin-bottom: 10px; padding-bottom: 5px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; font-size: 11px;">
          <span style="width: 50px;">QTY</span>
          <span style="flex-grow: 1; text-align: left;">ITEM</span>
          <span style="width: 100px; text-align: right;">PRICE</span>
        </div>
        ${data.items.map(item => {
          const price = item.price ?? item.priceAtOrder ?? 0;
          return `
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="width: 50px;">${item.quantity}x</span>
              <span style="flex-grow: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</span>
              <span style="width: 100px; text-align: right;">₹${(price * item.quantity).toFixed(2)}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div style="border-bottom: 1px dashed #000; margin: 10px 0; padding-bottom: 5px; text-align: right;">
        <div style="display: flex; justify-content: space-between; margin: 3px 0;">
          <span>Subtotal:</span> <span>₹${data.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 3px 0;">
          <span>Service Charge (10%):</span> <span>₹${data.serviceCharge.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 3px 0;">
          <span>VAT Taxes (8%):</span> <span>₹${data.tax.toFixed(2)}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin: 10px 0;">
        <span>TOTAL:</span> <span>₹${data.total.toFixed(2)}</span>
      </div>

      ${data.paymentMethod ? `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; border-top: 1px dotted #ccc; padding-top: 5px;">
        <span>Payment Method:</span>
        <span style="font-weight: bold; font-family: monospace;">
          ${data.paymentMethod === 'UPI' ? 'UPI 📱' : data.paymentMethod === 'Cash' ? 'CASH 💵' : 'CARD 💳'}
        </span>
      </div>` : ''}

      <div style="text-align: center; margin-top: 25px; border-top: 1px dashed #000; padding-top: 15px;">
        <p style="margin: 2px 0; font-size: 11px;">Thank you for dining with us!</p>
        <p style="margin: 2px 0; font-size: 10px; color: #555;">Please scan to pay or leave feedback</p>
        <div style="margin: 15px auto 5px; font-family: monospace; letter-spacing: 2px; font-size: 10px; background: #000; color: #fff; display: inline-block; padding: 4px 10px;">
          ||| | |||| | || ||| || ||
        </div>
        <p style="margin: 2px 0; font-size: 9px; color: #999;">Bespoke Core Systems</p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Trigger print queue instantly after allowing layout thread settling
  setTimeout(() => {
    window.print();
    // Safely remove helpers from document structure
    if (document.head.contains(style)) {
      document.head.removeChild(style);
    }
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }, 100);
}

/**
 * Downloads the receipt locally as a high quality PNG file
 */
export function downloadReceiptImage(data: ReceiptData): void {
  const canvas = generateReceiptCanvas(data);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `receipt_table_${data.tableNumber}_${data.id ? data.id.slice(-5) : Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Shares the receipt image using standard Web Share API if supported.
 * Returns true if sharing was supported and completed, false otherwise.
 */
export async function shareReceiptImage(data: ReceiptData): Promise<boolean> {
  try {
    const canvas = generateReceiptCanvas(data);
    const dataUrl = canvas.toDataURL('image/png');

    // Use native share methods on supports (e.g. smart mobile platforms)
    if (navigator.canShare && navigator.share) {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `receipt-table-${data.tableNumber}.png`, { type: 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Bespoke Table ${data.tableNumber} Receipt`,
          text: `Table ${data.tableNumber} settled with ₹${data.total.toFixed(2)} amount paid.`
        });
        return true;
      }
    }
  } catch (error) {
    console.warn('Native share failed or is disabled by user environment:', error);
  }
  return false;
}
