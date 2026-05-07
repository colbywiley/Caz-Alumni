"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveProfileAction } from "@/app/profile/actions";
import { ALUMNI_ROLES, INSTRUMENTS, STAFF_POSITIONS, type AlumniRoleValue } from "@/lib/constants/picklists";
import type { AlumniRoleRow, ProfileRow } from "@/lib/db/types";
import { profileSchema, type RoleInput } from "@/lib/validators/profile";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { MultiSelect } from "@/components/ui/MultiSelect";

type Props = {
  profile: ProfileRow;
  roles: AlumniRoleRow[];
};

type RoleState = RoleInput;

function emptyRole(role: AlumniRoleValue): RoleState {
  return {
    role,
    start_year: null,
    end_year: null,
    positions: [],
    other_position: null,
  };
}

export function ProfileForm({ profile, roles }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialRoleMap = useMemo(() => {
    const m = new Map<AlumniRoleValue, RoleState>();
    for (const r of roles) {
      m.set(r.role, {
        role: r.role,
        start_year: r.start_year,
        end_year: r.end_year,
        positions: r.positions ?? [],
        other_position: r.other_position,
      });
    }
    return m;
  }, [roles]);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [stateField, setStateField] = useState(profile.state ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [instruments, setInstruments] = useState<string[]>(profile.instruments ?? []);
  const [showInDirectory, setShowInDirectory] = useState(profile.show_in_directory);
  const [shareEmail, setShareEmail] = useState(profile.share_email_in_directory);
  const [activeRoles, setActiveRoles] = useState<Record<AlumniRoleValue, RoleState | null>>({
    camper: initialRoleMap.get("camper") ?? null,
    staff: initialRoleMap.get("staff") ?? null,
    board: initialRoleMap.get("board") ?? null,
  });

  function toggleRole(role: AlumniRoleValue) {
    setActiveRoles((prev) => ({
      ...prev,
      [role]: prev[role] ? null : emptyRole(role),
    }));
  }

  function updateRole(role: AlumniRoleValue, patch: Partial<RoleState>) {
    setActiveRoles((prev) => ({
      ...prev,
      [role]: prev[role] ? { ...prev[role]!, ...patch } : prev[role],
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const rolesArray: RoleInput[] = (["camper", "staff", "board"] as AlumniRoleValue[])
      .map((r) => activeRoles[r])
      .filter((r): r is RoleState => r != null);

    const payload = {
      full_name: fullName.trim(),
      display_name: displayName.trim() || null,
      phone: phone.trim() || null,
      city: city.trim() || null,
      state: stateField.trim() || null,
      country: country.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      instruments,
      show_in_directory: showInDirectory,
      share_email_in_directory: shareEmail,
      roles: rolesArray,
    };

    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    startTransition(async () => {
      const res = await saveProfileAction(parsed.data);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Avatar + visibility */}
      <section className="card p-6">
        <h2 className="text-xl">Photo & visibility</h2>
        <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row">
          <AvatarUploader
            userId={profile.id}
            currentUrl={avatarUrl}
            onUploaded={(url) => setAvatarUrl(url)}
          />
          <div className="flex-1 space-y-3">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-caz-green)]"
                checked={showInDirectory}
                onChange={(e) => setShowInDirectory(e.target.checked)}
              />
              <span>
                <span className="font-semibold">Show me in the Alumni Directory</span>
                <span className="block text-[var(--color-caz-muted)]">
                  Other signed-in alumni will see your photo, name, role(s), years at Caz, and instruments.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-caz-green)]"
                checked={shareEmail}
                onChange={(e) => setShareEmail(e.target.checked)}
                disabled={!showInDirectory}
              />
              <span>
                <span className="font-semibold">Share my email in the directory</span>
                <span className="block text-[var(--color-caz-muted)]">
                  Only takes effect if you&apos;re also showing in the directory.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="card p-6">
        <h2 className="text-xl">Contact information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="full_name" className="label">Full name *</label>
            <input id="full_name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="display_name" className="label">Display name (optional)</label>
            <input id="display_name" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <p className="help">Shown in the directory if set; otherwise we use your full name.</p>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={profile.email} disabled />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone (optional)</label>
            <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="city" className="label">City</label>
            <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label htmlFor="state" className="label">State / Province</label>
            <input id="state" className="input" value={stateField} onChange={(e) => setStateField(e.target.value)} />
          </div>
          <div>
            <label htmlFor="country" className="label">Country</label>
            <input id="country" className="input" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="bio" className="label">A favorite Caz memory (optional)</label>
          <textarea id="bio" className="textarea" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
      </section>

      {/* Instruments */}
      <section className="card p-6">
        <h2 className="text-xl">Instruments</h2>
        <p className="mt-1 text-sm text-[var(--color-caz-muted)]">Select any instruments you play.</p>
        <div className="mt-4">
          <MultiSelect
            options={INSTRUMENTS as readonly string[] as string[]}
            value={instruments}
            onChange={setInstruments}
            placeholder="Add instruments…"
          />
        </div>
      </section>

      {/* Roles */}
      <section className="card p-6">
        <h2 className="text-xl">Your time at Caz</h2>
        <p className="mt-1 text-sm text-[var(--color-caz-muted)]">
          Check all that apply. Add the years for each.
        </p>
        <div className="mt-4 space-y-4">
          {ALUMNI_ROLES.map(({ value, label }) => {
            const state = activeRoles[value];
            return (
              <div key={value} className="rounded-lg border border-[var(--color-caz-line)] p-4">
                <label className="flex items-center gap-3 text-base font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-caz-green)]"
                    checked={!!state}
                    onChange={() => toggleRole(value)}
                  />
                  {label}
                </label>
                {state && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Start year</label>
                      <input
                        type="number"
                        min={1957}
                        max={new Date().getFullYear() + 1}
                        className="input"
                        value={state.start_year ?? ""}
                        onChange={(e) =>
                          updateRole(value, { start_year: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </div>
                    <div>
                      <label className="label">End year (leave blank if ongoing)</label>
                      <input
                        type="number"
                        min={1957}
                        max={new Date().getFullYear() + 1}
                        className="input"
                        value={state.end_year ?? ""}
                        onChange={(e) =>
                          updateRole(value, { end_year: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </div>
                    {value === "staff" && (
                      <div className="sm:col-span-2">
                        <label className="label">Positions held</label>
                        <MultiSelect
                          options={STAFF_POSITIONS as readonly string[] as string[]}
                          value={state.positions}
                          onChange={(v) => updateRole(value, { positions: v })}
                          placeholder="Add positions…"
                        />
                        {state.positions.includes("Other") && (
                          <div className="mt-3">
                            <label className="label" htmlFor={`${value}-other`}>Describe other position(s) *</label>
                            <input
                              id={`${value}-other`}
                              className="input"
                              value={state.other_position ?? ""}
                              onChange={(e) => updateRole(value, { other_position: e.target.value })}
                              placeholder="e.g. Media Coordinator"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Submit */}
      <div className="sticky bottom-4 z-10">
        <div className="card flex items-center justify-between gap-3 p-4">
          <div className="text-sm">
            {error && <span className="text-red-600">{error}</span>}
            {!error && savedAt && (
              <span className="text-[var(--color-caz-green-dark)]">✓ Saved</span>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>

      {/* Quick avatar preview block at top is the AvatarUploader; here a fallback if none */}
      {avatarUrl && (
        <div className="hidden">
          {/* Force <Image> to be referenced so types stay aligned */}
          <Image src={avatarUrl} alt="" width={1} height={1} />
        </div>
      )}
    </form>
  );
}
