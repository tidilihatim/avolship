# Chat Features Test Checklist

## Test 1: Edit Message Feature
1. **Support Chat**:
   - Open support chat
   - Send a text message
   - Click 3 dots → Should see Edit option
   - Click Edit → Edit the message → Save
   - Message should show "(edited)" tag

2. **Main Chat** (seller/provider chat):
   - Open main chat between seller and provider
   - Send a text message
   - Click 3 dots → Check console for "Edit permissions" log
   - Should see Edit option if:
     - You sent the message (isCurrentUser: true)
     - OR you're support/admin role
   - Edit should work same as support chat

## Test 2: Reply Feature
1. **Send Reply**:
   - Click reply button on any message
   - Type and send reply
   - Check console for "Reply data for message" log
   - Reply banner should show above your message with:
     - "Replying to [name]"
     - Original message content

2. **Data Structure Check**:
   - Console should show:
     - replyToType: 'object' (not 'string')
     - replyToContent: Should have _id, content, sender
     - willShowReply: true

## Console Logs to Check

### For Edit Issues:
```
Edit permissions: {
  messageId: "...",
  userRole: "seller", // or "provider", "support", "admin"
  isSupport: false,
  isAdmin: false,
  isCurrentUser: true, // Should be true for your own messages
  canEdit: true, // Should be true if any above condition is met
  messageType: "text",
  isTextMessage: true,
  willShowEdit: true // Must be true to show Edit option
}
```

### For Reply Issues:
```
Reply data for message: {
  messageId: "...",
  hasReplyTo: true,
  replyToType: "object", // Should be "object", not "string"
  replyToContent: {
    _id: "...",
    content: "Original message",
    sender: { _id: "...", name: "User Name" },
    messageType: "text"
  },
  willShowReply: true
}
```

## Debugging Steps

1. **If Edit not showing in main chat**:
   - Check messageType value - must be "text" (lowercase)
   - Check user role - is it exactly "seller" or "provider"?
   - Check isCurrentUser - is sender._id matching your userId?

2. **If Reply not showing**:
   - Check replyToType - if "string", the populate isn't working
   - Check API response when loading messages
   - Check if replyTo data is included in the message

3. **For "Failed to mark message as read" error**:
   - Check message ID format in console
   - Should be 24 character hex string
   - Check network tab for actual error response