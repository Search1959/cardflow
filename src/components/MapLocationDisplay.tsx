import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Copy, Check, Compass, Building2 } from 'lucide-react';

interface MapLocationDisplayProps {
  address: string;
  company?: string;
  title?: string;
  className?: string;
  compact?: boolean;
}

export const MapLocationDisplay: React.FC<MapLocationDisplayProps> = ({
  address,
  company,
  title = 'Office Location & Directions',
  className = '',
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  if (!address || address.trim() === '') {
    return null;
  }

  const cleanAddress = address.trim();
  const encodedAddress = encodeURIComponent(cleanAddress);
  const embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const googleMapsUrl = `https://maps.google.com/?q=${encodedAddress}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodedAddress}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(cleanAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center space-x-2">
              <span>{title}</span>
            </h3>
            {company && (
              <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                <Building2 className="w-3 h-3 text-blue-400" />
                <span>{company}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopyAddress}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Copy address text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Directions</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>

      {/* Address Text Box */}
      <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
        <Compass className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-slate-200 leading-relaxed font-medium">{cleanAddress}</p>
      </div>

      {/* Embedded Google Map iframe */}
      <div className={`w-full ${compact ? 'h-52' : 'h-64 sm:h-72'} rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative group`}>
        {isIframeLoading && (
          <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading Google Maps location...</p>
          </div>
        )}

        <iframe
          title={`Map for ${cleanAddress}`}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
          onLoad={() => setIsIframeLoading(false)}
          className="w-full h-full rounded-2xl"
        />

        {/* Overlay map badge link */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center space-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 text-[10px] font-bold text-slate-300 hover:text-white rounded-lg shadow-md backdrop-blur-md transition-all"
          >
            Apple Maps
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 text-[10px] font-bold text-blue-400 hover:text-blue-300 rounded-lg shadow-md backdrop-blur-md transition-all flex items-center space-x-1"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
