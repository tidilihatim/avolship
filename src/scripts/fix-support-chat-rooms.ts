import { connectToDatabase } from '../lib/db/mongoose';
import SupportChatRoom from '../lib/db/models/support-chat-room';

async function fixSupportChatRooms() {
  try {
    await connectToDatabase();
    
    console.log('Finding support chat rooms with missing fields...');
    
    // Find all support chat rooms
    const chatRooms = await SupportChatRoom.find({
      $or: [
        { metrics: { $exists: false } },
        { sla: { $exists: false } },
        { 'metrics.totalMessages': { $exists: false } },
        { 'sla.responseTimeTarget': { $exists: false } }
      ]
    });
    
    console.log(`Found ${chatRooms.length} chat rooms to fix`);
    
    for (const chatRoom of chatRooms) {
      const updates: any = {};
      
      // Initialize metrics if missing
      if (!chatRoom.metrics) {
        updates.metrics = {
          totalMessages: 0,
          customerMessages: 0,
          agentMessages: 0,
          averageResponseTime: 0,
          transferCount: 0,
          escalationCount: 0
        };
      }
      
      // Initialize SLA if missing
      if (!chatRoom.sla) {
        updates.sla = {
          responseTimeTarget: 30, // 30 minutes default
          resolutionTimeTarget: 1440, // 24 hours default
          escalationLevel: 0
        };
      }
      
      // Update the chat room
      if (Object.keys(updates).length > 0) {
        await SupportChatRoom.findByIdAndUpdate(chatRoom._id, updates);
        console.log(`Fixed chat room ${chatRoom._id}`);
      }
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixSupportChatRooms();