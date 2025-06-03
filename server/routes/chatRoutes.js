import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize the Gemini API with proper error handling
const getGeminiAPI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === '${GEMINI_API_KEY}' || apiKey.trim() === '') {
    console.log('Gemini API key not properly configured');
    return null;
  }
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
    return null;
  }
};

// Check if Gemini API is available
const isGeminiAvailable = () => {
  const genAI = getGeminiAPI();
  return genAI !== null;
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

// Simple rule-based responses when Gemini is not available
const getSimpleResponse = (userMessage) => {
  const message = userMessage.toLowerCase();
  
  // Greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message === '' || message.includes('help')) {
    return {
      text: "Hello! Welcome to Hishiro.id! I'm here to help you with our anime-inspired streetwear and accessories. How can I assist you today? Whether you're looking for the perfect anime tee, need sizing help, or have questions about your order, I'm here to help!",
      needsTicket: false
    };
  }
  
  // Product inquiries
  if (message.includes('product') || message.includes('shirt') || message.includes('hoodie') || message.includes('merchandise') || message.includes('anime')) {
    return {
      text: "Awesome! You're interested in our anime-inspired collection! 🎌 We have amazing t-shirts, hoodies, and accessories featuring popular anime designs. For detailed product information, sizing charts, and current availability, I'd be happy to create a support ticket so our team can provide you with complete product details and help you find the perfect items!",
      needsTicket: true,
      subject: "Product Information Request"
    };
  }
  
  // Order inquiries
  if (message.includes('order') || message.includes('delivery') || message.includes('shipping') || message.includes('track')) {
    return {
      text: "I can help you with order-related questions! 📦 Whether you need to track a shipment, check order status, or have questions about delivery, our support team can provide you with detailed information. Let me create a support ticket for you so our team can look up your specific order details.",
      needsTicket: true,
      subject: "Order & Shipping Inquiry"
    };
  }
  
  // Sizing questions
  if (message.includes('size') || message.includes('fit') || message.includes('measurement')) {
    return {
      text: "Great question about sizing! 📏 Getting the perfect fit is super important for our anime streetwear. Our sizing can vary between different product lines and styles. I'd love to help you get the exact measurements and sizing recommendations - let me create a support ticket so our team can provide you with detailed sizing charts and personalized fit advice!",
      needsTicket: true,
      subject: "Sizing & Fit Assistance"
    };
  }
  
  // Returns/refunds
  if (message.includes('return') || message.includes('refund') || message.includes('exchange') || message.includes('wrong size')) {
    return {
      text: "I understand you need help with a return or exchange! 🔄 We want to make sure you're completely happy with your Hishiro.id purchase. Our return policy and process can vary depending on the item and timing. Let me create a support ticket so our team can review your specific situation and guide you through the return process.",
      needsTicket: true,
      subject: "Return & Exchange Request"
    };
  }
  
  // Payment issues
  if (message.includes('payment') || message.includes('card') || message.includes('billing') || message.includes('charge')) {
    return {
      text: "I can help you with payment-related concerns! 💳 Whether it's about payment methods, billing questions, or transaction issues, our team can assist you. For security and privacy reasons, let me create a support ticket so our team can safely help you with your payment inquiry.",
      needsTicket: true,
      subject: "Payment & Billing Support"
    };
  }
  
  // General long messages that might need human help
  if (message.length > 100) {
    return {
      text: "Thank you for providing detailed information about your inquiry! 📝 I can see you have a specific question or situation that would benefit from personalized assistance from our support team. Let me create a support ticket so our team can give you the detailed attention your inquiry deserves.",
      needsTicket: true,
      subject: "Detailed Customer Inquiry"
    };
  }
  
  // Default response
  return {
    text: "Thank you for reaching out to Hishiro.id! 🌟 I'm here to help with questions about our anime-inspired streetwear, orders, sizing, returns, and more. Could you tell me a bit more about what you need help with? Or if you prefer, I can create a support ticket so our team can assist you directly!",
    needsTicket: true,
    subject: "General Support Request"
  };
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Given the following customer support message, generate a concise and descriptive subject line (maximum 100 characters) that summarizes the main issue. The subject should be clear and professional, suitable for a support ticket.

Message: "${message}"

Generate only the subject line, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const subject = response.text().trim();
    
    return subject.length > 100 ? subject.substring(0, 97) + '...' : subject;
  } catch (error) {
    console.error("Error generating subject:", error);
    const firstSentence = message.split(/[.!?]/)[0].trim();
    const fallbackSubject = firstSentence.length > 0 ? firstSentence : "Support Request";
    return fallbackSubject.length > 100 ? fallbackSubject.substring(0, 97) + '...' : fallbackSubject;
  }
};

/**
 * @swagger
 * /api/chat/generate-response:
 *   post:
 *     summary: Generate chatbot response
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
 *                       enum: [user, support]
 *                     text:
 *                       type: string
 *                     type:
 *                       type: string
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
      return res.status(400).json({ 
        message: 'Messages array is required',
        text: "I need some input to help you! Please tell me what you need assistance with.",
        needsTicket: false
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.from !== 'user') {
      return res.status(400).json({ 
        message: 'Last message must be from user',
        text: "I need a message from you to respond to! How can I help you today?",
        needsTicket: false
      });
    }

    // Check if Gemini is available
    if (!isGeminiAvailable()) {
      console.log('Gemini API not available, using simple responses');
      const response = getSimpleResponse(lastUserMessage.text);
      return res.json(response);
    }

    // Try to use Gemini API
    try {
      const genAI = getGeminiAPI();
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",  // Use a more stable model
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      });

      // Format conversation history for Gemini
      const conversationHistory = messages
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `${msg.from === 'user' ? 'Customer' : 'Assistant'}: ${msg.text}`)
        .join('\n');

      const prompt = `${companyInfo.chatbotContext}

Previous conversation:
${conversationHistory}

Customer: ${lastUserMessage.text}

Please respond as a helpful Hishiro.id customer support assistant. If the customer's issue seems complex or requires human intervention, suggest that they might benefit from creating a support ticket by mentioning "create a ticket" in your response.`;

      const result = await model.generateContent(prompt);
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
        
        // Simple subject generation since Gemini might not be working well
        const firstSentence = problemDescription.split(/[.!?]/)[0].trim();
        subject = firstSentence.length > 0 && firstSentence.length <= 100 
          ? firstSentence 
          : problemDescription.substring(0, 97) + '...';
      }
      
      return res.json({
        text: responseText,
        needsTicket: needsTicket && hasProblemDescription,
        subject
      });
      
    } catch (geminiError) {
      console.error("Error with Gemini API:", geminiError);
      
      // Fallback to simple responses if Gemini fails
      const fallbackResponse = getSimpleResponse(lastUserMessage.text);
      return res.json(fallbackResponse);
    }

  } catch (error) {
    console.error("Error generating bot response:", error);
    
    const lastUserMessage = req.body.messages?.[req.body.messages.length - 1]?.text || "";
    const fallbackResponse = getSimpleResponse(lastUserMessage);
    
    return res.status(500).json({
      text: `I'm temporarily having trouble processing requests. ${fallbackResponse.text}`,
      needsTicket: fallbackResponse.needsTicket,
      subject: fallbackResponse.subject
    });
  }
});

export default router; 