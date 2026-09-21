import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * Instance-to-Management API
 * These endpoints are called by tenant instances to communicate with the central management platform
 */

// Middleware to authenticate via API key
const authenticateInstance = async (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    // Verify API key by checking deployment
    const { data: deployment, error } = await supabase
      .from('deployments')
      .select('id, client_id, status')
      .eq('api_key', apiKey)
      .eq('status', 'active')
      .single();

    if (error || !deployment) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    req.deployment = deployment;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Heartbeat - instance sends periodic heartbeat
router.post('/heartbeat', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const { version, database_version } = req.body;
    const apiKey = req.headers['x-api-key'] as string;

    const { error } = await supabase.rpc('instance_heartbeat', {
      p_api_key: apiKey,
      p_version: version,
      p_database_version: database_version
    });

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Request a new module
router.post('/modules/request', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const { module_key, billing_cycle = 'monthly' } = req.body;
    const apiKey = req.headers['x-api-key'] as string;

    const { data: requestId, error } = await supabase.rpc('request_module', {
      p_api_key: apiKey,
      p_module_key: module_key,
      p_billing_cycle: billing_cycle
    });

    if (error) throw error;

    res.json({ 
      success: true, 
      request_id: requestId,
      status: 'awaiting_payment'
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Get active modules for this deployment
router.get('/modules', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    const { data: modules, error } = await supabase.rpc('get_deployment_modules', {
      p_api_key: apiKey
    });

    if (error) throw error;

    res.json({ success: true, modules });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Forward audit log from instance
router.post('/audit/forward', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const { 
      instance_org_id, 
      module, 
      action, 
      entity_type, 
      entity_id, 
      changes, 
      performed_by, 
      performed_at 
    } = req.body;
    const apiKey = req.headers['x-api-key'] as string;

    const { error } = await supabase.rpc('forward_audit_log', {
      p_api_key: apiKey,
      p_instance_org_id: instance_org_id,
      p_module: module,
      p_action: action,
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_changes: changes,
      p_performed_by: performed_by,
      p_performed_at: performed_at
    });

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Create support ticket from instance
router.post('/support/tickets', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const { subject, description, category, priority, reported_by, reported_email } = req.body;
    const deployment = req.deployment;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        client_id: deployment.client_id,
        deployment_id: deployment.id,
        ticket_number: `TKT-${Date.now()}`,
        subject,
        description,
        category,
        priority,
        reported_by,
        reported_email
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Get available modules catalog
router.get('/modules/catalog', async (req: Request, res: Response) => {
  try {
    const { data: modules, error } = await supabase
      .from('module_catalog')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.json({ success: true, modules });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Check module request status
router.get('/modules/requests/:requestId', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const deployment = req.deployment;

    const { data: request, error } = await supabase
      .from('module_requests')
      .select('*')
      .eq('id', requestId)
      .eq('client_id', deployment.client_id)
      .single();

    if (error) throw error;

    res.json({ success: true, request });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

export default router;
