import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize the Gemini API
const getGeminiAPI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured in server environment');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// Company information for context
const companyInfo = {
  chatbotContext: `You are a helpful customer support assistant for Hishiro.id, a trendy online store specializing in anime-inspired streetwear and accessories. 

Company Overview:
- Name: Hishiro.id
- Focus: Anime-inspired streetwear, clothing, and accessories
- Target audience: Anime fans, streetwear enthusiasts, young adults
- Products: T-shirts, hoodies, accessories, collectibles with anime themes
- Tone: Friendly, knowledgeable, enthusiastic about anime culture

Your Role:
- Help customers with product inquiries, order questions, and general support
- Provide information about sizing, materials, and product details
- Assist with order status, shipping, and return policies
- Guide users through the website and shopping process
- Be enthusiastic about anime culture while remaining professional

Guidelines:
- Always be helpful, friendly, and professional
- Use anime/otaku terminology when appropriate but keep it accessible
- If you cannot resolve an issue, offer to escalate to human support
- For complex technical issues, recommend creating a support ticket
- Stay in character as a Hishiro.id support representative`
};

// Retry utility function
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      const isRetryable = 
        error.message.includes('503') || 
        error.message.includes('overloaded') ||
        error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.includes('network') ||
        error.message.includes('timeout');
      
      if (!isRetryable || i === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Check if response indicates need for ticket
const shouldCreateTicket = (response) => {
  const ticketKeywords = [
    "create a ticket",
    "need a ticket", 
    "generate a ticket",
    "requires human assistance",
    "needs human intervention",
    "escalate to support",
    "contact support team",
    "create support ticket"
  ];
  
  return ticketKeywords.some(keyword => 
    response.toLowerCase().includes(keyword)
  );
};

// Generate subject for ticket
const generateSubject = async (message, genAI) => {
  try {
    return await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `Given the following customer support message, generate a concise and descriptive subject line (maximum 100 characters) that summarizes the main issue. The subject should be clear and professional, suitable for a support ticket.

Message: "${message}"

Generate only the subject line, nothing else.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const subject = response.text().trim();
      
      return subject.length > 100 ? subject.substring(0, 97) + '...' : subject;
    });
  } catch (error) {
    console.error("Error generating subject:", error);
    const firstSentence = message.split(/[.!?]/)[0].trim();
    const fallbackSubject = firstSentence.length > 0 ? firstSentence : "Support Request";
    return fallbackSubject.length > 100 ? fallbackSubject.substring(0, 97) + '...' : fallbackSubject;
  }
};

// Fallback responses
const getFallbackResponse = (userMessage) => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('order') || message.includes('delivery') || message.includes('shipping')) {
    return {
      text: "I understand you have a question about orders or shipping. While our AI assistant is temporarily unavailable, I can help you create a support ticket for our team to assist you with order-related inquiries.",
      needsTicket: true,
      subject: "Order/Shipping Inquiry"
    };
  }
  
  if (message.includes('return') || message.includes('refund') || message.includes('exchange')) {
    return {
      text: "I see you need help with returns or refunds. Our AI is currently busy, but I can create a support ticket for our team to help you with your return/refund request.",
      needsTicket: true,
      subject: "Return/Refund Request"
    };
  }
  
  if (message.includes('product') || message.includes('item') || message.includes('size')) {
    return {
      text: "I notice you have questions about our products. While our AI assistant is temporarily overloaded, I can help you submit a support ticket for detailed product information.",
      needsTicket: true,
      subject: "Product Inquiry"
    };
  }
  
  return {
    text: "Hello! I'm currently experiencing high traffic and might be a bit slow to respond. I'm here to help with questions about Hishiro.id's anime-inspired streetwear and accessories. If you need immediate assistance, I can create a support ticket for our team to help you directly.",
    needsTicket: true,
    subject: "General Support Request"
  };
};

/**
 * @swagger
 * /api/chat/generate-response:
 *   post:
 *     summary: Generate chatbot response using Gemini AI
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       enum: [user, bot]
 *                     text:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Bot response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                 needsTicket:
 *                   type: boolean
 *                 subject:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error generating response
 */
router.post('/generate-response', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const genAI = getGeminiAPI();
    
    // Format chat history
    const chatHistory = messages.map(msg => ({
      role: msg.from === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // Generate response with retry logic
    const result = await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: companyInfo.chatbotContext + "\n\nIf you cannot resolve the user's issue or if it requires human intervention, please first ask them to describe their problem in detail. Only after they provide a detailed description, indicate that a ticket should be created by including the phrase 'create a ticket' in your response." }]
          },
          {
            role: "model", 
            parts: [{ text: "I understand. I am a customer support assistant for Hishiro.id and will help users with their inquiries about our anime-inspired streetwear and accessories. If I cannot resolve an issue, I will first ask for a detailed problem description before suggesting ticket creation." }]
          },
          ...chatHistory.slice(0, -1)
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.text);
      const response = await result.response;
      const responseText = response.text();
      
      const needsTicket = shouldCreateTicket(responseText);
      
      const hasProblemDescription = messages.some(msg => 
        msg.from === "user" && 
        msg.text.length > 50 && 
        !shouldCreateTicket(msg.text)
      );

      let subject = '';
      if (needsTicket && hasProblemDescription) {
        const problemDescription = messages
          .filter(msg => msg.from === "user" && msg.text.length > 50)
          .map(msg => msg.text)
          .join("\n\n");
        subject = await generateSubject(problemDescription, genAI);
      }
      
      return {
        text: responseText,
        needsTicket: needsTicket && hasProblemDescription,
        subject
      };
    }, 3, 2000);

    res.json(result);

  } catch (error) {
    console.error("Error generating bot response:", error);
    
    const lastUserMessage = req.body.messages?.[req.body.messages.length - 1]?.text || "";
    
    if (error.message.includes("API key") || error.message.includes("not configured")) {
      return res.status(500).json({
        text: "I apologize, but there's a configuration issue with the chatbot. Please contact the administrator or create a support ticket for assistance.",
        needsTicket: true,
        subject: "Chatbot Configuration Issue"
      });
    } else if (error.message.includes("quota") || error.message.includes("limit")) {
      return res.status(429).json({
        text: "I'm currently experiencing high demand and have reached my response limit. Please try again in a few minutes, or I can create a support ticket for immediate assistance.",
        needsTicket: true,
        subject: "Chatbot Service Limit Reached"
      });
    } else {
      const fallbackResponse = getFallbackResponse(lastUserMessage);
      return res.status(500).json({
        text: `I'm temporarily having trouble processing requests. ${fallbackResponse.text}`,
        needsTicket: fallbackResponse.needsTicket,
        subject: fallbackResponse.subject
      });
    }
  }
});

export default router; 