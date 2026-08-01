import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  Building2,
  MapPin,
  Tag,
  Palette,
  ArrowRight,
  ShieldCheck,
  Zap,
  Eye,
  Sliders,
  Layers,
  X,
  SwitchCamera,
  Check,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  RotateCw,
  FlipHorizontal
} from 'lucide-react';
import { OCRResult, CardProfile } from '../types.js';
import { generateClientFallbackOCR, extractCardDataWithClientOCR } from '../lib/ocrFallback.js';
import { saveCardGlobally, getShareableCardUrls } from '../lib/globalSync.js';
import { MapLocationDisplay } from './MapLocationDisplay.js';
import { BANNER_PRESETS, getBannerForCategory } from '../lib/bannerPresets.js';

interface VisitingCardScannerProps {
  onCardCreated: (newCard: CardProfile) => void;
  onNavigateToCard: (slug: string) => void;
}

const SAMPLE_CARDS = [
  {
    id: 'sample-1',
    name: 'Arun Shaw - Tech Director',
    company: 'Apex Digital Solutions',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    category: 'IT Services & Software'
  },
  {
    id: 'sample-2',
    name: 'Sarah Chen - Brand Architect',
    company: 'Lumina Creative Studio',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    category: 'Design & Branding'
  },
  {
    id: 'sample-3',
    name: 'Marcus Vance - Estate Advisor',
    company: 'Vance Luxury Estates',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    category: 'Real Estate & Properties'
  }
];

export const VisitingCardScanner: React.FC<VisitingCardScannerProps> = ({
  onCardCreated,
  onNavigateToCard,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_CARDS[0].url);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Camera Stream state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state derived from OCR
  const [formData, setFormData] = useState<Partial<CardProfile>>({
    name: '',
    title: '',
    company: '',
    tagline: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    businessCategory: 'IT Services & Software',
    primaryColor: '#1e40af',
    themeStyle: 'executive',
    slug: '',
  });

  const [isPublishing, setIsPublishing] = useState(false);

  // Clean up media stream when component unmounts or modal closes
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleStartCamera = async (deviceId?: string) => {
    setCameraError(null);
    setIsCameraStarting(true);
    setIsCameraOpen(true);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser environment.');
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Enumerate camera devices for switching
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevices = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(vDevices);

      if (!deviceId && vDevices.length > 0) {
        const currentTrack = stream.getVideoTracks()[0];
        const currentSettings = currentTrack?.getSettings();
        if (currentSettings?.deviceId) {
          setSelectedDeviceId(currentSettings.deviceId);
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.message || 'Unable to access camera.'
      );
    } finally {
      setIsCameraStarting(false);
    }
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // Helper function to compress and resize image to avoid sending oversized base64 to Gemini API
  const compressImage = (base64Str: string, maxWidth = 1200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  };

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const maxDim = 1200;

    let targetWidth = vw;
    let targetHeight = vh;
    if (vw > maxDim) {
      targetHeight = Math.round((vh * maxDim) / vw);
      targetWidth = maxDim;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const snapshotBase64 = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(snapshotBase64);
      setOcrResult(null);
      handleCloseCamera();
      // Auto run OCR on captured image
      runOCR(snapshotBase64);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        const compressedBase64 = await compressImage(rawBase64, 1200);
        setSelectedImage(compressedBase64);
        setOcrResult(null);
        // Auto run OCR on uploaded image/camera capture
        runOCR(compressedBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotateImage = () => {
    if (!selectedImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        const rotated = canvas.toDataURL('image/jpeg', 0.88);
        setSelectedImage(rotated);
        setOcrResult(null);
        runOCR(rotated);
      }
    };
    img.src = selectedImage;
  };

  const handleFlipImage = () => {
    if (!selectedImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
        const flipped = canvas.toDataURL('image/jpeg', 0.88);
        setSelectedImage(flipped);
        setOcrResult(null);
        runOCR(flipped);
      }
    };
    img.src = selectedImage;
  };

  const runOCR = async (imageSrcToUse?: string) => {
    const src = imageSrcToUse || selectedImage;
    if (!src) {
      setErrorMsg('Please upload or capture a visiting card image first.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      const compressedSrc = await compressImage(src, 1200);
      let result: OCRResult;

      try {
        const response = await fetch('/api/cards/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: compressedSrc,
            mimeType: 'image/jpeg'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && !data.error) {
            result = data;
          } else {
            console.warn('Backend returned error payload, running fallback client OCR engine');
            result = await extractCardDataWithClientOCR(compressedSrc);
          }
        } else {
          console.warn('Backend OCR endpoint non-200, running fallback client OCR engine');
          result = await extractCardDataWithClientOCR(compressedSrc);
        }
      } catch (fetchErr) {
        console.warn('Network call to OCR endpoint failed, running client fallback OCR engine', fetchErr);
        result = await extractCardDataWithClientOCR(compressedSrc);
      }

      setOcrResult(result);

      // Pre-fill editable form with extracted details
      setFormData({
        name: result.name || '',
        title: result.title || '',
        company: result.company || '',
        tagline: result.tagline || '',
        email: result.email || '',
        phone: result.phone || '',
        whatsapp: result.whatsapp || result.phone || '',
        website: result.website || '',
        address: result.address || '',
        businessCategory: result.businessCategory || 'IT Services & Software',
        bannerUrl: getBannerForCategory(result.businessCategory || 'IT Services & Software', result.title),
        primaryColor: result.primaryColor || '#1e40af',
        themeStyle: 'executive',
        slug: result.suggestedSlug || (result.name ? result.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'profile'),
        socialLinks: result.socialLinks || {},
        cardImageUrl: src,
      });
    } catch (err: any) {
      console.error('OCR Process Error:', err);
      const fallbackResult = await extractCardDataWithClientOCR(src);
      setOcrResult(fallbackResult);
      setFormData({
        name: fallbackResult.name,
        title: fallbackResult.title,
        company: fallbackResult.company,
        tagline: fallbackResult.tagline,
        email: fallbackResult.email,
        phone: fallbackResult.phone,
        whatsapp: fallbackResult.whatsapp,
        website: fallbackResult.website,
        address: fallbackResult.address,
        businessCategory: fallbackResult.businessCategory,
        bannerUrl: getBannerForCategory(fallbackResult.businessCategory, fallbackResult.title),
        primaryColor: fallbackResult.primaryColor,
        themeStyle: 'executive',
        slug: fallbackResult.suggestedSlug,
        socialLinks: fallbackResult.socialLinks,
        cardImageUrl: src,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMsg(null);
    try {
      const newCardPayload = {
        ...formData,
        id: 'card-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        cardImageUrl: selectedImage || '',
        confidenceScores: ocrResult?.confidenceScores || { overall: 96, name: 98, email: 96, phone: 97, company: 97, website: 92, address: 92 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: { views: 0, leadsCaptured: 0, vcardDownloads: 0, qrScans: 0 },
      };

      // Save globally across Express API, Cloud KV, and LocalStorage
      const createdCard = await saveCardGlobally(newCardPayload as CardProfile);

      onCardCreated(createdCard);

      // Generate universal share URL with embedded fallback payload
      const { universalUrl } = getShareableCardUrls(createdCard);
      console.log('Published Universal Card URL:', universalUrl);

      onNavigateToCard(createdCard.slug);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error publishing profile');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSendWhatsAppMessage = (phoneNum?: string) => {
    const targetPhone = (phoneNum || formData.phone || '').replace(/[^0-9]/g, '');
    const landingUrl = `${window.location.origin}/card/${formData.slug || 'profile'}`;
    const name = formData.name || 'Cardholder';
    const message = `Hello ${name}! Your digital business card page is ready live.\n\n🌐 View & share your landing page here:\n${landingUrl}\n\nCreated with AI Digital Identity Card.`;

    const encodedMsg = encodeURIComponent(message);
    const waUrl = targetPhone && targetPhone.length >= 7
      ? `https://wa.me/${targetPhone}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multi-Modal OCR & Entity Extraction</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Scan Physical Card into <span className="text-blue-400">Digital Identity</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Capture or upload a visiting card. Our server-side Gemini AI extracts contact info, company details, logos, social links, brand colors, and generates a live SEO profile page at <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded">/card/your-slug</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Upload & OCR Trigger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-xl">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-400" />
              <span>1. Capture Visiting Card</span>
            </h2>

            {/* Hidden Camera Input for Native Mobile Camera App */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Quick Capture Options Bar */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleStartCamera()}
                className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
              >
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Live Webcam Stream</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
              >
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Mobile Camera App</span>
              </button>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/60 hover:bg-slate-900 rounded-xl p-6 text-center cursor-pointer transition-all group relative overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {selectedImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 aspect-[16/10]">
                    <img
                      src={selectedImage}
                      alt="Visiting Card Preview"
                      className="w-full h-full object-contain bg-black"
                    />
                    {/* Scan Laser effect when scanning */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-3">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse shadow-lg shadow-blue-500" />
                        <div className="px-3 py-1 bg-slate-900/90 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30 flex items-center space-x-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini OCR Reading Card...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Orientation Tools */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <span className="text-slate-400 text-[11px]">Card orientation incorrect?</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotateImage();
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center space-x-1 transition-all"
                        title="Rotate image 90 degrees"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                        <span>Rotate 90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlipImage();
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center space-x-1 transition-all"
                        title="Flip image horizontally (mirror fix)"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Flip Mirror</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 group-hover:bg-blue-600/20 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-all">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Click to upload or drag visiting card photo</p>
                    <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, WebP up to 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sample Cards Selector */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Or pick a test sample card:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_CARDS.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      setSelectedImage(card.url);
                      setOcrResult(null);
                    }}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      selectedImage === card.url
                        ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-[11px] truncate">{card.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{card.company}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Action Button */}
            <button
              onClick={() => runOCR()}
              disabled={isScanning || !selectedImage}
              className="w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Extracting Contact Entities...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Extract Contact Info with AI OCR</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* OCR Confidence Inspector Card */}
          {ocrResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm">AI OCR Confidence Breakdown</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Overall: {ocrResult.confidenceScores.overall}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(ocrResult.confidenceScores)
                  .filter(([k]) => k !== 'overall')
                  .map(([field, score]) => (
                    <div key={field} className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="capitalize text-slate-400">{field}:</span>
                      <span className={`font-semibold ${Number(score) > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {String(score)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Editable Profile Form & Live Setup */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  <span>2. Validate & Custom-Branding</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review extracted card details, assign custom slug, and choose color scheme.
                </p>
              </div>
              {ocrResult && (
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Auto-Filled by Gemini</span>
                </span>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Arun Shaw"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Job Title / Role</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Founder & MD"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Organization</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Apex Digital"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Business Category</label>
                <select
                  value={formData.businessCategory || 'IT Services & Software'}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      businessCategory: newCat,
                      bannerUrl: getBannerForCategory(newCat, prev.title),
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="IT Services & Software">IT Services & Software</option>
                  <option value="Design & Branding">Design & Branding</option>
                  <option value="Real Estate & Properties">Real Estate & Properties</option>
                  <option value="Legal & Advisory">Legal & Advisory</option>
                  <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                  <option value="Retail & Artisanal">Retail & Artisanal</option>
                  <option value="Finance & Venture Capital">Finance & Venture Capital</option>
                  <option value="Marketing & Advertising">Marketing & Advertising</option>
                  <option value="Education & Training">Education & Training</option>
                  <option value="Food, Dining & Hospitality">Food, Dining & Hospitality</option>
                  <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="arun@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-400">Phone / WhatsApp</label>
                  {formData.phone && (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppMessage()}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                      title="Send WhatsApp message"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Send WhatsApp</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Website URL</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://apexdigital.in"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-400">Address / Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Suite 402, Cyber Tower, HiTech City, Hyderabad"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {formData.address && formData.address.trim().length > 3 && (
                  <div className="pt-2">
                    <MapLocationDisplay
                      address={formData.address}
                      company={formData.company}
                      title="Extracted Card Address Map Location"
                      compact={true}
                    />
                  </div>
                )}
              </div>

              {/* Custom Slug & URL Preview */}
              <div className="sm:col-span-2 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-blue-400">SEO Custom Public Slug</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-mono">/card/</span>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                      })
                    }
                    placeholder="arun-shaw"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Your live profile will be accessible at: <span className="text-blue-300 font-mono">/card/{formData.slug || 'slug'}</span>
                </p>
              </div>

              {/* Branding Theme & Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Brand Accent</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.primaryColor || '#1e40af'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent border border-slate-700 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-300">{formData.primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Theme Layout Style</label>
                <select
                  value={formData.themeStyle || 'executive'}
                  onChange={(e) => setFormData({ ...formData, themeStyle: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="executive">Executive Classic</option>
                  <option value="creative">Creative Emerald</option>
                  <option value="luxury">Luxury Violet</option>
                  <option value="minimal">Minimal Slate</option>
                </select>
              </div>

              {/* Cover Banner Selection */}
              <div className="sm:col-span-2 space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-blue-400 flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Profile Header Cover Background (Service-Based)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Auto-matches category or select custom</span>
                </div>

                {/* Preset Banner Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BANNER_PRESETS.map((preset) => {
                    const isSelected = (formData.bannerUrl || getBannerForCategory(formData.businessCategory, formData.title)) === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerUrl: preset.url })}
                        className={`group relative h-20 rounded-xl overflow-hidden border text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/30'
                            : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 group-hover:bg-slate-950/40 transition-colors" />
                        <div className="absolute inset-0 p-2 flex flex-col justify-between">
                          <span className="text-[10px] font-extrabold text-white leading-tight drop-shadow-md">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="self-end bg-blue-600 text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Banner URL option */}
                <div className="relative pt-1">
                  <input
                    type="url"
                    value={formData.bannerUrl || ''}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    placeholder="Or paste custom background image URL (e.g. https://images.unsplash.com/...)"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Action Publish & WhatsApp Share Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSendWhatsAppMessage()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Send WhatsApp Notification</span>
              </button>

              <button
                onClick={handlePublish}
                disabled={isPublishing || !formData.name}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Publishing & Generating Bio...</span>
                  </>
                ) : (
                  <>
                    <span>Publish Digital Identity Page</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Camera Stream Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Live Camera Scanner</h3>
                  <p className="text-xs text-slate-400">Position the visiting card inside the box</p>
                </div>
              </div>

              <button
                onClick={handleCloseCamera}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport / Error Display */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] max-h-[500px] overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center space-y-4 max-w-md">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Camera Unavailable</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                  </div>
                  <button
                    onClick={() => handleStartCamera(selectedDeviceId)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    Retry Camera Access
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Card Viewfinder Outline Overlay */}
                  <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-blue-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-4 bg-blue-500/5">
                    <div className="flex justify-between text-blue-400 text-xs font-mono">
                      <span>┌ TOP LEFT</span>
                      <span>TOP RIGHT ┐</span>
                    </div>
                    <div className="text-center text-xs font-semibold text-white/80 bg-slate-900/80 backdrop-blur-sm py-1 px-3 rounded-full self-center border border-slate-700/80">
                      Center Card inside frame
                    </div>
                    <div className="flex justify-between text-blue-400 text-xs font-mono">
                      <span>└ BTM LEFT</span>
                      <span>BTM RIGHT ┘</span>
                    </div>
                  </div>

                  {isCameraStarting && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                      <span className="text-xs text-slate-300 font-semibold">Initializing Video Stream...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Controls Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Device Selector */}
              {videoDevices.length > 1 ? (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <SwitchCamera className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      handleStartCamera(e.target.value);
                    }}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
                  >
                    {videoDevices.map((device, idx) => (
                      <option key={device.deviceId || idx} value={device.deviceId}>
                        {device.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Desktop / Mobile Camera Active</span>
                </div>
              )}

              {/* Shutter Capture Button */}
              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCloseCamera}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCaptureSnapshot}
                  disabled={!!cameraError || isCameraStarting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo & Scan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
