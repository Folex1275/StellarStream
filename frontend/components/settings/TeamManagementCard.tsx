"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus, ShieldCheck, Trash2, Mail, KeyRound } from "lucide-react";

type CollaboratorRole = "Admin" | "Accountant" | "Viewer";

interface TeamMember {
  id: string;
  name: string;
  contact: string;
  role: CollaboratorRole;
  status: "Active";
}

interface PendingInvite {
  id: string;
  orgId: string;
  recipient: string;
  role: CollaboratorRole;
  status: "pending";
  invitedAt: string;
}

const DEFAULT_ORG_ID = "demo-org";
const ROLE_OPTIONS: CollaboratorRole[] = ["Admin", "Accountant", "Viewer"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "member_01",
    name: "Rena Patel",
    contact: "rena@stellarstream.io",
    role: "Admin",
    status: "Active",
  },
  {
    id: "member_02",
    name: "Marco Reyes",
    contact: "marco@stellarstream.io",
    role: "Accountant",
    status: "Active",
  },
  {
    id: "member_03",
    name: "Ops Treasury",
    contact: "GCQ2EV4VQXXTVS2I3M7L5YQWS5SIXRJ7Q3FKH2N7JRWQH2MY6MV6A4GC",
    role: "Viewer",
    status: "Active",
  },
];

function toRecipientTypeLabel(recipient: string): "Email" | "G-Address" {
  return recipient.includes("@") ? "Email" : "G-Address";
}

function isValidRecipient(value: string): boolean {
  const normalized = value.trim();
  return (
    EMAIL_REGEX.test(normalized) ||
    STELLAR_ADDRESS_REGEX.test(normalized.toUpperCase())
  );
}

function formatInviteTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function TeamManagementCard() {
  const [members] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [recipient, setRecipient] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("Viewer");
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");

  const pendingCount = useMemo(
    () => pendingInvites.filter((invite) => invite.status === "pending").length,
    [pendingInvites],
  );

  useEffect(() => {
    const loadPendingInvites = async () => {
      setIsLoading(true);
      setStatus("");

      try {
        const response = await fetch(
          `/api/v3/org/invites?orgId=${encodeURIComponent(DEFAULT_ORG_ID)}`,
        );
        if (!response.ok) {
          throw new Error(
            `Failed to load pending invites (${response.status})`,
          );
        }

        const body = (await response.json()) as {
          ok: boolean;
          invites: PendingInvite[];
        };
        setPendingInvites(body.invites ?? []);
      } catch (error) {
        console.error("[TeamManagementCard] failed to load invites", error);
        setStatus("Failed to load pending invites.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingInvites();
  }, []);

  const handleSendInvite = async () => {
    const normalizedRecipient = recipient.trim();

    if (!normalizedRecipient) {
      setStatus("Enter an email or Stellar G-address.");
      return;
    }

    if (!isValidRecipient(normalizedRecipient)) {
      setStatus("Invite target must be a valid email or G-address.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Sending invite...");

    try {
      const response = await fetch("/api/v3/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: DEFAULT_ORG_ID,
          recipient: normalizedRecipient,
          role,
        }),
      });

      const body = (await response.json()) as {
        error?: string;
        invite?: PendingInvite;
      };

      if (!response.ok) {
        throw new Error(body.error || `Invite failed (${response.status})`);
      }

      const invite = body.invite;
      if (!invite) {
        throw new Error("Invite response is missing invite payload.");
      }
      setPendingInvites((prev) => [invite, ...prev]);

      setRecipient("");
      setRole("Viewer");
      setStatus("Invite sent. Awaiting collaborator acceptance.");
    } catch (error) {
      console.error("[TeamManagementCard] failed to send invite", error);
      setStatus(
        error instanceof Error ? error.message : "Failed to send invite.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setStatus("Revoking invite...");

    try {
      const response = await fetch("/api/v3/org/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: DEFAULT_ORG_ID, inviteId }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || `Revoke failed (${response.status})`);
      }

      setPendingInvites((prev) =>
        prev.filter((invite) => invite.id !== inviteId),
      );
      setStatus("Invite revoked.");
    } catch (error) {
      console.error("[TeamManagementCard] failed to revoke invite", error);
      setStatus(
        error instanceof Error ? error.message : "Failed to revoke invite.",
      );
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
            Access Control
          </p>
          <h2 className="font-heading mt-2 text-2xl md:text-3xl">
            Team Management
          </h2>
          <p className="font-body mt-3 text-sm text-white/60">
            Invite collaborators by email or Stellar address and assign RBAC
            roles.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2">
          <p className="text-xs text-cyan-100/80">Pending Invites</p>
          <p className="text-lg font-semibold text-cyan-200">{pendingCount}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_180px_auto]">
        <label className="space-y-2 text-xs uppercase tracking-[0.08em] text-white/50">
          Invite Target
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <Mail className="h-4 w-4 text-cyan-200/70" />
            <input
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="name@org.com or G..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              aria-label="Collaborator email or Stellar address"
            />
          </div>
        </label>

        <label className="space-y-2 text-xs uppercase tracking-[0.08em] text-white/50">
          Role
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-cyan-200/70" />
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as CollaboratorRole)
              }
              className="w-full bg-transparent text-sm text-white outline-none"
              aria-label="Assign RBAC role"
            >
              {ROLE_OPTIONS.map((item) => (
                <option key={item} value={item} className="bg-slate-900">
                  {item}
                </option>
              ))}
            </select>
          </div>
        </label>

        <button
          type="button"
          onClick={handleSendInvite}
          disabled={isSubmitting}
          className="h-fit self-end rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? "Sending..." : "Send Invite"}
          </span>
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.05] text-white/70">
            <tr>
              <th className="px-4 py-3 font-medium">Team Member</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-white/10">
                <td className="px-4 py-3 text-white">{member.name}</td>
                <td className="px-4 py-3 text-white/70">{member.contact}</td>
                <td className="px-4 py-3">
                  <span className="rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-white/90">
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Pending Invites</h3>
          <span className="text-xs text-white/40">
            Revoke to cancel access before acceptance
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-white/50">Loading invites...</p>
        ) : pendingInvites.length === 0 ? (
          <p className="text-sm text-white/50">No pending invites.</p>
        ) : (
          <ul className="space-y-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">
                    {invite.recipient}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {toRecipientTypeLabel(invite.recipient)} · {invite.role} ·
                    Invited {formatInviteTime(invite.invitedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeInvite(invite.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100/90">
          <KeyRound className="h-3.5 w-3.5" />
          {status}
        </p>
      )}
    </section>
  );
}
