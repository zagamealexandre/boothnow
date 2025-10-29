import React, { useState } from 'react';
import { Receipt } from '../services/receiptsService';
import { Download, FileText, Calendar, Clock, MapPin, CreditCard, Euro } from 'lucide-react';

interface ReceiptCardProps {
  receipt: Receipt;
  onDownload: (receiptId: string) => void;
  onView: (receiptId: string) => void;
}

export default function ReceiptCard({ receipt, onDownload, onView }: ReceiptCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload(receipt.id);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Receipt #{receipt.receipt_number}</h3>
            <p className="text-sm text-gray-500">
              {formatDate(receipt.created_at)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
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

      {/* Session Details */}
      {receipt.sessions && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{receipt.receipt_data?.booth_name || 'Booth'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {receipt.sessions.start_time && formatDate(receipt.sessions.start_time)}
              {receipt.sessions.end_time && ` - ${formatDate(receipt.sessions.end_time)}`}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{receipt.sessions.total_minutes} minutes</span>
          </div>
          {receipt.payments && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>Transaction: {receipt.payments.transaction_id}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={() => onView(receipt.id)}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>View</span>
        </button>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
        </button>
      </div>
    </div>
  );
}
