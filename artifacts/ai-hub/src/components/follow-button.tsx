import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { Plus, Check, Loader2 } from "lucide-react";
import { useFollows, useFollowMutations, useIsFollowing, type EntityType } from "@/lib/useFollows";

interface FollowButtonProps {
  entityType: EntityType;
  entityId: number;
  size?: "sm" | "md";
  className?: string;
}

export function FollowButton({ entityType, entityId, size = "sm", className = "" }: FollowButtonProps) {
  const { isSignedIn, isLoaded } = useUser();
  const isFollowing = useIsFollowing(entityType, entityId);
  const { follow, unfollow } = useFollowMutations();
  const isPending = follow.isPending || unfollow.isPending;

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <Link
        href="/sign-in"
        onClick={e => e.stopPropagation()}
        className={`inline-flex items-center gap-1 font-mono text-xs border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary px-2 py-1 transition-all ${size === "md" ? "px-3 py-1.5" : ""} ${className}`}
      >
        <Plus className="h-3 w-3" />
        Follow
      </Link>
    );
  }

  return (
    <button
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        if (isFollowing) {
          unfollow.mutate({ entityType, entityId });
        } else {
          follow.mutate({ entityType, entityId });
        }
      }}
      disabled={isPending}
      className={`inline-flex items-center gap-1 font-mono text-xs border transition-all ${
        isFollowing
          ? "border-primary/60 bg-primary/10 text-primary hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400"
          : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary"
      } px-2 py-1 ${size === "md" ? "px-3 py-1.5" : ""} ${className}`}
      title={isFollowing ? "Unfollow" : "Follow"}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isFollowing ? (
        <Check className="h-3 w-3" />
      ) : (
        <Plus className="h-3 w-3" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
