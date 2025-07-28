'use client';
import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

export function InfoTooltip({ info }: { info: string }) {
  const [show, setShow] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const touch = window.matchMedia('(pointer: coarse)').matches;
    setIsTouch(touch);
  }, []);

  return (
    <div className="relative inline-block">
      {isTouch ? (
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="focus:outline-none"
        >
          <Info className="w-4 h-4 text-gray-400" />
        </button>
      ) : (
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400" />
          <div className="absolute z-10 bottom-full mb-1 hidden group-hover:block bg-gray-700 text-white text-xs rounded p-1 max-w-xs">
            {info}
          </div>
        </div>
      )}

      {isTouch && show && (
        <div className="absolute z-10 bottom-full mb-1 bg-gray-700 text-white text-xs rounded p-1 max-w-xs">
          {info}
        </div>
      )}
    </div>
  );
}
