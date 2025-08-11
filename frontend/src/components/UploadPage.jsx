import React from 'react';

const UploadPage = ({ onFileSelect }) => {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">PDF Genie</span>
        </div>
      </nav>

      <div className="hero-section">
        <h1 className="hero-title">Chat with Your PDF Documents</h1>
        <p className="hero-subtitle">
        Upload your PDF and get instant AI-powered answers

        </p>
      </div>

      <div className="upload-container">
        <div className="upload-content">
          <div className="upload-icon">📄</div>
          <h2>Start Chatting with Your PDF</h2>
          <p>Drag & drop your PDF or click to browse</p>
          <label className="file-upload">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              hidden
            />
            <span>Choose PDF File</span>
          </label>
        </div>
      </div>

    </div>
  );
};

export default UploadPage;