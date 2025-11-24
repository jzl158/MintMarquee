/**
 * FileUpload Component
 * Handles file uploads for custom 3D printing orders
 * Supports STL, OBJ, 3MF, GLTF, and GLB formats
 */

import { Component } from 'react';
import type { ModelFormat } from '../types/product';

interface FileUploadProps {
  onFileSelect: (file: File, previewUrl?: string) => void;
  allowedFormats?: ModelFormat[];
  maxFileSizeMB?: number;
  showPreview?: boolean;
}

interface FileUploadState {
  selectedFile: File | null;
  previewUrl: string | null;
  error: string | null;
  uploading: boolean;
  dragActive: boolean;
}

export default class FileUpload extends Component<FileUploadProps, FileUploadState> {
  private fileInputRef: HTMLInputElement | null = null;

  static defaultProps = {
    allowedFormats: ['stl', 'obj', '3mf', 'gltf', 'glb'] as ModelFormat[],
    maxFileSizeMB: 100,
    showPreview: true,
  };

  constructor(props: FileUploadProps) {
    super(props);
    this.state = {
      selectedFile: null,
      previewUrl: null,
      error: null,
      uploading: false,
      dragActive: false,
    };

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.triggerFileInput = this.triggerFileInput.bind(this);
    this.validateFile = this.validateFile.bind(this);
  }

  validateFile(file: File): string | null {
    const { allowedFormats, maxFileSizeMB } = this.props;

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase() as ModelFormat;
    if (!allowedFormats.includes(extension)) {
      return `Invalid file format. Allowed formats: ${allowedFormats.join(', ').toUpperCase()}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      return `File too large. Maximum size: ${maxFileSizeMB}MB (your file: ${fileSizeMB.toFixed(2)}MB)`;
    }

    return null;
  }

  handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = this.validateFile(file);
    if (error) {
      this.setState({ error, selectedFile: null, previewUrl: null });
      return;
    }

    // Create preview URL for GLTF/GLB files (could be extended)
    const previewUrl = this.props.showPreview ? URL.createObjectURL(file) : null;

    this.setState({
      selectedFile: file,
      previewUrl,
      error: null,
    });

    this.props.onFileSelect(file, previewUrl);
  }

  handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      this.setState({ dragActive: true });
    }
  }

  handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ dragActive: false });
  }

  handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ dragActive: false });

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const error = this.validateFile(file);
    if (error) {
      this.setState({ error, selectedFile: null, previewUrl: null });
      return;
    }

    const previewUrl = this.props.showPreview ? URL.createObjectURL(file) : null;

    this.setState({
      selectedFile: file,
      previewUrl,
      error: null,
    });

    this.props.onFileSelect(file, previewUrl);
  }

  triggerFileInput() {
    this.fileInputRef?.click();
  }

  componentWillUnmount() {
    // Clean up preview URL
    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }
  }

  render() {
    const { selectedFile, error, dragActive } = this.state;
    const { allowedFormats, maxFileSizeMB } = this.props;

    return (
      <div className="file-upload-container">
        <div
          className={`dropzone ${dragActive ? 'drag-active' : ''} ${error ? 'has-error' : ''}`}
          onDragEnter={this.handleDrag}
          onDragOver={this.handleDrag}
          onDragLeave={this.handleDragLeave}
          onDrop={this.handleDrop}
          onClick={this.triggerFileInput}
        >
          <input
            ref={ref => this.fileInputRef = ref}
            type="file"
            onChange={this.handleFileChange}
            accept={allowedFormats.map(f => `.${f}`).join(',')}
            style={{ display: 'none' }}
          />

          <div className="dropzone-content">
            {!selectedFile ? (
              <>
                <i className="material-icons md-48">cloud_upload</i>
                <p className="f4 mt3 mb2 fw6">
                  {dragActive ? 'Drop your file here' : 'Drop your 3D model here or click to browse'}
                </p>
                <p className="f6 gray">
                  Supported formats: {allowedFormats.join(', ').toUpperCase()}
                </p>
                <p className="f6 gray">
                  Maximum file size: {maxFileSizeMB}MB
                </p>
              </>
            ) : (
              <>
                <i className="material-icons md-48 green">check_circle</i>
                <p className="f5 mt3 mb2 fw6">{selectedFile.name}</p>
                <p className="f6 gray">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <p className="f6 mt2">
                  Click to select a different file
                </p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message mt3 pa3 bg-light-red dark-red br2">
            <i className="material-icons f6 v-mid mr2">error</i>
            <span>{error}</span>
          </div>
        )}

        <style jsx>{`
          .file-upload-container {
            width: 100%;
            margin: 1rem 0;
          }

          .dropzone {
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 3rem 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.05);
          }

          .dropzone:hover {
            border-color: #888;
            background: rgba(255, 255, 255, 0.08);
          }

          .dropzone.drag-active {
            border-color: #4CAF50;
            background: rgba(76, 175, 80, 0.1);
          }

          .dropzone.has-error {
            border-color: #f44336;
          }

          .dropzone-content {
            pointer-events: none;
          }

          .error-message {
            display: flex;
            align-items: center;
          }

          .green {
            color: #4CAF50;
          }
        `}</style>
      </div>
    );
  }
}
