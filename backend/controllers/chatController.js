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
      if (msg?.payload?.fields?.richContent) {
        try {
          const richContent = msg.payload.fields.richContent;
          
          const extractChipsFromStruct = (obj) => {
            const chips = [];
            
            if (obj.listValue?.values) {
              obj.listValue.values.forEach(section => {
                if (section.listValue?.values) {
                  section.listValue.values.forEach(item => {
                    if (item.structValue?.fields) {
                      const fields = item.structValue.fields;
                      
                      if (fields.type?.stringValue === 'chips' && fields.options?.listValue?.values) {
                        fields.options.listValue.values.forEach(option => {
                          if (option.structValue?.fields?.text?.stringValue) {
                            chips.push(option.structValue.fields.text.stringValue);
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
            
            return chips;
          };
          
          suggestionChips = extractChipsFromStruct(richContent);
          console.log('✅ Successfully extracted chips:', suggestionChips);
          
        } catch (e) {
          console.error('❌ Error parsing richContent:', e);
        }
      }
    });

    const payload = suggestionChips.length > 0 ? { buttons: suggestionChips } : {};

    console.log('🤖 Final response:', { 
      reply: fulfillmentText, 
      buttons: suggestionChips 
    });

    res.status(200).json({
      reply: fulfillmentText,
      payload: payload,
    });

  } catch (err) {
    console.error("❌ Dialogflow error:", err);
    res.status(500).json({ 
      error: "Failed to process chat message", 
      details: err.message || err 
    });
  }
};