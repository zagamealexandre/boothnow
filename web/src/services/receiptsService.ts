import { supabase } from '../lib/supabase';

export interface Receipt {
  id: string;
  user_id: string;
  session_id?: string;
  payment_id?: string;
  receipt_number: string;
  amount: number;
  currency: string;
  status: 'generated' | 'sent' | 'downloaded';
  receipt_data: any;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  sessions?: {
    id: string;
    start_time: string;
    end_time: string;
    total_minutes: number;
    status: string;
    booth_id: string;
  };
  payments?: {
    id: string;
    amount: number;
    currency: string;
    transaction_id: string;
    status: string;
    created_at: string;
  };
}

export interface ReceiptStats {
  totalAmount: number;
  totalReceipts: number;
  thisMonth: number;
  currency: string;
}

class ReceiptsService {
  // Get all user receipts
  async getUserReceipts(clerkUserId: string, limit: number = 20, offset: number = 0): Promise<Receipt[]> {
    try {
      // Get user's internal ID
      const { data: userByClerkId, error: clerkError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();

      if (clerkError || !userByClerkId) {
        console.error('❌ ReceiptsService - getUserReceipts: User not found for clerk_user_id:', clerkUserId, clerkError);
        return [];
      }

      const { data: receipts, error } = await supabase
        .from('receipts')
        .select(`
          *,
          sessions!inner (
            id,
            start_time,
            end_time,
            total_minutes,
            status,
            booth_id
          )
        `)
        .eq('user_id', userByClerkId.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ ReceiptsService - getUserReceipts: Error fetching receipts:', error);
        return [];
      }

      return receipts || [];
    } catch (error) {
      console.error('❌ ReceiptsService - getUserReceipts: Exception:', error);
      return [];
    }
  }

  // Get specific receipt
  async getReceipt(receiptId: string, clerkUserId: string): Promise<Receipt | null> {
    try {
      // Get user's internal ID
      const { data: userByClerkId, error: clerkError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();

      if (clerkError || !userByClerkId) {
        console.error('❌ ReceiptsService - getReceipt: User not found for clerk_user_id:', clerkUserId, clerkError);
        return null;
      }

      const { data: receipt, error } = await supabase
        .from('receipts')
        .select(`
          *,
          sessions!inner (
            id,
            start_time,
            end_time,
            total_minutes,
            status,
            booth_id
          )
        `)
        .eq('id', receiptId)
        .eq('user_id', userByClerkId.id)
        .single();

      if (error || !receipt) {
        console.error('❌ ReceiptsService - getReceipt: Receipt not found:', error);
        return null;
      }

      return receipt;
    } catch (error) {
      console.error('❌ ReceiptsService - getReceipt: Exception:', error);
      return null;
    }
  }

  // Mark receipt as downloaded
  async markReceiptDownloaded(receiptId: string, clerkUserId: string): Promise<boolean> {
    try {
      // Get user's internal ID
      const { data: userByClerkId, error: clerkError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();

      if (clerkError || !userByClerkId) {
        console.error('❌ ReceiptsService - markReceiptDownloaded: User not found for clerk_user_id:', clerkUserId, clerkError);
        return false;
      }

      const { error } = await supabase
        .from('receipts')
        .update({ 
          status: 'downloaded',
          updated_at: new Date().toISOString()
        })
        .eq('id', receiptId)
        .eq('user_id', userByClerkId.id);

      if (error) {
        console.error('❌ ReceiptsService - markReceiptDownloaded: Error updating receipt:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ ReceiptsService - markReceiptDownloaded: Exception:', error);
      return false;
    }
  }

  // Get receipt statistics
  async getReceiptStats(clerkUserId: string): Promise<ReceiptStats | null> {
    try {
      // Get user's internal ID
      const { data: userByClerkId, error: clerkError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();

      if (clerkError || !userByClerkId) {
        console.error('❌ ReceiptsService - getReceiptStats: User not found for clerk_user_id:', clerkUserId, clerkError);
        return null;
      }

      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('amount, currency, created_at')
        .eq('user_id', userByClerkId.id);

      if (error) {
        console.error('❌ ReceiptsService - getReceiptStats: Error fetching receipts:', error);
        return null;
      }

      const totalAmount = receipts?.reduce((sum, receipt) => sum + parseFloat(receipt.amount), 0) || 0;
      const totalReceipts = receipts?.length || 0;
      const thisMonth = receipts?.filter(receipt => {
        const receiptDate = new Date(receipt.created_at);
        const now = new Date();
        return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
      }).length || 0;

      return {
        totalAmount,
        totalReceipts,
        thisMonth,
        currency: 'SEK'
      };
    } catch (error) {
      console.error('❌ ReceiptsService - getReceiptStats: Exception:', error);
      return null;
    }
  }

  // Generate PDF data for receipt
  async generateReceiptPDF(receiptId: string, clerkUserId: string): Promise<any> {
    try {
      const receipt = await this.getReceipt(receiptId, clerkUserId);
      if (!receipt) {
        return null;
      }

      // Return formatted data for PDF generation
      return {
        receiptNumber: receipt.receipt_number,
        amount: receipt.amount,
        currency: receipt.currency,
        generatedAt: receipt.created_at,
        session: receipt.sessions,
        payment: receipt.payments,
        receiptData: receipt.receipt_data
      };
    } catch (error) {
      console.error('❌ ReceiptsService - generateReceiptPDF: Exception:', error);
      return null;
    }
  }
}

export const receiptsService = new ReceiptsService();
