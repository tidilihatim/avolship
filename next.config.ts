import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
  images: {
    domains: ['img.icons8.com'],
  },
  
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);