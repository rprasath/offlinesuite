/**
 * SEO Utility Functions
 * Manages dynamic meta tags for better SEO and LLM discoverability
 */

/**
 * Update page title
 */
export function updateTitle(title) {
  document.title = title
}

/**
 * Update or create a meta tag
 */
export function updateMetaTag(name, content, attribute = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`)
  
  if (element) {
    element.setAttribute('content', content)
  } else {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    element.setAttribute('content', content)
    document.head.appendChild(element)
  }
}

/**
 * Update canonical URL
 */
export function updateCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]')
  
  if (link) {
    link.setAttribute('href', url)
  } else {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    link.setAttribute('href', url)
    document.head.appendChild(link)
  }
}

/**
 * Add or update structured data (JSON-LD)
 */
export function updateStructuredData(data, id = 'tool-structured-data') {
  // Remove existing structured data
  const existing = document.getElementById(id)
  if (existing) {
    existing.remove()
  }
  
  // Add new structured data
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = id
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

/**
 * Update all SEO meta tags for a tool page
 */
export function updateToolSEO(tool) {
  const baseUrl = window.location.origin
  const toolUrl = `${baseUrl}/tool/${tool.id}`
  
  // Update title
  const title = `${tool.name} - Free Offline Tool | OfflineSuite`
  updateTitle(title)
  
  // Update meta description
  const description = `${tool.description} Works 100% offline. No upload, no accounts, no tracking. ${tool.keywords.join(', ')}.`
  updateMetaTag('description', description)
  
  // Update keywords
  const keywords = [
    ...tool.keywords,
    'offline',
    'free',
    'no upload',
    'privacy',
    'browser-based',
    tool.name.toLowerCase()
  ].join(', ')
  updateMetaTag('keywords', keywords)
  
  // Update Open Graph tags
  updateMetaTag('og:title', title, 'property')
  updateMetaTag('og:description', description, 'property')
  updateMetaTag('og:url', toolUrl, 'property')
  updateMetaTag('og:type', 'website', 'property')
  
  // Update Twitter tags
  updateMetaTag('twitter:title', title, 'property')
  updateMetaTag('twitter:description', description, 'property')
  updateMetaTag('twitter:url', toolUrl, 'property')
  
  // Update canonical URL
  updateCanonical(toolUrl)
  
  // Add tool-specific structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': tool.name,
    'url': toolUrl,
    'description': tool.description,
    'applicationCategory': getCategoryType(tool.category),
    'operatingSystem': 'Web Browser',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    },
    'softwareHelp': {
      '@type': 'CreativeWork',
      'url': toolUrl
    },
    'keywords': tool.keywords.join(', '),
    'browserRequirements': 'Requires JavaScript. Works offline.',
    'permissions': 'No permissions required. No data uploaded.',
    'softwareVersion': '1.0.0',
    'author': {
      '@type': 'Organization',
      'name': 'OfflineSuite'
    }
  }
  
  updateStructuredData(structuredData, 'tool-structured-data')
}

/**
 * Get schema.org category type based on tool category
 */
function getCategoryType(category) {
  const categoryMap = {
    'image': 'MultimediaApplication',
    'document': 'UtilitiesApplication',
    'converter': 'UtilitiesApplication',
    'utility': 'UtilitiesApplication'
  }
  return categoryMap[category] || 'UtilitiesApplication'
}

/**
 * Reset to home page SEO
 */
export function resetToHomeSEO() {
  const baseUrl = window.location.origin
  
  updateTitle('OfflineSuite - Free Offline PDF, Image & Document Tools | 100% Private & No Upload')
  updateMetaTag('description', 'Free offline tools for PDF editing, image processing, and document management. Merge PDFs, compress images, remove backgrounds, generate QR codes, create invoices & more. Works 100% offline - your data never leaves your device.')
  updateCanonical(baseUrl)
  
  // Remove tool-specific structured data
  const toolData = document.getElementById('tool-structured-data')
  if (toolData) {
    toolData.remove()
  }
}

/**
 * Generate FAQ structured data for better LLM understanding
 */
export function addFAQStructuredData() {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Is OfflineSuite really free?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes, OfflineSuite is 100% free. All tools work offline in your browser with no accounts, subscriptions, or hidden fees.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Does OfflineSuite upload my files?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'No. OfflineSuite processes everything locally in your browser. Your files never leave your device, ensuring complete privacy and security.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I use OfflineSuite offline?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes. After the initial page load, OfflineSuite works completely offline. You can use all tools without an internet connection.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What tools are available in OfflineSuite?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'OfflineSuite includes 17+ tools: PDF Merger, PDF Compressor, PDF Splitter, PDF Watermark, PDF Signer, PDF to Images, Passport Photo Maker, Background Remover, Image Compressor, Image Converter, Image Editor, QR Code Generator, Invoice Generator, Signature Maker, Text Diff, PDF Diff, and more.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Do I need to install anything?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'No installation required. OfflineSuite runs entirely in your web browser. Just visit the website and start using the tools immediately.'
        }
      }
    ]
  }
  
  updateStructuredData(faqData, 'faq-structured-data')
}
