import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * Deployment Management Routes
 * Handles deployment health monitoring, updates, and version management
 */

// Middleware to authenticate via API key
const authenticateInstance = async (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const { data: deployment, error } = await supabase
      .from('deployments')
      .select('id, client_id, status, version')
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

// Check for available updates
router.get('/updates/check', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const deployment = req.deployment;
    const apiKey = req.headers['x-api-key'] as string;

    // Get current version from deployment
    const currentVersion = deployment.version;

    // Get latest available version from system settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'latest_version')
      .single();

    if (settingsError) throw settingsError;

    const latestVersion = settings?.value?.version || currentVersion;

    // Compare versions
    const hasUpdate = currentVersion !== latestVersion;
    const updateAvailable = hasUpdate ? latestVersion : null;

    // Get update notes if available
    const { data: releaseNotes } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'release_notes')
      .single();

    res.json({ 
      success: true, 
      current_version: currentVersion,
      latest_version: latestVersion,
      update_available: updateAvailable,
      release_notes: releaseNotes?.value?.notes || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Request update
router.post('/updates/request', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const { target_version } = req.body;
    const deployment = req.deployment;

    // Create update request record
    const { data: updateRequest, error } = await supabase
      .from('deployment_updates')
      .insert({
        deployment_id: deployment.id,
        current_version: deployment.version,
        target_version: target_version,
        status: 'scheduled',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      update_request_id: updateRequest.id,
      status: 'scheduled'
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Report update progress
router.post('/updates/progress', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const { update_request_id, progress, status, logs } = req.body;
    const deployment = req.deployment;

    const updateData: any = {
      progress,
      status,
      updated_at: new Date().toISOString()
    };

    if (logs) {
      updateData.logs = logs;
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'failed') {
      updateData.failed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('deployment_updates')
      .update(updateData)
      .eq('id', update_request_id)
      .eq('deployment_id', deployment.id);

    if (error) throw error;

    // If update completed, update deployment version
    if (status === 'completed') {
      const { data: updateRequest } = await supabase
        .from('deployment_updates')
        .select('target_version')
        .eq('id', update_request_id)
        .single();

      if (updateRequest) {
        await supabase
          .from('deployments')
          .update({ 
            version: updateRequest.target_version,
            updated_at: new Date().toISOString()
          })
          .eq('id', deployment.id);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Get deployment health status
router.get('/health', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const deployment = req.deployment;

    // Get recent health metrics
    const { data: healthMetrics, error } = await supabase
      .from('deployment_health_metrics')
      .select('*')
      .eq('deployment_id', deployment.id)
      .order('recorded_at', { ascending: false })
      .limit(24); // Last 24 hours if hourly

    if (error && error.code !== 'PGRST116') throw error; // Ignore if table doesn't exist yet

    // Calculate health score
    let healthScore = 100;
    let issues: string[] = [];

    if (healthMetrics && healthMetrics.length > 0) {
      const recent = healthMetrics[0];
      
      if (recent.cpu_usage > 80) {
        healthScore -= 20;
        issues.push('High CPU usage');
      }
      if (recent.memory_usage > 80) {
        healthScore -= 20;
        issues.push('High memory usage');
      }
      if (recent.disk_usage > 80) {
        healthScore -= 15;
        issues.push('High disk usage');
      }
      if (recent.response_time > 2000) {
        healthScore -= 15;
        issues.push('Slow response time');
      }
    }

    // Check last heartbeat
    const lastHeartbeat = deployment.last_heartbeat_at;
    const heartbeatAge = lastHeartbeat ? Date.now() - new Date(lastHeartbeat).getTime() : Infinity;
    
    if (heartbeatAge > 5 * 60 * 1000) { // 5 minutes
      healthScore -= 30;
      issues.push('Stale heartbeat');
    }

    const healthStatus = healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical';

    res.json({ 
      success: true, 
      health_score: Math.max(0, healthScore),
      health_status: healthStatus,
      issues,
      last_heartbeat: lastHeartbeat,
      metrics: healthMetrics?.[0] || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Report health metrics
router.post('/health/metrics', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const { cpu_usage, memory_usage, disk_usage, response_time, active_connections } = req.body;
    const deployment = req.deployment;

    const { error } = await supabase
      .from('deployment_health_metrics')
      .insert({
        deployment_id: deployment.id,
        cpu_usage,
        memory_usage,
        disk_usage,
        response_time,
        active_connections,
        recorded_at: new Date().toISOString()
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Get update history
router.get('/updates/history', authenticateInstance, async (req: Request, res: Response) => {
  try {
    const deployment = req.deployment;

    const { data: updates, error } = await supabase
      .from('deployment_updates')
      .select('*')
      .eq('deployment_id', deployment.id)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, updates });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

export default router;
