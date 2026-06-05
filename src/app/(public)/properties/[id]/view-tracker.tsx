"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoProperty } from "@/lib/mock-listings";

export function PropertyViewTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    if (isDemoProperty(propertyId) || !isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.rpc("increment_property_views", { property_id: propertyId });
  }, [propertyId]);

  return null;
}
