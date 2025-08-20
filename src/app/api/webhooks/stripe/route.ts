import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/db/mongoose';
import UserToken, { TokenTransaction, TokenTransactionStatus, TokenTransactionType } from '@/lib/db/models/user-token';
import TokenPackage from '@/lib/db/models/token-package';
import User from '@/lib/db/models/user';
import { sendNotification } from '@/lib/notifications/send-notification';
import { NotificationIcon, NotificationType } from '@/lib/db/models/notification';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log(`Processing payment_intent.succeeded for ID: ${paymentIntent.id}`);
  
  const { userId, packageId, tokenCount } = paymentIntent.metadata;

  if (!userId || !packageId || !tokenCount) {
    console.error('Missing metadata in payment intent:', { userId, packageId, tokenCount });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  const tokenPackage = await TokenPackage.findById(packageId);
  if (!tokenPackage) {
    console.error('Token package not found:', packageId);
    return;
  }

  // Get or create user token record
  let userToken = await UserToken.findOne({ userId: user._id });
  if (!userToken) {
    userToken = new UserToken({ userId: user._id });
    await userToken.save();
  }

  // Use findOneAndUpdate with atomic operation to prevent duplicates
  console.log(`Looking for pending transaction with payment intent ID: ${paymentIntent.id}`);
  
  const updatedTransaction = await TokenTransaction.findOneAndUpdate(
    {
      'metadata.stripePaymentIntentId': paymentIntent.id,
      status: TokenTransactionStatus.PENDING,
    },
    {
      status: TokenTransactionStatus.COMPLETED,
    },
    {
      new: true,
    }
  );

  if (!updatedTransaction) {
    console.log('No pending transaction found or already processed for payment intent:', paymentIntent.id);
    
    // Log all transactions for this payment intent to debug
    const allTransactionsForPI = await TokenTransaction.find({
      'metadata.stripePaymentIntentId': paymentIntent.id,
    });
    console.log(`All transactions for payment intent ${paymentIntent.id}:`, allTransactionsForPI.length);
    allTransactionsForPI.forEach((t, i) => {
      console.log(`Transaction ${i + 1}: status=${t.status}, amount=${t.amount}, created=${t.createdAt}`);
    });
    
    return;
  }
  
  console.log(`Successfully updated transaction ${updatedTransaction._id} to COMPLETED`);

  // Add tokens to user balance (don't create a new transaction, just update balance)
  const tokensToAdd = parseInt(tokenCount);
  userToken.currentBalance += tokensToAdd;
  userToken.totalPurchased += tokensToAdd;
  userToken.lastTransactionAt = new Date();
  
  await userToken.save();

  sendNotification({
    title: `Token Purchase Successful!`,
    message: `Your purchase of ${tokensToAdd} tokens has been completed successfully. You can now use them to boost your profile visibility.`,
    userId: user._id,
    actionLink: "/dashboard/provider/tokens",
    icon: NotificationIcon.CREDIT_CARD,
    type: NotificationType.PAYMENT
  })

  console.log(`Successfully added ${tokensToAdd} tokens to user ${userId}`);
}

async function handlePaymentFailed(paymentIntent: any) {
  console.log(`Processing payment_intent.payment_failed for ID: ${paymentIntent.id}`);
  
  // Find the pending transaction and mark it as failed
  const pendingTransaction = await TokenTransaction.findOne({
    'metadata.stripePaymentIntentId': paymentIntent.id,
    status: TokenTransactionStatus.PENDING,
  });

  if (pendingTransaction) {
    pendingTransaction.status = TokenTransactionStatus.FAILED;
    await pendingTransaction.save();

    sendNotification({
      title: `Payment Failed`,
      message: `Your token purchase payment could not be processed. Please try again or contact support if the issue persists.`,
      userId: pendingTransaction.userId,
      actionLink: "/dashboard/provider/tokens",
      icon: NotificationIcon.CREDIT_CARD,
      type: NotificationType.PAYMENT
    })

    console.log(`Marked transaction as failed for payment intent: ${paymentIntent.id}`);
  }
}