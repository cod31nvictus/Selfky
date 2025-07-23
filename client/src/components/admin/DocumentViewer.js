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
          
          {/* BPharm Year Marksheets for MPharm applications */}
          {documents.bpharmYear1Marksheet && (
            <div className="document-item">
              <h3>BPharm Year 1 Marksheet</h3>
              <a href={`/api/files/${documents.bpharmYear1Marksheet}`} download target="_blank" rel="noopener noreferrer">{documents.bpharmYear1Marksheet}</a>
            </div>
          )}
          
          {documents.bpharmYear2Marksheet && (
            <div className="document-item">
              <h3>BPharm Year 2 Marksheet</h3>
              <a href={`/api/files/${documents.bpharmYear2Marksheet}`} download target="_blank" rel="noopener noreferrer">{documents.bpharmYear2Marksheet}</a>
            </div>
          )}
          
          {documents.bpharmYear3Marksheet && (
            <div className="document-item">
              <h3>BPharm Year 3 Marksheet</h3>
              <a href={`/api/files/${documents.bpharmYear3Marksheet}`} download target="_blank" rel="noopener noreferrer">{documents.bpharmYear3Marksheet}</a>
            </div>
          )}
          
          {documents.bpharmYear4Marksheet && (
            <div className="document-item">
              <h3>BPharm Year 4 Marksheet</h3>
              <a href={`/api/files/${documents.bpharmYear4Marksheet}`} download target="_blank" rel="noopener noreferrer">{documents.bpharmYear4Marksheet}</a>
            </div>
          )}
          
          {documents.bpharmDegree && (
            <div className="document-item">
              <h3>BPharm Degree</h3>
              <a href={`/api/files/${documents.bpharmDegree}`} download target="_blank" rel="noopener noreferrer">{documents.bpharmDegree}</a>
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