import React from 'react';

const DocumentViewer = ({ documents, applicationNumber }) => {
  const downloadDocument = (documentPath, documentName) => {
    if (!documentPath) return;
    
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/${documentPath}`;
    link.download = `${applicationNumber}_${documentName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDocument = (documentPath, documentName, label) => {
    if (!documentPath) return null;

    const isImage = documentPath.toLowerCase().endsWith('.jpg') || 
                   documentPath.toLowerCase().endsWith('.jpeg') || 
                   documentPath.toLowerCase().endsWith('.png') || 
                   documentPath.toLowerCase().endsWith('.gif');

    return (
      <div key={documentName} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">{label}</h4>
          <button
            onClick={() => downloadDocument(documentPath, documentName)}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Download
          </button>
        </div>
        
        {isImage ? (
          <div className="bg-gray-50 rounded-lg p-2">
            <img
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${documentPath.includes('/') ? documentPath.split('/').pop() : documentPath}`}
              alt={label}
              className="max-w-full h-auto max-h-32 object-contain rounded"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden items-center justify-center h-20 bg-gray-200 rounded text-gray-500 text-xs">
              Image not available
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs text-gray-500">PDF Document</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Required Documents */}
        <div className="col-span-full">
          <h4 className="text-md font-medium text-gray-700 mb-3">Required Documents</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderDocument(documents?.photo, 'photo', 'Photo')}
            {renderDocument(documents?.signature, 'signature', 'Signature')}
          </div>
        </div>

        {/* Optional Documents */}
        <div className="col-span-full">
          <h4 className="text-md font-medium text-gray-700 mb-3">Optional Documents</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderDocument(documents?.categoryCertificate, 'categoryCertificate', 'Category Certificate')}
            {renderDocument(documents?.highSchoolCertificate, 'highSchoolCertificate', 'High School Certificate')}
            {renderDocument(documents?.intermediateCertificate, 'intermediateCertificate', '10+2 Certificate')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 