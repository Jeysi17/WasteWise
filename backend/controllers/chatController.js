import { sendToDialogflow } from "../config/dialogflow.js";

// Fallback responses for when Dialogflow fails
const getFallbackResponse = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  
  const fallbackResponses = {
    "what is waste management": {
      reply: "Waste management involves the collection, transport, treatment, and disposal of waste, together with monitoring and regulation of the waste management process. It helps protect the environment and public health.",
      buttons: [
        "What are the benefits?",
        "Why is it important?",
        "Types of waste management",
        "Back to main menu"
      ]
    },
    "what are the benefits of waste management": {
      reply: "Proper waste management offers many benefits:\n\n• Environmental protection\n• Resource conservation through recycling\n• Pollution reduction\n• Public health improvement\n• Energy generation from waste\n• Economic opportunities",
      buttons: [
        "Environmental benefits",
        "Economic benefits", 
        "Health benefits",
        "Back to main menu"
      ]
    },
    "is waste management important": {
      reply: "Yes, waste management is extremely important for:\n\n• Protecting our environment from pollution\n• Conserving natural resources\n• Preventing disease spread\n• Reducing greenhouse gas emissions\n• Creating sustainable communities",
      buttons: [
        "Why protect environment?",
        "How to start recycling",
        "Waste segregation tips",
        "Back to main menu"
      ]
    },
    "recycling": {
      reply: "Recycling involves converting waste materials into new products. Common recyclables include:\n\n• Paper and cardboard\n• Plastic bottles and containers\n• Glass jars and bottles\n• Aluminum and steel cans\n• Electronic waste",
      buttons: [
        "How to recycle properly",
        "What can be recycled",
        "Recycling benefits",
        "Back to main menu"
      ]
    },
    "default": {
      reply: "I'm here to help you with waste management knowledge! Please ask me about:\n\n• What waste management is\n• Benefits of proper waste disposal\n• Recycling methods\n• Waste segregation\n• Environmental protection",
      buttons: [
        "What is Waste Management?",
        "Benefits of Waste Management",
        "Is Waste Management important?",
        "How to recycle properly"
      ]
    }
  };

  // Check for exact matches first
  if (fallbackResponses[lowerMessage]) {
    return fallbackResponses[lowerMessage];
  }

  // Check for partial matches
  if (lowerMessage.includes('waste management') && lowerMessage.includes('what')) {
    return fallbackResponses["what is waste management"];
  }
  if (lowerMessage.includes('benefit') || lowerMessage.includes('advantage')) {
    return fallbackResponses["what are the benefits of waste management"];
  }
  if (lowerMessage.includes('important') || lowerMessage.includes('why')) {
    return fallbackResponses["is waste management important"];
  }
  if (lowerMessage.includes('recycle') || lowerMessage.includes('recycling')) {
    return fallbackResponses["recycling"];
  }

  return fallbackResponses["default"];
};

export const chatWithBot = async (req, res) => {
  const { message, sessionId } = req.body;

  console.log('🔍 Chat request received:', { message, sessionId });

  if (!message || !sessionId) {
    return res.status(400).json({ error: "Message and sessionId are required" });
  }

  try {
    console.log('📤 Sending to Dialogflow...');
    const result = await sendToDialogflow(message, sessionId);
    console.log('✅ Dialogflow response received successfully');

    const fulfillmentMessages = result?.fulfillmentMessages || [];
    const fulfillmentText =
      result?.fulfillmentText ||
      fulfillmentMessages.find((msg) => msg?.text?.text?.length > 0)?.text?.text?.[0] ||
      "Sorry, I didn't understand that.";

    let suggestionChips = [];

    // Extract suggestion chips from fulfillment messages
    fulfillmentMessages.forEach((msg, index) => {
      console.log(`📨 Processing message ${index}:`, msg.message);
      
      // Method 1: Check for payload with richContent
      if (msg?.payload?.fields?.richContent) {
        try {
          const richContent = msg.payload.fields.richContent;
          console.log('📦 Raw richContent structure detected');
          
          const chips = extractChipsFromRichContent(richContent);
          if (chips.length > 0) {
            suggestionChips = [...suggestionChips, ...chips];
            console.log('✅ Extracted chips from richContent:', chips);
          }
        } catch (e) {
          console.error('❌ Error parsing richContent:', e);
        }
      }
      
      // Method 2: Check for payload with suggestion chips directly
      if (msg?.payload?.fields?.suggestions) {
        try {
          const suggestions = msg.payload.fields.suggestions;
          const chips = extractChipsFromSuggestions(suggestions);
          if (chips.length > 0) {
            suggestionChips = [...suggestionChips, ...chips];
            console.log('✅ Extracted chips from suggestions:', chips);
          }
        } catch (e) {
          console.error('❌ Error parsing suggestions:', e);
        }
      }
      
      // Method 3: Check for quickReplies (alternative chip format)
      if (msg?.quickReplies?.quickReplies?.length > 0) {
        suggestionChips = [...suggestionChips, ...msg.quickReplies.quickReplies];
        console.log('✅ Extracted chips from quickReplies:', msg.quickReplies.quickReplies);
      }
    });

    // Remove duplicates and empty chips
    suggestionChips = [...new Set(suggestionChips.filter(chip => chip && chip.trim()))];

    const payload = suggestionChips.length > 0 ? { 
      buttons: suggestionChips,
      type: 'suggestion_chips'
    } : {};

    console.log('🤖 Final response prepared:', { 
      reply: fulfillmentText, 
      buttonCount: suggestionChips.length,
      chips: suggestionChips
    });

    res.status(200).json({
      reply: fulfillmentText,
      payload: payload,
      sessionId: sessionId
    });

  } catch (err) {
    console.error("❌ Dialogflow error - using fallback response");
    console.error("Error details:", err.message);

    // Use fallback response instead of showing error
    const fallback = getFallbackResponse(message);
    
    console.log('🔄 Using fallback response for:', message);
    
    res.status(200).json({
      reply: fallback.reply,
      payload: {
        buttons: fallback.buttons,
        type: 'fallback_chips',
        note: 'Using fallback response'
      },
      sessionId: sessionId
    });
  }
};

// Helper function to extract chips from richContent
function extractChipsFromRichContent(richContent) {
  const chips = [];
  
  try {
    // Handle different richContent structures
    
    // Structure 1: richContent.listValue.values (array of sections)
    if (richContent.listValue?.values) {
      console.log('📋 Processing listValue structure');
      richContent.listValue.values.forEach((section, sectionIndex) => {
        // Each section can be a list of items
        if (section.listValue?.values) {
          section.listValue.values.forEach((item, itemIndex) => {
            console.log(`  Processing section ${sectionIndex}, item ${itemIndex}`);
            extractChipsFromItem(item, chips);
          });
        } else {
          console.log(`  Processing section ${sectionIndex} directly`);
          extractChipsFromItem(section, chips);
        }
      });
    }
    
    // Structure 2: Direct struct value
    else if (richContent.structValue?.fields) {
      console.log('📋 Processing structValue structure');
      extractChipsFromItem(richContent, chips);
    }
    
  } catch (error) {
    console.error('Error in extractChipsFromRichContent:', error);
  }
  
  return chips;
}

// Helper function to extract chips from a single item
function extractChipsFromItem(item, chips) {
  try {
    // Check if item has structValue with fields
    if (item.structValue?.fields) {
      const fields = item.structValue.fields;
      
      // Check for chips type
      if (fields.type?.stringValue === 'chips' && fields.options?.listValue?.values) {
        console.log('🎰 Found chips type with options');
        fields.options.listValue.values.forEach(option => {
          if (option.structValue?.fields?.text?.stringValue) {
            chips.push(option.structValue.fields.text.stringValue);
          }
        });
      }
      
      // Check for button type
      if (fields.type?.stringValue === 'button' && fields.text?.stringValue) {
        console.log('🔘 Found button type:', fields.text.stringValue);
        chips.push(fields.text.stringValue);
      }
      
      // Check for direct text in simple buttons
      if (fields.text?.stringValue && !fields.type) {
        console.log('📝 Found direct text:', fields.text.stringValue);
        chips.push(fields.text.stringValue);
      }
    }
    
    // Check for direct text in list values
    if (item.stringValue) {
      console.log('📄 Found string value:', item.stringValue);
      chips.push(item.stringValue);
    }
    
  } catch (error) {
    console.error('Error in extractChipsFromItem:', error);
  }
}

// Helper function to extract chips from suggestions payload
function extractChipsFromSuggestions(suggestions) {
  const chips = [];
  
  try {
    // Structure: suggestions.listValue.values (array of suggestion items)
    if (suggestions.listValue?.values) {
      console.log('💡 Processing suggestions list');
      suggestions.listValue.values.forEach(suggestion => {
        if (suggestion.structValue?.fields?.title?.stringValue) {
          chips.push(suggestion.structValue.fields.title.stringValue);
        } else if (suggestion.stringValue) {
          chips.push(suggestion.stringValue);
        }
      });
    }
    
  } catch (error) {
    console.error('Error in extractChipsFromSuggestions:', error);
  }
  
  return chips;
}

export const testChipExtraction = async (req, res) => {
  const { message, sessionId } = req.body;
  
  console.log('🧪 Test endpoint called with:', { message, sessionId });
  
  try {
    const result = await sendToDialogflow(message, sessionId || 'test-session');
    
    console.log('✅ Dialogflow test successful');
    
    res.status(200).json({
      status: "success",
      message: "Dialogflow is working correctly",
      response: result
    });
    
  } catch (error) {
    console.error('❌ Dialogflow test failed:', error.message);
    
    res.status(500).json({ 
      status: "error",
      error: "Dialogflow authentication failed",
      message: error.message,
      solution: "Check Render environment variables for GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY"
    });
  }
};