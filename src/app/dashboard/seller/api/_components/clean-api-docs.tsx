'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Copy,
  Terminal,
  AlertCircle,
  XCircle,
  Clock,
  Shield,
  Code,
  Info,
  Key,
  Plus,
  Edit,
  FileText,
  Menu
} from 'lucide-react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTranslations } from 'next-intl';

const API_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const codeLanguages = ['curl', 'javascript', 'python'] as const;

// Language mapping for syntax highlighter
const languageMap = {
  curl: 'bash',
  javascript: 'javascript',
  python: 'python',
  json: 'json'
};

// Code Block Component with syntax highlighting
const CodeBlock = ({ code, language, onCopy }: { code: string; language: string; onCopy?: () => void }) => (
  <div className="relative">
    {onCopy && (
      <Button
        size="sm"
        variant="outline"
        className="absolute right-2 top-2 z-10 bg-background/80 backdrop-blur-sm"
        onClick={onCopy}
      >
        <Copy className="h-4 w-4" />
      </Button>
    )}
    <SyntaxHighlighter
      language={languageMap[language as keyof typeof languageMap] || language}
      style={vscDarkPlus}
      customStyle={{
        borderRadius: '0.5rem',
        fontSize: '0.75rem',
        paddingRight: onCopy ? '3rem' : '1rem',
        margin: 0,
        maxWidth: '100%',
        overflow: 'auto',
      }}
      customProps={{
        style: {
          fontSize: '0.75rem',
          lineHeight: '1.4',
        }
      }}
      wrapLongLines={true}
    >
      {code}
    </SyntaxHighlighter>
  </div>
);

const codeExamples = {
  tokenGeneration: {
    curl: `curl -X POST "${API_BASE_URL}/api/auth/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "keyId": "ak_your_key_id_here",
    "apiKey": "sk_your_api_key_here",
    "apiSecret": "your_api_secret_here"
  }'`,

    javascript: `const response = await fetch('${API_BASE_URL}/api/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    keyId: 'ak_your_key_id_here',
    apiKey: 'sk_your_api_key_here',
    apiSecret: 'your_api_secret_here'
  })
});

const data = await response.json();`,

    python: `import requests

response = requests.post('${API_BASE_URL}/api/auth/token', json={
    'keyId': 'ak_your_key_id_here',
    'apiKey': 'sk_your_api_key_here',
    'apiSecret': 'your_api_secret_here'
})

data = response.json()`
  },

  createOrder: {
    curl: `curl -X POST "${API_BASE_URL}/api/orders" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "country": "Morocco",
    "totalPrice": 35,
    "products": [
      {
        "productName": "iPhone 15",
        "quantity": 2,
        "unitPrice": 1200
      }
    ],
    "customer": {
      "name": "John Doe",
      "phoneNumbers": ["+92123456789"],
      "shippingAddress": "123 Main St, Casablanca, Morrocc"
    }
  }'`,

    javascript: `const response = await fetch('${API_BASE_URL}/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    country: 'Morocco',
    totalPrice: 35,
    products: [
      {
        productName: 'iPhone 15',
        quantity: 2,
        unitPrice: 1200
      }
    ],
    customer: {
      name: 'John Doe',
      phoneNumbers: ['+92123456789'],
      shippingAddress: '123 Main St, Casablanca, Morocco'
    }
  })
});

const data = await response.json();`,

    python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

data = {
    'country': 'Morocco',
    'totalPrice': 35,
    'products': [
        {
            'productName': 'iPhone 15',
            'quantity': 2,
            'unitPrice': 1200
        }
    ],
    'customer': {
        'name': 'John Doe',
        'phoneNumbers': ['+92123456789'],
        'shippingAddress': '123 Main St, Casablanca, Morocco'
    }
}

response = requests.post('${API_BASE_URL}/api/orders', json=data, headers=headers)
result = response.json()`
  },

  updateOrder: {
    curl: `curl -X PUT "${API_BASE_URL}/api/orders/ORD-12345678-ABCD" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "totalPrice": 2400,
    "products": [
      {
        "productName": "iPhone 15",
        "quantity": 2,
        "unitPrice": 1200
      }
    ],
    "customer": {
      "name": "John Doe Updated",
      "phoneNumbers": ["+92123456789"],
      "shippingAddress": "456 New Address, Karachi, Pakistan"
    }
  }'`,

    javascript: `const response = await fetch('${API_BASE_URL}/api/orders/ORD-12345678-ABCD', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    totalPrice: 2400,
    products: [
      {
        productName: 'iPhone 15',
        quantity: 2,
        unitPrice: 1200
      }
    ],
    customer: {
      name: 'John Doe Updated',
      phoneNumbers: ['+92123456789'],
      shippingAddress: '456 New Address, Karachi, Pakistan'
    }
  })
});

const data = await response.json();`,

    python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

data = {
    'totalPrice': 2400,
    'products': [
        {
            'productName': 'iPhone 15',
            'quantity': 2,
            'unitPrice': 1200
        }
    ],
    'customer': {
        'name': 'John Doe Updated',
        'phoneNumbers': ['+92123456789'],
        'shippingAddress': '456 New Address, Karachi, Pakistan'
    }
}

response = requests.put('${API_BASE_URL}/api/orders/ORD-12345678-ABCD', json=data, headers=headers)
result = response.json()`
  },

  getOrders: {
    curl: `curl -X GET "${API_BASE_URL}/api/orders?limit=10&skip=0&status=pending&country=Morocco&dateFrom=2023-01-01&dateTo=2023-12-31" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`,

    javascript: `// Basic request
const response = await fetch('${API_BASE_URL}/api/orders', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  }
});

// With filters and pagination
const params = new URLSearchParams({
  limit: '10',
  skip: '0',
  status: 'pending',
  country: 'Morocco',
  dateFrom: '2023-01-01',
  dateTo: '2023-12-31'
});

const filteredResponse = await fetch(\`${API_BASE_URL}/api/orders?\${params}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  }
});

const data = await filteredResponse.json();`,

    python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
}

# Basic request
response = requests.get('${API_BASE_URL}/api/orders', headers=headers)

# With filters and pagination
params = {
    'limit': 10,
    'skip': 0,
    'status': 'pending',
    'country': 'Morocco',
    'dateFrom': '2023-01-01',
    'dateTo': '2023-12-31'
}

filtered_response = requests.get('${API_BASE_URL}/api/orders', headers=headers, params=params)
data = filtered_response.json()`
  }
};

const errorResponses = {
  // Token Generation Errors
  400: `{
  "success": false,
  "error": "Missing required credentials",
  "message": "keyId, apiKey, and apiSecret are required"
}`,
  401: `{
  "success": false,
  "error": "Invalid credentials",
  "message": "The provided API credentials are invalid or inactive"
}`,
  403: `{
  "success": false,
  "error": "Account not approved",
  "message": "Your account must be approved before using the API"
}`,
  429: `{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 5 minutes.",
  "retryAfter": 300
}`,
  500: `{
  "success": false,
  "error": "Internal server error",
  "message": "An error occurred while processing your request"
}`,

  // Order Creation Errors
  "400-order": `{
  "success": false,
  "error": "Missing required fields",
  "message": "country, totalPrice, products array, and customer are required"
}`,
  "400-order-body": `{
  "success": false,
  "error": "Missing request body",
  "message": "Request body must contain country, totalPrice, products, and customer"
}`,
  "400-order-customer": `{
  "success": false,
  "error": "Invalid customer data",
  "message": "Customer name, phoneNumbers (array), and shippingAddress are required"
}`,
  "400-order-warehouse": `{
  "success": false,
  "error": "No warehouse available",
  "message": "No active warehouse found for country: Morocco"
}`,
  "400-order-product": `{
  "success": false,
  "error": "Product not found",
  "message": "No active product matching \\"iPhone 15\\" found in warehouse for country Morocco"
}`,
  "400-order-expedition": `{
  "success": false,
  "error": "No expedition found",
  "message": "No approved expedition found for product \\"iPhone 15 Pro\\" in warehouse for country Morocco"
}`,
  "400-order-stock": `{
  "success": false,
  "error": "Insufficient stock",
  "message": "Product \\"iPhone 15 Pro\\": Only 1 units available, but 2 requested"
}`,
  "401-order": `{
  "success": false,
  "error": "Invalid seller token",
  "message": "Seller authentication is required"
}`,
  "401-order-expired": `{
  "success": false,
  "error": "Token expired",
  "message": "The access token has expired. Please generate a new one."
}`,
  "500-order": `{
  "success": false,
  "error": "Internal server error",
  "message": "An error occurred while creating the order"
}`,

  // Order Update Errors
  "404-order-update": `{
  "success": false,
  "error": "Order not found",
  "message": "Order with ID ORD-12345678-ABCD not found or you don't have permission to update it"
}`,
  "400-order-status": `{
  "success": false,
  "error": "Order cannot be updated",
  "message": "Order with status 'confirmed' cannot be updated. Only orders with 'pending' status can be modified."
}`,
  "400-order-update-body": `{
  "success": false,
  "error": "Missing request body",
  "message": "Request body must contain totalPrice, products, and customer"
}`,
  "500-order-update-failed": `{
  "success": false,
  "error": "Internal server error",
  "message": "An error occurred while updating the order"
}`
};

const successResponses = {
  tokenGeneration: `{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 300,
    "scope": "api:orders:read api:orders:write api:orders:update"
  }
}`,

  createOrder: `{
  "success": true,
  "data": {
    "orderId": "ORD-12345678-ABCD",
    "warehouseId": "64f8a1b2c3d4e5f6789012ab",
    "productMatches": [
      {
        "productId": "64f8a1b2c3d4e5f6789012cd",
        "productName": "iPhone 15 Pro",
        "quantity": 2
      }
    ],
    "status": "pending",
    "duplicateCheck": {
      "isDuplicate": false,
      "duplicateOrders": []
    }
  }
}`,

  updateOrder: `{
  "success": true,
  "data": {
    "orderId": "ORD-12345678-ABCD",
    "warehouseId": "64f8a1b2c3d4e5f6789012ab",
    "productMatches": [
      {
        "productId": "64f8a1b2c3d4e5f6789012cd",
        "productName": "iPhone 15 Pro",
        "quantity": 2
      }
    ],
    "status": "pending",
    "totalPrice": 2400,
    "duplicateCheck": {
      "isDuplicate": false,
      "duplicateOrders": []
    },
    "updatedAt": "2023-12-07T15:30:00Z"
  }
}`,

  getOrders: `{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "ORD-12345678-ABCD",
        "status": "pending",
        "totalPrice": 2400,
        "orderDate": "2023-12-07T10:00:00Z",
        "customer": {
          "name": "John Doe",
          "phoneNumbers": ["+92123456789"],
          "shippingAddress": "123 Main St, Casablanca, Morocco"
        },
        "warehouse": {
          "id": "64f8a1b2c3d4e5f6789012ab",
          "name": "Morocco Warehouse",
          "country": "Morocco"
        },
        "products": [
          {
            "productId": "64f8a1b2c3d4e5f6789012cd",
            "productName": "iPhone 15 Pro",
            "quantity": 2,
            "unitPrice": 1200
          }
        ],
        "isDouble": false,
        "doubleOrderReferences": [],
        "assignedAgent": null,
        "createdAt": "2023-12-07T10:00:00Z",
        "updatedAt": "2023-12-07T10:00:00Z"
      }
    ],
    "pagination": {
      "totalCount": 45,
      "totalPages": 5,
      "currentPage": 1,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10,
      "skip": 0
    },
    "filters": {
      "status": "pending",
      "country": "Morocco",
      "dateFrom": "2023-01-01",
      "dateTo": "2023-12-31"
    }
  }
}`
};

const errorDetails = [
  {
    code: 400,
    title: "Bad Request",
    description: "Missing or invalid request parameters",
    causes: [
      "Missing required credentials (keyId, apiKey, apiSecret)",
      "Missing required fields (country, totalPrice, products, customer)",
      "Empty request body",
      "Invalid customer data (missing name, phoneNumbers, or shippingAddress)",
      "Invalid product data (missing productName, quantity, or unitPrice)",
      "No warehouse found for specified country",
      "Product not found in warehouse",
      "No expedition found for product",
      "Order cannot be updated (status is not 'pending')",
      "Invalid JSON format"
    ],
    icon: <AlertCircle className="h-4 w-4" />
  },
  {
    code: 401,
    title: "Unauthorized",
    description: "Invalid API credentials or expired token",
    causes: [
      "Wrong API key or secret",
      "Invalid credentials (provided API credentials are invalid or inactive)",
      "Expired access token (tokens expire after 5 minutes)",
      "Missing Authorization header",
      "Invalid seller token",
      "Malformed JWT token"
    ],
    icon: <XCircle className="h-4 w-4" />
  },
  {
    code: 403,
    title: "Forbidden",
    description: "Account access restrictions",
    causes: [
      "Seller account not approved",
      "Account suspended",
      "API access disabled",
      "Insufficient permissions for warehouse or product"
    ],
    icon: <Shield className="h-4 w-4" />
  },
  {
    code: 404,
    title: "Not Found",
    description: "Resource not found",
    causes: [
      "Order not found with the provided orderId",
      "Order belongs to different seller (no permission to update)",
      "Invalid orderId format"
    ],
    icon: <XCircle className="h-4 w-4" />
  },
  {
    code: 429,
    title: "Too Many Requests",
    description: "Rate limit exceeded",
    causes: [
      "More than 100 requests per 5 minutes (global limit)",
      "Token generation rate limit (10 requests per 5 minutes)",
      "IP rate limit reached"
    ],
    icon: <Clock className="h-4 w-4" />
  },
  {
    code: 500,
    title: "Internal Server Error",
    description: "Server-side error",
    causes: [
      "Temporary server issues",
      "Service temporarily unavailable",
      "Request processing failed"
    ],
    icon: <XCircle className="h-4 w-4" />
  }
];

export function CleanApiDocs() {
  const [activeLanguage, setActiveLanguage] = useState<typeof codeLanguages[number]>('curl');
  const [activeSection, setActiveSection] = useState('introduction');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('apiDocs');

  const sidebarSections = [
    {
      id: 'overview',
      title: t('sidebar.overview'),
      icon: <FileText className="h-4 w-4" />,
      items: [
        { id: 'introduction', title: t('sidebar.introduction') },
        { id: 'base-url', title: t('sidebar.baseUrl') },
        { id: 'authentication', title: t('sidebar.authentication') }
      ]
    },
    {
      id: 'auth',
      title: t('sidebar.auth'),
      icon: <Key className="h-4 w-4" />,
      items: [
        { id: 'token-generation', title: t('sidebar.tokenGeneration') },
        { id: 'token-usage', title: t('sidebar.tokenUsage') },
        { id: 'rate-limits', title: t('sidebar.rateLimits') }
      ]
    },
    {
      id: 'orders',
      title: t('sidebar.orders'),
      icon: <Plus className="h-4 w-4" />,
      items: [
        { id: 'create-order', title: t('sidebar.createOrder') },
        { id: 'update-order', title: t('sidebar.updateOrder') },
        { id: 'get-orders', title: t('sidebar.getOrders') }
      ]
    },
    {
      id: 'errors',
      title: t('sidebar.errors'),
      icon: <AlertCircle className="h-4 w-4" />,
      items: [
        { id: 'error-codes', title: t('sidebar.errorCodes') },
        { id: 'error-examples', title: t('sidebar.errorExamples') }
      ]
    }
  ];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Code copied to clipboard');
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setSidebarOpen(false);
  };

  // Auto-update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'introduction',
        'base-url',
        'authentication',
        'token-generation',
        'token-usage',
        'rate-limits',
        'create-order',
        'update-order',
        'get-orders',
        'error-codes'
      ];

      const scrollPosition = window.scrollY + 200; // Offset for better detection

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-72 bg-background border-r flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:block
        fixed lg:sticky top-0 h-screen z-50 lg:z-auto
        transition-transform duration-300 ease-in-out
      `}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-full pb-16">
          <div className="p-4 space-y-4">
            {sidebarSections.map((section) => (
              <div key={section.id} className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                  {section.icon}
                  {section.title}
                </div>
                <div className="space-y-1 ml-6">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors ${
                        activeSection === item.id
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <div className="lg:hidden p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4 mr-2" />
            {t('title')}
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6 space-y-6 lg:space-y-12 w-full">
          <div className="max-w-4xl lg:max-w-none mx-auto space-y-6 lg:space-y-12">
          {/* Introduction */}
          <section id="introduction" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('introduction.title')}</h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('introduction.description')}
            </p>
          </section>

          {/* Base URL */}
          <section id="base-url" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('baseUrl.title')}</h2>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                  <code className="flex-1">{API_BASE_URL}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(API_BASE_URL)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Authentication Overview */}
          <section id="authentication" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('authentication.title')}</h2>
            <Card>
              <CardHeader>
                <CardTitle>{t('authentication.cardTitle')}</CardTitle>
                <CardDescription>
                  {t('authentication.cardDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                      <h4 className="font-medium">{t('authentication.step1')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('authentication.step1Description')}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                      <h4 className="font-medium">{t('authentication.step2')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('authentication.step2Description')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Token Generation */}
          <section id="token-generation" className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('tokenGeneration.title')}</h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  POST /api/auth/token
                </CardTitle>
                <CardDescription>
                  Exchange your API credentials for a short-lived JWT access token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Token Expiry
                    </h4>
                    <p className="text-sm text-muted-foreground">5 minutes</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Rate Limit
                    </h4>
                    <p className="text-sm text-muted-foreground">10 requests / 5 minutes</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Content-Type
                    </h4>
                    <p className="text-sm text-muted-foreground">application/json</p>
                  </div>
                </div>

                <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as any)}>
                  <TabsList className="grid grid-cols-3 w-full sm:w-fit">
                    <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
                    <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                    <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                  </TabsList>

                  {codeLanguages.map((lang) => (
                    <TabsContent key={lang} value={lang}>
                      <CodeBlock
                        code={codeExamples.tokenGeneration[lang]}
                        language={lang}
                        onCopy={() => copyToClipboard(codeExamples.tokenGeneration[lang])}
                      />
                    </TabsContent>
                  ))}
                </Tabs>

                <div>
                  <h4 className="font-semibold mb-3">Success Response (200)</h4>
                  <CodeBlock
                    code={successResponses.tokenGeneration}
                    language="json"
                    onCopy={() => copyToClipboard(successResponses.tokenGeneration)}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Token Usage */}
          <section id="token-usage" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('tokenUsage.title')}</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Authorization Header
                </CardTitle>
                <CardDescription>
                  Include the access token in the Authorization header for all API requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code="Authorization: Bearer YOUR_ACCESS_TOKEN"
                  language="bash"
                  onCopy={() => copyToClipboard('Authorization: Bearer YOUR_ACCESS_TOKEN')}
                />

                <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800 dark:text-amber-200">Important:</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Tokens expire after 5 minutes. Generate a new token when you receive a 401 Unauthorized response.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('rateLimits.title')}</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  API Rate Limits
                </CardTitle>
                <CardDescription>
                  API usage limits to ensure fair access for all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Global API Limit</h4>
                    <p className="text-sm text-muted-foreground">All API endpoints combined</p>
                    <Badge variant="secondary">100 requests / 5 minutes</Badge>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Token Generation Limit</h4>
                    <p className="text-sm text-muted-foreground">Token generation endpoint only</p>
                    <Badge variant="secondary">10 requests / 5 minutes</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Create Order */}
          <section id="create-order" className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('createOrder.title')}</h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  POST /api/orders
                </CardTitle>
                <CardDescription>
                  Create a new order for processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as any)}>
                  <TabsList className="grid grid-cols-3 w-full sm:w-fit">
                    <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
                    <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                    <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                  </TabsList>

                  {codeLanguages.map((lang) => (
                    <TabsContent key={lang} value={lang}>
                      <CodeBlock
                        code={codeExamples.createOrder[lang]}
                        language={lang}
                        onCopy={() => copyToClipboard(codeExamples.createOrder[lang])}
                      />
                    </TabsContent>
                  ))}
                </Tabs>

                <div>
                  <h4 className="font-semibold mb-3">Success Response (201)</h4>
                  <CodeBlock
                    code={successResponses.createOrder}
                    language="json"
                    onCopy={() => copyToClipboard(successResponses.createOrder)}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Update Order */}
          <section id="update-order" className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('updateOrder.title')}</h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  PUT /api/orders/:orderId
                </CardTitle>
                <CardDescription>
                  Update an existing order's status or details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as any)}>
                  <TabsList className="grid grid-cols-3 w-full sm:w-fit">
                    <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
                    <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                    <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                  </TabsList>

                  {codeLanguages.map((lang) => (
                    <TabsContent key={lang} value={lang}>
                      <CodeBlock
                        code={codeExamples.updateOrder[lang]}
                        language={lang}
                        onCopy={() => copyToClipboard(codeExamples.updateOrder[lang])}
                      />
                    </TabsContent>
                  ))}
                </Tabs>

                <div>
                  <h4 className="font-semibold mb-3">Success Response (200)</h4>
                  <CodeBlock
                    code={successResponses.updateOrder}
                    language="json"
                    onCopy={() => copyToClipboard(successResponses.updateOrder)}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Get Orders */}
          <section id="get-orders" className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('getOrders.title')}</h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  GET /api/orders
                </CardTitle>
                <CardDescription>
                  Retrieve a list of your orders with pagination and optional filtering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Query Parameters */}
                <div>
                  <h4 className="font-semibold mb-3">Query Parameters</h4>
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <h5 className="font-medium text-sm">Pagination</h5>
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          <p><code>limit</code> - Records per page (1-100, default: 20)</p>
                          <p><code>skip</code> - Records to skip (default: 0)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <h5 className="font-medium text-sm">Filtering</h5>
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          <p><code>status</code> - Order status filter</p>
                          <p><code>country</code> - Warehouse country filter</p>
                          <p><code>dateFrom</code> - Start date (ISO format)</p>
                          <p><code>dateTo</code> - End date (ISO format)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Status Values */}
                <div>
                  <h4 className="font-semibold mb-3">Available Status Values</h4>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'confirmed', 'cancelled', 'shipped', 'assigned_to_delivery', 'accepted_by_delivery', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed', 'refunded', 'wrong_number', 'double', 'unreached', 'expired'].map((status) => (
                      <Badge key={status} variant="secondary" className="text-xs">
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as any)}>
                  <TabsList className="grid grid-cols-3 w-full sm:w-fit">
                    <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
                    <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                    <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                  </TabsList>

                  {codeLanguages.map((lang) => (
                    <TabsContent key={lang} value={lang}>
                      <CodeBlock
                        code={codeExamples.getOrders[lang]}
                        language={lang}
                        onCopy={() => copyToClipboard(codeExamples.getOrders[lang])}
                      />
                    </TabsContent>
                  ))}
                </Tabs>

                <div>
                  <h4 className="font-semibold mb-3">Success Response (200)</h4>
                  <CodeBlock
                    code={successResponses.getOrders}
                    language="json"
                    onCopy={() => copyToClipboard(successResponses.getOrders)}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Error Codes */}
          <section id="error-codes" className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('errorCodes.title')}</h2>

            {errorDetails.map((error) => (
              <Card key={error.code}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {error.icon}
                      <Badge variant="destructive">{error.code}</Badge>
                    </div>
                    <span>{error.title}</span>
                  </CardTitle>
                  <CardDescription>{error.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold mb-2">Common Causes:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {error.causes.map((cause, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold mb-2">Example Response:</h5>
                      <div className="text-xs">
                        <CodeBlock
                          code={error.code === 404 ? errorResponses["404-order-update"] : errorResponses[error.code as keyof typeof errorResponses]}
                          language="json"
                          onCopy={() => copyToClipboard(error.code === 404 ? errorResponses["404-order-update"] : errorResponses[error.code as keyof typeof errorResponses])}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}