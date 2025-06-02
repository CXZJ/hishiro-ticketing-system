import { GoogleGenerativeAI } from "@google/generative-ai";
import { companyInfo } from "../config/companyInfo";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Retry utility function
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      // Check if it's a retryable error (503, 429, network errors)
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
      
      // Exponential backoff: wait 1s, 2s, 4s...
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Format chat history for Gemini API
const formatChatHistory = (messages) => {
  return messages.map(msg => ({
    role: msg.from === "user" ? "user" : "model",
    parts: [{ text: msg.text }]
  }));
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

// Generate a sophisticated subject using Gemini with retry
const generateSubject = async (message) => {
  try {
    return await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `Given the following customer support message, generate a concise and descriptive subject line (maximum 100 characters) that summarizes the main issue. The subject should be clear and professional, suitable for a support ticket.

Message: "${message}"

Generate only the subject line, nothing else.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const subject = response.text().trim();
      
      // Ensure the subject is not too long
      return subject.length > 100 ? subject.substring(0, 97) + '...' : subject;
    });
  } catch (error) {
    console.error("Error generating subject:", error);
    // Fallback to basic subject generation if AI fails completely
    const firstSentence = message.split(/[.!?]/)[0].trim();
    const fallbackSubject = firstSentence.length > 0 ? firstSentence : "Support Request";
    return fallbackSubject.length > 100 ? fallbackSubject.substring(0, 97) + '...' : fallbackSubject;
  }
};

// Fallback responses for when AI is unavailable
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
  
  if (message.includes('account') || message.includes('login') || message.includes('password')) {
    return {
      text: "I understand you're having account-related issues. Our AI is currently experiencing high traffic, but I can create a support ticket for our technical team to help you.",
      needsTicket: true,
      subject: "Account Support"
    };
  }
  
  return {
    text: "Hello! I'm currently experiencing high traffic and might be a bit slow to respond. I'm here to help with questions about Hishiro.id's anime-inspired streetwear and accessories. If you need immediate assistance, I can create a support ticket for our team to help you directly.",
    needsTicket: true,
    subject: "General Support Request"
  };
};

// Generate bot response using Gemini with retry logic
export const generateBotResponse = async (messages) => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured. Please check your .env file.");
    }

    // Try to generate response with retry logic
    return await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Format chat history for the API
      const chatHistory = formatChatHistory(messages);
      
      // Start a chat session with company context
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
          ...chatHistory.slice(0, -1) // Exclude the last message
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      // Get the last message from the user
      const lastMessage = messages[messages.length - 1];
      
      // Generate response
      const result = await chat.sendMessage(lastMessage.text);
      const response = await result.response;
      const responseText = response.text();
      
      // Check if we should create a ticket
      const needsTicket = shouldCreateTicket(responseText);
      
      // Check if we have enough context for a ticket
      const hasProblemDescription = messages.some(msg => 
        msg.from === "user" && 
        msg.text.length > 50 && // Basic check for detailed description
        !shouldCreateTicket(msg.text) // Not a ticket request itself
      );

      // Generate subject if ticket is needed
      let subject = '';
      if (needsTicket && hasProblemDescription) {
        const problemDescription = messages
          .filter(msg => msg.from === "user" && msg.text.length > 50)
          .map(msg => msg.text)
          .join("\n\n");
        subject = await generateSubject(problemDescription);
      }
      
      return {
        text: responseText,
        needsTicket: needsTicket && hasProblemDescription,
        subject // Include the generated subject in the response
      };
    }, 3, 2000); // Retry 3 times with 2s base delay

  } catch (error) {
    console.error("Error generating bot response:", error);
    
    // Get the last user message for fallback response
    const lastUserMessage = messages[messages.length - 1]?.text || "";
    
    // Provide more specific error messages and fallbacks based on the error type
    if (error.message.includes("API key")) {
      return {
        text: "I apologize, but there's a configuration issue with the chatbot. Please contact the administrator or create a support ticket for assistance.",
        needsTicket: true,
        subject: "Chatbot Configuration Issue"
      };
    } else if (error.message.includes("quota") || error.message.includes("limit")) {
      return {
        text: "I'm currently experiencing high demand and have reached my response limit. Please try again in a few minutes, or I can create a support ticket for immediate assistance.",
        needsTicket: true,
        subject: "Chatbot Service Limit Reached"
      };
    } else if (error.message.includes("503") || error.message.includes("overloaded")) {
      // Use intelligent fallback based on user's message
      const fallbackResponse = getFallbackResponse(lastUserMessage);
      return {
        text: `🤖 AI Assistant is busy: ${fallbackResponse.text}`,
        needsTicket: fallbackResponse.needsTicket,
        subject: fallbackResponse.subject
      };
    } else {
      // Generic fallback with context-aware response
      const fallbackResponse = getFallbackResponse(lastUserMessage);
      return {
        text: `I'm temporarily having trouble processing requests. ${fallbackResponse.text}`,
        needsTicket: fallbackResponse.needsTicket,
        subject: fallbackResponse.subject
      };
    }
  }
}; 