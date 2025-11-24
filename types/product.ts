/**
 * Product types for the 3D printing e-commerce platform
 * Supports: Physical products, Digital downloads, Custom orders, and Photo gallery
 */

export type ModelFormat = 'stl' | 'obj' | '3mf' | 'gltf' | 'glb';
export type ProductType = 'physical' | 'digital' | 'custom' | 'gallery';
export type LicenseType = 'personal' | 'commercial' | 'both';
export type MaterialType = 'PLA' | 'ABS' | 'PETG' | 'Resin' | 'Nylon' | 'TPU';

/**
 * File information for 3D models
 */
export interface ModelFile {
  format: ModelFormat;
  path: string;          // Path to the file (e.g., '/models/1/model.stl')
  size?: number;         // File size in bytes
  thumbnailPath?: string; // Path to preview thumbnail
}

/**
 * Downloadable file for digital products
 */
export interface DownloadFile extends ModelFile {
  downloadUrl?: string;   // Secure download URL (generated after purchase)
  expiresAt?: Date;      // Download link expiration
  downloadLimit?: number; // Max number of downloads allowed
}

/**
 * Custom order specifications
 */
export interface CustomOrderSpecs {
  acceptsCustomFiles: boolean;
  basePrice: number;
  materials: MaterialType[];
  maxFileSize: number; // in MB
  allowedFormats: ModelFormat[];
  pricingNotes?: string; // e.g., "Price varies by size and material"
}

/**
 * Shipping information for physical products
 */
export interface ShippingInfo {
  enabled: boolean;
  weight?: number;    // in grams
  dimensions?: {      // in mm
    length: number;
    width: number;
    height: number;
  };
  shippingCost?: number;
  estimatedDays?: string; // e.g., "3-5 business days"
}

/**
 * Main Product interface
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ProductType;

  // 3D Model (for physical, digital, and custom products)
  model?: ModelFile;

  // For digital download products (Scenario B)
  downloadFiles?: DownloadFile[];
  licenseType?: LicenseType;

  // For custom order products (Scenario C)
  customSpecs?: CustomOrderSpecs;

  // For physical products (Scenario A)
  shipping?: ShippingInfo;
  inStock?: boolean;
  stockQuantity?: number;

  // Images for gallery and thumbnails
  images: string[];          // Array of image paths
  thumbnails: {
    small: string;
    medium: string;
    large: string;
  };

  // Additional metadata
  tags?: string[];
  category?: string;
  featured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Cart item interface
 */
export interface CartItem {
  product: Product;
  quantity: number;
  customization?: {
    screenshot?: string;     // Screenshot of customized 3D view
    viewSettings?: any;      // Camera position, effects, etc.
    uploadedFile?: string;   // For custom orders
    material?: MaterialType;
    specifications?: string;
  };
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  shipping?: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  customerEmail: string;
  createdAt: Date;
  downloadLinks?: {
    productId: string;
    files: DownloadFile[];
  }[];
}
