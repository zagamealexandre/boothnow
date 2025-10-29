import { Router } from 'express';
import { supabase } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/receipts - Get user's receipts
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data: receipts, error } = await supabase
      .from('receipts')
      .select(`
        *,
        sessions (
          id,
          start_time,
          end_time,
          total_minutes,
          status
        ),
        payments (
          id,
          amount,
          currency,
          transaction_id,
          status
        )
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (error) {
      console.error('Receipts fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch receipts' });
    }

    return res.json({ receipts: receipts || [] });

  } catch (error) {
    console.error('Receipts fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// GET /api/receipts/:id - Get specific receipt
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: receipt, error } = await supabase
      .from('receipts')
      .select(`
        *,
        sessions (
          id,
          start_time,
          end_time,
          total_minutes,
          status,
          booths (
            name,
            partner,
            address
          )
        ),
        payments (
          id,
          amount,
          currency,
          transaction_id,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    return res.json({ receipt });

  } catch (error) {
    console.error('Receipt fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// POST /api/receipts/:id/download - Mark receipt as downloaded
router.post('/:id/download', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: receipt, error } = await supabase
      .from('receipts')
      .update({ 
        status: 'downloaded',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    return res.json({ receipt });

  } catch (error) {
    console.error('Receipt download error:', error);
    return res.status(500).json({ error: 'Failed to update receipt status' });
  }
});

// POST /api/receipts/generate-pdf/:id - Generate PDF for receipt
router.post('/generate-pdf/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Get receipt data
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select(`
        *,
        sessions (
          id,
          start_time,
          end_time,
          total_minutes,
          status,
          booths (
            name,
            partner,
            address
          )
        ),
        payments (
          id,
          amount,
          currency,
          transaction_id,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // For now, return the receipt data for PDF generation on frontend
    // In a production environment, you would generate the PDF here
    return res.json({ 
      receipt,
      pdfData: {
        receiptNumber: receipt.receipt_number,
        amount: receipt.amount,
        currency: receipt.currency,
        generatedAt: receipt.created_at,
        // Add other PDF generation data here
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// GET /api/receipts/stats - Get receipt statistics
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('receipts')
      .select('amount, currency, created_at')
      .eq('user_id', req.userId);

    if (error) {
      console.error('Receipt stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch receipt statistics' });
    }

    const totalAmount = stats?.reduce((sum, receipt) => sum + parseFloat(receipt.amount), 0) || 0;
    const totalReceipts = stats?.length || 0;
    const thisMonth = stats?.filter(receipt => {
      const receiptDate = new Date(receipt.created_at);
      const now = new Date();
      return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
    }).length || 0;

    return res.json({
      totalAmount,
      totalReceipts,
      thisMonth,
      currency: 'EUR'
    });

  } catch (error) {
    console.error('Receipt stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch receipt statistics' });
  }
});

export { router as receiptRoutes };
