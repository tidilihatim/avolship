import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
  compiler:{
    removeConsole: process.env.NODE_ENV === "production"
  },
  images: {
    domains: ['img.icons8.com'],
  },
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);