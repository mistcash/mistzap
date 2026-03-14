"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateIndexedSecret, getNextIndex, getCurrentIndex } from "@/lib/secret";

interface Props {
  secretKey: string;
  onClose: () => void;
}

export default function QRCodeModal({ secretKey, onClose }: Props) {
  const [index, setIndex] = useState(() => getCurrentIndex());
  const [qrValue, setQrValue] = useState(() =>
    generateIndexedSecret(secretKey, getCurrentIndex())
  );

  const handleRefresh = () => {
    const newIndex = getNextIndex();
    setIndex(newIndex + 1);
    setQrValue(generateIndexedSecret(secretKey, newIndex + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Payment QR</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={qrValue} size={200} />
          </div>

          <p className="text-xs text-gray-400 font-mono break-all text-center">
            Index: {index}
          </p>
          <p className="text-xs text-gray-500 font-mono break-all text-center">
            {qrValue.slice(0, 20)}...{qrValue.slice(-8)}
          </p>

          <button
            onClick={handleRefresh}
            className="w-full py-2 rounded-xl bg-yellow-400/20 text-yellow-400 font-medium hover:bg-yellow-400/30 transition-colors"
          >
            Generate New Code
          </button>
        </div>
      </div>
    </div>
  );
}
