import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import './App.css';
import UploadPage from './components/UploadPage';
import ChatPage from './components/ChatPage';

function formatBotMessage(text) {
  const bolded = text.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>');
  const withBreaks = bolded.replace(/\n/g, '<br/>');
  return withBreaks;
}

function App() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("question", question);

    try {
      const res = await axios.post("http://localhost:5000/ask", formData);
      setMessages(prev => [
        ...prev,
        { type: 'user', content: question },
        { type: 'bot', content: formatBotMessage(res.data.answer) }
      ]);
      setQuestion("");
      setTimeout(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
      }, 100);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { type: 'user', content: question },
        { type: 'bot', content: "Sorry, I couldn't process your request." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {!file ? (
        <UploadPage onFileSelect={setFile} />
      ) : (
        <ChatPage
          file={file}
          fileUrl={fileUrl}
          messages={messages}
          loading={loading}
          question={question}
          chatContainerRef={chatContainerRef}
          onNewChat={() => {
            setFile(null);
            setMessages([]);
          }}
          onQuestionChange={(e) => setQuestion(e.target.value)}
          onSubmit={handleSubmit}
          formatBotMessage={formatBotMessage}
        />
      )}
    </div>
  );
}

export default App;
