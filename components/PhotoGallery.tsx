/**
 * PhotoGallery Component
 * Traditional photo gallery for products without 3D models
 * Features: thumbnail navigation, zoom, fullscreen view
 */

import { Component } from 'react';
import Image from 'next/image';

interface PhotoGalleryProps {
  images: string[];
  productName: string;
  thumbnails?: {
    small: string;
    medium: string;
    large: string;
  };
}

interface PhotoGalleryState {
  currentImageIndex: number;
  isZoomed: boolean;
  isFullscreen: boolean;
  zoomLevel: number;
  imageLoaded: boolean;
}

export default class PhotoGallery extends Component<PhotoGalleryProps, PhotoGalleryState> {
  private imageRef: HTMLDivElement | null = null;

  constructor(props: PhotoGalleryProps) {
    super(props);
    this.state = {
      currentImageIndex: 0,
      isZoomed: false,
      isFullscreen: false,
      zoomLevel: 1,
      imageLoaded: false,
    };

    this.selectImage = this.selectImage.bind(this);
    this.nextImage = this.nextImage.bind(this);
    this.prevImage = this.prevImage.bind(this);
    this.toggleZoom = this.toggleZoom.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleImageLoad = this.handleImageLoad.bind(this);
  }

  selectImage(index: number) {
    this.setState({
      currentImageIndex: index,
      isZoomed: false,
      zoomLevel: 1,
      imageLoaded: false,
    });
  }

  nextImage() {
    const { images } = this.props;
    const nextIndex = (this.state.currentImageIndex + 1) % images.length;
    this.selectImage(nextIndex);
  }

  prevImage() {
    const { images } = this.props;
    const prevIndex =
      this.state.currentImageIndex === 0
        ? images.length - 1
        : this.state.currentImageIndex - 1;
    this.selectImage(prevIndex);
  }

  toggleZoom() {
    this.setState(prevState => ({
      isZoomed: !prevState.isZoomed,
      zoomLevel: !prevState.isZoomed ? 2 : 1,
    }));
  }

  toggleFullscreen() {
    this.setState(prevState => ({
      isFullscreen: !prevState.isFullscreen,
    }));
  }

  handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      this.nextImage();
    } else if (e.key === 'ArrowLeft') {
      this.prevImage();
    } else if (e.key === 'Escape' && this.state.isFullscreen) {
      this.toggleFullscreen();
    }
  }

  handleImageLoad() {
    this.setState({ imageLoaded: true });
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  }

  render() {
    const { images, productName, thumbnails } = this.props;
    const { currentImageIndex, isZoomed, isFullscreen, zoomLevel, imageLoaded } = this.state;

    if (!images || images.length === 0) {
      return (
        <div className="no-images pa4 tc bg-light-gray br2">
          <i className="material-icons f1 gray">image</i>
          <p className="gray mt2">No images available</p>
        </div>
      );
    }

    const currentImage = images[currentImageIndex];
    const hasMultipleImages = images.length > 1;

    return (
      <div className={`photo-gallery ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Main Image Display */}
        <div className="main-image-container relative">
          <div
            ref={ref => (this.imageRef = ref)}
            className={`main-image ${isZoomed ? 'zoomed' : ''}`}
            onClick={this.toggleZoom}
          >
            {!imageLoaded && (
              <div className="image-loading absolute top-0 left-0 w-100 h-100 flex items-center justify-center">
                <i className="material-icons f1 gray animate-spin">refresh</i>
              </div>
            )}

            <img
              src={currentImage}
              alt={`${productName} - Image ${currentImageIndex + 1}`}
              style={{
                transform: `scale(${zoomLevel})`,
                cursor: isZoomed ? 'zoom-out' : 'zoom-in',
              }}
              onLoad={this.handleImageLoad}
            />

            {/* Image Counter */}
            {hasMultipleImages && (
              <div className="image-counter absolute top-1 right-1 pa2 bg-black-80 white br2 f7">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Zoom Indicator */}
            {isZoomed && (
              <div className="zoom-indicator absolute top-1 left-1 pa2 bg-black-80 white br2 f7">
                <i className="material-icons f6 v-mid">zoom_in</i>
                <span className="ml1">{zoomLevel}x</span>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={this.prevImage}
                className="nav-arrow prev absolute left-1 top-50 pa2 br2 bn white pointer"
                aria-label="Previous image"
              >
                <i className="material-icons">chevron_left</i>
              </button>
              <button
                onClick={this.nextImage}
                className="nav-arrow next absolute right-1 top-50 pa2 br2 bn white pointer"
                aria-label="Next image"
              >
                <i className="material-icons">chevron_right</i>
              </button>
            </>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={this.toggleFullscreen}
            className="fullscreen-btn absolute bottom-1 right-1 pa2 br2 bn white pointer"
            aria-label="Toggle fullscreen"
          >
            <i className="material-icons">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </i>
          </button>
        </div>

        {/* Thumbnail Navigation */}
        {hasMultipleImages && (
          <div className="thumbnails-container mt3">
            <div className="thumbnails-grid">
              {images.map((image, index) => (
                <div
                  key={`thumb-${index}`}
                  onClick={() => this.selectImage(index)}
                  className={`thumbnail ${
                    index === currentImageIndex ? 'active' : ''
                  } pointer br2 ba overflow-hidden`}
                >
                  <img
                    src={thumbnails?.small || image}
                    alt={`${productName} thumbnail ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Controls */}
        <div className="gallery-controls mt3 flex items-center justify-center gap-2">
          <button
            onClick={() => this.setState({ zoomLevel: Math.max(1, zoomLevel - 0.5) })}
            disabled={zoomLevel <= 1}
            className="control-btn pa2 br2 ba b--light-gray pointer"
            title="Zoom out"
          >
            <i className="material-icons">zoom_out</i>
          </button>

          <button
            onClick={() => this.setState({ zoomLevel: Math.min(4, zoomLevel + 0.5) })}
            disabled={zoomLevel >= 4}
            className="control-btn pa2 br2 ba b--light-gray pointer"
            title="Zoom in"
          >
            <i className="material-icons">zoom_in</i>
          </button>

          <button
            onClick={() => this.setState({ zoomLevel: 1, isZoomed: false })}
            disabled={zoomLevel === 1}
            className="control-btn pa2 br2 ba b--light-gray pointer"
            title="Reset zoom"
          >
            <i className="material-icons">restart_alt</i>
          </button>
        </div>

        <style jsx>{`
          .photo-gallery {
            width: 100%;
            position: relative;
          }

          .photo-gallery.fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 9999;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .main-image-container {
            background: #f5f5f5;
            border-radius: 8px;
            overflow: hidden;
            aspect-ratio: 4 / 3;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .fullscreen .main-image-container {
            background: transparent;
            aspect-ratio: auto;
            flex: 1;
          }

          .main-image {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
          }

          .main-image img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            transition: transform 0.3s ease;
          }

          .main-image.zoomed img {
            cursor: zoom-out;
          }

          .nav-arrow {
            background: rgba(0, 0, 0, 0.7);
            transition: all 0.2s ease;
            transform: translateY(-50%);
          }

          .nav-arrow:hover {
            background: rgba(0, 0, 0, 0.9);
            transform: translateY(-50%) scale(1.1);
          }

          .fullscreen-btn {
            background: rgba(0, 0, 0, 0.7);
            transition: all 0.2s ease;
          }

          .fullscreen-btn:hover {
            background: rgba(0, 0, 0, 0.9);
          }

          .thumbnails-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 0.5rem;
            max-width: 600px;
            margin: 0 auto;
          }

          .thumbnail {
            aspect-ratio: 1;
            border-color: #ddd;
            transition: all 0.2s ease;
            opacity: 0.6;
          }

          .thumbnail:hover {
            opacity: 0.8;
            border-color: #888;
          }

          .thumbnail.active {
            opacity: 1;
            border-color: #2196F3;
            border-width: 2px;
          }

          .thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .control-btn {
            background: white;
            transition: all 0.2s ease;
          }

          .control-btn:hover:not(:disabled) {
            background: #f5f5f5;
            border-color: #888;
          }

          .control-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .gap-2 > * + * {
            margin-left: 0.5rem;
          }

          .image-loading {
            background: rgba(255, 255, 255, 0.9);
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }

          .no-images {
            min-height: 400px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </div>
    );
  }
}
