import { GoogleGenerativeAI } from "@google/generative-ai";
import { companyInfo } from "../config/companyInfo";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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

// Generate bot response using Gemini
export const generateBotResponse = async (messages) => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured. Please check your .env file.");
    }

    // Use the correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Format chat history for the API
    const chatHistory = formatChatHistory(messages);
    
    // Start a chat session with company context
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: companyInfo.chatbotContext + "\n\nIf you cannot resolve the user's issue or if it requires human intervention, please indicate that a ticket should be created by including the phrase 'create a ticket' in your response." }]
        },
        {
          role: "model",
          parts: [{ text: "I understand. I am a customer support assistant for Hishiro.id and will help users with their inquiries about our anime-inspired streetwear and accessories. If I cannot resolve an issue, I will indicate that a ticket should be created." }]
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
    
    return {
      text: responseText,
      needsTicket
    };
  } catch (error) {
    console.error("Error generating bot response:", error);
    
    // Provide more specific error messages based on the error type
    if (error.message.includes("API key")) {
      return {
        text: "I apologize, but there's a configuration issue with the chatbot. Please contact the administrator.",
        needsTicket: true
      };
    } else if (error.message.includes("quota")) {
      return {
        text: "I apologize, but the chatbot is currently experiencing high traffic. Please try again in a few minutes.",
        needsTicket: true
      };
    } else {
      return {
        text: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        needsTicket: true
      };
    }
  }
}; 