"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function BoostSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("session_id");
    setSessionId(id);
  }, [searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Boost Activated!</CardTitle>
          <CardDescription className="text-base">
            Your provider visibility has been successfully boosted
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Higher Search Rankings</h4>
                <p className="text-sm text-muted-foreground">
                  Your provider will now appear higher in search results for case managers and families.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Sponsored Badge</h4>
                <p className="text-sm text-muted-foreground">
                  Your listings will display a "Sponsored" badge to indicate boosted visibility.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Track Your Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor views, inquiries, and placements in your boost dashboard.
                </p>
              </div>
            </div>
          </div>

          {sessionId && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Session ID: {sessionId.substring(0, 20)}...</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              onClick={() => router.push("/provider/boost")}
            >
              View Boost Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/provider/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Questions? Contact support at{" "}
              <a href="mailto:support@carelinkm.com" className="text-primary hover:underline">
                support@carelinkmn.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BoostSuccessPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-2xl mx-auto" />}>
      <BoostSuccessContent />
    </Suspense>
  );
}
