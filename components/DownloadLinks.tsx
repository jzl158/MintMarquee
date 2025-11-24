/**
 * DownloadLinks Component
 * Displays downloadable files for digital products
 * Shows file format, size, and download limits
 */

import { Component } from 'react';
import type { DownloadFile, LicenseType } from '../types/product';

interface DownloadLinksProps {
  files: DownloadFile[];
  licenseType?: LicenseType;
  purchaseId?: string;
  isPurchased: boolean;
}

interface DownloadLinksState {
  downloading: { [key: string]: boolean };
  downloadCounts: { [key: string]: number };
}

export default class DownloadLinks extends Component<DownloadLinksProps, DownloadLinksState> {
  constructor(props: DownloadLinksProps) {
    super(props);
    this.state = {
      downloading: {},
      downloadCounts: {},
    };

    this.handleDownload = this.handleDownload.bind(this);
  }

  async handleDownload(file: DownloadFile, index: number) {
    const { purchaseId } = this.props;
    const { downloadCounts } = this.state;

    // Check download limit
    const currentCount = downloadCounts[file.path] || 0;
    if (file.downloadLimit && currentCount >= file.downloadLimit) {
      alert(`Download limit reached for this file (${file.downloadLimit} downloads)`);
      return;
    }

    // Set downloading state
    this.setState({
      downloading: { ...this.state.downloading, [file.path]: true }
    });

    try {
      // In production, this would call an API endpoint that:
      // 1. Verifies purchase
      // 2. Checks download limits
      // 3. Generates secure temporary download URL
      // 4. Logs the download

      // For now, simulate download
      const downloadUrl = file.downloadUrl || file.path;

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.path.split('/').pop() || `model.${file.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update download count
      this.setState({
        downloadCounts: {
          ...this.state.downloadCounts,
          [file.path]: currentCount + 1
        }
      });

    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again or contact support.');
    } finally {
      this.setState({
        downloading: { ...this.state.downloading, [file.path]: false }
      });
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';

    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  }

  getLicenseIcon(licenseType?: LicenseType): string {
    switch (licenseType) {
      case 'personal':
        return 'person';
      case 'commercial':
        return 'business';
      case 'both':
        return 'people';
      default:
        return 'description';
    }
  }

  getLicenseText(licenseType?: LicenseType): string {
    switch (licenseType) {
      case 'personal':
        return 'Personal Use Only';
      case 'commercial':
        return 'Commercial Use License';
      case 'both':
        return 'Personal & Commercial Use';
      default:
        return 'Standard License';
    }
  }

  render() {
    const { files, licenseType, isPurchased } = this.props;
    const { downloading, downloadCounts } = this.state;

    if (!files || files.length === 0) {
      return null;
    }

    return (
      <div className="download-links-container">
        {/* License Information */}
        {licenseType && (
          <div className="license-info mb4 pa3 bg-light-gray br2">
            <div className="flex items-center mb2">
              <i className="material-icons mr2">{this.getLicenseIcon(licenseType)}</i>
              <span className="fw6">{this.getLicenseText(licenseType)}</span>
            </div>
            <p className="f6 gray ma0">
              {licenseType === 'personal' &&
                'This model is for personal use only. Commercial use is not permitted.'}
              {licenseType === 'commercial' &&
                'This model includes a commercial use license. You may use it in commercial projects.'}
              {licenseType === 'both' &&
                'This model includes both personal and commercial use rights.'}
            </p>
          </div>
        )}

        {/* Download Files */}
        <div className="files-list">
          <h3 className="f5 fw6 mb3">
            <i className="material-icons f5 v-mid mr2">folder</i>
            Download Files
          </h3>

          {!isPurchased ? (
            <div className="not-purchased pa3 bg-light-yellow dark-gray br2">
              <i className="material-icons f5 v-mid mr2">lock</i>
              <span>Purchase this product to access downloads</span>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file, index) => {
                const isDownloading = downloading[file.path];
                const downloadCount = downloadCounts[file.path] || 0;
                const remainingDownloads = file.downloadLimit
                  ? file.downloadLimit - downloadCount
                  : null;

                return (
                  <div key={`${file.path}-${index}`} className="file-card pa3 mb2 bg-white br2 ba b--light-gray">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-grow-1">
                        <i className="material-icons mr3 f3">{this.getFileIcon(file.format)}</i>
                        <div>
                          <div className="fw6 mb1">{file.format.toUpperCase()} Format</div>
                          <div className="f6 gray">{this.formatFileSize(file.size)}</div>
                          {file.downloadLimit && (
                            <div className="f7 mt1" style={{ color: remainingDownloads === 0 ? '#f44336' : '#666' }}>
                              {remainingDownloads} of {file.downloadLimit} downloads remaining
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => this.handleDownload(file, index)}
                        disabled={isDownloading || (file.downloadLimit && downloadCount >= file.downloadLimit)}
                        className="download-btn ph3 pv2 br2 bn white pointer"
                      >
                        {isDownloading ? (
                          <>
                            <i className="material-icons f6 v-mid">hourglass_empty</i>
                            <span className="ml2">Downloading...</span>
                          </>
                        ) : (
                          <>
                            <i className="material-icons f6 v-mid">download</i>
                            <span className="ml2">Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Download Instructions */}
        {isPurchased && (
          <div className="instructions mt4 pa3 bg-light-blue dark-blue br2">
            <h4 className="f6 fw6 mt0 mb2">
              <i className="material-icons f6 v-mid mr2">info</i>
              Download Instructions
            </h4>
            <ul className="f7 ma0 pl3">
              <li>Click the download button to save the file to your device</li>
              <li>Some files may have download limits - check remaining downloads above</li>
              <li>If you experience issues, contact support with your order number</li>
              <li>Files are available for 1 year from purchase date</li>
            </ul>
          </div>
        )}

        <style jsx>{`
          .download-links-container {
            width: 100%;
          }

          .files-grid {
            display: flex;
            flex-direction: column;
          }

          .file-card {
            transition: box-shadow 0.2s ease;
          }

          .file-card:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .download-btn {
            background: #4CAF50;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
          }

          .download-btn:hover:not(:disabled) {
            background: #45a049;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .download-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            opacity: 0.6;
          }

          .not-purchased {
            display: flex;
            align-items: center;
          }
        `}</style>
      </div>
    );
  }

  getFileIcon(format: string): string {
    switch (format.toLowerCase()) {
      case 'stl':
        return 'view_in_ar';
      case 'obj':
        return '3d_rotation';
      case 'gltf':
      case 'glb':
        return 'category';
      case '3mf':
        return 'print';
      default:
        return 'insert_drive_file';
    }
  }
}
