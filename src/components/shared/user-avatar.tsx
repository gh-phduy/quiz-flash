'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  src: string;
  alt: string;
  fallbackSeed: string;
  className?: string;
}

export function UserAvatar({ src, alt, fallbackSeed, className = "" }: UserAvatarProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 40px, 56px"
        referrerPolicy="no-referrer"
        className="object-cover"
        onError={() => {
          // If the primary image fails, fallback to dicebear
          setImgSrc(`https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`);
        }}
      />
    </div>
  );
}
