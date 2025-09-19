import { CleanApiDocs } from '../_components/clean-api-docs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - AvolShip',
  description: 'Complete API documentation for AvolShip sellers. Learn how to create, update, and manage orders programmatically with our REST API. Includes authentication, endpoints, examples, and error handling.',
};

export default function ApiDocsPage() {
  return <CleanApiDocs />;
}