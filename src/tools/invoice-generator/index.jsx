/**
 * Invoice Generator - React Component
 * Create professional invoices with visual editing
 */

import { useState } from 'react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { config, colorSchemes, currencies, taxRates, defaultInvoice } from './config'
import { PDF_CONFIG } from '../../utils/pdfConfig'

export default function InvoiceGenerator() {
  const [invoice, setInvoice] = useState(defaultInvoice)
  const [isGenerating, setIsGenerating] = useState(false)

  // Get current color scheme
  const getColorScheme = () => {
    return colorSchemes.find(c => c.id === invoice.colorScheme) || colorSchemes[0]
  }

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currencies.find(c => c.code === invoice.currency)?.symbol || '$'
  }

  // Calculate item total
  const getItemTotal = (item) => {
    return item.quantity * item.price
  }

  // Calculate subtotal
  const getSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + getItemTotal(item), 0)
  }

  // Calculate tax
  const getTax = () => {
    const subtotal = getSubtotal()
    if (invoice.taxRate === 'custom') {
      return subtotal * (invoice.customTaxRate / 100)
    }
    const rate = taxRates.find(t => t.id === invoice.taxRate)?.rate || 0
    return subtotal * rate
  }

  // Calculate discount
  const getDiscount = () => {
    const subtotal = getSubtotal()
    return subtotal * (invoice.discount / 100)
  }

  // Calculate total
  const getTotal = () => {
    return getSubtotal() + getTax() - getDiscount()
  }

  // Format currency
  const formatCurrency = (amount) => {
    return `${getCurrencySymbol()}${amount.toFixed(2)}`
  }

  // Add new item
  const addItem = () => {
    const newId = Math.max(...invoice.items.map(i => i.id), 0) + 1
    setInvoice({
      ...invoice,
      items: [...invoice.items, { id: newId, description: '', quantity: 1, price: 0 }]
    })
  }

  // Remove item
  const removeItem = (id) => {
    if (invoice.items.length > 1) {
      setInvoice({
        ...invoice,
        items: invoice.items.filter(i => i.id !== id)
      })
    }
  }

  // Update item
  const updateItem = (id, field, value) => {
    setInvoice({
      ...invoice,
      items: invoice.items.map(i => 
        i.id === id ? { ...i, [field]: value } : i
      )
    })
  }

  // Convert hex to RGB array for pdf-lib
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0, 0, 0]
  }

  // Generate PDF
  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      const colorScheme = getColorScheme()
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842]) // A4 size
      
      const { width, height } = page.getSize()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      
      // Get colors
      const primaryRgb = hexToRgb(colorScheme.primary)
      const accentRgb = hexToRgb(colorScheme.accent)
      const primaryColor = rgb(primaryRgb[0], primaryRgb[1], primaryRgb[2])
      const accentColor = rgb(accentRgb[0], accentRgb[1], accentRgb[2])
      const textColor = rgb(0.1, 0.1, 0.1)
      
      let y = height - 60
      
      // Header background
      page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: primaryColor,
      })
      
      // Title
      page.drawText('INVOICE', {
        x: 50,
        y: height - 60,
        size: 32,
        font: fontBold,
        color: rgb(1, 1, 1),
      })
      
      y = height - 160
      
      // Invoice Details (left side)
      page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
        x: 50,
        y,
        size: 11,
        font: fontBold,
        color: textColor,
      })
      
      y -= 20
      page.drawText(`Date: ${invoice.date}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: textColor,
      })
      
      if (invoice.dueDate) {
        y -= 15
        page.drawText(`Due Date: ${invoice.dueDate}`, {
          x: 50,
          y,
          size: 10,
          font,
          color: textColor,
        })
      }
      
      // From Section
      y -= 40
      page.drawText('FROM:', {
        x: 50,
        y,
        size: 11,
        font: fontBold,
        color: textColor,
      })
      
      y -= 20
      if (invoice.from.name) {
        page.drawText(invoice.from.name, {
          x: 50,
          y,
          size: 10,
          font: fontBold,
          color: textColor,
        })
        y -= 15
      }
      
      if (invoice.from.email) {
        page.drawText(invoice.from.email, {
          x: 50,
          y,
          size: 9,
          font,
          color: textColor,
        })
        y -= 15
      }
      
      if (invoice.from.phone) {
        page.drawText(invoice.from.phone, {
          x: 50,
          y,
          size: 9,
          font,
          color: textColor,
        })
        y -= 15
      }
      
      if (invoice.from.address) {
        const addressLines = invoice.from.address.split('\n')
        for (const line of addressLines) {
          page.drawText(line, {
            x: 50,
            y,
            size: 9,
            font,
            color: textColor,
          })
          y -= 15
        }
      }
      
      // To Section
      y = height - 160
      page.drawText('BILL TO:', {
        x: 320,
        y,
        size: 11,
        font: fontBold,
        color: textColor,
      })
      
      y -= 20
      if (invoice.to.name) {
        page.drawText(invoice.to.name, {
          x: 320,
          y,
          size: 10,
          font: fontBold,
          color: textColor,
        })
        y -= 15
      }
      
      if (invoice.to.email) {
        page.drawText(invoice.to.email, {
          x: 320,
          y,
          size: 9,
          font,
          color: textColor,
        })
        y -= 15
      }
      
      if (invoice.to.phone) {
        page.drawText(invoice.to.phone, {
          x: 320,
          y,
          size: 9,
          font,
          color: textColor,
        })
        y -= 15
      }
      
      if (invoice.to.address) {
        const addressLines = invoice.to.address.split('\n')
        for (const line of addressLines) {
          page.drawText(line, {
            x: 320,
            y,
            size: 9,
            font,
            color: textColor,
          })
          y -= 15
        }
      }
      
      // Items table
      y = 420
      
      // Table header background
      page.drawRectangle({
        x: 40,
        y: y - 5,
        width: width - 80,
        height: 25,
        color: accentColor,
      })
      
      // Table headers
      page.drawText('Description', {
        x: 50,
        y: y + 5,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      })
      
      page.drawText('Qty', {
        x: 380,
        y: y + 5,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      })
      
      page.drawText('Price', {
        x: 430,
        y: y + 5,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      })
      
      page.drawText('Total', {
        x: 490,
        y: y + 5,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      })
      
      y -= 30
      
      // Items
      for (const item of invoice.items) {
        if (y < 150) break // Prevent overflow
        
        // Description (wrap if too long)
        const desc = item.description || 'Item'
        const maxDescWidth = 320
        let descText = desc
        if (font.widthOfTextAtSize(desc, 9) > maxDescWidth) {
          descText = desc.substring(0, 45) + '...'
        }
        
        page.drawText(descText, {
          x: 50,
          y,
          size: 9,
          font,
          color: textColor,
        })
        
        page.drawText(item.quantity.toString(), {
          x: 390,
          y,
          size: 9,
          font,
          color: textColor,
        })
        
        page.drawText(formatCurrency(item.price), {
          x: 430,
          y,
          size: 9,
          font,
          color: textColor,
        })
        
        page.drawText(formatCurrency(getItemTotal(item)), {
          x: 490,
          y,
          size: 9,
          font,
          color: textColor,
        })
        
        y -= 25
        
        // Separator line
        page.drawLine({
          start: { x: 40, y: y + 10 },
          end: { x: width - 40, y: y + 10 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        })
      }
      
      // Totals section
      y -= 20
      const totalsX = 400
      
      // Subtotal
      page.drawText('Subtotal:', {
        x: totalsX,
        y,
        size: 10,
        font,
        color: textColor,
      })
      
      page.drawText(formatCurrency(getSubtotal()), {
        x: 490,
        y,
        size: 10,
        font,
        color: textColor,
      })
      
      // Discount
      if (invoice.discount > 0) {
        y -= 20
        page.drawText(`Discount (${invoice.discount}%):`, {
          x: totalsX,
          y,
          size: 10,
          font,
          color: textColor,
        })
        
        page.drawText(`-${formatCurrency(getDiscount())}`, {
          x: 490,
          y,
          size: 10,
          font,
          color: textColor,
        })
      }
      
      // Tax
      if (invoice.taxRate !== 'none') {
        y -= 20
        const taxLabel = invoice.taxRate === 'custom' 
          ? `Tax (${invoice.customTaxRate}%):`
          : `Tax (${taxRates.find(t => t.id === invoice.taxRate)?.label}):` 
        
        page.drawText(taxLabel, {
          x: totalsX,
          y,
          size: 10,
          font,
          color: textColor,
        })
        
        page.drawText(formatCurrency(getTax()), {
          x: 490,
          y,
          size: 10,
          font,
          color: textColor,
        })
      }
      
      // Total
      y -= 25
      page.drawRectangle({
        x: totalsX - 10,
        y: y - 8,
        width: 155,
        height: 25,
        color: primaryColor,
      })
      
      page.drawText('TOTAL:', {
        x: totalsX,
        y,
        size: 12,
        font: fontBold,
        color: rgb(1, 1, 1),
      })
      
      page.drawText(formatCurrency(getTotal()), {
        x: 490,
        y,
        size: 12,
        font: fontBold,
        color: rgb(1, 1, 1),
      })
      
      // Notes
      if (invoice.notes) {
        y -= 50
        if (y > 80) {
          page.drawText('Notes:', {
            x: 50,
            y,
            size: 10,
            font: fontBold,
            color: textColor,
          })
          
          y -= 15
          const noteLines = invoice.notes.split('\n').slice(0, 3)
          for (const line of noteLines) {
            if (y < 60) break
            page.drawText(line.substring(0, 80), {
              x: 50,
              y,
              size: 9,
              font,
              color: textColor,
            })
            y -= 15
          }
        }
      }
      
      // Payment Terms
      if (invoice.paymentTerms) {
        y -= 10
        if (y > 80) {
          page.drawText('Payment Terms:', {
            x: 50,
            y,
            size: 10,
            font: fontBold,
            color: textColor,
          })
          
          y -= 15
          page.drawText(invoice.paymentTerms.substring(0, 80), {
            x: 50,
            y,
            size: 9,
            font,
            color: textColor,
          })
        }
      }
      
      // Footer
      page.drawText('Generated by OfflineSuite', {
        x: 50,
        y: 30,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
      })
      
      // Set metadata
      pdfDoc.setProducer(PDF_CONFIG.producer)
      pdfDoc.setCreator(PDF_CONFIG.creator)
      pdfDoc.setTitle(`Invoice ${invoice.invoiceNumber}`)
      pdfDoc.setSubject('Invoice')
      
      const pdfBytes = await pdfDoc.save()
      return pdfBytes
    } catch (err) {
      console.error('Error generating PDF:', err)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  // Download PDF
  const downloadPDF = async () => {
    try {
      const pdfBytes = await generatePDF()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error generating invoice: ' + err.message)
    }
  }

  const colorScheme = getColorScheme()

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 transition-colors">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Invoice Generator</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Fill in the fields below to create your invoice. The preview updates in real-time.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Color & Settings Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color:</label>
              <div className="flex gap-2">
                {colorSchemes.map(scheme => (
                  <button
                    key={scheme.id}
                    onClick={() => setInvoice({ ...invoice, colorScheme: scheme.id })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      invoice.colorScheme === scheme.id 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: scheme.primary }}
                    title={scheme.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={invoice.currency}
                onChange={(e) => setInvoice({ ...invoice, currency: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.label} ({c.symbol})</option>
                ))}
              </select>
              
              <button
                onClick={downloadPDF}
                disabled={isGenerating || !invoice.from.name || !invoice.to.name}
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Preview/Form */}
        <div 
          className="bg-white rounded-lg shadow-lg p-12 space-y-8"
          style={{ maxWidth: '210mm', margin: '0 auto' }}
        >
          {/* Header */}
          <div 
            className="p-8 rounded-t-lg"
            style={{ backgroundColor: colorScheme.primary }}
          >
            <input
              type="text"
              value="INVOICE"
              readOnly
              className="text-4xl font-bold text-white bg-transparent border-none outline-none w-full"
            />
          </div>

          {/* Invoice Details & Parties */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left - From */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">INVOICE #</label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-gray-900 outline-none font-semibold"
                  placeholder="INV-001"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">DATE</label>
                  <input
                    type="date"
                    value={invoice.date}
                    onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                    className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">DUE DATE</label>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <label className="block text-xs font-bold text-gray-700 mb-2">FROM</label>
                <input
                  type="text"
                  value={invoice.from.name}
                  onChange={(e) => setInvoice({ 
                    ...invoice, 
                    from: { ...invoice.from, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 outline-none font-semibold"
                  placeholder="Your Company Name *"
                />
                <input
                  type="email"
                  value={invoice.from.email}
                  onChange={(e) => setInvoice({ 
                    ...invoice, 
                    from: { ...invoice.from, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 outline-none text-sm"
                  placeholder="email@company.com"
                />
                <input
                  type="tel"
                  value={invoice.from.phone}
                  onChange={(e) => setInvoice({ 
                    ...invoice, 
                    from: { ...invoice.from, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 outline-none text-sm"
                  placeholder="+1 (555) 123-4567"
                />
                <textarea
                  value={invoice.from.address}
                  onChange={(e) => setInvoice({ 
                    ...invoice, 
                    from: { ...invoice.from, address: e.target.value }
                  })}
                  className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 outline-none text-sm resize-none"
                  placeholder="Address"
                  rows={2}
                />
              </div>
            </div>

            {/* Right - To */}
            <div className="space-y-4">
              <div className="pt-12">
                <label className="block text-xs font-bold text-gray-700 mb-2">BILL TO</label>
                <input
                  type="text"
                  value={invoice.to.name}
                  onChange={(e) => setInvoice({ 
                    ...invoice, 
                    to: { ...invoice.to, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 outline-none font-semibold"
                  placeholder="Client Name *"
                />
                <input
                  type="email"
                  value={invoice.to.email}
                  onChange={(e) => setInvoice({ 
                    ...invoice, 
                    to: { ...invoice.to, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 outline-none text-sm"
                  placeholder="client@email.com"
                />
                <input
                  type="tel"
                  value={invoice.to.phone}
                  onChange={(e) => setInvoice({ 
                    ...invoice, 
                    to: { ...invoice.to, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 outline-none text-sm"
                  placeholder="+1 (555) 987-6543"
                />
                <textarea
                  value={invoice.to.address}
                  onChange={(e) => setInvoice({ 
                    ...invoice, 
                    to: { ...invoice.to, address: e.target.value }
                  })}
                  className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 outline-none text-sm resize-none"
                  placeholder="Address"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div 
              className="grid grid-cols-12 gap-3 px-3 py-2 rounded text-white font-semibold text-sm"
              style={{ backgroundColor: colorScheme.accent }}
            >
              <div className="col-span-6">DESCRIPTION</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-2 text-right">PRICE</div>
              <div className="col-span-2 text-right">TOTAL</div>
            </div>

            {invoice.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-6">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-right"
                  />
                </div>
                <div className="col-span-1 text-right font-semibold">
                  {formatCurrency(getItemTotal(item))}
                </div>
                <div className="col-span-1 text-center">
                  {invoice.items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addItem}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + Add Item
            </button>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(getSubtotal())}</span>
              </div>

              {/* Tax */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Tax:</span>
                  <select
                    value={invoice.taxRate}
                    onChange={(e) => setInvoice({ ...invoice, taxRate: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {taxRates.map(rate => (
                      <option key={rate.id} value={rate.id}>{rate.label}</option>
                    ))}
                  </select>
                  {invoice.taxRate === 'custom' && (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={invoice.customTaxRate}
                      onChange={(e) => setInvoice({ ...invoice, customTaxRate: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="%"
                    />
                  )}
                </div>
                <span className="font-semibold">{formatCurrency(getTax())}</span>
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Discount:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={invoice.discount}
                    onChange={(e) => setInvoice({ ...invoice, discount: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="%"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <span className="font-semibold text-red-600">-{formatCurrency(getDiscount())}</span>
              </div>

              {/* Total */}
              <div 
                className="flex justify-between p-3 rounded text-white text-lg font-bold"
                style={{ backgroundColor: colorScheme.primary }}
              >
                <span>TOTAL:</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
            </div>
          </div>

          {/* Notes & Payment Terms */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">NOTES</label>
              <textarea
                value={invoice.notes}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">PAYMENT TERMS</label>
              <textarea
                value={invoice.paymentTerms}
                onChange={(e) => setInvoice({ ...invoice, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                placeholder="e.g., Due within 30 days"
                rows={3}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-6">
            Generated by OfflineSuite
          </div>
        </div>
      </div>
    </div>
  )
}
