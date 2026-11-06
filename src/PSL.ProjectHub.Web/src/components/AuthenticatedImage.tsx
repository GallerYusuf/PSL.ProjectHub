import React, { useEffect, useState } from "react";

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackIcon?: React.ReactNode;
}

/**
 * JWT korumalı görselleri yükleyen resim bileşeni.
 * Tarayıcı img etiketleri Authorization başlığı gönderemediğinden görseli
 * Bearer token ile fetch eder ve blob URL olarak gösterir.
 */
export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  alt,
  fallbackIcon,
  style,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let createdBlobUrl: string | null = null;

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const token = localStorage.getItem("psl_token");
        const response = await fetch(src, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (isMounted) {
          createdBlobUrl = URL.createObjectURL(blob);
          setImageSrc(createdBlobUrl);
        }
      } catch {
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [src]);

  if (hasError && fallbackIcon) {
    return <>{fallbackIcon}</>;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      style={{
        ...style,
        opacity: isLoading ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};
