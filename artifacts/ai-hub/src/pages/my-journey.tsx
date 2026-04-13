import { useMemo, useState, type ChangeEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import {
  ShieldCheck,
  Users,
  Radio,
  MessageSquare,
  BookOpen,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { FRONTIER_MODELS, TOOL_CATEGORIES, USE_CASES, EXPERIENCE_LEVELS, FREQUENCY_OPTIONS } from "@/data/journey-constants";

type JourneyInputEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

function fetchJson<T>(url: string, options: RequestInit = {}) {
  return fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options })
    .then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<T>;
    });
}

function tabClass(active: boolean) {
  return `px-4 py-2 text-xs font-mono tracking-widest border-b-2 transition-colors ${
    active ? "border-primary text-primary" : "border-border/30 text-muted-foreground hover:text-foreground"
  }`;
}

function ProfileEditor({ profile, onSave }: { profile: any; onSave: (data: any) => Promise<void> }) {
  const [form, setForm] = useState<any>({
    displayName: profile?.displayName ?? "",
    currentRole: profile?.currentRole ?? "",
    aiExperienceLevel: profile?.aiExperienceLevel ?? "beginner",
    currentlyWorkingOn: profile?.currentlyWorkingOn ?? "",
    primaryUseCase: profile?.primaryUseCase ?? "Coding",
    bio: profile?.bio ?? "",
    isPublic: profile?.isPublic ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          DISPLAY_NAME
          <input
            value={form.displayName}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, displayName: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          />
        </label>
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          CURRENT_ROLE
          <input
            value={form.currentRole}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, currentRole: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          EXPERIENCE_LEVEL
          <select
            value={form.aiExperienceLevel}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, aiExperienceLevel: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          PRIMARY_USE_CASE
          <select
            value={form.primaryUseCase}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, primaryUseCase: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          >
            {USE_CASES.map((useCase) => (
              <option key={useCase} value={useCase}>{useCase}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2 text-xs font-mono text-muted-foreground">
        CURRENTLY_WORKING_ON
        <textarea
          value={form.currentlyWorkingOn}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, currentlyWorkingOn: e.target.value })}
          rows={3}
          className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
        />
      </label>

      <label className="space-y-2 text-xs font-mono text-muted-foreground">
        BIO
        <textarea
          value={form.bio}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, isPublic: e.target.checked })}
          className="h-4 w-4 rounded-none border border-border/50 bg-card"
        />
        MAKE_PROFILE_PUBLIC
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-none border border-primary bg-primary/10 px-4 py-2 text-sm font-mono text-primary hover:bg-primary/20 transition-colors"
      >
        {saving ? "SAVING..." : "SAVE_PROFILE"}
      </button>
    </div>
  );
}

function ToolsEditor({ tools, refetch }: { tools: any[]; refetch: () => void }) {
  const [form, setForm] = useState<any>({
    toolName: "",
    toolCategory: TOOL_CATEGORIES[0],
    useCase: USE_CASES[0],
    frequency: FREQUENCY_OPTIONS[0],
    rating: 5,
    notes: "",
    isPublic: true,
  });
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const saveTool = async () => {
    setSaving(true);
    await fetchJson("/api/journey/tools", {
      method: "POST",
      body: JSON.stringify({ ...form, id: selected?.id }),
    });
    setSelected(null);
    setForm({
      toolName: "",
      toolCategory: TOOL_CATEGORIES[0],
      useCase: USE_CASES[0],
      frequency: FREQUENCY_OPTIONS[0],
      rating: 5,
      notes: "",
      isPublic: true,
    });
    await refetch();
    setSaving(false);
  };

  const deleteTool = async (id: number) => {
    await fetchJson(`/api/journey/tools/${id}`, { method: "DELETE" });
    await refetch();
  };

  const edit = (tool: any) => {
    setSelected(tool);
    setForm({
      toolName: tool.toolName,
      toolCategory: tool.toolCategory ?? TOOL_CATEGORIES[0],
      useCase: tool.useCase ?? USE_CASES[0],
      frequency: tool.frequency ?? FREQUENCY_OPTIONS[0],
      rating: tool.rating ?? 5,
      notes: tool.notes ?? "",
      isPublic: tool.isPublic ?? true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          TOOL_NAME
          <input
            value={form.toolName}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, toolName: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          />
        </label>
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          TOOL_CATEGORY
          <select
            value={form.toolCategory}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, toolCategory: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          >
            {TOOL_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          USE_CASE
          <select
            value={form.useCase}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, useCase: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          >
            {USE_CASES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          FREQUENCY
          <select
            value={form.frequency}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, frequency: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          >
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          RATING
          <input
            type="number"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, rating: Number(e.target.value) })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          />
        </label>
      </div>

      <label className="space-y-2 text-xs font-mono text-muted-foreground">
        NOTES
        <textarea
          value={form.notes}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, isPublic: e.target.checked })}
          className="h-4 w-4 rounded-none border border-border/50 bg-card"
        />
        MAKE_TOOL_PUBLIC
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={saveTool}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-none border border-primary bg-primary/10 px-4 py-2 text-sm font-mono text-primary hover:bg-primary/20 transition-colors"
        >
          {selected ? "UPDATE_TOOL" : "ADD_TOOL"}
        </button>
        {selected && (
          <button
            onClick={() => {
              setSelected(null);
              setForm({
                toolName: "",
                toolCategory: TOOL_CATEGORIES[0],
                useCase: USE_CASES[0],
                frequency: FREQUENCY_OPTIONS[0],
                rating: 5,
                notes: "",
                isPublic: true,
              });
            }}
            className="text-xs font-mono uppercase text-muted-foreground hover:text-foreground"
          >
            CANCEL_EDIT
          </button>
        )}
      </div>

      <div className="space-y-3">
        {tools.length === 0 ? (
          <div className="border border-dashed border-border/50 bg-secondary/10 p-6 text-sm font-mono text-muted-foreground text-center">
            NO_TOOL_USAGE_LOGGED
          </div>
        ) : (
          <div className="grid gap-3">
            {tools.map((tool) => (
              <div key={tool.id} className="border border-border/50 bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold font-mono text-sm truncate">{tool.toolName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">{tool.toolCategory} · {tool.useCase} · {tool.frequency}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => edit(tool)} className="text-xs font-mono uppercase text-primary">EDIT</button>
                    <button onClick={() => deleteTool(tool.id)} className="text-xs font-mono uppercase text-destructive">DELETE</button>
                  </div>
                </div>
                <div className="mt-3 text-xs font-mono text-muted-foreground">RATING: {tool.rating} / 5</div>
                {tool.notes && <p className="mt-2 text-sm leading-relaxed text-foreground">{tool.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsEditor({ reviews, refetch }: { reviews: any[]; refetch: () => void }) {
  const [form, setForm] = useState<any>({
    provider: FRONTIER_MODELS[0].provider,
    modelName: FRONTIER_MODELS[0].models[0],
    modelVersion: "",
    primaryUseCase: USE_CASES[0],
    usagePeriodStart: "",
    usagePeriodEnd: "",
    overallRating: 5,
    reasoningRating: 5,
    codingRating: 5,
    creativeRating: 5,
    speedRating: 5,
    strengths: "",
    weaknesses: "",
    review: "",
    wouldRecommend: true,
    isPublic: true,
  });
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const modelOptions = useMemo(() => {
    const providerEntry = FRONTIER_MODELS.find((entry) => entry.provider === form.provider);
    return providerEntry ? providerEntry.models : [];
  }, [form.provider]);

  const saveReview = async () => {
    setSaving(true);
    await fetchJson("/api/journey/models", {
      method: "POST",
      body: JSON.stringify({ ...form, id: selected?.id }),
    });
    setSelected(null);
    setForm({
      provider: FRONTIER_MODELS[0].provider,
      modelName: FRONTIER_MODELS[0].models[0],
      modelVersion: "",
      primaryUseCase: USE_CASES[0],
      usagePeriodStart: "",
      usagePeriodEnd: "",
      overallRating: 5,
      reasoningRating: 5,
      codingRating: 5,
      creativeRating: 5,
      speedRating: 5,
      strengths: "",
      weaknesses: "",
      review: "",
      wouldRecommend: true,
      isPublic: true,
    });
    await refetch();
    setSaving(false);
  };

  const deleteReview = async (id: number) => {
    await fetchJson(`/api/journey/models/${id}`, { method: "DELETE" });
    await refetch();
  };

  const edit = (review: any) => {
    setSelected(review);
    setForm({
      provider: review.provider,
      modelName: review.modelName,
      modelVersion: review.modelVersion ?? "",
      primaryUseCase: review.primaryUseCase ?? USE_CASES[0],
      usagePeriodStart: review.usagePeriodStart ?? "",
      usagePeriodEnd: review.usagePeriodEnd ?? "",
      overallRating: review.overallRating ?? 5,
      reasoningRating: review.reasoningRating ?? 5,
      codingRating: review.codingRating ?? 5,
      creativeRating: review.creativeRating ?? 5,
      speedRating: review.speedRating ?? 5,
      strengths: review.strengths ?? "",
      weaknesses: review.weaknesses ?? "",
      review: review.review ?? "",
      wouldRecommend: review.wouldRecommend ?? true,
      isPublic: review.isPublic ?? true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          MODEL_PROVIDER
          <select
            value={form.provider}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, provider: e.target.value, modelName: FRONTIER_MODELS.find((row) => row.provider === e.target.value)?.models[0] ?? "" })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          >
            {FRONTIER_MODELS.map((entry) => (
              <option key={entry.provider} value={entry.provider}>{entry.provider}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          MODEL_NAME
          <select
            value={form.modelName}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, modelName: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          >
            {modelOptions.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          USAGE_PERIOD_START
          <input
            value={form.usagePeriodStart}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, usagePeriodStart: e.target.value })}
            placeholder="Jan 2026"
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          />
        </label>
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          USAGE_PERIOD_END
          <input
            value={form.usagePeriodEnd}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, usagePeriodEnd: e.target.value })}
            placeholder="Present"
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          PRIMARY_USE_CASE
          <select
            value={form.primaryUseCase}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, primaryUseCase: e.target.value })}
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          >
            {USE_CASES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-mono text-muted-foreground">
          MODEL_VERSION
          <input
            value={form.modelVersion}
            onChange={(e: JourneyInputEvent) => setForm({ ...form, modelVersion: e.target.value })}
            placeholder="2026-04" 
            className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { key: "overallRating", label: "OVERALL" },
          { key: "reasoningRating", label: "REASONING" },
          { key: "codingRating", label: "CODING" },
        ].map(({ key, label }) => (
          <label key={key} className="space-y-2 text-xs font-mono text-muted-foreground">
            {label}
            <input
              type="number"
              min={1}
              max={5}
              value={form[key]}
              onChange={(e: JourneyInputEvent) => setForm({ ...form, [key]: Number(e.target.value) })}
              className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { key: "creativeRating", label: "CREATIVE" },
          { key: "speedRating", label: "SPEED" },
        ].map(({ key, label }) => (
          <label key={key} className="space-y-2 text-xs font-mono text-muted-foreground">
            {label}
            <input
              type="number"
              min={1}
              max={5}
              value={form[key]}
              onChange={(e: JourneyInputEvent) => setForm({ ...form, [key]: Number(e.target.value) })}
              className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
            />
          </label>
        ))}
      </div>

      <label className="space-y-2 text-xs font-mono text-muted-foreground">
        STRENGTHS
        <textarea
          value={form.strengths}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, strengths: e.target.value })}
          rows={3}
          className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
        />
      </label>
      <label className="space-y-2 text-xs font-mono text-muted-foreground">
        WEAKNESSES
        <textarea
          value={form.weaknesses}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, weaknesses: e.target.value })}
          rows={3}
          className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
        />
      </label>
      <label className="space-y-2 text-xs font-mono text-muted-foreground">
        REVIEW
        <textarea
          value={form.review}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, review: e.target.value })}
          rows={4}
          className="w-full rounded-none border border-border/50 bg-card px-3 py-2 text-sm font-mono text-foreground"
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <input
          type="checkbox"
          checked={form.wouldRecommend}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, wouldRecommend: e.target.checked })}
          className="h-4 w-4 rounded-none border border-border/50 bg-card"
        />
        WOULD_RECOMMEND
      </label>
      <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e: JourneyInputEvent) => setForm({ ...form, isPublic: e.target.checked })}
          className="h-4 w-4 rounded-none border border-border/50 bg-card"
        />
        MAKE_REVIEW_PUBLIC
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={saveReview}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-none border border-primary bg-primary/10 px-4 py-2 text-sm font-mono text-primary hover:bg-primary/20 transition-colors"
        >
          {saving ? "SAVING..." : selected ? "UPDATE_REVIEW" : "SUBMIT_REVIEW"}
        </button>
        {selected && (
          <button
            onClick={() => {
              setSelected(null);
              setForm({
                provider: FRONTIER_MODELS[0].provider,
                modelName: FRONTIER_MODELS[0].models[0],
                modelVersion: "",
                primaryUseCase: USE_CASES[0],
                usagePeriodStart: "",
                usagePeriodEnd: "",
                overallRating: 5,
                reasoningRating: 5,
                codingRating: 5,
                creativeRating: 5,
                speedRating: 5,
                strengths: "",
                weaknesses: "",
                review: "",
                wouldRecommend: true,
                isPublic: true,
              });
            }}
            className="text-xs font-mono uppercase text-muted-foreground hover:text-foreground"
          >
            CANCEL_EDIT
          </button>
        )}
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="border border-dashed border-border/50 bg-secondary/10 p-6 text-sm font-mono text-muted-foreground text-center">
            NO_MODEL_REVIEWS_YET
          </div>
        ) : (
          <div className="grid gap-3">
            {reviews.map((review) => (
              <div key={review.id} className="border border-border/50 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold font-mono text-sm truncate">{review.provider} / {review.modelName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{review.primaryUseCase} · {review.usagePeriodStart} → {review.usagePeriodEnd || "present"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => edit(review)} className="text-xs font-mono uppercase text-primary">EDIT</button>
                    <button onClick={() => deleteReview(review.id)} className="text-xs font-mono uppercase text-destructive">DELETE</button>
                  </div>
                </div>
                <div className="mt-3 text-xs font-mono text-muted-foreground">OVERALL: {review.overallRating} · REASONING: {review.reasoningRating} · CODING: {review.codingRating}</div>
                <p className="mt-2 text-sm leading-relaxed text-foreground line-clamp-3">{review.review}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyJourney() {
  const { isSignedIn } = useUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState("profile");

  const profileQuery = useQuery({
    queryKey: ["journey", "profile"],
    queryFn: () => fetchJson<any>("/api/journey/profile"),
    enabled: !!isSignedIn,
  });
  const toolsQuery = useQuery({
    queryKey: ["journey", "tools"],
    queryFn: () => fetchJson<any[]>("/api/journey/tools/mine"),
    enabled: !!isSignedIn,
  });
  const reviewsQuery = useQuery({
    queryKey: ["journey", "reviews"],
    queryFn: () => fetchJson<any[]>("/api/journey/models/mine"),
    enabled: !!isSignedIn,
  });
  const feedQuery = useQuery({
    queryKey: ["journey", "feed"],
    queryFn: () => fetchJson<any[]>("/api/journey/feed?limit=10"),
  });
  const ratingsQuery = useQuery({
    queryKey: ["journey", "ratings"],
    queryFn: () => fetchJson<any[]>("/api/journey/models"),
  });

  const saveProfile = async (data: any) => {
    await fetchJson("/api/journey/profile", { method: "POST", body: JSON.stringify(data) });
    qc.invalidateQueries({ queryKey: ["journey", "profile"] });
  };

  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <div className="border border-border/50 bg-card p-8">
          <h1 className="text-3xl font-bold font-mono">YOUR_AI_ROADMAP</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            Track your AI tool usage, submit reviews for frontier models, and share your public AI journey with the community.
          </p>
          <Link href="/sign-in" className="inline-flex items-center gap-2 mt-6 rounded-none border border-primary bg-primary/10 px-4 py-2 text-sm font-mono text-primary hover:bg-primary/20 transition-colors">
            SIGN_IN_TO_BEGIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono">YOUR_AI_ROADMAP</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            A personal dashboard for your AI profile, tool check-ins, and frontier model reviews.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-none border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-mono uppercase text-primary">Phase 1</span>
          <span className="rounded-none border border-secondary/30 bg-secondary/10 px-3 py-1 text-[10px] font-mono uppercase text-muted-foreground">Community beta</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/30">
        {[
          { id: "profile", label: "MY_PROFILE" },
          { id: "tools", label: "MY_TOOLS" },
          { id: "reviews", label: "MY_REVIEWS" },
          { id: "community", label: "COMMUNITY" },
        ].map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={tabClass(tab === item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <section className="space-y-4">
          {profileQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground font-mono"><Loader2 className="h-4 w-4 animate-spin" /> LOADING_PROFILE...</div>
          ) : (
            <ProfileEditor profile={profileQuery.data} onSave={saveProfile} />
          )}
        </section>
      )}

      {tab === "tools" && (
        <section className="space-y-4">
          {toolsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground font-mono"><Loader2 className="h-4 w-4 animate-spin" /> LOADING_YOUR_TOOLS...</div>
          ) : (
            <ToolsEditor tools={toolsQuery.data ?? []} refetch={() => toolsQuery.refetch()} />
          )}
        </section>
      )}

      {tab === "reviews" && (
        <section className="space-y-4">
          {reviewsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground font-mono"><Loader2 className="h-4 w-4 animate-spin" /> LOADING_YOUR_REVIEWS...</div>
          ) : (
            <ReviewsEditor reviews={reviewsQuery.data ?? []} refetch={() => reviewsQuery.refetch()} />
          )}
        </section>
      )}

      {tab === "community" && (
        <section className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase font-mono text-primary">
                <Users className="h-4 w-4" /> PUBLIC_CHECK_INS
              </div>
              {feedQuery.isLoading ? (
                <div className="text-sm font-mono text-muted-foreground">LOADING_COMMUNITY_FEED...</div>
              ) : feedQuery.data?.length === 0 ? (
                <div className="text-sm font-mono text-muted-foreground">NO_PUBLIC_PROFILES_YET</div>
              ) : (
                <div className="space-y-3">
                  {feedQuery.data.map((profile: any) => (
                    <div key={profile.id} className="border border-border/50 bg-secondary p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold font-mono text-sm">{profile.displayName || "ANONYMOUS"}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{profile.currentRole} · {profile.aiExperienceLevel}</div>
                        </div>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">{new Date(profile.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-2 text-sm text-foreground leading-relaxed">{profile.currentlyWorkingOn}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase font-mono text-primary">
                <ShieldCheck className="h-4 w-4" /> MODEL_RATINGS
              </div>
              {ratingsQuery.isLoading ? (
                <div className="text-sm font-mono text-muted-foreground">LOADING_MODEL_RATINGS...</div>
              ) : ratingsQuery.data?.length === 0 ? (
                <div className="text-sm font-mono text-muted-foreground">NO_PUBLIC_REVIEWS_YET</div>
              ) : (
                <div className="space-y-3">
                  {ratingsQuery.data.map((row: any) => (
                    <div key={`${row.provider}-${row.modelName}`} className="border border-border/50 bg-secondary p-3">
                      <div className="font-semibold font-mono text-sm">{row.provider} / {row.modelName}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">AVG: {Number(row.avgRating).toFixed(1)} · REVIEWS: {row.reviewCount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
