const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { Storage } = require("@google-cloud/storage");
const { DocumentProcessorServiceClient } = require("@google-cloud/documentai").v1;
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {
  chunkText,
  getEmbeddings,
  findMostSimilarChunks
} = require("./vector_utils");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// CONFIGURATION
const bucketName = "";
const processorId = ""; // Document AI Processor ID
const projectId = "";
const location = "us"; // or your processor region
const vertexLocation = ""; // Vertex AI location
const VERTEX_API_KEY = process.env.VERTEX_API_KEY || "YOUR_VERTEX_API_KEY"; // Set your Vertex API key here or via env
// In-memory store for embeddings per PDF (filename as key)
const pdfEmbeddingsStore = {};

// Add this check to verify processor exists
const checkProcessor = async () => {
  try {
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    const [processor] = await documentAIClient.getProcessor({ name });
    console.log('Processor verified:', processor.name);
  } catch (error) {
    console.error('Processor verification failed:', error.message);
    process.exit(1);
  }
};

// Initialize Storage with credentials
const storage = new Storage({
  keyFilename: "D:\\Downloads\\valid-verbena-449610-q5-80ba93d6166c.json",
  projectId: projectId
});

// Initialize Document AI client with explicit credentials
const documentAIClient = new DocumentProcessorServiceClient({
  credentials: {
    client_email: require("D:\\Downloads\\").client_email,
    private_key: require("D:\\Downloads\\n").private_key
  },
  projectId: projectId
});

const uploadToCloudStorage = async (localPath, filename) => {
  await storage.bucket(bucketName).upload(localPath, {
    destination: filename,
  });
  return `gs://${bucketName}/${filename}`;
};

app.post("/ask", upload.single("pdf"), async (req, res) => {
  try {
    const question = req.body.question;
    const filePath = req.file.path;
    const filename = req.file.originalname;

    // 1. Upload to Cloud Storage
    const gcsPath = await uploadToCloudStorage(filePath, filename);

    // 2. Call Document AI OCR
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    const request = {
      name,
      rawDocument: {
        content: await fs.promises.readFile(filePath),
        mimeType: "application/pdf",
      },
    };
    const [result] = await documentAIClient.processDocument(request);
    const fullText = result.document.text;

    // 3. Chunk and embed if not already done for this PDF
    if (!pdfEmbeddingsStore[filename]) {
      const chunks = chunkText(fullText, 2000);
      const chunkEmbeddings = await getEmbeddings(chunks, VERTEX_API_KEY, projectId, vertexLocation);
      pdfEmbeddingsStore[filename] = { chunks, chunkEmbeddings };
    }
    const { chunks, chunkEmbeddings } = pdfEmbeddingsStore[filename];

    // 4. Embed the question
    const [questionEmbedding] = await getEmbeddings([question], VERTEX_API_KEY, projectId, vertexLocation);

    // 5. Find top 5 most relevant chunks
    const topIdxs = findMostSimilarChunks(questionEmbedding, chunkEmbeddings, 5);
    const context = topIdxs.map(idx => chunks[idx]).join("\n\n");

    // 6. Call Gemini with only the relevant context
    const geminiRes = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=",
      {
        contents: [
          {
            parts: [
              { text: `Use this context to answer: ${question}\n\n${context}` },
            ],
          },
        ],
      }
    );

    const answer = geminiRes.data.candidates[0].content.parts[0].text;
    res.json({ answer });
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data
    });
    res.status(500).json({ 
      error: "An error occurred while processing the document",
      details: error.message 
    });
  }
});
  
  const PORT = 5000;

const testPermissions = async () => {
  try {
    // Test Storage permissions
    await storage.bucket(bucketName).exists();
    console.log('✓ Storage permissions verified');
    
    // Test Document AI permissions
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    await documentAIClient.getProcessor({ name });
    console.log('✓ Document AI permissions verified');
    
    return true;
  } catch (error) {
    console.error('Permission test failed:', error.message);
    return false;
  }
};

// Add this before starting the server
checkProcessor()
  .then(() => testPermissions())
  .then((permissionsOk) => {
    if (permissionsOk) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } else {
      console.error('Permission verification failed');
      process.exit(1);
    }
  });