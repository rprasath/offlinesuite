/**
 * Invoice Generator - Configuration
 */

export const config = {
  maxLogoSize: 5 * 1024 * 1024, // 5MB
}

export const colorSchemes = [
  {
    id: 'blue',
    name: 'Blue',
    primary: '#0047AB',
    accent: '#3B82F6',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    primary: '#6366F1',
    accent: '#818CF8',
  },
  {
    id: 'gray',
    name: 'Gray',
    primary: '#1F2937',
    accent: '#6B7280',
  },
  {
    id: 'green',
    name: 'Green',
    primary: '#059669',
    accent: '#10B981',
  },
  {
    id: 'purple',
    name: 'Purple',
    primary: '#7C3AED',
    accent: '#A78BFA',
  },
  {
    id: 'red',
    name: 'Red',
    primary: '#DC2626',
    accent: '#EF4444',
  },
  {
    id: 'orange',
    name: 'Orange',
    primary: '#EA580C',
    accent: '#F97316',
  },
  {
    id: 'pink',
    name: 'Pink',
    primary: '#DB2777',
    accent: '#EC4899',
  },
]

export const currencies = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'Australian Dollar' },
]

export const taxRates = [
  { id: 'none', label: 'No Tax', rate: 0 },
  { id: 'custom', label: 'Custom', rate: 0 },
  { id: '5', label: '5%', rate: 0.05 },
  { id: '10', label: '10%', rate: 0.10 },
  { id: '15', label: '15%', rate: 0.15 },
  { id: '18', label: '18%', rate: 0.18 },
  { id: '20', label: '20%', rate: 0.20 },
]

export const defaultInvoice = {
  invoiceNumber: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  colorScheme: 'blue',
  
  from: {
    name: '',
    email: '',
    phone: '',
    address: '',
  },
  
  to: {
    name: '',
    email: '',
    phone: '',
    address: '',
  },
  
  items: [
    { id: 1, description: '', quantity: 1, price: 0 },
  ],
  
  currency: 'USD',
  taxRate: 'none',
  customTaxRate: 0,
  discount: 0,
  notes: '',
  paymentTerms: '',
}
