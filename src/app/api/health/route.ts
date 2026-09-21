import { isAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export async function GET() {
  return Response.json({
    ok: true,
    firebaseClient: isFirebaseConfigured(),
    firebaseAdmin: isAdminConfigured(),
  });
}
