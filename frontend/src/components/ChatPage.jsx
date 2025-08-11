import React from 'react';

const ChatPage = ({ 
  file, 
  fileUrl, 
  messages, 
  loading, 
  question, 
  chatContainerRef,
  onNewChat,
  onQuestionChange,
  onSubmit,
  formatBotMessage 
}) => {
  return (
    <div className="main-container">
      <div className="chat-section">
        <div className="chat-header">
          <div className="header-content">
            <h2><span className="brand-icon">🤖</span> PDF Genie</h2>
            <button className="new-chat gradient-button" onClick={onNewChat}>
              Upload PDF
            </button>
          </div>
        </div>
        <div className="chat-messages" ref={chatContainerRef}>
          <div className="welcome-message">
            <h3>👋 Welcome! Ask any question about your PDF</h3>
          </div>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <div className="message-content">
                <span className="message-label">{msg.type === 'user' ? 'You' : 'AI'}</span>
                {msg.type === 'bot'
                  ? <span dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.content) }} />
                  : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={onSubmit} className="chat-input">
          <input
            type="text"
            value={question}
            onChange={onQuestionChange}
            placeholder="Ask a question about your PDF..."
            disabled={loading}
            className="chat-input-field"
          />
          <button type="submit" disabled={loading} className="send-button gradient-button">
            {loading ? (
              'Sending...'
            ) : (
              <>
                <span>Send</span>
                <span className="send-icon">→</span>
              </>
            )}
          </button>
        </form>
      </div>
      <div className="pdf-section">
        {fileUrl && (
          <iframe
            src={fileUrl}
            width="100%"
            height="700px"
            title="PDF Viewer"
            style={{ border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;