/**
 * ProductDetail Component
 * Universal product detail page supporting all product types:
 * - Physical: 3D printed products with shipping
 * - Digital: Downloadable 3D files
 * - Custom: Custom printing service with file upload
 * - Gallery: Photo-only products
 */

import { Component } from 'react';
import type { Product, ProductType, MaterialType } from '../types/product';
import Editor from './Editor';
import PhotoGallery from './PhotoGallery';
import FileUpload from './FileUpload';
import DownloadLinks from './DownloadLinks';
import ShippingCalculator from './ShippingCalculator';

interface ProductDetailProps {
  product: Product;
  isPurchased?: boolean;
  onAddToCart?: (product: Product, customizations?: any) => void;
}

interface ProductDetailState {
  selectedMaterial: MaterialType | null;
  uploadedFile: File | null;
  uploadedFilePreview: string | null;
  customNotes: string;
  quantity: number;
  addingToCart: boolean;
}

export default class ProductDetail extends Component<ProductDetailProps, ProductDetailState> {
  constructor(props: ProductDetailProps) {
    super(props);

    // Default material for custom orders
    const defaultMaterial = props.product.customSpecs?.materials?.[0] || null;

    this.state = {
      selectedMaterial: defaultMaterial,
      uploadedFile: null,
      uploadedFilePreview: null,
      customNotes: '',
      quantity: 1,
      addingToCart: false,
    };

    this.handleAddToCart = this.handleAddToCart.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.handleMaterialChange = this.handleMaterialChange.bind(this);
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
  }

  handleFileUpload(file: File, previewUrl?: string) {
    this.setState({
      uploadedFile: file,
      uploadedFilePreview: previewUrl || null,
    });
  }

  handleMaterialChange(e: React.ChangeEvent<HTMLSelectElement>) {
    this.setState({ selectedMaterial: e.target.value as MaterialType });
  }

  handleQuantityChange(delta: number) {
    this.setState(prevState => ({
      quantity: Math.max(1, prevState.quantity + delta),
    }));
  }

  async handleAddToCart() {
    const { product, onAddToCart } = this.props;
    const { selectedMaterial, uploadedFile, customNotes, quantity } = this.state;

    // Validation for custom orders
    if (product.type === 'custom' && !uploadedFile) {
      alert('Please upload your 3D model file before adding to cart');
      return;
    }

    this.setState({ addingToCart: true });

    try {
      const customizations = {
        material: selectedMaterial,
        uploadedFile,
        customNotes,
        quantity,
      };

      if (onAddToCart) {
        await onAddToCart(product, customizations);
      }

      // Show success message
      alert(`Added ${quantity}x "${product.name}" to cart!`);

    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      this.setState({ addingToCart: false });
    }
  }

  calculateTotalPrice(): number {
    const { product } = this.props;
    const { quantity } = this.state;

    return product.price * quantity;
  }

  renderProductViewer() {
    const { product } = this.props;

    // 3D Model viewer for products with 3D models
    if (product.model && product.type !== 'gallery') {
      return (
        <div className="product-viewer-3d">
          <Editor details={product} addToCart={() => {}} />
        </div>
      );
    }

    // Photo gallery for products without 3D models or gallery type
    if (product.images && product.images.length > 0) {
      return (
        <PhotoGallery
          images={product.images}
          productName={product.name}
          thumbnails={product.thumbnails}
        />
      );
    }

    return (
      <div className="no-preview pa4 tc bg-light-gray br2">
        <i className="material-icons f1 gray">3d_rotation</i>
        <p className="gray mt2">No preview available</p>
      </div>
    );
  }

  renderProductOptions() {
    const { product } = this.props;
    const { selectedMaterial, customNotes, uploadedFile } = this.state;

    switch (product.type) {
      case 'physical':
        // Physical products show shipping options
        return (
          <div className="product-options">
            {product.shipping && (
              <ShippingCalculator
                shippingInfo={product.shipping}
                productPrice={product.price}
                productName={product.name}
              />
            )}

            {/* Stock information */}
            {product.inStock !== undefined && (
              <div className="stock-info mt3 pa2 br2 f6">
                {product.inStock ? (
                  <span className="green">
                    <i className="material-icons f6 v-mid mr1">check_circle</i>
                    In Stock
                    {product.stockQuantity && ` (${product.stockQuantity} available)`}
                  </span>
                ) : (
                  <span className="red">
                    <i className="material-icons f6 v-mid mr1">cancel</i>
                    Out of Stock
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case 'digital':
        // Digital products show download information
        return (
          <div className="product-options">
            {product.downloadFiles && (
              <DownloadLinks
                files={product.downloadFiles}
                licenseType={product.licenseType}
                isPurchased={this.props.isPurchased || false}
              />
            )}

            {!this.props.isPurchased && (
              <div className="purchase-note mt3 pa3 bg-light-blue dark-blue br2 f6">
                <i className="material-icons f6 v-mid mr2">info</i>
                Purchase this product to download the 3D model files
              </div>
            )}
          </div>
        );

      case 'custom':
        // Custom orders show file upload and material selection
        return (
          <div className="product-options">
            <h3 className="f5 fw6 mb3">Upload Your 3D Model</h3>

            {product.customSpecs && (
              <>
                <FileUpload
                  onFileSelect={this.handleFileUpload}
                  allowedFormats={product.customSpecs.allowedFormats}
                  maxFileSizeMB={product.customSpecs.maxFileSize}
                />

                {/* Material Selection */}
                <div className="material-selection mt3">
                  <label className="db f6 fw6 mb2">Select Material</label>
                  <select
                    value={selectedMaterial || ''}
                    onChange={this.handleMaterialChange}
                    className="w-100 pa2 br2 ba b--light-gray"
                  >
                    {product.customSpecs.materials.map(material => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Notes */}
                <div className="custom-notes mt3">
                  <label className="db f6 fw6 mb2">Special Instructions (Optional)</label>
                  <textarea
                    value={customNotes}
                    onChange={e => this.setState({ customNotes: e.target.value })}
                    placeholder="Any special requirements or notes for your print..."
                    className="w-100 pa2 br2 ba b--light-gray"
                    rows={4}
                  />
                </div>

                {/* Pricing Info */}
                {product.customSpecs.pricingNotes && (
                  <div className="pricing-notes mt3 pa2 bg-light-yellow dark-gray br2 f6">
                    <i className="material-icons f6 v-mid mr2">attach_money</i>
                    {product.customSpecs.pricingNotes}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'gallery':
        // Photo gallery products may have additional options
        return (
          <div className="product-options">
            {product.shipping && (
              <ShippingCalculator
                shippingInfo={product.shipping}
                productPrice={product.price}
                productName={product.name}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  }

  renderPriceSection() {
    const { product } = this.props;
    const { quantity } = this.state;
    const totalPrice = this.calculateTotalPrice();

    return (
      <div className="price-section pa3 bg-light-gray br2 mb3">
        <div className="flex items-center justify-between mb2">
          <span className="f6 gray">Price:</span>
          <span className="f4 fw6">${product.price.toFixed(2)}</span>
        </div>

        {/* Quantity Selector */}
        <div className="quantity-selector flex items-center justify-between mt3">
          <span className="f6 gray">Quantity:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => this.handleQuantityChange(-1)}
              className="quantity-btn pa2 br2 ba b--light-gray pointer"
              disabled={quantity <= 1}
            >
              <i className="material-icons f5">remove</i>
            </button>
            <span className="ph3 fw6">{quantity}</span>
            <button
              onClick={() => this.handleQuantityChange(1)}
              className="quantity-btn pa2 br2 ba b--light-gray pointer"
            >
              <i className="material-icons f5">add</i>
            </button>
          </div>
        </div>

        {quantity > 1 && (
          <div className="flex items-center justify-between mt3 pt3 bt b--light-gray">
            <span className="f5 fw6">Total:</span>
            <span className="f3 fw6">${totalPrice.toFixed(2)}</span>
          </div>
        )}
      </div>
    );
  }

  render() {
    const { product } = this.props;
    const { addingToCart } = this.state;

    return (
      <div className="product-detail">
        <div className="product-layout">
          {/* Left: Product Viewer */}
          <div className="product-viewer">
            {this.renderProductViewer()}
          </div>

          {/* Right: Product Information */}
          <div className="product-info">
            {/* Product Header */}
            <div className="product-header mb4">
              <h1 className="f2 fw6 mt0 mb2">{product.name}</h1>

              {/* Product Type Badge */}
              <div className="product-type-badge dib pa2 br2 f7 fw6 white mb3">
                {product.type === 'physical' && '3D Printed Product'}
                {product.type === 'digital' && 'Digital Download'}
                {product.type === 'custom' && 'Custom Print Service'}
                {product.type === 'gallery' && 'Product'}
              </div>

              <p className="f5 lh-copy gray">{product.description}</p>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="tags mt3">
                  {product.tags.map(tag => (
                    <span key={tag} className="tag dib pa1 ph2 mr2 mb2 br2 bg-light-gray f7">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price Section */}
            {this.renderPriceSection()}

            {/* Product-specific Options */}
            {this.renderProductOptions()}

            {/* Add to Cart Button */}
            <button
              onClick={this.handleAddToCart}
              disabled={addingToCart || (product.type === 'physical' && !product.inStock)}
              className="add-to-cart-btn w-100 pa3 br2 bn white pointer fw6 f5 mt4"
            >
              {addingToCart ? (
                <>
                  <i className="material-icons f5 v-mid mr2">hourglass_empty</i>
                  Adding to Cart...
                </>
              ) : product.type === 'digital' && !this.props.isPurchased ? (
                <>
                  <i className="material-icons f5 v-mid mr2">shopping_cart</i>
                  Purchase & Download
                </>
              ) : product.type === 'custom' ? (
                <>
                  <i className="material-icons f5 v-mid mr2">upload</i>
                  Get Custom Quote
                </>
              ) : (
                <>
                  <i className="material-icons f5 v-mid mr2">shopping_cart</i>
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>

        <style jsx>{`
          .product-detail {
            width: 100%;
            min-height: 100vh;
            padding: 2rem;
          }

          .product-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            max-width: 1400px;
            margin: 0 auto;
          }

          @media (max-width: 768px) {
            .product-layout {
              grid-template-columns: 1fr;
              gap: 2rem;
            }
          }

          .product-viewer {
            position: sticky;
            top: 2rem;
            height: fit-content;
          }

          .product-type-badge {
            background: #2196F3;
          }

          .product-type-badge[data-type='digital'] {
            background: #9C27B0;
          }

          .product-type-badge[data-type='custom'] {
            background: #FF9800;
          }

          .product-type-badge[data-type='gallery'] {
            background: #4CAF50;
          }

          .quantity-btn {
            background: white;
            transition: all 0.2s ease;
          }

          .quantity-btn:hover:not(:disabled) {
            background: #f5f5f5;
            border-color: #888;
          }

          .quantity-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .add-to-cart-btn {
            background: #4CAF50;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .add-to-cart-btn:hover:not(:disabled) {
            background: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }

          .add-to-cart-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
          }

          .gap-2 > * + * {
            margin-left: 0.5rem;
          }

          .green {
            color: #4CAF50;
          }

          .red {
            color: #f44336;
          }

          .tag {
            color: #666;
          }
        `}</style>
      </div>
    );
  }
}
