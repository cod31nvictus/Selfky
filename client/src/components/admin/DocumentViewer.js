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
            <div className="document-item" onClick={() => handleDocumentClick(documents.photo)}>
              <h3>Photo</h3>
              <div className="document-preview">
                <img 
                  src={`/api/files/${documents.photo}`}
                  alt="Photo" 
                  className="document-image"
                />
              </div>
            </div>
          )}
          
          {documents.signature && (
            <div className="document-item" onClick={() => handleDocumentClick(documents.signature)}>
              <h3>Signature</h3>
              <div className="document-preview">
                <img 
                  src={`/api/files/${documents.signature}`}
                  alt="Signature" 
                  className="document-image"
                />
              </div>
            </div>
          )}
          
          {documents.categoryCertificate && (
            <div className="document-item" onClick={() => handleDocumentClick(documents.categoryCertificate)}>
              <h3>Category Certificate</h3>
              <div className="document-preview">
                <img 
                  src={`/api/files/${documents.categoryCertificate}`}
                  alt="Category Certificate" 
                  className="document-image"
                />
              </div>
            </div>
          )}
          
          {documents.highSchoolCertificate && (
            <div className="document-item" onClick={() => handleDocumentClick(documents.highSchoolCertificate)}>
              <h3>High School Certificate</h3>
              <div className="document-preview">
                <img 
                  src={`/api/files/${documents.highSchoolCertificate}`}
                  alt="High School Certificate" 
                  className="document-image"
                />
              </div>
            </div>
          )}
          
          {documents.intermediateCertificate && (
            <div className="document-item" onClick={() => handleDocumentClick(documents.intermediateCertificate)}>
              <h3>Intermediate Certificate</h3>
              <div className="document-preview">
                <img 
                  src={`/api/files/${documents.intermediateCertificate}`}
                  alt="Intermediate Certificate" 
                  className="document-image"
                />
              </div>
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