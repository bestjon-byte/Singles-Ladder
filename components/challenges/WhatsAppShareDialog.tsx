'use client'

import { useState } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { generateWhatsAppChallengeMessage, generateWhatsAppShareLink, isMobileDevice } from '@/lib/utils/whatsapp'

interface WhatsAppShareDialogProps {
  challengerName: string
  challengedName: string
  proposedDate: string
  proposedLocation: string
  isWildcard: boolean
  phoneNumber?: string
}

export function WhatsAppShareDialog({
  challengerName,
  challengedName,
  proposedDate,
  proposedLocation,
  isWildcard,
  phoneNumber,
}: WhatsAppShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const message = generateWhatsAppChallengeMessage({
    challengerName,
    challengedName,
    proposedDate,
    proposedLocation,
    isWildcard,
  })

  const whatsappLink = generateWhatsAppShareLink(message, phoneNumber)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleWhatsAppOpen = () => {
    window.open(whatsappLink, '_blank')
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
          <MessageCircle className="h-4 w-4" />
          Share via WhatsApp
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Share Challenge via WhatsApp
          </Dialog.Title>

          <Dialog.Description className="text-sm text-gray-600 mb-4">
            {isMobileDevice()
              ? 'Tap "Open WhatsApp" to send this message to your opponent.'
              : 'Copy the message below and share it with your opponent via WhatsApp.'}
          </Dialog.Description>

          {/* Message Preview */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Preview
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                {message}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Message
                </>
              )}
            </button>

            <button
              onClick={handleWhatsAppOpen}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp
            </button>
          </div>

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
