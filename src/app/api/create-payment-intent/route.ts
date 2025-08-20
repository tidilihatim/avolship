import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/db/mongoose';
import TokenPackage, { TokenPackageStatus } from '@/lib/db/models/token-package';
import User, { UserRole } from '@/lib/db/models/user';
import UserToken, { TokenTransaction, TokenTransactionType, TokenTransactionStatus } from '@/lib/db/models/user-token';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.PROVIDER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId, amount } = await request.json();

    if (!packageId || !amount) {
      return NextResponse.json({ error: 'Package ID and amount are required' }, { status: 400 });
    }

    await connectToDatabase();

    const tokenPackage = await TokenPackage.findById(packageId);
    if (!tokenPackage || tokenPackage.status !== TokenPackageStatus.ACTIVE) {
      return NextResponse.json({ error: 'Token package not found or inactive' }, { status: 404 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create user token record
    let userToken = await UserToken.findOne({ userId: user._id });
    if (!userToken) {
      userToken = new UserToken({ userId: user._id });
      await userToken.save();
    }

    console.log(`Creating payment intent for user ${user._id}, package ${packageId}, amount ${amount}`);
    
    // Create payment intent with comprehensive metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user._id.toString(),
        packageId: tokenPackage._id.toString(),
        tokenCount: tokenPackage.tokenCount.toString(),
        packageName: tokenPackage.name,
        userEmail: user.email,
      },
    });

    console.log(`Created payment intent: ${paymentIntent.id}`);
    
    // Create pending transaction record
    const transaction = new TokenTransaction({
      userId: user._id,
      type: TokenTransactionType.PURCHASE,
      status: TokenTransactionStatus.PENDING,
      amount: tokenPackage.tokenCount,
      balanceBefore: userToken.currentBalance,
      balanceAfter: userToken.currentBalance + tokenPackage.tokenCount,
      description: `Purchase ${tokenPackage.name} - ${tokenPackage.tokenCount} tokens`,
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        tokenPackageId: tokenPackage._id,
      },
    });

    await transaction.save();
    console.log(`Created pending transaction: ${transaction._id} for payment intent: ${paymentIntent.id}`);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}