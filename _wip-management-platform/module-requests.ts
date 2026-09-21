/**
 * Module Request Service
 * Handles module requests to the management platform
 */

import { supabase } from '@/lib/supabase';
import { managementClient, initializeManagementClient } from '@/lib/management-client';

export interface ModuleRequest {
  id: string;
  org_id: string;
  module_key: string;
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
  management_request_id?: string;
  payment_amount?: number;
  payment_status?: 'pending' | 'completed' | 'failed';
  requested_by?: string;
  submitted_at?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleCatalogItem {
  key: string;
  name: string;
  description: string;
  category: string;
  monthly_price_usd: number;
  annual_discount_percent: number;
  is_active: boolean;
}

/**
 * Get available modules from management platform catalog
 */
export async function getModuleCatalog(): Promise<ModuleCatalogItem[]> {
  try {
    await initializeManagementClient(supabase, (await getOrgId()));
    
    const { modules } = await managementClient.getModuleCatalog();
    return modules;
  } catch (error) {
    console.error('Failed to fetch module catalog:', error);
    return [];
  }
}

/**
 * Get current organization ID
 */
async function getOrgId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!member) throw new Error('No active organization found');
  return member.org_id;
}

/**
 * List module requests for current organization
 */
export async function listModuleRequests(status?: string): Promise<ModuleRequest[]> {
  const orgId = await getOrgId();

  const { data, error } = await supabase
    .from('outgoing_module_requests')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (status) {
    return data?.filter((r: ModuleRequest) => r.status === status) || [];
  }

  return data || [];
}

/**
 * Request a new module
 */
export async function requestModule(
  moduleKey: string,
  billingCycle: 'monthly' | 'quarterly' | 'annual' = 'monthly'
): Promise<ModuleRequest> {
  const orgId = await getOrgId();

  // Initialize management client
  const initialized = await initializeManagementClient(supabase, orgId);
  if (!initialized) {
    throw new Error('Organization not linked to management platform');
  }

  // Create local request record
  const { data: request, error: createError } = await supabase
    .from('outgoing_module_requests')
    .insert({
      org_id: orgId,
      module_key: moduleKey,
      billing_cycle: billingCycle,
      status: 'pending',
      requested_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (createError) throw createError;

  try {
    // Call management platform API
    const response = await managementClient.requestModule(moduleKey, billingCycle);

    // Update local request with management request ID
    const { data: updatedRequest, error: updateError } = await supabase
      .from('outgoing_module_requests')
      .update({
        status: 'submitted',
        management_request_id: response.request_id,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', request.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log successful sync
    await supabase.from('management_sync_logs').insert({
      org_id: orgId,
      sync_type: 'module_request',
      status: 'success',
      request_payload: { module_key: moduleKey, billing_cycle: billingCycle },
      response_payload: response,
    });

    return updatedRequest;
  } catch (apiError) {
    // Update request status to failed
    await supabase
      .from('outgoing_module_requests')
      .update({
        status: 'pending', // Keep as pending so user can retry
        notes: `API call failed: ${String(apiError)}`,
      })
      .eq('id', request.id);

    // Log failed sync
    await supabase.from('management_sync_logs').insert({
      org_id: orgId,
      sync_type: 'module_request',
      status: 'failed',
      request_payload: { module_key: moduleKey, billing_cycle: billingCycle },
      error_message: String(apiError),
    });

    throw apiError;
  }
}

/**
 * Check status of a module request from management platform
 */
export async function checkModuleRequestStatus(requestId: string): Promise<ModuleRequest> {
  const orgId = await getOrgId();

  // Get local request
  const { data: localRequest, error: fetchError } = await supabase
    .from('outgoing_module_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  if (!localRequest.management_request_id) {
    throw new Error('Request not yet submitted to management platform');
  }

  try {
    // Call management platform API to check status
    const { request: managementRequest } = await managementClient.getModuleRequestStatus(
      localRequest.management_request_id
    );

    // Update local request based on management platform status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('outgoing_module_requests')
      .update({
        status: managementRequest.status,
        payment_amount: managementRequest.payment_amount,
        payment_status: managementRequest.payment_status,
        approved_at: managementRequest.approved_at,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If approved, enable the module locally
    if (managementRequest.status === 'approved') {
      await supabase
        .from('org_modules')
        .upsert({
          org_id: orgId,
          module_key: localRequest.module_key,
          is_enabled: true,
          enabled_at: new Date().toISOString(),
        });
    }

    return updatedRequest;
  } catch (apiError) {
    console.error('Failed to check module request status:', apiError);
    throw apiError;
  }
}

/**
 * Cancel a module request
 */
export async function cancelModuleRequest(requestId: string): Promise<void> {
  const orgId = await getOrgId();

  const { error } = await supabase
    .from('outgoing_module_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('org_id', orgId);

  if (error) throw error;
}

/**
 * Get management link status
 */
export async function getManagementLinkStatus(): Promise<{
  is_linked: boolean;
  api_url: string | null;
  deployment_id: string | null;
  last_sync_at: string | null;
}> {
  const orgId = await getOrgId();

  const { data, error } = await supabase
    .from('organizations')
    .select('is_linked_to_management, management_api_url, management_deployment_id, last_sync_at')
    .eq('id', orgId)
    .single();

  if (error) throw error;

  return {
    is_linked: data.is_linked_to_management,
    api_url: data.management_api_url,
    deployment_id: data.management_deployment_id,
    last_sync_at: data.last_sync_at,
  };
}

/**
 * Link organization to management platform
 */
export async function linkToManagement(
  apiKey: string,
  apiUrl: string,
  deploymentId?: string
): Promise<void> {
  const orgId = await getOrgId();

  const { error } = await supabase.rpc('link_to_management', {
    p_org_id: orgId,
    p_api_key: apiKey,
    p_api_url: apiUrl,
    p_deployment_id: deploymentId,
  });

  if (error) throw error;

  // Reinitialize client with new config
  await initializeManagementClient(supabase, orgId);
}

/**
 * Unlink organization from management platform
 */
export async function unlinkFromManagement(): Promise<void> {
  const orgId = await getOrgId();

  const { error } = await supabase.rpc('unlink_from_management', {
    p_org_id: orgId,
  });

  if (error) throw error;

  // Clear client config
  managementClient.setConfig({ apiKey: '', apiUrl: '' });
}
