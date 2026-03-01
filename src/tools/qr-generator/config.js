/**
 * QR Code Generator - Configuration
 */

export const qrTypes = [
  { id: 'text', label: 'Plain Text', icon: '📝', placeholder: 'Enter text...' },
  { id: 'url', label: 'URL / Website', icon: '🔗', placeholder: 'https://example.com' },
  { id: 'email', label: 'Email', icon: '📧', placeholder: 'email@example.com' },
  { id: 'phone', label: 'Phone', icon: '📞', placeholder: '+1234567890' },
  { id: 'sms', label: 'SMS', icon: '💬', placeholder: 'Phone:Message' },
  { id: 'wifi', label: 'WiFi', icon: '📶', placeholder: 'Network credentials' },
  { id: 'vcard', label: 'Contact Card', icon: '👤', placeholder: 'Contact information' },
]

export const errorCorrectionLevels = [
  { id: 'L', label: 'Low (7%)', description: 'Fast scan, less recovery' },
  { id: 'M', label: 'Medium (15%)', description: 'Balanced' },
  { id: 'Q', label: 'Quartile (25%)', description: 'Good recovery' },
  { id: 'H', label: 'High (30%)', description: 'Best recovery, slower scan' },
]

export const sizePresets = [
  { value: 128, label: 'Small (128px)' },
  { value: 256, label: 'Medium (256px)' },
  { value: 512, label: 'Large (512px)' },
  { value: 1024, label: 'Extra Large (1024px)' },
  { value: 2048, label: 'Print Quality (2048px)' },
]

export const defaultSettings = {
  type: 'url',
  text: '',
  size: 512,
  errorCorrection: 'M',
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  margin: 4,
  includeMargin: true,
}

export const wifiSecurityTypes = [
  { id: 'WPA', label: 'WPA/WPA2' },
  { id: 'WEP', label: 'WEP' },
  { id: 'nopass', label: 'No Password' },
]
