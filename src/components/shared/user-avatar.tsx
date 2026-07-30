'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function UserAvatar({ src, alt = "Avatar", className = "" }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const showImage = Boolean(src && !hasError);

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-slate-800 text-slate-400 shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <User className="w-1/2 h-1/2 text-slate-400" />
      )}
    </div>
  );
}

