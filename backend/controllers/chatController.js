import { sendToDialogflow } from "../config/dialogflow.js";

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

    // CRITICAL: Always return status 200 with proper JSON
    return res.status(200).json({
      reply: fulfillmentText,
      payload: payload,
      sessionId: sessionId
    });

  } catch (err) {
    console.error("❌ Dialogflow error:", err.message);
    console.error("Stack:", err.stack);

    // CRITICAL: Return 200 with error message instead of 500
    // This prevents 502 Bad Gateway errors
    return res.status(200).json({
      reply: "Sorry, I'm having trouble connecting right now. Please try again.",
      payload: {
        buttons: ["Try again"],
        type: 'error'
      },
      sessionId: sessionId,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

// Test endpoint to check chip extraction
export const testChipExtraction = async (req, res) => {
  const { message, sessionId } = req.body;
  
  console.log('🧪 Test endpoint called with:', { message, sessionId });
  
  try {
    const result = await sendToDialogflow(message, sessionId || 'test-session');
    
    console.log('🔍 Full Dialogflow response structure:');
    console.log(JSON.stringify(result, null, 2));
    
    const fulfillmentMessages = result?.fulfillmentMessages || [];
    
    fulfillmentMessages.forEach((msg, index) => {
      console.log(`\n--- Message ${index} ---`);
      console.log('Message type:', msg.message);
      if (msg.payload) console.log('Payload keys:', Object.keys(msg.payload));
      if (msg.quickReplies) console.log('Quick Replies:', msg.quickReplies);
    });
    
    return res.status(200).json({
      fullResponse: result,
      fulfillmentMessages: fulfillmentMessages,
      status: "success"
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return res.status(200).json({ 
      error: error.message,
      status: "error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}