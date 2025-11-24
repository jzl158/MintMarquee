import { Product } from './types/product';

/**
 * Mock product data demonstrating all three scenarios:
 * - Scenario A: Physical 3D printed products
 * - Scenario B: Digital download files
 * - Scenario C: Custom printing service
 * - Photo gallery items
 */

const mockProducts: Product[] = [
  // Scenario A: Physical 3D Printed Product
  {
    id: '1',
    name: 'Dragon Miniature',
    description: 'Highly detailed dragon figure, 3D printed in premium PLA',
    price: 35.00,
    type: 'physical',
    model: {
      format: 'stl',
      path: '/models/1/dragon.stl',
      thumbnailPath: '/models/1/thumbnail.jpg',
    },
    shipping: {
      enabled: true,
      weight: 45,
      dimensions: { length: 80, width: 60, height: 90 },
      shippingCost: 5.99,
      estimatedDays: '3-5 business days',
    },
    inStock: true,
    stockQuantity: 25,
    images: ['/images/products/dragon-1.jpg', '/images/products/dragon-2.jpg'],
    thumbnails: {
      small: '/models/1/thumbnail@s.jpg',
      medium: '/models/1/thumbnail@m.jpg',
      large: '/models/1/thumbnail@l.jpg',
    },
    tags: ['miniature', 'fantasy', 'dragon'],
    category: 'Miniatures',
    featured: true,
  },

  // Scenario B: Digital Download
  {
    id: '2',
    name: 'Geometric Vase STL File',
    description: 'Modern geometric vase design - Digital file for personal 3D printing',
    price: 8.99,
    type: 'digital',
    model: {
      format: 'stl',
      path: '/models/2/vase.stl',
      size: 2400000, // ~2.4MB
      thumbnailPath: '/models/2/thumbnail.jpg',
    },
    downloadFiles: [
      {
        format: 'stl',
        path: '/models/2/vase.stl',
        size: 2400000,
        downloadLimit: 5,
      },
      {
        format: 'obj',
        path: '/models/2/vase.obj',
        size: 1800000,
        downloadLimit: 5,
      },
    ],
    licenseType: 'personal',
    images: ['/images/products/vase-1.jpg', '/images/products/vase-2.jpg'],
    thumbnails: {
      small: '/models/2/thumbnail@s.jpg',
      medium: '/models/2/thumbnail@m.jpg',
      large: '/models/2/thumbnail@l.jpg',
    },
    tags: ['vase', 'home-decor', 'geometric'],
    category: 'Home Decor',
  },

  // Scenario B: Digital Download (Commercial License)
  {
    id: '3',
    name: 'Articulated Dragon - Commercial License',
    description: 'Print-in-place articulated dragon with commercial license',
    price: 24.99,
    type: 'digital',
    model: {
      format: 'stl',
      path: '/models/3/articulated-dragon.stl',
      size: 8500000,
      thumbnailPath: '/models/3/thumbnail.jpg',
    },
    downloadFiles: [
      {
        format: 'stl',
        path: '/models/3/articulated-dragon.stl',
        size: 8500000,
        downloadLimit: 10,
      },
      {
        format: '3mf',
        path: '/models/3/articulated-dragon.3mf',
        size: 7200000,
        downloadLimit: 10,
      },
    ],
    licenseType: 'commercial',
    images: ['/images/products/articulated-dragon-1.jpg'],
    thumbnails: {
      small: '/models/3/thumbnail@s.jpg',
      medium: '/models/3/thumbnail@m.jpg',
      large: '/models/3/thumbnail@l.jpg',
    },
    tags: ['dragon', 'articulated', 'print-in-place'],
    category: 'Toys & Games',
    featured: true,
  },

  // Scenario C: Custom Printing Service
  {
    id: '4',
    name: 'Custom 3D Printing Service',
    description: 'Upload your own 3D model and we\'ll print it for you in your choice of material',
    price: 15.00, // Base price
    type: 'custom',
    customSpecs: {
      acceptsCustomFiles: true,
      basePrice: 15.00,
      materials: ['PLA', 'ABS', 'PETG', 'Resin'],
      maxFileSize: 100, // 100MB
      allowedFormats: ['stl', 'obj', '3mf', 'gltf'],
      pricingNotes: 'Final price calculated based on model size, material, and complexity',
    },
    shipping: {
      enabled: true,
      estimatedDays: '5-7 business days',
    },
    images: ['/images/products/custom-service.jpg'],
    thumbnails: {
      small: '/images/products/custom@s.jpg',
      medium: '/images/products/custom@m.jpg',
      large: '/images/products/custom@l.jpg',
    },
    tags: ['custom', 'service'],
    category: 'Services',
  },

  // Photo Gallery Item (no 3D model)
  {
    id: '5',
    name: 'Hand-Painted Miniature Set',
    description: 'Set of 5 hand-painted fantasy character miniatures',
    price: 125.00,
    type: 'gallery',
    shipping: {
      enabled: true,
      weight: 150,
      shippingCost: 8.99,
      estimatedDays: '3-5 business days',
    },
    inStock: true,
    stockQuantity: 3,
    images: [
      '/images/products/painted-set-1.jpg',
      '/images/products/painted-set-2.jpg',
      '/images/products/painted-set-3.jpg',
      '/images/products/painted-set-4.jpg',
    ],
    thumbnails: {
      small: '/images/products/painted-set@s.jpg',
      medium: '/images/products/painted-set@m.jpg',
      large: '/images/products/painted-set@l.jpg',
    },
    tags: ['painted', 'miniatures', 'fantasy', 'set'],
    category: 'Miniatures',
  },

  // Another Physical Product
  {
    id: '6',
    name: 'Octopus Sculpture',
    description: 'Detailed octopus sculpture, perfect for desks and shelves',
    price: 28.00,
    type: 'physical',
    model: {
      format: 'obj',
      path: '/models/6/octopus.obj',
      thumbnailPath: '/models/6/thumbnail.jpg',
    },
    shipping: {
      enabled: true,
      weight: 65,
      dimensions: { length: 100, width: 100, height: 70 },
      shippingCost: 5.99,
      estimatedDays: '3-5 business days',
    },
    inStock: true,
    stockQuantity: 15,
    images: ['/images/products/octopus-1.jpg', '/images/products/octopus-2.jpg'],
    thumbnails: {
      small: '/models/6/thumbnail@s.jpg',
      medium: '/models/6/thumbnail@m.jpg',
      large: '/models/6/thumbnail@l.jpg',
    },
    tags: ['sculpture', 'octopus', 'marine'],
    category: 'Sculptures',
  },
];

export default mockProducts;
