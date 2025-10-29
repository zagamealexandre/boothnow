import React, { useState, useEffect } from 'react';
import { Receipt } from '../services/receiptsService';
import { receiptsService } from '../services/receiptsService';
import { X, Download, FileText, Calendar, Clock, MapPin, CreditCard, User, Building } from 'lucide-react';

interface ReceiptModalProps {
  receiptId: string;
  isOpen: boolean;
  onClose: () => void;
  clerkUserId: string;
}

export default function ReceiptModal({ receiptId, isOpen, onClose, clerkUserId }: ReceiptModalProps) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && receiptId) {
      fetchReceipt();
    }
  }, [isOpen, receiptId]);

  const fetchReceipt = async () => {
    setLoading(true);
    try {
      const receiptData = await receiptsService.getReceipt(receiptId, clerkUserId);
      setReceipt(receiptData);
    } catch (error) {
      console.error('Error fetching receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!receipt) return;
    
    setIsDownloading(true);
    try {
      // Mark as downloaded
      await receiptsService.markReceiptDownloaded(receipt.id, clerkUserId);
      
      // Generate PDF data
      const pdfData = await receiptsService.generateReceiptPDF(receipt.id, clerkUserId);
      
      if (pdfData) {
        // Create a simple text receipt for now
        const receiptText = generateReceiptText(pdfData);
        downloadTextFile(receiptText, `receipt-${receipt.receipt_number}.txt`);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const generateReceiptText = (pdfData: any) => {
    const session = pdfData.session;
    const payment = pdfData.payment;
    
    return `
BOOTHNOW RECEIPT
================

Receipt Number: ${pdfData.receiptNumber}
Generated: ${new Date(pdfData.generatedAt).toLocaleString()}

CUSTOMER DETAILS
----------------
Name: ${pdfData.receiptData?.user_name || 'N/A'}
Email: ${pdfData.receiptData?.user_email || 'N/A'}

BOOTH DETAILS
-------------
Booth: ${session?.booths?.name || 'N/A'}
Partner: ${session?.booths?.partner || 'N/A'}
Address: ${session?.booths?.address || 'N/A'}

SESSION DETAILS
---------------
Start Time: ${session?.start_time ? new Date(session.start_time).toLocaleString() : 'N/A'}
End Time: ${session?.end_time ? new Date(session.end_time).toLocaleString() : 'N/A'}
Duration: ${session?.total_minutes || 0} minutes

PAYMENT DETAILS
---------------
Amount: ${pdfData.currency} ${pdfData.amount.toFixed(2)}
Transaction ID: ${payment?.transaction_id || 'N/A'}
Payment Date: ${payment?.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A'}

Thank you for using BoothNow!
    `.trim();
  };

  const downloadTextFile = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Receipt Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : receipt ? (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Receipt #{receipt.receipt_number}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Generated: {new Date(receipt.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(receipt.amount, receipt.currency)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      receipt.status === 'downloaded' ? 'bg-green-100 text-green-800' :
                      receipt.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {receipt.status === 'downloaded' ? 'Downloaded' :
                       receipt.status === 'sent' ? 'Sent' : 'Generated'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Details
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Name:</span> {receipt.receipt_data?.user_name || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {receipt.receipt_data?.user_email || 'N/A'}</p>
                </div>
              </div>

              {/* Booth Details */}
              {receipt.sessions && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Booth Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Booth:</span> {receipt.receipt_data?.booth_name || 'N/A'}</p>
                    <p><span className="font-medium">Partner:</span> {receipt.receipt_data?.booth_partner || 'N/A'}</p>
                    <p><span className="font-medium">Address:</span> {receipt.receipt_data?.booth_address || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Session Details */}
              {receipt.sessions && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Session Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Start Time:</span> {receipt.sessions.start_time ? new Date(receipt.sessions.start_time).toLocaleString() : 'N/A'}</p>
                    <p><span className="font-medium">End Time:</span> {receipt.sessions.end_time ? new Date(receipt.sessions.end_time).toLocaleString() : 'N/A'}</p>
                    <p><span className="font-medium">Duration:</span> {receipt.sessions.total_minutes || 0} minutes</p>
                    <p><span className="font-medium">Status:</span> {receipt.sessions.status || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {receipt.payments && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Amount:</span> {formatCurrency(receipt.payments.amount, receipt.payments.currency)}</p>
                    <p><span className="font-medium">Transaction ID:</span> {receipt.payments.transaction_id || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {receipt.payments.status || 'N/A'}</p>
                    <p><span className="font-medium">Payment Date:</span> {receipt.payments.created_at ? new Date(receipt.payments.created_at).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>{isDownloading ? 'Downloading...' : 'Download Receipt'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Receipt not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
