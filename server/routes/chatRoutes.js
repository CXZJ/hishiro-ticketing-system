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

// Retry utility function for Gemini API calls
const retryGeminiCall = async (apiCall, maxRetries = 2, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`Gemini API attempt ${i + 1} failed:`, error.message);
      
      const isRetryable = 
        error.message.includes('503') || 
        error.message.includes('overloaded') ||
        error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.includes('DEADLINE_EXCEEDED') ||
        error.message.includes('network') ||
        error.message.includes('timeout');
      
      if (!isRetryable || i === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(1.5, i);
      console.log(`Retrying Gemini API in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
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
const getSimpleResponse = (userMessage, conversationHistory = []) => {
  const message = userMessage.toLowerCase();
  const wordCount = userMessage.trim().split(/\s+/).length;
  
  // Count how many detailed messages user has provided
  const detailedUserMessages = conversationHistory.filter(msg => 
    msg.from === "user" && 
    msg.text.trim().split(/\s+/).length >= 15
  );
  
  // Greetings - always allow without ticket creation
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message === '' || message.includes('help')) {
    return {
      text: "Hello! Welcome to Hishiro.id! I'm here to help you with our anime-inspired streetwear and accessories. How can I assist you today? Whether you're looking for the perfect anime tee, need sizing help, or have questions about your order, I'm here to help!",
      needsTicket: false
    };
  }
  
  // If user hasn't provided detailed description yet (less than 15 words), ask for more details
  if (wordCount < 15 && detailedUserMessages.length === 0) {
    if (message.includes('product') || message.includes('shirt') || message.includes('hoodie') || message.includes('merchandise') || message.includes('anime')) {
      return {
        text: "I'd love to help you with our anime-inspired products! To give you the best assistance, could you please describe in more detail what specific products you're looking for, what questions you have, or any issues you're experiencing? The more details you provide, the better I can help you!",
        needsTicket: false
      };
    }
    
    if (message.includes('order') || message.includes('delivery') || message.includes('shipping') || message.includes('track')) {
      return {
        text: "I'm here to help with your order! To assist you effectively, could you please provide more details about your specific concern? For example, what's your order number, what issue are you experiencing, or what information do you need?",
        needsTicket: false
      };
    }
    
    if (message.includes('size') || message.includes('fit') || message.includes('measurement')) {
      return {
        text: "Sizing is super important for our anime streetwear! To help you get the perfect fit, could you tell me more about what specific items you're interested in, what size concerns you have, or if you're having issues with a current order?",
        needsTicket: false
      };
    }
    
    if (message.includes('return') || message.includes('refund') || message.includes('exchange')) {
      return {
        text: "I understand you need help with a return or exchange. To best assist you, could you please provide more details about your situation? What item needs to be returned, when was it purchased, and what's the reason for the return?",
        needsTicket: false
      };
    }
    
    if (message.includes('payment') || message.includes('card') || message.includes('billing') || message.includes('charge')) {
      return {
        text: "I can help with payment-related questions. For your security and to provide the best assistance, could you please describe your specific payment concern in more detail? What issue are you experiencing?",
        needsTicket: false
      };
    }
    
    // General short message
    return {
      text: "I'm here to help! To provide you with the best assistance, could you please describe your question or issue in a bit more detail? The more information you can share, the better I can help you with your Hishiro.id inquiry.",
      needsTicket: false
    };
  }
  
  // User has provided sufficient detail, now we can create tickets
  if (message.includes('product') || message.includes('shirt') || message.includes('hoodie') || message.includes('merchandise') || message.includes('anime')) {
    return {
      text: "Thank you for the detailed information about your product inquiry! I understand you're interested in our anime-inspired collection. Let me create a support ticket so our team can provide you with complete product details, sizing charts, availability, and help you find the perfect items for your style!",
      needsTicket: true,
      subject: "Product Information Request"
    };
  }
  
  if (message.includes('order') || message.includes('delivery') || message.includes('shipping') || message.includes('track')) {
    return {
      text: "Thanks for providing those details about your order inquiry! I can see you need assistance with order-related questions. Let me create a support ticket so our team can look up your specific order details and provide you with the exact information you need.",
      needsTicket: true,
      subject: "Order & Shipping Inquiry"
    };
  }
  
  if (message.includes('size') || message.includes('fit') || message.includes('measurement')) {
    return {
      text: "Perfect! Thank you for the detailed sizing question. Getting the right fit is crucial for our anime streetwear. Let me create a support ticket so our team can provide you with detailed sizing charts, measurements, and personalized fit recommendations for the items you're interested in.",
      needsTicket: true,
      subject: "Sizing & Fit Assistance"
    };
  }
  
  if (message.includes('return') || message.includes('refund') || message.includes('exchange') || message.includes('wrong size')) {
    return {
      text: "I understand your return/exchange situation from your description. Let me create a support ticket so our team can review your specific case, check our return policy for your situation, and guide you through the process step by step.",
      needsTicket: true,
      subject: "Return & Exchange Request"
    };
  }
  
  if (message.includes('payment') || message.includes('card') || message.includes('billing') || message.includes('charge')) {
    return {
      text: "Thank you for explaining your payment concern. For security reasons and to properly address your billing question, let me create a support ticket so our team can safely assist you with your payment inquiry.",
      needsTicket: true,
      subject: "Payment & Billing Support"
    };
  }
  
  // For any detailed message (15+ words) that doesn't fit other categories
  if (wordCount >= 15 || detailedUserMessages.length > 0) {
    return {
      text: "Thank you for providing that detailed information! I can see you have a specific question that would benefit from personalized assistance. Let me create a support ticket so our team can give you the detailed attention your inquiry deserves.",
      needsTicket: true,
      subject: "Detailed Customer Inquiry"
    };
  }
  
  // Default response for short messages without enough context
  return {
    text: "Thank you for reaching out to Hishiro.id! I'm here to help with questions about our anime-inspired streetwear, orders, sizing, returns, and more. To provide the best assistance, could you please tell me more about what you need help with?",
    needsTicket: false
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
      const response = getSimpleResponse(lastUserMessage.text, messages);
      return res.json(response);
    }

    // Try to use Gemini API
    try {
      const genAI = getGeminiAPI();
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",  // Back to the original advanced model
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      });

      // Check if user has provided sufficient detail (15+ words)
      const lastMessageWordCount = lastUserMessage.text.trim().split(/\s+/).length;
      const detailedUserMessages = messages.filter(msg => 
        msg.from === "user" && 
        msg.text.trim().split(/\s+/).length >= 15
      );

      // If user hasn't provided enough detail, ask for more information (don't create ticket yet)
      if (lastMessageWordCount < 15 && detailedUserMessages.length === 0) {
        const prompt = `${companyInfo.chatbotContext}

You are responding to a customer inquiry, but they haven't provided enough detail yet. Your job is to ask them for more specific information about their question or issue. DO NOT create a ticket yet.

Customer message: "${lastUserMessage.text}"

Ask them to provide more details about their specific question or concern. Be helpful and encouraging, but make it clear you need more information to assist them properly. Do not mention creating a ticket - just ask for more details.`;

        const result = await retryGeminiCall(async () => {
          return await model.generateContent(prompt);
        });
        const response = await result.response;
        const responseText = response.text();
        
        return res.json({
          text: responseText,
          needsTicket: false
        });
      }

      // User has provided sufficient detail, now we can use full AI capabilities
      const conversationHistory = messages
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `${msg.from === 'user' ? 'Customer' : 'Assistant'}: ${msg.text}`)
        .join('\n');

      const prompt = `${companyInfo.chatbotContext}

Previous conversation:
${conversationHistory}

Customer: ${lastUserMessage.text}

The customer has provided sufficient detail about their inquiry. Now you can:
1. Try to help them directly if it's a simple question
2. If the issue is complex or requires human intervention, suggest creating a support ticket by mentioning "create a ticket" in your response

Guidelines:
- Be helpful and try to resolve simple questions
- For complex issues (orders, returns, specific product details, technical problems), suggest ticket creation
- Always be friendly and professional
- Acknowledge the details they've provided`;

      const result = await retryGeminiCall(async () => {
        return await model.generateContent(prompt);
      });
      const response = await result.response;
      const responseText = response.text();
      
      const needsTicket = shouldCreateTicket(responseText);
      
      // Only create tickets if user has provided detailed information
      const hasProblemDescription = detailedUserMessages.length > 0 || lastMessageWordCount >= 15;

      let subject = '';
      if (needsTicket && hasProblemDescription) {
        const problemDescription = messages
          .filter(msg => msg.from === "user" && msg.text.trim().split(/\s+/).length >= 15)
          .map(msg => msg.text)
          .join("\n\n");
        
        if (problemDescription) {
          // Try to generate subject with Gemini
          try {
            const subjectModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const subjectPrompt = `Generate a concise support ticket subject (max 100 characters) for this customer inquiry:

"${problemDescription}"

Subject should be clear, professional, and summarize the main issue. Return only the subject line.`;
            
            const subjectResult = await retryGeminiCall(async () => {
              return await subjectModel.generateContent(subjectPrompt);
            });
            const subjectResponse = await subjectResult.response;
            subject = subjectResponse.text().trim();
            
            if (subject.length > 100) {
              subject = subject.substring(0, 97) + '...';
            }
          } catch (subjectError) {
            console.error("Error generating subject with Gemini:", subjectError);
            // Fallback to simple subject generation
            const firstSentence = problemDescription.split(/[.!?]/)[0].trim();
            subject = firstSentence.length > 0 && firstSentence.length <= 100 
              ? firstSentence 
              : problemDescription.substring(0, 97) + '...';
          }
        }
      }
      
      return res.json({
        text: responseText,
        needsTicket: needsTicket && hasProblemDescription,
        subject
      });
      
    } catch (geminiError) {
      console.error("Error with Gemini API:", geminiError);
      
      // Fallback to simple responses if Gemini fails
      const fallbackResponse = getSimpleResponse(lastUserMessage.text, messages);
      return res.json(fallbackResponse);
    }

  } catch (error) {
    console.error("Error generating bot response:", error);
    
    const lastUserMessage = req.body.messages?.[req.body.messages.length - 1]?.text || "";
    const fallbackResponse = getSimpleResponse(lastUserMessage, req.body.messages);
    
    return res.status(500).json({
      text: `I'm temporarily having trouble processing requests. ${fallbackResponse.text}`,
      needsTicket: fallbackResponse.needsTicket,
      subject: fallbackResponse.subject
    });
  }
});

export default router; 