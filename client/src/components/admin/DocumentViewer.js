import React, { useState } from 'react';
import './DocumentViewer.css';

const DocumentViewer = ({ documents, onClose }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleDocumentClick = (documentPath) => {
    if (documentPath) {
      // Use S3 file serving endpoint
      setSelectedDocument(`/api/files/${documentPath}`);
    }
  };

  const closeModal = () => {
    setSelectedDocument(null);
  };

  const closeViewer = () => {
    setSelectedDocument(null);
    onClose();
  };

  return (
    <div className="document-viewer-overlay">
      <div className="document-viewer">
        <div className="document-viewer-header">
          <h2>Document Viewer</h2>
          <button onClick={closeViewer} className="close-button">×</button>
        </div>
        
        <div className="document-grid">
          {documents.photo && (
            <div className="document-item">
              <h3>Photo</h3>
              <a href={`/api/files/${documents.photo}`} download target="_blank" rel="noopener noreferrer">{documents.photo}</a>
            </div>
          )}
          
          {documents.signature && (
            <div className="document-item">
              <h3>Signature</h3>
              <a href={`/api/files/${documents.signature}`} download target="_blank" rel="noopener noreferrer">{documents.signature}</a>
            </div>
          )}
          
          {documents.categoryCertificate && (
            <div className="document-item">
              <h3>Category Certificate</h3>
              <a href={`/api/files/${documents.categoryCertificate}`} download target="_blank" rel="noopener noreferrer">{documents.categoryCertificate}</a>
            </div>
          )}
          
          {documents.highSchoolCertificate && (
            <div className="document-item">
              <h3>High School Certificate</h3>
              <a href={`/api/files/${documents.highSchoolCertificate}`} download target="_blank" rel="noopener noreferrer">{documents.highSchoolCertificate}</a>
            </div>
          )}
          
          {documents.intermediateCertificate && (
            <div className="document-item">
              <h3>Intermediate Certificate</h3>
              <a href={`/api/files/${documents.intermediateCertificate}`} download target="_blank" rel="noopener noreferrer">{documents.intermediateCertificate}</a>
            </div>
          )}
        </div>
        
        {selectedDocument && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeModal} className="modal-close">×</button>
              <img src={selectedDocument} alt="Document" className="modal-image" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer; 