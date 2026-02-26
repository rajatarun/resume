"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/admin/ToastProvider";

type Settings = { defaultHashtags: string; voiceRules: string };
const KEY = "admin-settings";

export default function SettingsPage() {
  const toast = useToast();
  const { register, handleSubmit, reset } = useForm<Settings>({ defaultValues: { defaultHashtags: "", voiceRules: "" } });

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      try {
        reset(JSON.parse(stored) as Settings);
      } catch {
        // ignore bad local storage payload
      }
    }
  }, [reset]);

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit((values) => {
        localStorage.setItem(KEY, JSON.stringify(values));
        toast.success("Settings saved locally.");
      })}
    >
      <input className="w-full rounded border p-2" placeholder="Default hashtags (comma separated)" {...register("defaultHashtags")} />
      <textarea className="min-h-32 w-full rounded border p-2" placeholder="Voice rules" {...register("voiceRules")} />
      <div className="rounded border bg-slate-50 p-3 text-sm dark:bg-slate-900">
        <p className="font-medium">Schedule placeholders</p>
        <p className="text-slate-500">Next send window: every Tuesday 9:00 AM ET (placeholder)</p>
      </div>
      <button className="rounded bg-slate-900 px-3 py-2 text-white" type="submit">Save</button>
    </form>
  );
}
