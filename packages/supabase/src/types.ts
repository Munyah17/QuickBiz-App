import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// The schema-parameterized client type every services/*.ts function should
// take, so `.from("table")`/`.select("columns")` are checked against the
// real schema at compile time instead of accepting any string silently.
export type TypedSupabaseClient = SupabaseClient<Database>;
