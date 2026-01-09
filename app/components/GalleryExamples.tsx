import React from 'react';
import { ImageGallery, MasonryGallery } from '@/app/components/ImageGallery';

/**
 * Example implementations of ImageGallery component
 */

// Sample gallery data (maps, property photos, parcel visualizations)
const SAMPLE_IMAGES = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800',
    alt: 'Mountain landscape',
    title: 'San Miguel County Overview',
    description: 'Aerial view of the county',
    category: 'Maps',
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&h=800',
    alt: 'Valley view',
    title: 'Telluride Valley',
    description: 'Downtown area',
    category: 'Maps',
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800',
    alt: 'Property 1',
    title: 'Residential Parcel',
    description: 'Mountain property',
    category: 'Properties',
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&h=800',
    alt: 'Property 2',
    title: 'Commercial Zone',
    description: 'Downtown location',
    category: 'Properties',
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800',
    alt: 'Property 3',
    title: 'Agricultural Land',
    description: 'Rural acreage',
    category: 'Properties',
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&h=800',
    alt: 'Parcel map',
    title: 'Zoning Map',
    description: 'District boundaries',
    category: 'Maps',
  },
];

/**
 * Basic Grid Gallery
 */
export function BasicGalleryExample() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Property Gallery</h1>
      <p className="text-gray-600 mb-8">
        Browse property images and maps with lightbox zoom feature
      </p>
      <ImageGallery
        images={SAMPLE_IMAGES}
        columns={3}
        aspectRatio="square"
        showLightbox={true}
      />
    </div>
  );
}

/**
 * Gallery with Categories
 */
export function CategorizedGalleryExample() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">San Miguel County Resources</h1>
      <p className="text-gray-600 mb-8">
        Filter between maps and property photos
      </p>
      <ImageGallery
        images={SAMPLE_IMAGES}
        columns={3}
        aspectRatio="square"
        showLightbox={true}
        enableCategories={true}
      />
    </div>
  );
}

/**
 * Wide Aspect Ratio Gallery (16:9 video ratio)
 */
export function WideGalleryExample() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Map Collection</h1>
      <p className="text-gray-600 mb-8">Wide-format maps and aerial views</p>
      <ImageGallery
        images={SAMPLE_IMAGES}
        columns={2}
        aspectRatio="video"
        showLightbox={true}
      />
    </div>
  );
}

/**
 * Masonry (Pinterest-style) Gallery
 */
export function MasonryGalleryExample() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Masonry Gallery</h1>
      <p className="text-gray-600 mb-8">
        Dynamic layout for varied image sizes
      </p>
      <MasonryGallery images={SAMPLE_IMAGES} columns={3} showLightbox={true} />
    </div>
  );
}

/**
 * Parcel Visualization Gallery
 * For showing before/after parcel maps or property comparisons
 */
export function ParcelVisualizationGallery() {
  const parcelImages = [
    {
      id: 'parcel-1',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800',
      alt: 'Parcel 1234-0000-12345',
      title: 'Parcel ID: 1234-0000-12345',
      description: '0.45 acres | Residential | Owner: John Doe',
      category: 'Active',
    },
    {
      id: 'parcel-2',
      src: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&h=800',
      alt: 'Parcel 1234-0000-12346',
      title: 'Parcel ID: 1234-0000-12346',
      description: '1.2 acres | Commercial | Owner: Jane Smith',
      category: 'Active',
    },
    {
      id: 'parcel-3',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800',
      alt: 'Parcel 1234-0000-12347',
      title: 'Parcel ID: 1234-0000-12347',
      description: '5.8 acres | Agricultural | Owner: County',
      category: 'Pending',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Parcel Visualizations</h1>
      <p className="text-gray-600 mb-8">
        View parcel boundaries and property details
      </p>
      <ImageGallery
        images={parcelImages}
        columns={3}
        aspectRatio="square"
        showLightbox={true}
        enableCategories={true}
      />
    </div>
  );
}

/**
 * Demo Page with Multiple Gallery Styles
 */
export function DemoGalleryPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Basic Grid */}
      <section className="border-b border-gray-200">
        <BasicGalleryExample />
      </section>

      {/* Categorized */}
      <section className="border-b border-gray-200 bg-white">
        <CategorizedGalleryExample />
      </section>

      {/* Wide Format */}
      <section className="border-b border-gray-200">
        <WideGalleryExample />
      </section>

      {/* Masonry */}
      <section className="border-b border-gray-200 bg-white">
        <MasonryGalleryExample />
      </section>

      {/* Parcel Visualization */}
      <section>
        <ParcelVisualizationGallery />
      </section>
    </main>
  );
}

/**
 * Gallery with Dynamic Image Loading
 * Example of fetching images from API
 */
export function DynamicGalleryExample() {
  const [images, setImages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Example: Fetch from API
    // const fetchImages = async () => {
    //   const response = await fetch('/api/gallery/images');
    //   const data = await response.json();
    //   setImages(data);
    //   setLoading(false);
    // };
    // fetchImages();

    // For demo purposes, use sample images
    setImages(SAMPLE_IMAGES);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Gallery</h1>
      <ImageGallery
        images={images}
        columns={3}
        aspectRatio="square"
        showLightbox={true}
      />
    </div>
  );
}

/**
 * Using with Branded Reports
 * Gallery of report exports/previews
 */
export function ReportGalleryExample() {
  const reportImages = [
    {
      id: 'report-1',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800',
      alt: 'Q1 Report',
      title: 'Q1 2026 Property Report',
      description: 'Parcel analysis and zoning review',
      category: 'Reports',
    },
    {
      id: 'report-2',
      src: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&h=800',
      alt: 'Map Export',
      title: 'Zoning District Map',
      description: 'Full county zoning boundaries',
      category: 'Maps',
    },
    {
      id: 'report-3',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800',
      alt: 'Analysis',
      title: 'Demographic Analysis',
      description: 'Population and land use trends',
      category: 'Reports',
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Branded Report Gallery</h1>
      <p className="text-gray-600 mb-8">
        Previous reports and exported maps from your workspace
      </p>
      <ImageGallery
        images={reportImages}
        columns={3}
        aspectRatio="video"
        showLightbox={true}
        enableCategories={true}
      />
    </div>
  );
}
