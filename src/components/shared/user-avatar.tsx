'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src: string;
  alt: string;
  fallbackSeed: string;
  className?: string;
}

export function UserAvatar({ src, alt, fallbackSeed, className = "" }: UserAvatarProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-slate-800 ${className}`}>
      {hasError ? (
        <User className="w-1/2 h-1/2 text-slate-400" />
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => {
            const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`;
            if (imgSrc !== dicebearUrl) {
              setImgSrc(dicebearUrl);
            } else {
              setHasError(true);
            }
          }}
        />
      )}
    </div>
  );
}
