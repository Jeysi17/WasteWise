import { sendToDialogflow } from "../config/dialogflow.js";

export const chatWithBot = async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: "Message and sessionId are required" });
  }

  try {
    const result = await sendToDialogflow(message, sessionId);

    const fulfillmentMessages = result?.fulfillmentMessages || [];
    const fulfillmentText =
      result?.fulfillmentText ||
      fulfillmentMessages.find((msg) => msg?.text?.text?.length > 0)?.text?.text?.[0] ||
      "Sorry, I didn't understand that.";

    let suggestionChips = [];

    // Extract suggestion chips from fulfillment messages
    fulfillmentMessages.forEach((msg) => {
      // Method 1: Check for payload with richContent
      if (msg?.payload?.fields?.richContent) {
        try {
          const richContent = msg.payload.fields.richContent;
          console.log('📦 Raw richContent:', JSON.stringify(richContent, null, 2));
          
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

    console.log('🤖 Final response:', { 
      reply: fulfillmentText, 
      buttons: suggestionChips.length,
      chips: suggestionChips
    });

    res.status(200).json({
      reply: fulfillmentText,
      payload: payload,
      sessionId: sessionId
    });

  } catch (err) {
    console.error("❌ Dialogflow error:", err);
    res.status(500).json({ 
      error: "Failed to process chat message",
      userMessage: "Sorry, I'm having trouble connecting right now. Please try again."
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
      richContent.listValue.values.forEach(section => {
        // Each section can be a list of items
        if (section.listValue?.values) {
          section.listValue.values.forEach(item => {
            extractChipsFromItem(item, chips);
          });
        } else {
          extractChipsFromItem(section, chips);
        }
      });
    }
    
    // Structure 2: Direct struct value
    else if (richContent.structValue?.fields) {
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
        fields.options.listValue.values.forEach(option => {
          if (option.structValue?.fields?.text?.stringValue) {
            chips.push(option.structValue.fields.text.stringValue);
          }
        });
      }
      
      // Check for button type
      if (fields.type?.stringValue === 'button' && fields.text?.stringValue) {
        chips.push(fields.text.stringValue);
      }
      
      // Check for direct text in simple buttons
      if (fields.text?.stringValue && !fields.type) {
        chips.push(fields.text.stringValue);
      }
    }
    
    // Check for direct text in list values
    if (item.stringValue) {
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

// Optional: Add a test endpoint to check chip extraction
export const testChipExtraction = async (req, res) => {
  // This can help you debug your Dialogflow response structure
  const { message, sessionId } = req.body;
  
  try {
    const result = await sendToDialogflow(message, sessionId || 'test-session');
    
    console.log('🔍 Full Dialogflow response structure:');
    console.log(JSON.stringify(result, null, 2));
    
    const fulfillmentMessages = result?.fulfillmentMessages || [];
    
    fulfillmentMessages.forEach((msg, index) => {
      console.log(`\n--- Message ${index} ---`);
      console.log('Message type:', msg.message);
      console.log('Payload:', msg.payload);
      console.log('Quick Replies:', msg.quickReplies);
    });
    
    res.status(200).json({
      fullResponse: result,
      fulfillmentMessages: fulfillmentMessages
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
};