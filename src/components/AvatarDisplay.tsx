import React, { useState } from 'react';

interface AvatarDisplayProps {
  avatarUrl?: string;
  logoUrl?: string;
  name: string;
  className?: string;
  primaryColor?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarUrl,
  logoUrl,
  name,
  className = 'w-12 h-12 text-sm',
  primaryColor = '#1e40af',
}) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = avatarUrl || logoUrl;

  // Generate Initials from name (e.g. "Sarah Chen" -> "SC")
  const getInitials = (fullName: string) => {
    if (!fullName) return 'ID';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'ID';
  };

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${className} object-cover bg-slate-950`}
        onError={() => setImageError(true)}
      />
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className={`${className} flex items-center justify-center font-extrabold text-white uppercase tracking-wider select-none shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${primaryColor || '#1e40af'} 0%, #0f172a 100%)`,
      }}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
};
