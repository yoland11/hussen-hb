import "server-only";

import { getBookingsBucketName } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

let ensureBucketPromise: Promise<void> | null = null;

export function getBookingsBucket() {
  return getBookingsBucketName();
}

export async function ensureBookingsBucket() {
  if (!ensureBucketPromise) {
    ensureBucketPromise = (async () => {
      const supabase = getSupabaseAdmin();
      const bucketName = getBookingsBucket();
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        throw new Error(error.message);
      }

      const exists = (data ?? []).some((bucket) => bucket.name === bucketName);

      if (exists) {
        return;
      }

      const { error: createError } = await supabase.storage.createBucket(
        bucketName,
        {
          public: false,
          fileSizeLimit: "10MB",
        },
      );

      if (createError) {
        throw new Error(createError.message);
      }
    })();
  }

  return ensureBucketPromise;
}
