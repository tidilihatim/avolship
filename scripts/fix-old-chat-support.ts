import mongoose from 'mongoose';

// Define the old chat models that might exist
const ChatMessageSchema = new mongoose.Schema({
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messageType: String,
  content: String,
  attachments: [{ type: Object }],
  status: String,
  isRead: Boolean,
  readAt: Date,
  reactions: [{ type: Object }],
  isPinned: Boolean,
  isEdited: Boolean,
  editedAt: Date,
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
  createdAt: Date,
  updatedAt: Date
});

const ChatRoomSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  name: String,
  description: String,
  avatar: String,
  isGroup: Boolean,
  isSupport: Boolean,
  supportTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
  lastMessageAt: Date,
  status: String,
  createdAt: Date,
  updatedAt: Date
});

// Support models
const SupportChatRoomSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String,
  priority: String,
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportChatMessage' },
  lastMessageAt: Date,
  lastCustomerMessageAt: Date,
  lastAgentMessageAt: Date,
  createdAt: Date,
  updatedAt: Date
});

const SupportChatMessageSchema = new mongoose.Schema({
  chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportChatRoom', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderType: String,
  messageType: String,
  content: String,
  attachments: [{ type: Object }],
  isInternal: Boolean,
  isRead: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
});

async function migrateOldChatToSupport() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/avolship');
    console.log('Connected to MongoDB');

    // Create model instances
    const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
    const ChatRoom = mongoose.models.ChatRoom || mongoose.model('ChatRoom', ChatRoomSchema);
    const SupportChatRoom = mongoose.models.SupportChatRoom || mongoose.model('SupportChatRoom', SupportChatRoomSchema);
    const SupportChatMessage = mongoose.models.SupportChatMessage || mongoose.model('SupportChatMessage', SupportChatMessageSchema);

    // Find all support-related chat rooms from old structure
    const oldSupportChats = await ChatRoom.find({ isSupport: true }).populate('participants');
    console.log(`Found ${oldSupportChats.length} old support chat rooms`);

    let migratedRooms = 0;
    let migratedMessages = 0;

    for (const oldRoom of oldSupportChats) {
      console.log(`Processing old chat room: ${oldRoom._id}`);

      // Check if already migrated
      const existingRoom = await SupportChatRoom.findOne({
        $or: [
          { _id: oldRoom._id },
          { customerId: oldRoom.participants[0]._id }
        ]
      });

      if (existingRoom) {
        console.log(`Room ${oldRoom._id} already migrated`);
        continue;
      }

      // Determine customer and agent from participants
      const customer = oldRoom.participants.find((p: any) => p.role !== 'support' && p.role !== 'admin');
      const agent = oldRoom.participants.find((p: any) => p.role === 'support' || p.role === 'admin');

      if (!customer) {
        console.log(`No customer found for room ${oldRoom._id}, skipping`);
        continue;
      }

      // Create new support chat room
      const newRoom = await SupportChatRoom.create({
        _id: oldRoom._id, // Keep same ID for consistency
        customerId: customer._id,
        assignedAgentId: agent?._id,
        status: oldRoom.status || 'active',
        priority: 'medium',
        lastMessageAt: oldRoom.lastMessageAt,
        createdAt: oldRoom.createdAt,
        updatedAt: oldRoom.updatedAt
      });

      migratedRooms++;
      console.log(`Created support room: ${newRoom._id}`);

      // Migrate messages
      const oldMessages = await ChatMessage.find({ chatRoom: oldRoom._id }).sort({ createdAt: 1 });
      console.log(`Found ${oldMessages.length} messages to migrate`);

      for (const oldMsg of oldMessages) {
        const senderType = oldMsg.sender.toString() === customer._id.toString() ? 'customer' : 'agent';
        
        const newMessage = await SupportChatMessage.create({
          chatRoomId: newRoom._id,
          senderId: oldMsg.sender,
          senderType,
          messageType: oldMsg.messageType || 'text',
          content: oldMsg.content,
          attachments: oldMsg.attachments || [],
          isInternal: false,
          isRead: oldMsg.isRead || false,
          readAt: oldMsg.readAt,
          createdAt: oldMsg.createdAt,
          updatedAt: oldMsg.updatedAt
        });

        migratedMessages++;
      }

      // Update last message reference
      const lastMessage = await SupportChatMessage.findOne({ chatRoomId: newRoom._id }).sort({ createdAt: -1 });
      if (lastMessage) {
        await SupportChatRoom.findByIdAndUpdate(newRoom._id, {
          lastMessage: lastMessage._id,
          lastMessageAt: lastMessage.createdAt
        });
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`Migrated ${migratedRooms} chat rooms`);
    console.log(`Migrated ${migratedMessages} messages`);

    // Analyze problematic IDs
    console.log('\nAnalyzing problematic chat IDs...');
    const problemIds = ['6870f33165face6f47961bcc', '6870f5dd65face6f47961ccb'];
    
    for (const id of problemIds) {
      // Check if it exists in old chat rooms
      const oldChat = await ChatRoom.findById(id);
      if (oldChat) {
        console.log(`Found ${id} in old ChatRoom collection`);
      }

      // Check if it exists in new support rooms
      const supportRoom = await SupportChatRoom.findById(id);
      if (supportRoom) {
        console.log(`Found ${id} in SupportChatRoom collection`);
      }

      // Check if it's a message ID being used as room ID
      const oldMessage = await ChatMessage.findById(id);
      if (oldMessage) {
        console.log(`${id} is actually a message ID, not a room ID!`);
        console.log(`Message belongs to room: ${oldMessage.chatRoom}`);
      }
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateOldChatToSupport().catch(console.error);