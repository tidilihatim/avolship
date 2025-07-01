import crypto from 'crypto';

// Utility function to generate deterministic webhook secret
export function generateWooCommerceWebhookSecret(userId: string): string {
  const secretData = `avolship_woocommerce_${userId}_secret_salt`;
  return crypto.createHash('sha256').update(secretData).digest('hex');
}