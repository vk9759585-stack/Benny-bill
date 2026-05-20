import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Share2 } from 'lucide-react';
import { ReceiptData, printReceipt, downloadReceiptImage, shareReceiptImage, generateReceiptCanvas } from '../utils/receipt';
import { motion } from 'motion/react';

interface ReceiptActionModalProps {
  data: ReceiptData;
  onClose: () => void;
}

export default function ReceiptActionModal({ data, onClose }: ReceiptActionModalProps) {
  const [imgUrl, setImgUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [nativeShared, setNativeShared] = useState(false);

  useEffect(() => {
    try {
      const canvas = generateReceiptCanvas(data);
      setImgUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('Error generating receipt preview image:', e);
    }
  }, [data]);

  const handlePrint = () => {
    printReceipt(data);
  };

  const handleDownload = () => {
    downloadReceiptImage(data);
  };

  const handleShare = async () => {
    const success = await shareReceiptImage(data);
    if (success) {
      setNativeShared(true);
      setTimeout(() => setNativeShared(false), 3000);
    } else {
      // Direct elegant copy summary to clipboard fallback
      try {
        const itemSummaries = data.items.map(i => `${i.quantity}x ${i.name}`).join('\n');
        const idString = data.id ? data.id.slice(-5).toUpperCase() : 'TEMP';
        const formattedText = `🍽 *BESPOKE DINING CO.*\n` +
                              `=======================\n` +
                              `Receipt ID: #${idString}\n` +
                              `Table: T${data.tableNumber}\n` +
                              (data.guestName ? `Guest: ${data.guestName}\n` : '') +
                              `-----------------------\n` +
                              `${itemSummaries}\n` +
                              `-----------------------\n` +
                              `Subtotal: ₹${data.subtotal.toFixed(2)}\n` +
                              `Charges: ₹${data.serviceCharge.toFixed(2)}\n` +
                              `Tax (8%): ₹${data.tax.toFixed(2)}\n` +
                              `*TOTAL: ₹${data.total.toFixed(2)}*\n` +
                              `=======================\n` +
                              `Thank you for dining with us! Sent via Bespoke Applet.`;
        
        let copySuccessful = false;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(formattedText);
            copySuccessful = true;
          }
        } catch (clipErr) {
          console.warn('Async clipboard API failed, attempting classic execution backup:', clipErr);
        }

        if (!copySuccessful) {
          try {
            const textArea = document.createElement('textarea');
            textArea.value = formattedText;
            textArea.style.position = 'fixed';
            textArea.style.top = '0px';
            textArea.style.left = '0px';
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            textArea.style.padding = '0px';
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            textArea.style.background = 'transparent';
            textArea.style.opacity = '0';
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            if (successful) {
              copySuccessful = true;
            }
            document.body.removeChild(textArea);
          } catch (fallbackErr) {
            console.error('Bespoke classic copy fallback failed:', fallbackErr);
          }
        }

        if (copySuccessful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } else {
          // If everything fails, log and let the user know
          console.error('All clipboard operations blocked by the platform/iframe sandbox restrictions.');
        }
      } catch (err) {
        console.error('Clipboard copy / formatting error:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Frosted heavy translucent glass backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs cursor-pointer"
      />
      
      {/* Primary panel container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header information */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between text-white bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-neutral-200">Receipt Action Hub</h3>
              <p className="text-[10px] text-neutral-500 font-medium font-mono">Invoice_T${data.tableNumber}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-450 hover:text-white transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable visual content area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center bg-neutral-950/10">
          {imgUrl ? (
            <div className="relative group rounded-xl overflow-hidden shadow-xl border border-neutral-800/80 bg-white max-w-[270px]">
              <img 
                src={imgUrl} 
                alt="Bespoke Invoice" 
                className="w-full h-auto object-contain select-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/5 transition duration-300 pointer-events-none" />
            </div>
          ) : (
            <div className="w-[270px] h-[350px] bg-neutral-950 rounded-2xl flex items-center justify-center border border-neutral-850 animate-pulse">
              <span className="text-xs text-neutral-550 font-bold uppercase tracking-wider">Engraving plate...</span>
            </div>
          )}
          <p className="text-[10px] text-neutral-450 mt-4 text-center px-3 font-medium leading-relaxed">
            💡 Pin/Download option saves directly to photos. You can also right-click or tap-and-hold the image to copy & share!
          </p>
        </div>

        {/* Actions grid columns */}
        <div className="p-4 bg-neutral-950/70 border-t border-neutral-800/80 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="h-10 px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-800"
          >
            <Printer size={13} className="text-orange-500" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="h-10 px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-800"
          >
            <Download size={13} className="text-emerald-500" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="col-span-2 h-11 px-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-950/20 active:scale-98"
          >
            <Share2 size={13} />
            <span>
              {nativeShared 
                ? 'Device Shared ✓' 
                : copied 
                  ? 'Text Bill Copied!' 
                  : 'Share/Copy Bill Text'}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
