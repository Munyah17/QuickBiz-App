import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      admin?: any;
      deployment?: any;
    }
  }
}

/**
 * Super Admin API Routes
 * These endpoints are used by the management platform's web interface
 */

// Middleware to authenticate platform admin
const authenticateAdmin = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    // Verify admin session (implementation depends on auth system)
    // For now, we'll use a simple token check
    const token = authHeader.replace('Bearer ', '');
    
    const { data: admin, error } = await supabase
      .from('platform_users')
      .select('*, platform_roles(*)')
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid admin session' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// === CLIENTS ===

// List all clients
router.get('/clients', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    
    let query = supabase.from('clients').select('*');
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.ilike('org_name', `%${search}%`);
    }

    const { data: clients, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, clients });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Get single client
router.get('/clients/:clientId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    const { data: client, error } = await supabase
      .from('clients')
      .select('*, deployments(*), client_module_subscriptions(*, module_catalog(*))')
      .eq('id', clientId)
      .single();

    if (error) throw error;

    res.json({ success: true, client });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Create new client
router.post('/clients', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { org_name, contact_name, contact_email, contact_phone, billing_email, trial_days } = req.body;

    const { data: clientId, error } = await supabase.rpc('create_client', {
      p_org_name: org_name,
      p_contact_name: contact_name,
      p_contact_email: contact_email,
      p_contact_phone: contact_phone,
      p_billing_email: billing_email,
      p_trial_days: trial_days || 30
    });

    if (error) throw error;

    res.json({ success: true, client_id: clientId });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Update client
router.patch('/clients/:clientId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const updates = req.body;

    const { data: client, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, client });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// === DEPLOYMENTS ===

// Register new deployment
router.post('/deployments', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { client_id, instance_name, environment, instance_url } = req.body;

    const { data: deploymentId, error } = await supabase.rpc('register_deployment', {
      p_client_id: client_id,
      p_instance_name: instance_name,
      p_environment: environment,
      p_instance_url: instance_url
    });

    if (error) throw error;

    // Return the API key (only shown once)
    const { data: deployment, error: fetchError } = await supabase
      .from('deployments')
      .select('api_key')
      .eq('id', deploymentId)
      .single();

    if (fetchError) throw fetchError;

    res.json({ success: true, deployment_id: deploymentId, api_key: deployment?.api_key });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// List deployments
router.get('/deployments', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { client_id, status } = req.query;
    
    let query = supabase.from('deployments').select('*, clients(org_name)');
    
    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data: deployments, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, deployments });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// === MODULE REQUESTS ===

// List pending module requests
router.get('/modules/requests', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    let query = supabase
      .from('module_requests')
      .select('*, clients(org_name), deployments(instance_name), module_catalog(name, description, monthly_price_usd)');

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Approve module request
router.post('/modules/requests/:requestId/approve', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    const { data: subscriptionId, error } = await supabase.rpc('approve_module_request', {
      p_request_id: requestId,
      p_notes: notes
    });

    if (error) throw error;

    res.json({ success: true, subscription_id: subscriptionId });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Reject module request
router.post('/modules/requests/:requestId/reject', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const { error } = await supabase.rpc('reject_module_request', {
      p_request_id: requestId,
      p_reason: reason
    });

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Process payment for module request
router.post('/modules/requests/:requestId/payment', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { payment_reference, payment_method, gateway_response } = req.body;

    const { data: result, error } = await supabase.rpc('process_module_payment', {
      p_request_id: requestId,
      p_payment_reference: payment_reference,
      p_payment_method: payment_method,
      p_gateway_response: gateway_response
    });

    if (error) throw error;

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// === MODULE SUBSCRIPTIONS ===

// List all subscriptions
router.get('/modules/subscriptions', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { client_id, status } = req.query;
    
    let query = supabase
      .from('client_module_subscriptions')
      .select('*, clients(org_name), module_catalog(name, category, monthly_price_usd), deployments(instance_name)');

    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data: subscriptions, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, subscriptions });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Cancel subscription
router.post('/modules/subscriptions/:subscriptionId/cancel', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;

    const { error } = await supabase
      .from('client_module_subscriptions')
      .update({ 
        status: 'cancelled', 
        auto_renew: false,
        end_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', subscriptionId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// === BILLING ===

// List invoices
router.get('/billing/invoices', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { client_id, status } = req.query;
    
    let query = supabase
      .from('invoices')
      .select('*, clients(org_name, contact_email)');

    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data: invoices, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, invoices });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Create invoice
router.post('/billing/invoices', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { client_id, billing_period_start, billing_period_end, line_items } = req.body;
    
    let subtotal = 0;
    line_items.forEach((item: any) => {
      subtotal += item.quantity * item.unit_price_usd;
    });

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        client_id,
        invoice_number: `INV-${Date.now()}`,
        billing_period_start,
        billing_period_end,
        subtotal_usd: subtotal,
        total_usd: subtotal,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    // Add line items
    const itemsToInsert = line_items.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      module_key: item.module_key,
      quantity: item.quantity,
      unit_price_usd: item.unit_price_usd,
      line_total_usd: item.quantity * item.unit_price_usd
    }));

    const { error: lineError } = await supabase
      .from('invoice_line_items')
      .insert(itemsToInsert);

    if (lineError) throw lineError;

    res.json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Send invoice
router.post('/billing/invoices/:invoiceId/send', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const { due_date } = req.body;

    const { error } = await supabase
      .from('invoices')
      .update({ 
        status: 'sent', 
        due_date,
        sent_by: req.admin.id,
        sent_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// === SUPPORT ===

// List support tickets
router.get('/support/tickets', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, category, priority } = req.query;
    
    let query = supabase
      .from('support_tickets')
      .select('*, clients(org_name), deployments(instance_name), platform_users(full_name)');

    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tickets, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, tickets });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Get single ticket with comments
router.get('/support/tickets/:ticketId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('*, clients(org_name), deployments(instance_name), platform_users(full_name)')
      .eq('id', ticketId)
      .single();

    if (error) throw error;

    const { data: comments, error: commentsError } = await supabase
      .from('support_ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    res.json({ success: true, ticket, comments });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Update ticket status
router.patch('/support/tickets/:ticketId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { status, assigned_to, resolution } = req.body;

    const updateData: any = { status };
    if (assigned_to) updateData.assigned_to = assigned_to;
    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Add comment to ticket
router.post('/support/tickets/:ticketId/comments', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { comment, is_internal } = req.body;

    const { data: commentData, error } = await supabase
      .from('support_ticket_comments')
      .insert({
        ticket_id: ticketId,
        comment,
        is_internal,
        author_id: req.admin.id,
        author_name: req.admin.full_name
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, comment: commentData });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// === AUDIT LOGS ===

// Get cross-instance audit logs
router.get('/audit/logs', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { client_id, module, limit = 100 } = req.query;
    
    let query = supabase
      .from('cross_instance_audit_logs')
      .select('*, clients(org_name), deployments(instance_name)')
      .order('performed_at', { ascending: false })
      .limit(Number(limit));

    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    
    if (module) {
      query = query.eq('module', module);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// === SYSTEM SETTINGS ===

// Get system settings
router.get('/settings', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;

    const settingsMap = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json({ success: true, settings: settingsMap });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Update system setting
router.patch('/settings/:key', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { error } = await supabase
      .from('system_settings')
      .update({ 
        value, 
        updated_by: req.admin.id,
        updated_at: new Date().toISOString()
      })
      .eq('key', key);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

export default router;
