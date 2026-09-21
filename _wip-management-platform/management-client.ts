/**
 * Management Platform Client
 * Handles communication between tenant instance and central management platform
 */

interface ManagementConfig {
  apiKey: string;
  apiUrl: string;
  deploymentId?: string;
}

interface ModuleRequest {
  module_key: string;
  billing_cycle?: 'monthly' | 'quarterly' | 'annual';
}

interface ModuleRequestResponse {
  success: boolean;
  request_id: string;
  status: string;
}

interface ActiveModule {
  module_key: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface HeartbeatResponse {
  success: boolean;
}

interface AuditLogPayload {
  instance_org_id: string;
  module: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  changes?: Record<string, any>;
  performed_by: string;
  performed_at: string;
}

class ManagementClient {
  private config: ManagementConfig | null = null;

  setConfig(config: ManagementConfig) {
    this.config = config;
  }

  getConfig(): ManagementConfig | null {
    return this.config;
  }

  isConfigured(): boolean {
    return this.config !== null && this.config.apiKey !== null && this.config.apiUrl !== null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Management client not configured');
    }

    const url = `${this.config!.apiUrl}/api/instance${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config!.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * Send heartbeat to management platform
   */
  async sendHeartbeat(version: string, databaseVersion?: string): Promise<HeartbeatResponse> {
    return this.request<HeartbeatResponse>('/heartbeat', {
      method: 'POST',
      body: JSON.stringify({
        version,
        database_version: databaseVersion,
      }),
    });
  }

  /**
   * Request a new module from management platform
   */
  async requestModule(moduleKey: string, billingCycle: 'monthly' | 'quarterly' | 'annual' = 'monthly'): Promise<ModuleRequestResponse> {
    return this.request<ModuleRequestResponse>('/modules/request', {
      method: 'POST',
      body: JSON.stringify({
        module_key: moduleKey,
        billing_cycle: billingCycle,
      }),
    });
  }

  /**
   * Get active modules for this deployment
   */
  async getActiveModules(): Promise<{ success: boolean; modules: ActiveModule[] }> {
    return this.request<{ success: boolean; modules: ActiveModule[] }>('/modules');
  }

  /**
   * Get module catalog (available modules)
   */
  async getModuleCatalog(): Promise<{ success: boolean; modules: any[] }> {
    return this.request<{ success: boolean; modules: any[] }>('/modules/catalog');
  }

  /**
   * Check module request status
   */
  async getModuleRequestStatus(requestId: string): Promise<{ success: boolean; request: any }> {
    return this.request<{ success: boolean; request: any }>(`/modules/requests/${requestId}`);
  }

  /**
   * Forward audit log to management platform
   */
  async forwardAuditLog(payload: AuditLogPayload): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/audit/forward', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Create support ticket
   */
  async createSupportTicket(
    subject: string,
    description: string,
    category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other',
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    reportedBy: string,
    reportedEmail: string
  ): Promise<{ success: boolean; ticket: any }> {
    return this.request<{ success: boolean; ticket: any }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject,
        description,
        category,
        priority,
        reported_by: reportedBy,
        reported_email: reportedEmail,
      }),
    });
  }
}

// Singleton instance
export const managementClient = new ManagementClient();

/**
 * Initialize management client from organization settings
 */
export async function initializeManagementClient(supabase: any, orgId: string): Promise<boolean> {
  try {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('management_api_key, management_api_url, management_deployment_id')
      .eq('id', orgId)
      .single();

    if (error || !org) {
      console.error('Failed to fetch org settings:', error);
      return false;
    }

    if (!org.management_api_key || !org.management_api_url) {
      console.log('Organization not linked to management platform');
      return false;
    }

    managementClient.setConfig({
      apiKey: org.management_api_key,
      apiUrl: org.management_api_url,
      deploymentId: org.management_deployment_id || undefined,
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize management client:', error);
    return false;
  }
}

/**
 * Sync modules from management platform to local org_modules
 */
export async function syncModulesFromManagement(supabase: any, orgId: string): Promise<void> {
  if (!managementClient.isConfigured()) {
    console.log('Management client not configured, skipping module sync');
    return;
  }

  try {
    const { modules } = await managementClient.getActiveModules();

    for (const module of modules) {
      // Enable module locally if it's active in management platform
      if (module.status === 'active') {
        await supabase
          .from('org_modules')
          .upsert({
            org_id: orgId,
            module_key: module.module_key,
            is_enabled: true,
            enabled_at: module.start_date,
          });
      }
    }

    // Log successful sync
    await supabase.from('management_sync_logs').insert({
      org_id: orgId,
      sync_type: 'module_sync',
      status: 'success',
      request_payload: { modules_count: modules.length },
    });

    // Update last sync time
    await supabase
      .from('organizations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', orgId);
  } catch (error) {
    console.error('Failed to sync modules from management:', error);
    
    // Log failed sync
    await supabase.from('management_sync_logs').insert({
      org_id: orgId,
      sync_type: 'module_sync',
      status: 'failed',
      error_message: String(error),
    });
  }
}

/**
 * Send periodic heartbeat
 */
export async function sendHeartbeat(supabase: any, orgId: string, version: string): Promise<void> {
  if (!managementClient.isConfigured()) {
    return;
  }

  try {
    // Get database version from migrations
    const { data: migrations } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const databaseVersion = migrations?.version || 'unknown';

    await managementClient.sendHeartbeat(version, databaseVersion);

    // Log successful heartbeat
    await supabase.from('management_sync_logs').insert({
      org_id: orgId,
      sync_type: 'heartbeat',
      status: 'success',
    });

    // Update last sync time
    await supabase
      .from('organizations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', orgId);
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
    
    // Log failed heartbeat
    await supabase.from('management_sync_logs').insert({
      org_id: orgId,
      sync_type: 'heartbeat',
      status: 'failed',
      error_message: String(error),
    });
  }
}
