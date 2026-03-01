import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { updateTitle, updateMetaTag, updateCanonical, addFAQStructuredData } from '../utils/seo'

export default function FAQ() {
  useEffect(() => {
    const baseUrl = window.location.origin
    const faqUrl = `${baseUrl}/faq`

    updateTitle('FAQ - OfflineSuite')
    updateMetaTag(
      'description',
      'Frequently asked questions about OfflineSuite. Learn how offline processing works, privacy guarantees, supported tools, and usage tips.'
    )
    updateMetaTag('og:title', 'FAQ - OfflineSuite', 'property')
    updateMetaTag(
      'og:description',
      'Answers to common questions about OfflineSuite, privacy, offline use, and supported tools.',
      'property'
    )
    updateMetaTag('og:type', 'website', 'property')
    updateMetaTag('og:url', faqUrl, 'property')
    updateMetaTag('twitter:title', 'FAQ - OfflineSuite', 'property')
    updateMetaTag(
      'twitter:description',
      'Answers to common questions about OfflineSuite, privacy, offline use, and supported tools.',
      'property'
    )
    updateMetaTag('twitter:url', faqUrl, 'property')
    updateCanonical(faqUrl)
    addFAQStructuredData()
  }, [])

  const faqs = [
    {
      question: 'Is OfflineSuite really free?',
      answer:
        'Yes. All tools are 100% free to use with no accounts, subscriptions, or hidden fees.'
    },
    {
      question: 'Do you upload my files?',
      answer:
        'No. All processing happens locally in your browser. Your files never leave your device.'
    },
    {
      question: 'Can I use OfflineSuite without internet?',
      answer:
        'Yes. After the first load, most tools work fully offline. Some AI-powered tools may require an initial model download.'
    },
    {
      question: 'What file types are supported?',
      answer:
        'OfflineSuite supports common PDF and image formats like PDF, PNG, JPG/JPEG, and SVG. Each tool shows its supported formats.'
    },
    {
      question: 'Is my data stored anywhere?',
      answer:
        'No. Files are processed in-memory and are never stored or transmitted.'
    },
    {
      question: 'Why do some tools load slower the first time?',
      answer:
        'Some tools download local processing libraries or AI models on first use. After that, they’re cached for offline use.'
    },
    {
      question: 'How can I suggest a new tool or report a bug?',
      answer:
        'Use the “Suggest a Tool” link in the footer or open an issue on GitHub.'
    }
  ]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-purple-200/50 dark:border-gray-700/50 shadow-lg mb-6 transition-colors">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Clear answers about privacy, offline usage, and how OfflineSuite works.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200/60 dark:border-green-700/40 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Files stay on your device. Nothing is uploaded.
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group bg-white dark:bg-gray-800 rounded-2xl border border-purple-200/40 dark:border-gray-700/50 shadow-sm p-5 transition-colors"
            >
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {item.question}
                </span>
                <span className="text-purple-600 dark:text-purple-400 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400">{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 sm:p-8 border border-purple-200/50 dark:border-gray-600/50 transition-colors">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Still have a question?</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            Reach out anytime or explore the tools to see how they work.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:contact@prasath.me"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
            >
              Contact Us
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all border border-gray-300 dark:border-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
            >
              Browse Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
