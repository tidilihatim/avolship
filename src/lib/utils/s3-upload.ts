import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

export async function uploadToS3(file: File, key: string): Promise<string> {
    const bucketName = process.env.AWS_BUCKET_NAME;
    
    if (!bucketName) {
        throw new Error('AWS_BUCKET_NAME environment variable is not set');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials are not properly configured');
    }

    try {
        // Convert File to Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: file.type,
            ContentDisposition: 'inline',
        });

        await s3Client.send(command);

        // Return the public URL
        const region = process.env.AWS_REGION || 'us-east-2';
        return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
}