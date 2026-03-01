/**
 * QR Code Generator Tool - React Component
 * Generate QR codes for URLs, text, WiFi, contact cards, etc.
 */

import { useState, useRef } from 'react'
import QRCode from 'qrcode'
import { qrTypes, errorCorrectionLevels, sizePresets, defaultSettings, wifiSecurityTypes } from './config'

export default function QrGenerator() {
  const [settings, setSettings] = useState(defaultSettings)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [error, setError] = useState('')
  const [wifiSettings, setWifiSettings] = useState({
    ssid: '',
    password: '',
    security: 'WPA',
    hidden: false,
  })
  const [vcardSettings, setVcardSettings] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    email: '',
    website: '',
  })
  
  const canvasRef = useRef(null)

  // Generate QR Code using the qrcode library
  const generateQRCode = async () => {
    if (!settings.text.trim() && settings.type !== 'wifi' && settings.type !== 'vcard') {
      setError('Please enter content for the QR code')
      return
    }

    setError('')

    try {
      let content = settings.text

      // Format content based on type
      if (settings.type === 'email') {
        content = `mailto:${settings.text}`
      } else if (settings.type === 'phone') {
        content = `tel:${settings.text}`
      } else if (settings.type === 'sms') {
        const [phone, message] = settings.text.split(':')
        content = `SMSTO:${phone}:${message || ''}`
      } else if (settings.type === 'wifi') {
        // WiFi QR format: WIFI:T:WPA;S:ssid;P:password;H:false;;
        if (!wifiSettings.ssid) {
          setError('Please enter WiFi network name (SSID)')
          return
        }
        content = `WIFI:T:${wifiSettings.security};S:${wifiSettings.ssid};P:${wifiSettings.password};H:${wifiSettings.hidden};;`
      } else if (settings.type === 'vcard') {
        // vCard format
        if (!vcardSettings.firstName && !vcardSettings.lastName) {
          setError('Please enter at least a name')
          return
        }
        content = `BEGIN:VCARD\nVERSION:3.0\nN:${vcardSettings.lastName};${vcardSettings.firstName}\nFN:${vcardSettings.firstName} ${vcardSettings.lastName}\n`
        if (vcardSettings.organization) content += `ORG:${vcardSettings.organization}\n`
        if (vcardSettings.phone) content += `TEL:${vcardSettings.phone}\n`
        if (vcardSettings.email) content += `EMAIL:${vcardSettings.email}\n`
        if (vcardSettings.website) content += `URL:${vcardSettings.website}\n`
        content += `END:VCARD`
      }

      // Generate QR code using qrcode library
      const qrCanvas = canvasRef.current
      await QRCode.toCanvas(qrCanvas, content, {
        width: settings.size,
        margin: settings.includeMargin ? settings.margin : 0,
        color: {
          dark: settings.foregroundColor,
          light: settings.backgroundColor,
        },
        errorCorrectionLevel: settings.errorCorrection,
      })
      
      setQrDataUrl(qrCanvas.toDataURL('image/png'))
    } catch (err) {
      setError(`Error generating QR code: ${err.message}`)
    }
  }

  // Download QR code
  const downloadQR = (format = 'png') => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `qrcode.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get current type config
  const currentType = qrTypes.find(t => t.id === settings.type) || qrTypes[0]

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">QR Code Generator</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Generate QR codes for URLs, text, WiFi credentials, contact cards, and more. All processing happens locally.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">QR Code Settings</h2>
          
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              QR Code Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {qrTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSettings({ ...settings, type: type.id })}
                  className={`px-3 py-2 rounded-lg border-2 transition-colors text-left ${
                    settings.type === type.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Input */}
          {settings.type !== 'wifi' && settings.type !== 'vcard' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {currentType.label} Content
              </label>
              <textarea
                value={settings.text}
                onChange={(e) => setSettings({ ...settings, text: e.target.value })}
                placeholder={currentType.placeholder}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              />
            </div>
          )}

          {/* WiFi Settings */}
          {settings.type === 'wifi' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Network Name (SSID)
                </label>
                <input
                  type="text"
                  value={wifiSettings.ssid}
                  onChange={(e) => setWifiSettings({ ...wifiSettings, ssid: e.target.value })}
                  placeholder="MyNetwork"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="text"
                  value={wifiSettings.password}
                  onChange={(e) => setWifiSettings({ ...wifiSettings, password: e.target.value })}
                  placeholder="password123"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Security Type
                </label>
                <select
                  value={wifiSettings.security}
                  onChange={(e) => setWifiSettings({ ...wifiSettings, security: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  {wifiSecurityTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={wifiSettings.hidden}
                  onChange={(e) => setWifiSettings({ ...wifiSettings, hidden: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Hidden network</span>
              </label>
            </div>
          )}

          {/* vCard Settings */}
          {settings.type === 'vcard' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={vcardSettings.firstName}
                    onChange={(e) => setVcardSettings({ ...vcardSettings, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={vcardSettings.lastName}
                    onChange={(e) => setVcardSettings({ ...vcardSettings, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  value={vcardSettings.organization}
                  onChange={(e) => setVcardSettings({ ...vcardSettings, organization: e.target.value })}
                  placeholder="Company Inc."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={vcardSettings.phone}
                  onChange={(e) => setVcardSettings({ ...vcardSettings, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={vcardSettings.email}
                  onChange={(e) => setVcardSettings({ ...vcardSettings, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={vcardSettings.website}
                  onChange={(e) => setVcardSettings({ ...vcardSettings, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size
              </label>
              <select
                value={settings.size}
                onChange={(e) => setSettings({ ...settings, size: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                {sizePresets.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Correction
              </label>
              <select
                value={settings.errorCorrection}
                onChange={(e) => setSettings({ ...settings, errorCorrection: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                {errorCorrectionLevels.map(level => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foreground Color
              </label>
              <input
                type="color"
                value={settings.foregroundColor}
                onChange={(e) => setSettings({ ...settings, foregroundColor: e.target.value })}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer transition-colors"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateQRCode}
            className="w-full px-4 sm:px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Generate QR Code
          </button>
        </div>

        {/* Preview Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Preview</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 dark:border-gray-600 rounded-lg p-4 transition-colors">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* QR Code Display */}
          <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="max-w-full" />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-6xl mb-4">📱</div>
                <p>Generate a QR code to see preview</p>
              </div>
            )}
          </div>

          {/* Canvas for generation */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Download Buttons */}
          {qrDataUrl && (
            <div className="space-y-3">
              <button
                onClick={() => downloadQR('png')}
                className="w-full px-4 sm:px-6 py-3 bg-green-600 text-white text-sm sm:text-base rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Download PNG
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Right-click the QR code to save as image
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• All processing happens locally - your data never leaves your device</li>
          <li>• Higher error correction allows the QR code to be scanned even if partially damaged</li>
          <li>• Ensure good contrast between foreground and background colors</li>
          <li>• Use larger sizes (1024px+) for printing</li>
          <li>• WiFi QR codes allow instant network connection on most devices</li>
        </ul>
      </div>
    </div>
  )
}
