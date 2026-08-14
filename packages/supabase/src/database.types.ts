export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      warehouses: {
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
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      create_organization: {
        Args: { p_branch_name?: string; p_name: string }
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
      next_number: {
        Args: { p_entity_type: string; target_org_id: string }
        Returns: string
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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

