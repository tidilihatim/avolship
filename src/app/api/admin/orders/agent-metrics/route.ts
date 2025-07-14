import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/auth';
import { connectToDatabase } from '@/lib/db/mongoose';
import Order from '@/lib/db/models/order';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MODERATOR', 'admin', 'moderator'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }

    const query: any = {
      $or: [
        { assignedAgent: new mongoose.Types.ObjectId(agentId) },
        { 'callAttempts.callCenterAgent': new mongoose.Types.ObjectId(agentId) }
      ]
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query);
    
    // Calculate metrics
    const totalCalls = orders.reduce((sum, order) => sum + order.totalCallAttempts, 0);
    const successfulCalls = orders.filter(order => 
      order.callAttempts.some((attempt: any) => attempt.status === 'answered')
    ).length;
    
    const confirmedOrders = orders.filter(order => 
      order.status === 'CONFIRMED' && order.assignedAgent?.toString() === agentId
    ).length;
    
    const deliveredOrders = orders.filter(order => 
      order.status === 'DELIVERED' && order.assignedAgent?.toString() === agentId  
    ).length;
    
    const callSuccessRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    const orderConfirmationRate = orders.length > 0 ? (confirmedOrders / orders.length) * 100 : 0;
    const deliveryRate = confirmedOrders > 0 ? (deliveredOrders / confirmedOrders) * 100 : 0;
    
    // Calculate average call duration
    const callsWithDuration = orders.flatMap(order => 
      order.callAttempts.filter((attempt: any) => 
        attempt.callCenterAgent?.toString() === agentId && attempt.recording?.duration
      )
    );
    
    const avgCallDuration = callsWithDuration.length > 0 
      ? callsWithDuration.reduce((sum, call) => sum + (call.recording?.duration || 0), 0) / callsWithDuration.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalCalls,
        successfulCalls,
        confirmedOrders,
        deliveredOrders,
        callSuccessRate: Math.round(callSuccessRate * 100) / 100,
        orderConfirmationRate: Math.round(orderConfirmationRate * 100) / 100,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        avgCallDuration: Math.round(avgCallDuration)
      }
    });
  } catch (error) {
    console.error('Error calculating agent metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate metrics' 
    }, { status: 500 });
  }
}