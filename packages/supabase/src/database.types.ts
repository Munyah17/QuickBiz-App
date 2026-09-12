export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance: {
        Row: {
          asset_id: string
          cost: number
          created_at: string
          description: string
          id: string
          maintenance_date: string
          org_id: string
          performed_by: string | null
        }
        Insert: {
          asset_id: string
          cost?: number
          created_at?: string
          description: string
          id?: string
          maintenance_date?: string
          org_id: string
          performed_by?: string | null
        }
        Update: {
          asset_id?: string
          cost?: number
          created_at?: string
          description?: string
          id?: string
          maintenance_date?: string
          org_id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_number: string
          assigned_to: string | null
          branch_id: string | null
          category: string
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          org_id: string
          purchase_cost: number
          purchase_date: string | null
          status: string
          updated_at: string
          useful_life_years: number
        }
        Insert: {
          asset_number: string
          assigned_to?: string | null
          branch_id?: string | null
          category?: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          org_id: string
          purchase_cost?: number
          purchase_date?: string | null
          status?: string
          updated_at?: string
          useful_life_years?: number
        }
        Update: {
          asset_number?: string
          assigned_to?: string | null
          branch_id?: string | null
          category?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          purchase_cost?: number
          purchase_date?: string | null
          status?: string
          updated_at?: string
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          module: string
          new_value: Json | null
          old_value: Json | null
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          module?: string
          new_value?: Json | null
          old_value?: Json | null
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          module?: string
          new_value?: Json | null
          old_value?: Json | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_of_materials: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          labor_cost: number
          name: string
          org_id: string
          overhead_cost: number
          product_id: string
          revision: string
          updated_at: string
          yield_quantity: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          labor_cost?: number
          name: string
          org_id: string
          overhead_cost?: number
          product_id: string
          revision?: string
          updated_at?: string
          yield_quantity?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          labor_cost?: number
          name?: string
          org_id?: string
          overhead_cost?: number
          product_id?: string
          revision?: string
          updated_at?: string
          yield_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_of_materials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_of_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          id: boolean
          setup_fee_usd: number
        }
        Insert: {
          id?: boolean
          setup_fee_usd: number
        }
        Update: {
          id?: boolean
          setup_fee_usd?: number
        }
        Relationships: []
      }
      bom_components: {
        Row: {
          bom_id: string
          component_product_id: string
          created_at: string
          id: string
          notes: string | null
          org_id: string
          quantity_per_unit: number
          wastage_percent: number
        }
        Insert: {
          bom_id: string
          component_product_id: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          quantity_per_unit: number
          wastage_percent?: number
        }
        Update: {
          bom_id?: string
          component_product_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          quantity_per_unit?: number
          wastage_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "bom_components_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bill_of_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_components_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_components_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: Json
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: Json
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: Json
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          branch_id: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          name: string
          org_id: string
          scheduled_at: string | null
          sent_at: string | null
          status: string
          target_segment: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          name: string
          org_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_segment?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          name?: string
          org_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_segment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          name: string
          symbol: string
        }
        Insert: {
          code: string
          name: string
          symbol: string
        }
        Update: {
          code?: string
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      custom_code: {
        Row: {
          code_type: string
          content: string
          id: string
          is_active: boolean
          org_id: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          code_type: string
          content?: string
          id?: string
          is_active?: boolean
          org_id: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          code_type?: string
          content?: string
          id?: string
          is_active?: boolean
          org_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_code_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_code_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_code_versions: {
        Row: {
          code_type: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          version: number
        }
        Insert: {
          code_type: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          version: number
        }
        Update: {
          code_type?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_code_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_code_versions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          entity_type: string
          field_type: string
          id: string
          is_required: boolean
          key: string
          label: string
          options: Json
          org_id: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          field_type: string
          id?: string
          is_required?: boolean
          key: string
          label: string
          options?: Json
          org_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          field_type?: string
          id?: string
          is_required?: boolean
          key?: string
          label?: string
          options?: Json
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          entity_id: string
          entity_type: string
          field_id: string
          id: string
          org_id: string
          value: Json
        }
        Insert: {
          entity_id: string
          entity_type: string
          field_id: string
          id?: string
          org_id: string
          value?: Json
        }
        Update: {
          entity_id?: string
          entity_type?: string
          field_id?: string
          id?: string
          org_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: Json
          created_at: string
          customer_type: string
          email: string | null
          id: string
          is_active: boolean
          legacy_id: string | null
          legacy_system: string | null
          name: string
          org_id: string
          phone: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          address?: Json
          created_at?: string
          customer_type?: string
          email?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          legacy_system?: string | null
          name: string
          org_id: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json
          created_at?: string
          customer_type?: string
          email?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          legacy_system?: string | null
          name?: string
          org_id?: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_cases: {
        Row: {
          action_effective_date: string | null
          action_end_date: string | null
          action_taken: string | null
          action_type: string | null
          case_number: string
          created_at: string
          created_by: string | null
          description: string
          employee_id: string
          evidence: string | null
          id: string
          incident_date: string
          notes: string | null
          org_id: string
          reported_by: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          violation_type: string
          witness_names: string | null
        }
        Insert: {
          action_effective_date?: string | null
          action_end_date?: string | null
          action_taken?: string | null
          action_type?: string | null
          case_number: string
          created_at?: string
          created_by?: string | null
          description: string
          employee_id: string
          evidence?: string | null
          id?: string
          incident_date: string
          notes?: string | null
          org_id: string
          reported_by?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
          violation_type: string
          witness_names?: string | null
        }
        Update: {
          action_effective_date?: string | null
          action_end_date?: string | null
          action_taken?: string | null
          action_type?: string | null
          case_number?: string
          created_at?: string
          created_by?: string | null
          description?: string
          employee_id?: string
          evidence?: string | null
          id?: string
          incident_date?: string
          notes?: string | null
          org_id?: string
          reported_by?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          violation_type?: string
          witness_names?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_cases_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_cases_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_hearings: {
        Row: {
          case_id: string
          chairperson_id: string | null
          created_at: string
          decision: string | null
          decision_date: string | null
          employee_present: boolean
          hearing_date: string
          hearing_time: string | null
          id: string
          location: string | null
          notes: string | null
          org_id: string
          outcome: string | null
          panel_members: Json | null
          representative_present: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id: string
          chairperson_id?: string | null
          created_at?: string
          decision?: string | null
          decision_date?: string | null
          employee_present?: boolean
          hearing_date: string
          hearing_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          org_id: string
          outcome?: string | null
          panel_members?: Json | null
          representative_present?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          chairperson_id?: string | null
          created_at?: string
          decision?: string | null
          decision_date?: string | null
          employee_present?: boolean
          hearing_date?: string
          hearing_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          org_id?: string
          outcome?: string | null
          panel_members?: Json | null
          representative_present?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "disciplinary_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_hearings_chairperson_id_fkey"
            columns: ["chairperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_hearings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_warnings: {
        Row: {
          acknowledged: boolean
          acknowledged_date: string | null
          case_id: string | null
          created_at: string
          employee_id: string
          expires_date: string | null
          id: string
          issued_by: string | null
          issued_date: string
          notes: string | null
          org_id: string
          reason: string
          warning_type: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_date?: string | null
          case_id?: string | null
          created_at?: string
          employee_id: string
          expires_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date: string
          notes?: string | null
          org_id: string
          reason: string
          warning_type: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_date?: string | null
          case_id?: string | null
          created_at?: string
          employee_id?: string
          expires_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string
          notes?: string | null
          org_id?: string
          reason?: string
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_warnings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "disciplinary_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_warnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_warnings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          branch_id: string | null
          category: string
          created_at: string
          description: string | null
          expiry_date: string | null
          file_name: string
          file_size: number
          id: string
          mime_type: string | null
          org_id: string
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          branch_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_name: string
          file_size?: number
          id?: string
          mime_type?: string | null
          org_id: string
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          branch_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string | null
          org_id?: string
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          bounced_count: number | null
          campaign_name: string
          clicked_count: number | null
          created_at: string
          created_by: string | null
          from_email: string | null
          from_name: string | null
          id: string
          notes: string | null
          opened_count: number | null
          org_id: string
          recipient_filter: Json | null
          scheduled_date: string | null
          sent_count: number | null
          sent_date: string | null
          status: string
          subject: string
          target_audience: string | null
          template_id: string | null
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          bounced_count?: number | null
          campaign_name: string
          clicked_count?: number | null
          created_at?: string
          created_by?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          notes?: string | null
          opened_count?: number | null
          org_id: string
          recipient_filter?: Json | null
          scheduled_date?: string | null
          sent_count?: number | null
          sent_date?: string | null
          status?: string
          subject: string
          target_audience?: string | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          bounced_count?: number | null
          campaign_name?: string
          clicked_count?: number | null
          created_at?: string
          created_by?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          notes?: string | null
          opened_count?: number | null
          org_id?: string
          recipient_filter?: Json | null
          scheduled_date?: string | null
          sent_count?: number | null
          sent_date?: string | null
          status?: string
          subject?: string
          target_audience?: string | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          org_id: string
          sent_at: string | null
          status: string
          subject: string
          template_type: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          org_id: string
          sent_at?: string | null
          status: string
          subject: string
          template_type?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          org_id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_type?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          created_at: string
          from_email: string
          from_name: string
          id: string
          is_active: boolean
          is_default: boolean
          org_id: string
          provider: string
          reply_to_email: string | null
          smtp_host: string | null
          smtp_password_encrypted: string | null
          smtp_port: number | null
          smtp_username: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_email: string
          from_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          org_id: string
          provider: string
          reply_to_email?: string | null
          smtp_host?: string | null
          smtp_password_encrypted?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          org_id?: string
          provider?: string
          reply_to_email?: string | null
          smtp_host?: string | null
          smtp_password_encrypted?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          org_id: string
          subject: string
          template_key: string
          template_type: string
          updated_at: string
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          org_id: string
          subject: string
          template_key: string
          template_type: string
          updated_at?: string
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          org_id?: string
          subject?: string
          template_key?: string
          template_type?: string
          updated_at?: string
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_compensation: {
        Row: {
          basic_salary: number
          employee_id: string
          org_id: string
          updated_at: string
        }
        Insert: {
          basic_salary?: number
          employee_id: string
          org_id: string
          updated_at?: string
        }
        Update: {
          basic_salary?: number
          employee_id?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_compensation_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compensation_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salary_components: {
        Row: {
          amount: number
          component_id: string
          created_at: string
          employee_id: string
          id: string
          is_active: boolean
          org_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          component_id: string
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean
          org_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          component_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_salary_components_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "salary_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_salary_components_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_salary_components_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          branch_id: string | null
          created_at: string
          department_id: string | null
          email: string | null
          employee_number: string
          employment_status: string
          full_name: string
          hire_date: string | null
          id: string
          org_id: string
          phone: string | null
          position: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          employee_number: string
          employment_status?: string
          full_name: string
          hire_date?: string | null
          id?: string
          org_id: string
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          employee_number?: string
          employment_status?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          org_id?: string
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          branch_id: string | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          org_id: string
          payment_method: string
          reference: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          org_id: string
          payment_method?: string
          reference?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          org_id?: string
          payment_method?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_devices: {
        Row: {
          branch_id: string | null
          created_at: string
          decommissioned_at: string | null
          device_model: string | null
          device_serial: string
          device_type: string
          id: string
          installed_at: string | null
          last_sync: string | null
          manufacturer: string | null
          org_id: string
          status: string
          updated_at: string
          zimra_device_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          decommissioned_at?: string | null
          device_model?: string | null
          device_serial: string
          device_type: string
          id?: string
          installed_at?: string | null
          last_sync?: string | null
          manufacturer?: string | null
          org_id: string
          status?: string
          updated_at?: string
          zimra_device_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          decommissioned_at?: string | null
          device_model?: string | null
          device_serial?: string
          device_type?: string
          id?: string
          installed_at?: string | null
          last_sync?: string | null
          manufacturer?: string | null
          org_id?: string
          status?: string
          updated_at?: string
          zimra_device_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_devices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_transactions: {
        Row: {
          amount: number
          fiscal_device_id: string
          fiscal_serial: string
          id: string
          invoice_number: string
          org_id: string
          qr_code: string | null
          synced_at: string
          transaction_date: string
          vat_amount: number | null
          zimra_signature: string | null
        }
        Insert: {
          amount: number
          fiscal_device_id: string
          fiscal_serial: string
          id?: string
          invoice_number: string
          org_id: string
          qr_code?: string | null
          synced_at?: string
          transaction_date: string
          vat_amount?: number | null
          zimra_signature?: string | null
        }
        Update: {
          amount?: number
          fiscal_device_id?: string
          fiscal_serial?: string
          id?: string
          invoice_number?: string
          org_id?: string
          qr_code?: string | null
          synced_at?: string
          transaction_date?: string
          vat_amount?: number | null
          zimra_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_transactions_fiscal_device_id_fkey"
            columns: ["fiscal_device_id"]
            isOneToOne: false
            referencedRelation: "fiscal_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          cost: number
          created_at: string
          fuel_date: string
          id: string
          liters: number
          odometer_km: number | null
          org_id: string
          recorded_by: string | null
          vehicle_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          fuel_date?: string
          id?: string
          liters: number
          odometer_km?: number | null
          org_id: string
          recorded_by?: string | null
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          fuel_date?: string
          id?: string
          liters?: number
          odometer_km?: number | null
          org_id?: string
          recorded_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      iban_accounts: {
        Row: {
          account_number: string | null
          available_balance: number
          balance: number
          bank_code: string | null
          bank_name: string | null
          closed_at: string | null
          created_at: string
          currency: string
          iban: string | null
          id: string
          notes: string | null
          org_id: string
          provisioned_at: string | null
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          available_balance?: number
          balance?: number
          bank_code?: string | null
          bank_name?: string | null
          closed_at?: string | null
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          notes?: string | null
          org_id: string
          provisioned_at?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          available_balance?: number
          balance?: number
          bank_code?: string | null
          bank_name?: string | null
          closed_at?: string | null
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          provisioned_at?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iban_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iban_accounts_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      iban_transactions: {
        Row: {
          amount: number
          counterparty_iban: string | null
          counterparty_name: string | null
          created_at: string
          currency: string
          description: string | null
          iban_account_id: string
          id: string
          org_id: string
          reference: string | null
          status: string
          transaction_type: string
          value_date: string | null
        }
        Insert: {
          amount: number
          counterparty_iban?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          iban_account_id: string
          id?: string
          org_id: string
          reference?: string | null
          status?: string
          transaction_type: string
          value_date?: string | null
        }
        Update: {
          amount?: number
          counterparty_iban?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          iban_account_id?: string
          id?: string
          org_id?: string
          reference?: string | null
          status?: string
          transaction_type?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iban_transactions_iban_account_id_fkey"
            columns: ["iban_account_id"]
            isOneToOne: false
            referencedRelation: "iban_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iban_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          approved_at: string | null
          claim_amount: number
          claim_number: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          incident_date: string
          incident_description: string
          insurer_reference: string | null
          notes: string | null
          org_id: string
          paid_at: string | null
          policy_id: string
          settlement_amount: number | null
          status: string
          submitted_at: string
          supporting_documents: Json | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          claim_amount: number
          claim_number: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          incident_date: string
          incident_description: string
          insurer_reference?: string | null
          notes?: string | null
          org_id: string
          paid_at?: string | null
          policy_id: string
          settlement_amount?: number | null
          status?: string
          submitted_at?: string
          supporting_documents?: Json | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          claim_amount?: number
          claim_number?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          incident_date?: string
          incident_description?: string
          insurer_reference?: string | null
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          policy_id?: string
          settlement_amount?: number | null
          status?: string
          submitted_at?: string
          supporting_documents?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          asset_id: string | null
          coverage_type: string | null
          created_at: string
          created_by: string | null
          currency: string
          end_date: string
          frequency: string
          id: string
          insurer_id: string | null
          notes: string | null
          org_id: string
          policy_document: string | null
          policy_number: string
          policy_type: string
          premium: number
          renewal_reminder_days: number | null
          start_date: string
          status: string
          sum_insured: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          asset_id?: string | null
          coverage_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          end_date: string
          frequency: string
          id?: string
          insurer_id?: string | null
          notes?: string | null
          org_id: string
          policy_document?: string | null
          policy_number: string
          policy_type: string
          premium: number
          renewal_reminder_days?: number | null
          start_date: string
          status?: string
          sum_insured?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          asset_id?: string | null
          coverage_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          end_date?: string
          frequency?: string
          id?: string
          insurer_id?: string | null
          notes?: string | null
          org_id?: string
          policy_document?: string | null
          policy_number?: string
          policy_type?: string
          premium?: number
          renewal_reminder_days?: number | null
          start_date?: string
          status?: string
          sum_insured?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurer_catalog: {
        Row: {
          category: string
          contact_email: string | null
          contact_phone: string | null
          coverage_types: Json | null
          description: string
          is_active: boolean
          key: string
          name: string
          regions: Json | null
          website: string | null
        }
        Insert: {
          category: string
          contact_email?: string | null
          contact_phone?: string | null
          coverage_types?: Json | null
          description: string
          is_active?: boolean
          key: string
          name: string
          regions?: Json | null
          website?: string | null
        }
        Update: {
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          coverage_types?: Json | null
          description?: string
          is_active?: boolean
          key?: string
          name?: string
          regions?: Json | null
          website?: string | null
        }
        Relationships: []
      }
      insurers: {
        Row: {
          activation_date: string | null
          address: string | null
          catalog_key: string | null
          code: string
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          is_catalog_activated: boolean
          name: string
          org_id: string
          phone: string | null
          policy_types: Json | null
          updated_at: string
        }
        Insert: {
          activation_date?: string | null
          address?: string | null
          catalog_key?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_catalog_activated?: boolean
          name: string
          org_id: string
          phone?: string | null
          policy_types?: Json | null
          updated_at?: string
        }
        Update: {
          activation_date?: string | null
          address?: string | null
          catalog_key?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_catalog_activated?: boolean
          name?: string
          org_id?: string
          phone?: string | null
          policy_types?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurers_catalog_key_fkey"
            columns: ["catalog_key"]
            isOneToOne: false
            referencedRelation: "insurer_catalog"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "insurers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_providers: {
        Row: {
          category: string
          credential_fields: Json
          description: string
          key: string
          name: string
        }
        Insert: {
          category: string
          credential_fields: Json
          description: string
          key: string
          name: string
        }
        Update: {
          category?: string
          credential_fields?: Json
          description?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      inventory_locations: {
        Row: {
          bin_id: string
          created_at: string
          expiry_date: string | null
          id: string
          lot_number: string | null
          org_id: string
          product_id: string | null
          quantity: number
          received_date: string | null
          status: string
          unit: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          bin_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          lot_number?: string | null
          org_id: string
          product_id?: string | null
          quantity?: number
          received_date?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          bin_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          lot_number?: string | null
          org_id?: string
          product_id?: string | null
          quantity?: number
          received_date?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_locations_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_locations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          converted_customer_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          converted_customer_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          converted_customer_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_customer_id_fkey"
            columns: ["converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          org_id: string
          points: number
          reason: string | null
          recorded_by: string | null
          type: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          org_id: string
          points: number
          reason?: string | null
          recorded_by?: string | null
          type: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          org_id?: string
          points?: number
          reason?: string | null
          recorded_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      module_catalog: {
        Row: {
          category: string
          description: string
          key: string
          monthly_price_usd: number
          name: string
        }
        Insert: {
          category: string
          description: string
          key: string
          monthly_price_usd?: number
          name: string
        }
        Update: {
          category?: string
          description?: string
          key?: string
          monthly_price_usd?: number
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          org_id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          org_id: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          org_id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      numbering_sequences: {
        Row: {
          entity_type: string
          next_number: number
          org_id: string
          prefix: string
        }
        Insert: {
          entity_type: string
          next_number?: number
          org_id: string
          prefix?: string
        }
        Update: {
          entity_type?: string
          next_number?: number
          org_id?: string
          prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "numbering_sequences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          org_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          order_id: string
          org_id: string
          product_id: string
          quantity: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          org_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "online_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      online_orders: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          delivery_address: string | null
          delivery_method: string
          delivery_status: string
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          order_number: string
          org_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivery_address?: string | null
          delivery_method?: string
          delivery_status?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          order_number: string
          org_id: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivery_address?: string | null
          delivery_method?: string
          delivery_status?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          org_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      online_products: {
        Row: {
          created_at: string
          description_override: string | null
          id: string
          is_published: boolean
          online_price: number | null
          org_id: string
          product_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_override?: string | null
          id?: string
          is_published?: boolean
          online_price?: number | null
          org_id: string
          product_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_override?: string | null
          id?: string
          is_published?: boolean
          online_price?: number | null
          org_id?: string
          product_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          name: string
          notes: string | null
          org_id: string
          stage: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          name: string
          notes?: string | null
          org_id: string
          stage?: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          stage?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_integration_connections: {
        Row: {
          account_label: string
          connected_by: string | null
          created_at: string
          credentials: Json
          id: string
          is_connected: boolean
          org_id: string
          provider_key: string
          updated_at: string
        }
        Insert: {
          account_label: string
          connected_by?: string | null
          created_at?: string
          credentials?: Json
          id?: string
          is_connected?: boolean
          org_id: string
          provider_key: string
          updated_at?: string
        }
        Update: {
          account_label?: string
          connected_by?: string | null
          created_at?: string
          credentials?: Json
          id?: string
          is_connected?: boolean
          org_id?: string
          provider_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_integration_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_integration_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_integration_connections_provider_key_fkey"
            columns: ["provider_key"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["key"]
          },
        ]
      }
      org_members: {
        Row: {
          branch_id: string | null
          created_at: string
          department_id: string | null
          id: string
          org_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          org_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          org_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_modules: {
        Row: {
          created_at: string
          enabled_at: string | null
          id: string
          module_key: string
          org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled_at?: string | null
          id?: string
          module_key: string
          org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled_at?: string | null
          id?: string
          module_key?: string
          org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_modules_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "module_catalog"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "org_modules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          key: string
          org_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          org_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          org_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_social_accounts: {
        Row: {
          access_token_encrypted: string
          account_id: string
          account_name: string
          connected_by: string | null
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          platform_key: string
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted: string
          account_id: string
          account_name: string
          connected_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          platform_key: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string
          account_id?: string
          account_name?: string
          connected_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          platform_key?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_social_accounts_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_social_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_social_accounts_platform_key_fkey"
            columns: ["platform_key"]
            isOneToOne: false
            referencedRelation: "social_platforms"
            referencedColumns: ["key"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_status: string
          created_at: string
          currency: string
          id: string
          legal_name: string | null
          name: string
          setup_fee_paid: boolean
          theme_color: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          billing_status?: string
          created_at?: string
          currency?: string
          id?: string
          legal_name?: string | null
          name: string
          setup_fee_paid?: boolean
          theme_color?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          billing_status?: string
          created_at?: string
          currency?: string
          id?: string
          legal_name?: string | null
          name?: string
          setup_fee_paid?: boolean
          theme_color?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          pay_date: string | null
          period_end: string
          period_start: string
          run_number: string
          status: string
          total_deductions: number
          total_gross: number
          total_net: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          pay_date?: string | null
          period_end: string
          period_start: string
          run_number: string
          status?: string
          total_deductions?: number
          total_gross?: number
          total_net?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          pay_date?: string | null
          period_end?: string
          period_start?: string
          run_number?: string
          status?: string
          total_deductions?: number
          total_gross?: number
          total_net?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_tax_settings: {
        Row: {
          aids_levy_rate: number
          nssa_employee_rate: number
          nssa_employer_rate: number
          nssa_insurable_ceiling: number | null
          org_id: string
          paye_bands: Json
          updated_at: string
        }
        Insert: {
          aids_levy_rate?: number
          nssa_employee_rate?: number
          nssa_employer_rate?: number
          nssa_insurable_ceiling?: number | null
          org_id: string
          paye_bands?: Json
          updated_at?: string
        }
        Update: {
          aids_levy_rate?: number
          nssa_employee_rate?: number
          nssa_employer_rate?: number
          nssa_insurable_ceiling?: number | null
          org_id?: string
          paye_bands?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_tax_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payslip_lines: {
        Row: {
          amount: number
          component_name: string
          component_type: string
          id: string
          payslip_id: string
        }
        Insert: {
          amount?: number
          component_name: string
          component_type: string
          id?: string
          payslip_id: string
        }
        Update: {
          amount?: number
          component_name?: string
          component_type?: string
          id?: string
          payslip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslip_lines_payslip_id_fkey"
            columns: ["payslip_id"]
            isOneToOne: false
            referencedRelation: "payslips"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          aids_levy_amount: number
          basic_salary: number
          created_at: string
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          nssa_employee_amount: number
          org_id: string
          other_deductions: number
          paye_amount: number
          payroll_run_id: string
        }
        Insert: {
          aids_levy_amount?: number
          basic_salary?: number
          created_at?: string
          employee_id: string
          gross_pay?: number
          id?: string
          net_pay?: number
          nssa_employee_amount?: number
          org_id: string
          other_deductions?: number
          paye_amount?: number
          payroll_run_id: string
        }
        Update: {
          aids_levy_amount?: number
          basic_salary?: number
          created_at?: string
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          nssa_employee_amount?: number
          org_id?: string
          other_deductions?: number
          paye_amount?: number
          payroll_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          id: string
          key: string
          label: string
        }
        Insert: {
          category: string
          id?: string
          key: string
          label: string
        }
        Update: {
          category?: string
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      petty_cash_transactions: {
        Row: {
          amount: number
          approved_by: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          org_id: string
          petty_cash_id: string
          receipt_number: string | null
          recipient_id: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          org_id: string
          petty_cash_id: string
          receipt_number?: string | null
          recipient_id?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          org_id?: string
          petty_cash_id?: string
          receipt_number?: string | null
          recipient_id?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_petty_cash_id_fkey"
            columns: ["petty_cash_id"]
            isOneToOne: false
            referencedRelation: "project_petty_cash"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_permissions: {
        Row: {
          key: string
          label: string
        }
        Insert: {
          key: string
          label: string
        }
        Update: {
          key?: string
          label?: string
        }
        Relationships: []
      }
      platform_role_permissions: {
        Row: {
          permission_key: string
          role_key: string
        }
        Insert: {
          permission_key: string
          role_key: string
        }
        Update: {
          permission_key?: string
          role_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "platform_permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "platform_role_permissions_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "platform_roles"
            referencedColumns: ["key"]
          },
        ]
      }
      platform_roles: {
        Row: {
          description: string
          key: string
          name: string
        }
        Insert: {
          description: string
          key: string
          name: string
        }
        Update: {
          description?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      platform_staff: {
        Row: {
          created_at: string
          id: string
          role_key: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_key: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_key?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_staff_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "platform_roles"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "platform_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_registers: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_registers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_registers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          closed_at: string | null
          closing_float: number | null
          id: string
          opened_at: string
          opened_by: string | null
          opening_float: number
          org_id: string
          register_id: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          closing_float?: number | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          opening_float?: number
          org_id: string
          register_id: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          closing_float?: number | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          opening_float?: number
          org_id?: string
          register_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_register_id_fkey"
            columns: ["register_id"]
            isOneToOne: false
            referencedRelation: "pos_registers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          reorder_level: number
          selling_price: number
          sku: string
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          reorder_level?: number
          selling_price?: number
          sku: string
          unit_of_measure?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          reorder_level?: number
          selling_price?: number
          sku?: string
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          name: string
          org_id: string
          progress: number | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          name: string
          org_id: string
          progress?: number | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          name?: string
          org_id?: string
          progress?: number | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_petty_cash: {
        Row: {
          created_at: string
          currency: string
          current_balance: number
          custodian_id: string | null
          fund_name: string
          id: string
          initial_amount: number
          org_id: string
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_balance: number
          custodian_id?: string | null
          fund_name: string
          id?: string
          initial_amount: number
          org_id: string
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_balance?: number
          custodian_id?: string | null
          fund_name?: string
          id?: string
          initial_amount?: number
          org_id?: string
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_petty_cash_custodian_id_fkey"
            columns: ["custodian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_petty_cash_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_petty_cash_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          allocated_quantity: number | null
          allocation_end: string | null
          allocation_start: string | null
          cost_per_unit: number | null
          created_at: string
          id: string
          org_id: string
          project_id: string
          resource_id: string | null
          resource_name: string
          resource_type: string
          total_cost: number | null
          unit: string | null
          updated_at: string
          utilization_percent: number | null
        }
        Insert: {
          allocated_quantity?: number | null
          allocation_end?: string | null
          allocation_start?: string | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          org_id: string
          project_id: string
          resource_id?: string | null
          resource_name: string
          resource_type: string
          total_cost?: number | null
          unit?: string | null
          updated_at?: string
          utilization_percent?: number | null
        }
        Update: {
          allocated_quantity?: number | null
          allocation_end?: string | null
          allocation_start?: string | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          org_id?: string
          project_id?: string
          resource_id?: string | null
          resource_name?: string
          resource_type?: string
          total_cost?: number | null
          unit?: string | null
          updated_at?: string
          utilization_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_date: string | null
          id: string
          org_id: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          org_id: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          org_id?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_timesheets: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          billable: boolean
          created_at: string
          date: string
          description: string | null
          hourly_rate: number | null
          hours: number
          id: string
          org_id: string
          project_id: string
          staff_id: string
          task_id: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          billable?: boolean
          created_at?: string
          date: string
          description?: string | null
          hourly_rate?: number | null
          hours: number
          id?: string
          org_id: string
          project_id: string
          staff_id: string
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          billable?: boolean
          created_at?: string
          date?: string
          description?: string | null
          hourly_rate?: number | null
          hours?: number
          id?: string
          org_id?: string
          project_id?: string
          staff_id?: string
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timesheets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timesheets_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timesheets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          org_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          org_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          org_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          description: string
          id: string
          line_total: number
          po_id: string
          product_id: string | null
          quantity: number
          unit_cost: number
        }
        Insert: {
          description: string
          id?: string
          line_total?: number
          po_id: string
          product_id?: string | null
          quantity?: number
          unit_cost?: number
        }
        Update: {
          description?: string
          id?: string
          line_total?: number
          po_id?: string
          product_id?: string | null
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount_paid: number
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          po_number: string
          received_at: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          tax_total: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          po_number: string
          received_at?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          po_number?: string
          received_at?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_payments: {
        Row: {
          amount: number
          id: string
          method: string
          org_id: string
          paid_at: string
          po_id: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          id?: string
          method?: string
          org_id: string
          paid_at?: string
          po_id: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          id?: string
          method?: string
          org_id?: string
          paid_at?: string
          po_id?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          impact: number | null
          likelihood: number | null
          mitigation_strategy: string | null
          org_id: string
          owner_id: string | null
          review_date: string | null
          risk_level: string
          risk_score: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          mitigation_strategy?: string | null
          org_id: string
          owner_id?: string | null
          review_date?: string | null
          risk_level: string
          risk_score?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          mitigation_strategy?: string | null
          org_id?: string
          owner_id?: string | null
          review_date?: string | null
          risk_level?: string
          risk_score?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_components: {
        Row: {
          calculation_method: string
          component_type: string
          created_at: string
          default_amount: number
          id: string
          is_active: boolean
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          calculation_method?: string
          component_type: string
          created_at?: string
          default_amount?: number
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          calculation_method?: string
          component_type?: string
          created_at?: string
          default_amount?: number
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_components_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          line_total: number
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          amount_paid: number
          branch_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          id: string
          invoice_number: string
          notes: string | null
          org_id: string
          pos_session_id: string | null
          status: string
          subtotal: number
          tax_total: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          org_id: string
          pos_session_id?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          org_id?: string
          pos_session_id?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_pos_session_fkey"
            columns: ["pos_session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_payments: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          method: string
          org_id: string
          paid_at: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          method?: string
          org_id: string
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          method?: string
          org_id?: string
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sheq_incidents: {
        Row: {
          actual_completion_date: string | null
          assigned_to: string | null
          branch_id: string | null
          corrective_actions: string | null
          created_at: string
          date_occurred: string
          description: string
          id: string
          immediate_actions: string | null
          incident_number: string
          incident_type: string
          involved_persons: string | null
          location: string | null
          org_id: string
          preventive_actions: string | null
          reported_by: string | null
          root_cause: string | null
          severity: string
          status: string
          target_completion_date: string | null
          time_occurred: string | null
          title: string
          updated_at: string
          witnesses: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          corrective_actions?: string | null
          created_at?: string
          date_occurred: string
          description: string
          id?: string
          immediate_actions?: string | null
          incident_number: string
          incident_type: string
          involved_persons?: string | null
          location?: string | null
          org_id: string
          preventive_actions?: string | null
          reported_by?: string | null
          root_cause?: string | null
          severity: string
          status?: string
          target_completion_date?: string | null
          time_occurred?: string | null
          title: string
          updated_at?: string
          witnesses?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          corrective_actions?: string | null
          created_at?: string
          date_occurred?: string
          description?: string
          id?: string
          immediate_actions?: string | null
          incident_number?: string
          incident_type?: string
          involved_persons?: string | null
          location?: string | null
          org_id?: string
          preventive_actions?: string | null
          reported_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          target_completion_date?: string | null
          time_occurred?: string | null
          title?: string
          updated_at?: string
          witnesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sheq_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_incidents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sheq_inspections: {
        Row: {
          area: string | null
          branch_id: string | null
          completed_date: string | null
          created_at: string
          critical_issues: number | null
          description: string | null
          findings: string | null
          follow_up_date: string | null
          follow_up_required: boolean
          id: string
          inspection_number: string
          inspection_type: string
          inspector_id: string | null
          major_issues: number | null
          minor_issues: number | null
          non_conformities: number | null
          org_id: string
          overall_score: number | null
          recommendations: string | null
          scheduled_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          branch_id?: string | null
          completed_date?: string | null
          created_at?: string
          critical_issues?: number | null
          description?: string | null
          findings?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean
          id?: string
          inspection_number: string
          inspection_type: string
          inspector_id?: string | null
          major_issues?: number | null
          minor_issues?: number | null
          non_conformities?: number | null
          org_id: string
          overall_score?: number | null
          recommendations?: string | null
          scheduled_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          branch_id?: string | null
          completed_date?: string | null
          created_at?: string
          critical_issues?: number | null
          description?: string | null
          findings?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean
          id?: string
          inspection_number?: string
          inspection_type?: string
          inspector_id?: string | null
          major_issues?: number | null
          minor_issues?: number | null
          non_conformities?: number | null
          org_id?: string
          overall_score?: number | null
          recommendations?: string | null
          scheduled_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheq_inspections_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_inspections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sheq_risk_assessments: {
        Row: {
          affected_personnel: string | null
          assessed_by: string | null
          assessment_number: string
          branch_id: string | null
          category: string | null
          created_at: string
          existing_controls: string | null
          hazard: string
          id: string
          likelihood: number | null
          location: string | null
          org_id: string
          recommended_controls: string | null
          responsible_person: string | null
          review_date: string | null
          risk_level: string | null
          risk_score: number | null
          severity: number | null
          status: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          affected_personnel?: string | null
          assessed_by?: string | null
          assessment_number: string
          branch_id?: string | null
          category?: string | null
          created_at?: string
          existing_controls?: string | null
          hazard: string
          id?: string
          likelihood?: number | null
          location?: string | null
          org_id: string
          recommended_controls?: string | null
          responsible_person?: string | null
          review_date?: string | null
          risk_level?: string | null
          risk_score?: number | null
          severity?: number | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          affected_personnel?: string | null
          assessed_by?: string | null
          assessment_number?: string
          branch_id?: string | null
          category?: string | null
          created_at?: string
          existing_controls?: string | null
          hazard?: string
          id?: string
          likelihood?: number | null
          location?: string | null
          org_id?: string
          recommended_controls?: string | null
          responsible_person?: string | null
          review_date?: string | null
          risk_level?: string | null
          risk_score?: number | null
          severity?: number | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheq_risk_assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_risk_assessments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_risk_assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_risk_assessments_responsible_person_fkey"
            columns: ["responsible_person"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sheq_training: {
        Row: {
          attendees: Json | null
          certification_expiry: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string
          instructor: string | null
          location: string | null
          org_id: string
          status: string
          title: string
          training_date: string
          training_type: string
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          certification_expiry?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          location?: string | null
          org_id: string
          status?: string
          title: string
          training_date: string
          training_type: string
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          certification_expiry?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor?: string | null
          location?: string | null
          org_id?: string
          status?: string
          title?: string
          training_date?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheq_training_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheq_training_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          branch_id: string | null
          carrier: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          delivered_at: string | null
          delivery_address: string | null
          dispatched_at: string | null
          driver_id: string | null
          id: string
          notes: string | null
          online_order_id: string | null
          org_id: string
          sales_invoice_id: string | null
          shipment_number: string
          status: string
          tracking_number: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          branch_id?: string | null
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          dispatched_at?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          online_order_id?: string | null
          org_id: string
          sales_invoice_id?: string | null
          shipment_number: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          branch_id?: string | null
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          dispatched_at?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          online_order_id?: string | null
          org_id?: string
          sales_invoice_id?: string | null
          shipment_number?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_online_order_id_fkey"
            columns: ["online_order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_platforms: {
        Row: {
          api_endpoint: string | null
          character_limit: number | null
          image_aspect_ratio: string | null
          key: string
          name: string
          supports_images: boolean
          supports_videos: boolean
        }
        Insert: {
          api_endpoint?: string | null
          character_limit?: number | null
          image_aspect_ratio?: string | null
          key: string
          name: string
          supports_images?: boolean
          supports_videos?: boolean
        }
        Update: {
          api_endpoint?: string | null
          character_limit?: number | null
          image_aspect_ratio?: string | null
          key?: string
          name?: string
          supports_images?: boolean
          supports_videos?: boolean
        }
        Relationships: []
      }
      social_post_publications: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          org_id: string
          platform_key: string
          platform_post_id: string | null
          post_id: string
          published_at: string | null
          social_account_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          org_id: string
          platform_key: string
          platform_post_id?: string | null
          post_id: string
          published_at?: string | null
          social_account_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          org_id?: string
          platform_key?: string
          platform_post_id?: string | null
          post_id?: string
          published_at?: string | null
          social_account_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_publications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_publications_platform_key_fkey"
            columns: ["platform_key"]
            isOneToOne: false
            referencedRelation: "social_platforms"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "social_post_publications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_publications_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "org_social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          caption: string | null
          content: string
          created_at: string
          created_by: string | null
          hashtags: string[] | null
          id: string
          media_urls: Json | null
          org_id: string
          platform_specific_content: Json | null
          platforms: Json
          published_at: string | null
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: Json | null
          org_id: string
          platform_specific_content?: Json | null
          platforms?: Json
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: Json | null
          org_id?: string
          platform_specific_content?: Json | null
          platforms?: Json
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          id: string
          org_id: string
          product_id: string
          quantity_on_hand: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          id?: string
          org_id: string
          product_id: string
          quantity_on_hand?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          id?: string
          org_id?: string
          product_id?: string
          quantity_on_hand?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          product_id: string
          quantity_delta: number
          reason: string
          reference: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          product_id: string
          quantity_delta: number
          reason: string
          reference?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          product_id?: string
          quantity_delta?: number
          reason?: string
          reference?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_take_adjustments: {
        Row: {
          adjustment_quantity: number
          adjustment_type: string
          adjustment_value: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          org_id: string
          quantity_after: number
          quantity_before: number
          reason: string | null
          stock_take_id: string
          stock_take_line_id: string
          unit_cost: number | null
        }
        Insert: {
          adjustment_quantity: number
          adjustment_type: string
          adjustment_value?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          org_id: string
          quantity_after: number
          quantity_before: number
          reason?: string | null
          stock_take_id: string
          stock_take_line_id: string
          unit_cost?: number | null
        }
        Update: {
          adjustment_quantity?: number
          adjustment_type?: string
          adjustment_value?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          org_id?: string
          quantity_after?: number
          quantity_before?: number
          reason?: string | null
          stock_take_id?: string
          stock_take_line_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_take_adjustments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_adjustments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_adjustments_stock_take_id_fkey"
            columns: ["stock_take_id"]
            isOneToOne: false
            referencedRelation: "stock_takes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_adjustments_stock_take_line_id_fkey"
            columns: ["stock_take_line_id"]
            isOneToOne: false
            referencedRelation: "stock_take_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_take_lines: {
        Row: {
          bin_id: string | null
          count_status: string
          counted_at: string | null
          counted_by: string | null
          counted_quantity: number | null
          created_at: string
          id: string
          notes: string | null
          org_id: string
          product_id: string | null
          product_name: string
          sku_code: string | null
          stock_take_id: string
          system_quantity: number
          unit_cost: number | null
          updated_at: string
          variance: number | null
          variance_value: number | null
          verified_at: string | null
          verified_by: string | null
          warehouse_id: string | null
        }
        Insert: {
          bin_id?: string | null
          count_status?: string
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          product_id?: string | null
          product_name: string
          sku_code?: string | null
          stock_take_id: string
          system_quantity: number
          unit_cost?: number | null
          updated_at?: string
          variance?: number | null
          variance_value?: number | null
          verified_at?: string | null
          verified_by?: string | null
          warehouse_id?: string | null
        }
        Update: {
          bin_id?: string | null
          count_status?: string
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          product_id?: string | null
          product_name?: string
          sku_code?: string | null
          stock_take_id?: string
          system_quantity?: number
          unit_cost?: number | null
          updated_at?: string
          variance?: number | null
          variance_value?: number | null
          verified_at?: string | null
          verified_by?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_take_lines_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_lines_counted_by_fkey"
            columns: ["counted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_lines_stock_take_id_fkey"
            columns: ["stock_take_id"]
            isOneToOne: false
            referencedRelation: "stock_takes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_lines_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_lines_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_takes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          completed_at: string | null
          count_type: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          notes: string | null
          org_id: string
          scheduled_date: string
          started_at: string | null
          status: string
          stock_take_number: string
          title: string
          total_items_counted: number | null
          total_items_expected: number | null
          total_variance_value: number | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          completed_at?: string | null
          count_type: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          notes?: string | null
          org_id: string
          scheduled_date: string
          started_at?: string | null
          status?: string
          stock_take_number: string
          title: string
          total_items_counted?: number | null
          total_items_expected?: number | null
          total_variance_value?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          completed_at?: string | null
          count_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          scheduled_date?: string
          started_at?: string | null
          status?: string
          stock_take_number?: string
          title?: string
          total_items_counted?: number | null
          total_items_expected?: number | null
          total_variance_value?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_takes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_takes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_takes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_takes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_takes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: Json
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          phone: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          address?: Json
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filings: {
        Row: {
          accepted_at: string | null
          amount: number
          created_at: string
          currency: string
          filing_reference: string | null
          id: string
          org_id: string
          paid_at: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          tax_period_id: string
          updated_at: string
          zimra_response: Json | null
        }
        Insert: {
          accepted_at?: string | null
          amount: number
          created_at?: string
          currency?: string
          filing_reference?: string | null
          id?: string
          org_id: string
          paid_at?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tax_period_id: string
          updated_at?: string
          zimra_response?: Json | null
        }
        Update: {
          accepted_at?: string | null
          amount?: number
          created_at?: string
          currency?: string
          filing_reference?: string | null
          id?: string
          org_id?: string
          paid_at?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tax_period_id?: string
          updated_at?: string
          zimra_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_filings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_filings_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_filings_tax_period_id_fkey"
            columns: ["tax_period_id"]
            isOneToOne: false
            referencedRelation: "tax_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_payments: {
        Row: {
          amount: number
          bank_reference: string | null
          created_by: string | null
          currency: string
          id: string
          org_id: string
          paid_at: string
          payment_method: string
          payment_reference: string | null
          tax_filing_id: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          org_id: string
          paid_at?: string
          payment_method: string
          payment_reference?: string | null
          tax_filing_id?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          org_id?: string
          paid_at?: string
          payment_method?: string
          payment_reference?: string | null
          tax_filing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_payments_tax_filing_id_fkey"
            columns: ["tax_filing_id"]
            isOneToOne: false
            referencedRelation: "tax_filings"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_periods: {
        Row: {
          created_at: string
          due_date: string
          end_date: string
          id: string
          org_id: string
          period: number
          start_date: string
          status: string
          tax_type_key: string
          year: number
        }
        Insert: {
          created_at?: string
          due_date: string
          end_date: string
          id?: string
          org_id: string
          period: number
          start_date: string
          status?: string
          tax_type_key: string
          year: number
        }
        Update: {
          created_at?: string
          due_date?: string
          end_date?: string
          id?: string
          org_id?: string
          period?: number
          start_date?: string
          status?: string
          tax_type_key?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_periods_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_periods_tax_type_key_fkey"
            columns: ["tax_type_key"]
            isOneToOne: false
            referencedRelation: "tax_types"
            referencedColumns: ["key"]
          },
        ]
      }
      tax_types: {
        Row: {
          description: string | null
          due_day: number | null
          frequency: string
          key: string
          name: string
          zimra_code: string | null
        }
        Insert: {
          description?: string | null
          due_day?: number | null
          frequency: string
          key: string
          name: string
          zimra_code?: string | null
        }
        Update: {
          description?: string | null
          due_day?: number | null
          frequency?: string
          key?: string
          name?: string
          zimra_code?: string | null
        }
        Relationships: []
      }
      tender_bids: {
        Row: {
          amount: number
          bid_number: string
          commercial_score: number | null
          created_at: string
          currency: string
          evaluation_notes: string | null
          id: string
          org_id: string
          proposal_document: string | null
          status: string
          submitted_at: string
          supplier_id: string | null
          technical_score: number | null
          tender_id: string
          total_score: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          bid_number: string
          commercial_score?: number | null
          created_at?: string
          currency?: string
          evaluation_notes?: string | null
          id?: string
          org_id: string
          proposal_document?: string | null
          status?: string
          submitted_at?: string
          supplier_id?: string | null
          technical_score?: number | null
          tender_id: string
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bid_number?: string
          commercial_score?: number | null
          created_at?: string
          currency?: string
          evaluation_notes?: string | null
          id?: string
          org_id?: string
          proposal_document?: string | null
          status?: string
          submitted_at?: string
          supplier_id?: string | null
          technical_score?: number | null
          tender_id?: string
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_bids_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_bids_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_bids_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_documents: {
        Row: {
          created_at: string
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          org_id: string
          tender_id: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_size?: number | null
          file_url: string
          id?: string
          org_id: string
          tender_id: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          org_id?: string
          tender_id?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          award_amount: number | null
          award_date: string | null
          awarded_to: string | null
          budget: number | null
          category: string | null
          closing_date: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          evaluation_criteria: Json | null
          id: string
          issue_date: string
          org_id: string
          requirements: Json | null
          status: string
          tender_number: string
          title: string
          updated_at: string
        }
        Insert: {
          award_amount?: number | null
          award_date?: string | null
          awarded_to?: string | null
          budget?: number | null
          category?: string | null
          closing_date: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          evaluation_criteria?: Json | null
          id?: string
          issue_date: string
          org_id: string
          requirements?: Json | null
          status?: string
          tender_number: string
          title: string
          updated_at?: string
        }
        Update: {
          award_amount?: number | null
          award_date?: string | null
          awarded_to?: string | null
          budget?: number | null
          category?: string | null
          closing_date?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          evaluation_criteria?: Json | null
          id?: string
          issue_date?: string
          org_id?: string
          requirements?: Json | null
          status?: string
          tender_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_awarded_to_fkey"
            columns: ["awarded_to"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          org_id: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          org_id: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          org_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          id: string
          org_id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          org_id: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          org_id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          org_member_id: string
          role_id: string
        }
        Insert: {
          org_member_id: string
          role_id: string
        }
        Update: {
          org_member_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_member_id_fkey"
            columns: ["org_member_id"]
            isOneToOne: false
            referencedRelation: "org_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          branch_id: string | null
          created_at: string
          driver_id: string | null
          id: string
          insurance_expiry: string | null
          license_expiry: string | null
          make: string | null
          model: string | null
          odometer_km: number
          org_id: string
          registration_number: string
          status: string
          updated_at: string
          year: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          insurance_expiry?: string | null
          license_expiry?: string | null
          make?: string | null
          model?: string | null
          odometer_km?: number
          org_id: string
          registration_number: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          insurance_expiry?: string | null
          license_expiry?: string | null
          make?: string | null
          model?: string | null
          odometer_km?: number
          org_id?: string
          registration_number?: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_aisles: {
        Row: {
          aisle_type: string | null
          code: string
          created_at: string
          id: string
          length: number | null
          name: string | null
          org_id: string
          status: string
          updated_at: string
          width: number | null
          zone_id: string
        }
        Insert: {
          aisle_type?: string | null
          code: string
          created_at?: string
          id?: string
          length?: number | null
          name?: string | null
          org_id: string
          status?: string
          updated_at?: string
          width?: number | null
          zone_id: string
        }
        Update: {
          aisle_type?: string | null
          code?: string
          created_at?: string
          id?: string
          length?: number | null
          name?: string | null
          org_id?: string
          status?: string
          updated_at?: string
          width?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_aisles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_aisles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_bins: {
        Row: {
          aisle_id: string | null
          bin_type: string | null
          capacity_volume: number | null
          code: string
          created_at: string
          current_weight: number | null
          height: number | null
          id: string
          length: number | null
          level: number | null
          max_weight: number | null
          name: string | null
          org_id: string
          position: number | null
          status: string
          updated_at: string
          width: number | null
          zone_id: string
        }
        Insert: {
          aisle_id?: string | null
          bin_type?: string | null
          capacity_volume?: number | null
          code: string
          created_at?: string
          current_weight?: number | null
          height?: number | null
          id?: string
          length?: number | null
          level?: number | null
          max_weight?: number | null
          name?: string | null
          org_id: string
          position?: number | null
          status?: string
          updated_at?: string
          width?: number | null
          zone_id: string
        }
        Update: {
          aisle_id?: string | null
          bin_type?: string | null
          capacity_volume?: number | null
          code?: string
          created_at?: string
          current_weight?: number | null
          height?: number | null
          id?: string
          length?: number | null
          level?: number | null
          max_weight?: number | null
          name?: string | null
          org_id?: string
          position?: number | null
          status?: string
          updated_at?: string
          width?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_bins_aisle_id_fkey"
            columns: ["aisle_id"]
            isOneToOne: false
            referencedRelation: "warehouse_aisles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_bins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_bins_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfer_lines: {
        Row: {
          created_at: string
          from_bin_id: string | null
          id: string
          lot_number: string | null
          notes: string | null
          org_id: string
          product_id: string | null
          quantity: number
          to_bin_id: string | null
          transfer_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          from_bin_id?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          org_id: string
          product_id?: string | null
          quantity: number
          to_bin_id?: string | null
          transfer_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          from_bin_id?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          org_id?: string
          product_id?: string | null
          quantity?: number
          to_bin_id?: string | null
          transfer_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_transfer_lines_from_bin_id_fkey"
            columns: ["from_bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfer_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfer_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfer_lines_to_bin_id_fkey"
            columns: ["to_bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfer_lines_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "warehouse_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfers: {
        Row: {
          approved_by: string | null
          created_at: string
          from_warehouse_id: string
          id: string
          notes: string | null
          org_id: string
          requested_by: string | null
          status: string
          to_warehouse_id: string
          transfer_date: string
          transfer_number: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          from_warehouse_id: string
          id?: string
          notes?: string | null
          org_id: string
          requested_by?: string | null
          status?: string
          to_warehouse_id: string
          transfer_date?: string
          transfer_number: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          from_warehouse_id?: string
          id?: string
          notes?: string | null
          org_id?: string
          requested_by?: string | null
          status?: string
          to_warehouse_id?: string
          transfer_date?: string
          transfer_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_zones: {
        Row: {
          area: number | null
          capacity_volume: number | null
          code: string
          created_at: string
          id: string
          max_temp: number | null
          min_temp: number | null
          name: string
          org_id: string
          status: string
          temperature_controlled: boolean
          updated_at: string
          warehouse_id: string
          zone_type: string | null
        }
        Insert: {
          area?: number | null
          capacity_volume?: number | null
          code: string
          created_at?: string
          id?: string
          max_temp?: number | null
          min_temp?: number | null
          name: string
          org_id: string
          status?: string
          temperature_controlled?: boolean
          updated_at?: string
          warehouse_id: string
          zone_type?: string | null
        }
        Update: {
          area?: number | null
          capacity_volume?: number | null
          code?: string
          created_at?: string
          id?: string
          max_temp?: number | null
          min_temp?: number | null
          name?: string
          org_id?: string
          status?: string
          temperature_controlled?: boolean
          updated_at?: string
          warehouse_id?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_zones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_zones_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          area_unit: string | null
          branch_id: string | null
          capacity_volume: number | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          manager_id: string | null
          name: string
          org_id: string
          phone: string | null
          province: string | null
          status: string
          total_area: number | null
          updated_at: string
          volume_unit: string | null
        }
        Insert: {
          address?: string | null
          area_unit?: string | null
          branch_id?: string | null
          capacity_volume?: number | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          manager_id?: string | null
          name: string
          org_id: string
          phone?: string | null
          province?: string | null
          status?: string
          total_area?: number | null
          updated_at?: string
          volume_unit?: string | null
        }
        Update: {
          address?: string | null
          area_unit?: string | null
          branch_id?: string | null
          capacity_volume?: number | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          manager_id?: string | null
          name?: string
          org_id?: string
          phone?: string | null
          province?: string | null
          status?: string
          total_area?: number | null
          updated_at?: string
          volume_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          bom_id: string
          branch_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          quantity_planned: number
          quantity_produced: number
          scheduled_date: string | null
          status: string
          updated_at: string
          warehouse_id: string
          wo_number: string
        }
        Insert: {
          bom_id: string
          branch_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          quantity_planned: number
          quantity_produced?: number
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          warehouse_id: string
          wo_number: string
        }
        Update: {
          bom_id?: string
          branch_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          quantity_planned?: number
          quantity_produced?: number
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string
          wo_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bill_of_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_insurer: {
        Args: { p_catalog_key: string; p_org_id: string }
        Returns: string
      }
      add_insurer: {
        Args: {
          p_address?: string
          p_code: string
          p_contact_person?: string
          p_email?: string
          p_name: string
          p_org_id: string
          p_phone?: string
          p_policy_types?: Json
        }
        Returns: string
      }
      add_stock_take_line: {
        Args: {
          p_bin_id?: string
          p_product_id?: string
          p_product_name: string
          p_sku_code?: string
          p_stock_take_id: string
          p_system_quantity: number
          p_unit_cost?: number
          p_warehouse_id?: string
        }
        Returns: string
      }
      adjust_stock: {
        Args: {
          p_org_id: string
          p_product_id: string
          p_quantity_delta: number
          p_reason: string
          p_reference?: string
          p_warehouse_id: string
        }
        Returns: number
      }
      allocate_project_resource: {
        Args: {
          p_allocated_quantity: number
          p_allocation_end?: string
          p_allocation_start?: string
          p_cost_per_unit?: number
          p_project_id: string
          p_resource_id: string
          p_resource_name: string
          p_resource_type: string
          p_unit?: string
        }
        Returns: string
      }
      approve_stock_take: {
        Args: { p_stock_take_id: string }
        Returns: undefined
      }
      award_tender: {
        Args: { p_award_amount: number; p_bid_id: string; p_tender_id: string }
        Returns: undefined
      }
      close_pos_session: {
        Args: {
          p_closing_float: number
          p_org_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      complete_stock_take: {
        Args: { p_stock_take_id: string }
        Returns: undefined
      }
      complete_work_order: {
        Args: { p_org_id: string; p_work_order_id: string }
        Returns: undefined
      }
      connect_integration: {
        Args: {
          p_account_label: string
          p_credentials: Json
          p_org_id: string
          p_provider_key: string
        }
        Returns: undefined
      }
      connect_social_account: {
        Args: {
          p_access_token_encrypted: string
          p_account_id: string
          p_account_name: string
          p_org_id: string
          p_platform_key: string
          p_refresh_token_encrypted?: string
          p_token_expires_at?: string
        }
        Returns: string
      }
      convert_lead_to_customer: {
        Args: { p_lead_id: string; p_org_id: string }
        Returns: string
      }
      create_disciplinary_case: {
        Args: {
          p_description: string
          p_employee_id: string
          p_incident_date: string
          p_org_id: string
          p_reported_by?: string
          p_severity: string
          p_title: string
          p_violation_type: string
        }
        Returns: string
      }
      create_disciplinary_warning: {
        Args: {
          p_case_id?: string
          p_employee_id: string
          p_expires_date?: string
          p_org_id: string
          p_reason: string
          p_warning_type: string
        }
        Returns: string
      }
      create_email_campaign: {
        Args: {
          p_campaign_name: string
          p_org_id: string
          p_recipient_filter?: Json
          p_scheduled_date?: string
          p_subject: string
          p_target_audience: string
          p_template_id?: string
        }
        Returns: string
      }
      create_email_template: {
        Args: {
          p_body: string
          p_name: string
          p_org_id: string
          p_subject: string
          p_template_key: string
          p_template_type: string
          p_variables?: Json
        }
        Returns: string
      }
      create_insurance_policy: {
        Args: {
          p_asset_id?: string
          p_coverage_type?: string
          p_end_date: string
          p_insurer_id: string
          p_org_id: string
          p_policy_number: string
          p_policy_type: string
          p_premium: number
          p_start_date: string
          p_sum_insured: number
          p_vehicle_id?: string
        }
        Returns: string
      }
      create_online_order: {
        Args: {
          p_branch_id: string
          p_customer_id?: string
          p_delivery_address?: string
          p_delivery_method?: string
          p_guest_name?: string
          p_guest_phone?: string
          p_items?: Json
          p_notes?: string
          p_org_id: string
          p_warehouse_id?: string
        }
        Returns: string
      }
      create_organization: {
        Args: { p_branch_name?: string; p_name: string }
        Returns: string
      }
      create_petty_cash_fund: {
        Args: {
          p_custodian_id: string
          p_fund_name: string
          p_initial_amount: number
          p_project_id: string
        }
        Returns: string
      }
      create_petty_cash_transaction: {
        Args: {
          p_amount: number
          p_approved_by?: string
          p_category?: string
          p_description: string
          p_petty_cash_id: string
          p_receipt_number?: string
          p_recipient_id?: string
          p_transaction_type: string
        }
        Returns: string
      }
      create_project_milestone: {
        Args: {
          p_description: string
          p_due_date: string
          p_name: string
          p_project_id: string
        }
        Returns: string
      }
      create_purchase_order: {
        Args: {
          p_branch_id: string
          p_items?: Json
          p_notes?: string
          p_org_id: string
          p_supplier_id?: string
          p_tax_total?: number
        }
        Returns: string
      }
      create_risk_assessment: {
        Args: {
          p_category: string
          p_description?: string
          p_impact: number
          p_likelihood: number
          p_mitigation_strategy?: string
          p_org_id: string
          p_owner_id?: string
          p_review_date?: string
          p_title: string
        }
        Returns: string
      }
      create_sales_invoice: {
        Args: {
          p_branch_id: string
          p_customer_id?: string
          p_items?: Json
          p_notes?: string
          p_org_id: string
          p_tax_total?: number
          p_warehouse_id?: string
        }
        Returns: string
      }
      create_sheq_incident: {
        Args: {
          p_branch_id?: string
          p_date_occurred: string
          p_description: string
          p_incident_type: string
          p_location?: string
          p_org_id: string
          p_reported_by?: string
          p_severity: string
          p_title: string
        }
        Returns: string
      }
      create_sheq_inspection: {
        Args: {
          p_branch_id?: string
          p_description?: string
          p_inspection_type: string
          p_inspector_id?: string
          p_org_id: string
          p_scheduled_date: string
          p_title: string
        }
        Returns: string
      }
      create_sheq_risk_assessment: {
        Args: {
          p_branch_id?: string
          p_category: string
          p_hazard: string
          p_likelihood: number
          p_location?: string
          p_org_id: string
          p_responsible_person?: string
          p_severity: number
        }
        Returns: string
      }
      create_social_post: {
        Args: {
          p_caption?: string
          p_content: string
          p_hashtags?: string[]
          p_media_urls?: Json
          p_org_id: string
          p_platforms?: Json
          p_scheduled_for?: string
          p_title: string
        }
        Returns: string
      }
      create_stock_take: {
        Args: {
          p_branch_id?: string
          p_count_type: string
          p_description?: string
          p_org_id: string
          p_scheduled_date: string
          p_title: string
          p_warehouse_id?: string
        }
        Returns: string
      }
      create_tax_filing: {
        Args: { p_amount: number; p_currency?: string; p_tax_period_id: string }
        Returns: string
      }
      create_tax_period: {
        Args: {
          p_org_id: string
          p_period: number
          p_tax_type_key: string
          p_year: number
        }
        Returns: string
      }
      create_tender: {
        Args: {
          p_budget: number
          p_category: string
          p_closing_date: string
          p_description: string
          p_evaluation_criteria?: Json
          p_org_id: string
          p_requirements?: Json
          p_tender_number: string
          p_title: string
        }
        Returns: string
      }
      create_warehouse: {
        Args: {
          p_address?: string
          p_branch_id?: string
          p_code: string
          p_manager_id?: string
          p_name: string
          p_org_id: string
        }
        Returns: string
      }
      create_warehouse_bin: {
        Args: {
          p_bin_type?: string
          p_code: string
          p_level?: number
          p_max_weight?: number
          p_name?: string
          p_position?: number
          p_zone_id: string
        }
        Returns: string
      }
      create_warehouse_transfer: {
        Args: {
          p_from_warehouse_id: string
          p_notes?: string
          p_org_id: string
          p_to_warehouse_id: string
        }
        Returns: string
      }
      create_warehouse_zone: {
        Args: {
          p_area?: number
          p_capacity_volume?: number
          p_code: string
          p_name: string
          p_warehouse_id: string
          p_zone_type: string
        }
        Returns: string
      }
      disconnect_integration: {
        Args: { p_org_id: string; p_provider_key: string }
        Returns: undefined
      }
      disconnect_social_account: {
        Args: { p_account_id: string; p_org_id: string }
        Returns: undefined
      }
      evaluate_tender_bid: {
        Args: {
          p_bid_id: string
          p_commercial_score: number
          p_evaluation_notes?: string
          p_technical_score: number
        }
        Returns: undefined
      }
      get_platform_staff_context: {
        Args: never
        Returns: {
          permission_keys: string[]
          role_key: string
        }[]
      }
      get_user_permissions: {
        Args: { target_org_id: string }
        Returns: string[]
      }
      has_permission: {
        Args: { perm_key: string; target_org_id: string }
        Returns: boolean
      }
      insert_audit_log: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_module: string
          p_new: Json
          p_old: Json
          p_org_id: string
        }
        Returns: undefined
      }
      invite_org_member: {
        Args: {
          p_branch_id?: string
          p_department_id?: string
          p_org_id: string
          p_role_key: string
          p_user_id: string
        }
        Returns: string
      }
      is_org_member: { Args: { target_org_id: string }; Returns: boolean }
      list_activated_insurers: {
        Args: { p_org_id: string }
        Returns: {
          activation_date: string
          catalog_key: string
          code: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      list_available_insurers: {
        Args: never
        Returns: {
          category: string
          contact_email: string
          contact_phone: string
          coverage_types: Json
          description: string
          key: string
          name: string
          regions: Json
          website: string
        }[]
      }
      list_connected_social_accounts: {
        Args: { p_org_id: string }
        Returns: {
          account_name: string
          created_at: string
          id: string
          is_active: boolean
          platform_key: string
        }[]
      }
      list_disciplinary_cases: {
        Args: {
          p_employee_id?: string
          p_limit?: number
          p_org_id: string
          p_status?: string
        }
        Returns: {
          case_number: string
          employee_name: string
          id: string
          incident_date: string
          severity: string
          status: string
          title: string
          violation_type: string
        }[]
      }
      list_email_campaigns: {
        Args: { p_limit?: number; p_org_id: string; p_status?: string }
        Returns: {
          campaign_name: string
          id: string
          opened_count: number
          scheduled_date: string
          sent_count: number
          status: string
          subject: string
          total_recipients: number
        }[]
      }
      list_iban_accounts: {
        Args: { p_org_id: string }
        Returns: {
          available_balance: number
          balance: number
          bank_name: string
          created_at: string
          currency: string
          iban: string
          id: string
          status: string
        }[]
      }
      list_iban_transactions: {
        Args: { p_iban_account_id?: string; p_limit?: number; p_org_id: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          description: string
          iban_account_id: string
          id: string
          status: string
          transaction_type: string
          value_date: string
        }[]
      }
      list_insurance_policies: {
        Args: { p_org_id: string; p_policy_type?: string; p_status?: string }
        Returns: {
          end_date: string
          id: string
          insurer_name: string
          policy_number: string
          policy_type: string
          premium: number
          start_date: string
          status: string
          sum_insured: number
        }[]
      }
      list_integration_connections: {
        Args: { p_org_id: string }
        Returns: {
          account_label: string
          connected_at: string
          is_connected: boolean
          provider_key: string
        }[]
      }
      list_project_petty_cash: {
        Args: { p_project_id: string }
        Returns: {
          currency: string
          current_balance: number
          custodian_name: string
          fund_name: string
          id: string
          initial_amount: number
          status: string
        }[]
      }
      list_sheq_incidents: {
        Args: { p_limit?: number; p_org_id: string; p_status?: string }
        Returns: {
          date_occurred: string
          id: string
          incident_number: string
          incident_type: string
          severity: string
          status: string
          title: string
        }[]
      }
      list_social_posts: {
        Args: { p_limit?: number; p_org_id: string; p_status?: string }
        Returns: {
          created_at: string
          id: string
          platforms: Json
          scheduled_for: string
          status: string
          title: string
        }[]
      }
      list_stock_takes: {
        Args: { p_limit?: number; p_org_id: string; p_status?: string }
        Returns: {
          count_type: string
          id: string
          scheduled_date: string
          status: string
          stock_take_number: string
          title: string
          total_variance_value: number
        }[]
      }
      list_tax_filings: {
        Args: { p_limit?: number; p_org_id: string; p_status?: string }
        Returns: {
          amount: number
          id: string
          period: number
          status: string
          submitted_at: string
          tax_type_key: string
          year: number
        }[]
      }
      list_tenders: {
        Args: { p_limit?: number; p_org_id: string; p_status?: string }
        Returns: {
          budget: number
          closing_date: string
          id: string
          status: string
          tender_number: string
          title: string
        }[]
      }
      list_warehouses: {
        Args: { p_org_id: string; p_status?: string }
        Returns: {
          city: string
          code: string
          id: string
          is_primary: boolean
          manager_name: string
          name: string
          status: string
        }[]
      }
      next_number: {
        Args: { p_entity_type: string; target_org_id: string }
        Returns: string
      }
      open_pos_session: {
        Args: {
          p_opening_float?: number
          p_org_id: string
          p_register_id: string
        }
        Returns: string
      }
      place_inventory_in_bin: {
        Args: {
          p_bin_id: string
          p_expiry_date?: string
          p_lot_number?: string
          p_product_id?: string
          p_quantity: number
          p_unit?: string
          p_warehouse_id: string
        }
        Returns: string
      }
      queue_social_post_for_publishing: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      receive_purchase_order: {
        Args: { p_org_id: string; p_po_id: string; p_warehouse_id: string }
        Returns: undefined
      }
      record_count: {
        Args: { p_counted_quantity: number; p_stock_take_line_id: string }
        Returns: undefined
      }
      record_purchase_payment: {
        Args: {
          p_amount: number
          p_method: string
          p_org_id: string
          p_po_id: string
          p_reference?: string
        }
        Returns: undefined
      }
      record_sales_payment: {
        Args: {
          p_amount: number
          p_invoice_id: string
          p_method: string
          p_org_id: string
          p_reference?: string
        }
        Returns: undefined
      }
      register_fiscal_device: {
        Args: {
          p_branch_id?: string
          p_device_model: string
          p_device_serial: string
          p_device_type: string
          p_manufacturer: string
          p_org_id: string
        }
        Returns: string
      }
      request_iban: {
        Args: { p_currency?: string; p_notes?: string; p_org_id: string }
        Returns: Json
      }
      rollback_custom_code: {
        Args: {
          p_code_type: string
          p_org_id: string
          p_target_version: number
        }
        Returns: number
      }
      save_custom_code: {
        Args: { p_code_type: string; p_content: string; p_org_id: string }
        Returns: number
      }
      schedule_disciplinary_hearing: {
        Args: {
          p_case_id: string
          p_chairperson_id?: string
          p_hearing_date: string
          p_hearing_time?: string
          p_location?: string
        }
        Returns: string
      }
      seed_default_accounts: { Args: { p_org_id: string }; Returns: undefined }
      start_stock_take: {
        Args: { p_stock_take_id: string }
        Returns: undefined
      }
      submit_insurance_claim: {
        Args: {
          p_claim_amount: number
          p_incident_date: string
          p_incident_description: string
          p_policy_id: string
          p_supporting_documents?: Json
        }
        Returns: string
      }
      submit_tax_filing: {
        Args: {
          p_amount: number
          p_filing_reference?: string
          p_tax_filing_id: string
        }
        Returns: undefined
      }
      submit_tender_bid: {
        Args: {
          p_amount: number
          p_proposal_document?: string
          p_supplier_id: string
          p_tender_id: string
        }
        Returns: string
      }
      submit_timesheet: {
        Args: {
          p_billable?: boolean
          p_date: string
          p_description?: string
          p_hourly_rate?: number
          p_hours: number
          p_project_id: string
          p_staff_id: string
          p_task_id: string
        }
        Returns: string
      }
      tag_invoice_pos_session: {
        Args: { p_invoice_id: string; p_org_id: string; p_session_id: string }
        Returns: undefined
      }
      user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
