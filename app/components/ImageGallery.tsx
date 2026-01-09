'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  category?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  aspectRatio?: 'square' | 'video' | 'landscape' | 'portrait';
  showLightbox?: boolean;
  enableCategories?: boolean;
}

/**
 * Main Image Gallery Component
 * Displays a grid of images with optional lightbox modal
 */
export function ImageGallery({
  images,
  columns = 3,
  aspectRatio = 'square',
  showLightbox = true,
  enableCategories = false,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  // Filter images by category if enabled
  const filteredImages =
    enableCategories && selectedCategory !== 'all'
      ? images.filter((img) => img.category === selectedCategory)
      : images;

  // Get unique categories
  const categories = enableCategories
    ? ['all', ...new Set(images.map((img) => img.category).filter(Boolean))]
    : [];

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'video':
        return 'aspect-video';
      case 'landscape':
        return 'aspect-[16/10]';
      case 'portrait':
        return 'aspect-[3/4]';
      case 'square':
      default:
        return 'aspect-square';
    }
  };

  const getGridClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case 3:
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div className="w-full">
      {/* Category Filter */}
      {enableCategories && categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      )}

      {/* Gallery Grid */}
      <div className={`grid ${getGridClass()} gap-4`}>
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-100"
          >
            <div className={`relative w-full ${getAspectRatioClass()}`}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Overlay on Hover */}
            {showLightbox && (
              <div
                onClick={() => setSelectedImage(image)}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-40"
              >
                <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            )}

            {/* Image Info */}
            {image.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white">
                <p className="font-semibold">{image.title}</p>
                {image.description && (
                  <p className="text-sm text-gray-300">{image.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {showLightbox && selectedImage && (
        <ImageLightbox
          image={selectedImage}
          allImages={filteredImages}
          onClose={() => setSelectedImage(null)}
          onNext={() => {
            const currentIndex = filteredImages.findIndex(
              (img) => img.id === selectedImage.id
            );
            if (currentIndex < filteredImages.length - 1) {
              setSelectedImage(filteredImages[currentIndex + 1]);
            }
          }}
          onPrev={() => {
            const currentIndex = filteredImages.findIndex(
              (img) => img.id === selectedImage.id
            );
            if (currentIndex > 0) {
              setSelectedImage(filteredImages[currentIndex - 1]);
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Lightbox Component
 * Full-screen image viewer with navigation
 */
interface ImageLightboxProps {
  image: GalleryImage;
  allImages: GalleryImage[];
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ImageLightbox({
  image,
  allImages,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  const currentIndex = allImages.findIndex((img) => img.id === image.id);
  const hasNext = currentIndex < allImages.length - 1;
  const hasPrev = currentIndex > 0;

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full p-2 bg-white/20 hover:bg-white/30 transition text-white"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Main Image */}
      <div className="relative h-[80vh] w-[90vw] max-w-6xl">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation Buttons */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-3 bg-white/20 hover:bg-white/30 transition text-white"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-3 bg-white/20 hover:bg-white/30 transition text-white"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image Info */}
      <div className="absolute bottom-6 left-6 right-6 text-white">
        {image.title && <p className="text-lg font-semibold">{image.title}</p>}
        {image.description && (
          <p className="text-sm text-gray-300 mt-2">{image.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          {currentIndex + 1} / {allImages.length}
        </p>
      </div>
    </div>
  );
}

/**
 * Masonry Gallery Component
 * Pinterest-style layout for varied image sizes
 */
interface MasonryGalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  showLightbox?: boolean;
}

export function MasonryGallery({
  images,
  columns = 3,
  showLightbox = true,
}: MasonryGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const getColumnClass = () => {
    switch (columns) {
      case 2:
        return 'md:columns-2';
      case 4:
        return 'md:columns-3 lg:columns-4';
      case 3:
      default:
        return 'md:columns-2 lg:columns-3';
    }
  };

  return (
    <div>
      <div className={`columns-1 ${getColumnClass()} gap-4`}>
        {images.map((image) => (
          <div
            key={image.id}
            className="mb-4 break-inside-avoid cursor-pointer group overflow-hidden rounded-lg"
            onClick={() => showLightbox && setSelectedImage(image)}
          >
            <div className="relative overflow-hidden bg-gray-100">
              <Image
                src={image.src}
                alt={image.alt}
                width={400}
                height={300}
                className="w-full transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 transition-all group-hover:bg-opacity-40 flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            {image.title && (
              <div className="p-3 bg-white">
                <p className="font-semibold text-sm">{image.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {showLightbox && selectedImage && (
        <ImageLightbox
          image={selectedImage}
          allImages={images}
          onClose={() => setSelectedImage(null)}
          onNext={() => {
            const currentIndex = images.findIndex(
              (img) => img.id === selectedImage.id
            );
            if (currentIndex < images.length - 1) {
              setSelectedImage(images[currentIndex + 1]);
            }
          }}
          onPrev={() => {
            const currentIndex = images.findIndex(
              (img) => img.id === selectedImage.id
            );
            if (currentIndex > 0) {
              setSelectedImage(images[currentIndex - 1]);
            }
          }}
        />
      )}
    </div>
  );
}
