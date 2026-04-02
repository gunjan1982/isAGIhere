import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="max-w-md w-full border border-border/50 bg-card p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground">ERR_404</h1>
          <p className="font-mono text-muted-foreground text-sm">
            Requested sector not found in intelligence database.
          </p>
        </div>
        <div className="pt-4 border-t border-border/50">
          <Link href="/" className="inline-flex items-center justify-center px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-mono text-sm transition-colors w-full">
            RETURN_TO_HUB
          </Link>
        </div>
      </div>
    </div>
  );
}
