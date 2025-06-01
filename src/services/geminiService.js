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

// Generate a sophisticated subject using Gemini
const generateSubject = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Given the following customer support message, generate a concise and descriptive subject line (maximum 100 characters) that summarizes the main issue. The subject should be clear and professional, suitable for a support ticket.

Message: "${message}"

Generate only the subject line, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const subject = response.text().trim();
    
    // Ensure the subject is not too long
    return subject.length > 100 ? subject.substring(0, 97) + '...' : subject;
  } catch (error) {
    console.error("Error generating subject:", error);
    // Fallback to basic subject generation if AI fails
    const firstSentence = message.split(/[.!?]/)[0].trim();
    return firstSentence.length > 100 ? firstSentence.substring(0, 97) + '...' : firstSentence;
  }
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
  } catch (error) {
    console.error("Error generating bot response:", error);
    
    // Provide more specific error messages based on the error type
    if (error.message.includes("API key")) {
      return {
        text: "I apologize, but there's a configuration issue with the chatbot. Please contact the administrator.",
        needsTicket: true,
        subject: "Chatbot Configuration Issue"
      };
    } else if (error.message.includes("quota")) {
      return {
        text: "I apologize, but the chatbot is currently experiencing high traffic. Please try again in a few minutes.",
        needsTicket: true,
        subject: "Chatbot Service Unavailable"
      };
    } else {
      return {
        text: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        needsTicket: true,
        subject: "Technical Support Required"
      };
    }
  }
}; 