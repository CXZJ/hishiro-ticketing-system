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
  chatbotContext: `You are a professional customer support assistant for Hishiro.id, a premium Indonesian e-commerce brand specializing in anime-inspired streetwear and accessories.

Company Profile:
- Brand: Hishiro.id
- Location: Indonesia
- Focus: Premium anime-inspired streetwear and accessories
- Target Audience: Fashion-conscious anime enthusiasts and streetwear lovers
- Products: High-quality t-shirts, hoodies, accessories, and collectibles with unique anime designs
- Brand Values: Quality, Innovation, Customer Satisfaction, Anime Culture Appreciation

Product Catalog:
1. Signature Hishiro Urahara Cardigan
   - Price: Rp 189.500 – Rp 374.000
   - Material: 100% cotton (multicolor olive & cream)
   - Features: Cream-patterned buttons, printed graphics, loose rib stitch, satin neck label, embroidered logo
   - Fit: Oversize boxy mid-crop
   - Sizes: M (63×59cm), L (66×63cm), XL (68×67cm), XXL (71×72cm)
   - Care: Cold wash, no bleach, iron inside out, wash with similar colors

2. Hishiro's Signature Dark Kon Button-Up [Pre-Order]
   - Price: Rp 519.000
   - Status: Sold Out
   - Material: 100% Japan Drill fabric
   - Features: Embroidered logo, boxy mid-crop fit, "Kon" graphics
   - Sizes: S, M, L, XL, XXL
   - Care: Cold wash, no bleach, iron inside out

3. Hishiro's Signature Y2K Toshiro True Bankai Jacket
   - Status: Sold Out
   - Material: 100% organic heavyweight cotton
   - Features: Custom hardware zipper, cut & sewn panels, distressed detailing
   - Sizes: S, M, L, XL, XXL
   - Care: Cold wash, no bleach, iron inside out

4. Hishiro's Signature Y2K Ghoul Workshirt
   - Price: Rp 519.000
   - Status: Sold Out
   - Features: Boxy mid-crop cut, embroidered branding, ghoul artwork
   - Sizes: S, M, L, XL, XXL
   - Care: Cold wash, no bleach, iron inside out

5. Signature Hishiro Vagabond Corduroy Button-Up
   - Price: Rp 389.000 – Rp 409.000
   - Status: Sold Out
   - Material: 100% cotton corduroy
   - Features: Patterned buttons, cotton-combed lining, embroidered design
   - Sizes: S (61×57cm) to XXXL (72×74cm)
   - Care: Cold wash, no bleach, iron inside out

6. Signature Hishiro Vagabond Sling Bag
   - Price: Rp 229.000
   - Status: Sold Out
   - Features: Adjustable strap, Hishiro embroidery/logo

7. Signature Hishiro Vinland Saga Oversize Boxy Shirt
   - Price: Rp 239.000 – Rp 259.000
   - Status: Sold Out
   - Material: 100% cotton jersey
   - Features: Vinland Saga graphics, embroidered logo
   - Sizes: S, M, L, XL, XXL
   - Care: Cold wash, no bleach, iron inside out

8. Luffy Boxy Racing Knitted Jacket
   - Price: Rp 419.000
   - Fit: Boxy, mid-crop silhouette
   - Sizes: M, L, XL

9. Zoro Boxy Racing Knitted Jacket
   - Price: Rp 419.000
   - Fit: Boxy, mid-crop silhouette
   - Sizes: M, L, XL

10. ACE Jorts
    - Available in sizes: S, M, L, XL, XXL

11. Sweater Yuta
    - Available in sizes: S, M, L, XL, XXL

12. Gojo Shirt
    - Available in sizes: S, M, L, XL, XXL

Your Role:
- Provide professional and knowledgeable support for all customer inquiries
- Assist with product information, sizing guidance, and order management
- Handle shipping inquiries, returns, and general customer service
- Maintain a professional yet approachable tone that reflects our brand identity
- Ensure customer satisfaction while upholding our premium service standards

Guidelines:
- Always maintain a professional and courteous tone
- Be knowledgeable about our products and anime culture that related to our products but doesnt mean you have to talk about anime culture if the customer didnt ask about it
- Provide clear and accurate information about product specifications, sizes, materials, and care instructions
- When discussing products, always mention their current availability status
- For sold-out items, inform customers about potential restocks or similar alternatives
- Escalate complex issues to human support when necessary
- Create support tickets for detailed inquiries requiring personalized attention
- Stay true to Hishiro.id's brand voice and values`
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
  
  // Product-specific responses
  if (message.includes('list') || message.includes('products') || message.includes('collection') || message.includes('items')) {
    return {
      text: "Here are our current products:\n\n1. Signature Hishiro Urahara Cardigan (Rp 189.500 – Rp 374.000)\n2. Luffy Boxy Racing Knitted Jacket (Rp 419.000)\n3. Zoro Boxy Racing Knitted Jacket (Rp 419.000)\n4. ACE Jorts\n5. Sweater Yuta\n6. Gojo Shirt\n\nNote: Several items are currently sold out, including the Dark Kon Button-Up, Toshiro True Bankai Jacket, Ghoul Workshirt, Vagabond Corduroy Button-Up, Vagabond Sling Bag, and Vinland Saga Oversize Boxy Shirt.",
      needsTicket: false
    };
  }
  
  if (message.includes('urahara') || message.includes('cardigan')) {
    return {
      text: "The Signature Hishiro Urahara Cardigan is available in sizes M (63×59cm) to XXL (71×72cm), priced from Rp 189.500 to Rp 374.000. Made from 100% cotton with cream-patterned buttons and embroidered Hishiro logo.",
      needsTicket: false
    };
  }
  
  if (message.includes('kon') || message.includes('button-up')) {
    return {
      text: "The Signature Dark Kon Button-Up is currently sold out. It was priced at Rp 519.000 and made from 100% Japan Drill fabric with embroidered branding.",
      needsTicket: false
    };
  }
  
  if (message.includes('toshiro') || message.includes('bankai')) {
    return {
      text: "The Y2K Toshiro True Bankai Jacket is currently sold out. It was made from 100% organic heavyweight cotton with custom hardware zipper and distressed detailing.",
      needsTicket: false
    };
  }
  
  if (message.includes('ghoul') || message.includes('workshirt')) {
    return {
      text: "The Y2K Ghoul Workshirt is currently sold out. It was priced at Rp 519.000 and featured a boxy mid-crop cut with embroidered branding.",
      needsTicket: false
    };
  }
  
  if (message.includes('vagabond') || message.includes('corduroy')) {
    return {
      text: "The Signature Hishiro Vagabond Corduroy Button-Up is currently sold out. It was priced from Rp 389.000 to Rp 409.000 and available in sizes S (61×57cm) to XXXL (72×74cm).",
      needsTicket: false
    };
  }
  
  if (message.includes('sling bag') || message.includes('vagabond bag')) {
    return {
      text: "The Signature Hishiro Vagabond Sling Bag is currently sold out. It was priced at Rp 229.000 and featured an adjustable strap with Hishiro embroidery.",
      needsTicket: false
    };
  }
  
  if (message.includes('vinland') || message.includes('saga')) {
    return {
      text: "The Signature Hishiro Vinland Saga Oversize Boxy Shirt is currently sold out. It was priced from Rp 239.000 to Rp 259.000 and made from 100% cotton jersey.",
      needsTicket: false
    };
  }
  
  if (message.includes('luffy') || message.includes('racing')) {
    return {
      text: "The Luffy Boxy Racing Knitted Jacket is available for Rp 419.000 in sizes M, L, and XL. It features a boxy, mid-crop silhouette.",
      needsTicket: false
    };
  }
  
  if (message.includes('zoro') || message.includes('racing jacket')) {
    return {
      text: "The Zoro Boxy Racing Knitted Jacket is available for Rp 419.000 in sizes M, L, and XL. It features a boxy, mid-crop silhouette.",
      needsTicket: false
    };
  }
  
  if (message.includes('ace') || message.includes('jorts')) {
    return {
      text: "The ACE Jorts are available in sizes S through XXL.",
      needsTicket: false
    };
  }
  
  if (message.includes('yuta') || message.includes('sweater')) {
    return {
      text: "The Sweater Yuta is available in sizes S through XXL.",
      needsTicket: false
    };
  }
  
  if (message.includes('gojo') || message.includes('shirt')) {
    return {
      text: "The Gojo Shirt is available in sizes S through XXL.",
      needsTicket: false
    };
  }
  
  // Greetings - always allow without ticket creation
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message === '' || message.includes('help')) {
    return {
      text: "Welcome to Hishiro.id! I'm here to help you with our premium anime-inspired streetwear and accessories. How may I assist you today?",
      needsTicket: false
    };
  }
  
  // If user hasn't provided detailed description yet (less than 15 words), ask for more details
  if (wordCount < 15 && detailedUserMessages.length === 0) {
    if (message.includes('product') || message.includes('shirt') || message.includes('hoodie') || message.includes('merchandise') || message.includes('anime')) {
      return {
        text: "I can help you with our products. What specific item would you like to know about?",
        needsTicket: false
      };
    }
    
    if (message.includes('order') || message.includes('delivery') || message.includes('shipping') || message.includes('track')) {
      return {
        text: "I can help with your order. Please provide your order number.",
        needsTicket: false
      };
    }
    
    if (message.includes('size') || message.includes('fit') || message.includes('measurement')) {
      return {
        text: "I can help with sizing. Which item are you interested in?",
        needsTicket: false
      };
    }
    
    if (message.includes('return') || message.includes('refund') || message.includes('exchange')) {
      return {
        text: "I can help with your return. Please provide your order number.",
        needsTicket: false
      };
    }
    
    if (message.includes('payment') || message.includes('card') || message.includes('billing') || message.includes('charge')) {
      return {
        text: "I can help with payment-related inquiries. What's your specific concern?",
        needsTicket: false
      };
    }
    
    // General short message
    return {
      text: "How can I help you today?",
      needsTicket: false
    };
  }
  
  // User has provided sufficient detail, now we can create tickets
  if (message.includes('product') || message.includes('shirt') || message.includes('hoodie') || message.includes('merchandise') || message.includes('anime')) {
    return {
      text: "Thank you for your detailed product inquiry. I'll create a support ticket so our team can provide you with comprehensive information about our products, including availability, sizing charts, and specific details about the items you're interested in.",
      needsTicket: true,
      subject: "Product Information Request"
    };
  }
  
  if (message.includes('order') || message.includes('delivery') || message.includes('shipping') || message.includes('track')) {
    return {
      text: "Thank you for providing those details about your order. I'll create a support ticket so our team can look up your specific order information and provide you with accurate status updates and assistance.",
      needsTicket: true,
      subject: "Order & Shipping Inquiry"
    };
  }
  
  if (message.includes('size') || message.includes('fit') || message.includes('measurement')) {
    return {
      text: "Thank you for your detailed sizing inquiry. I'll create a support ticket so our team can provide you with precise sizing charts and personalized fit recommendations for the items you're interested in.",
      needsTicket: true,
      subject: "Sizing & Fit Assistance"
    };
  }
  
  if (message.includes('return') || message.includes('refund') || message.includes('exchange') || message.includes('wrong size')) {
    return {
      text: "I understand your return/exchange request. I'll create a support ticket so our team can review your case and guide you through our return process, ensuring a smooth resolution to your request.",
      needsTicket: true,
      subject: "Return & Exchange Request"
    };
  }
  
  if (message.includes('payment') || message.includes('card') || message.includes('billing') || message.includes('charge')) {
    return {
      text: "Thank you for explaining your payment concern. I'll create a support ticket so our team can securely assist you with your payment inquiry and ensure your transaction is handled properly.",
      needsTicket: true,
      subject: "Payment & Billing Support"
    };
  }
  
  // For any detailed message (15+ words) that doesn't fit other categories
  if (wordCount >= 15 || detailedUserMessages.length > 0) {
    return {
      text: "Thank you for providing those details. I'll create a support ticket so our team can give your inquiry the attention it deserves and provide you with a comprehensive response.",
      needsTicket: true,
      subject: "Detailed Customer Inquiry"
    };
  }
  
  // Default response for short messages without enough context
  return {
    text: "Thank you for contacting Hishiro.id support. I'm here to assist you with any questions about our premium anime-inspired streetwear, orders, sizing, returns, or other inquiries. Please let me know how I can help you today.",
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
    "create support ticket",
    "complex issue",
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