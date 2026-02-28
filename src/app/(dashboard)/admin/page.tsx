"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Users,
  UserPlus,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Lock,
  Clock,
  Webhook,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/lib/api/hooks/use-user-role";
import {
  useAdminUsers,
  useAdminInvites,
  useSendInvite,
  useDeleteInvite,
  useAssignRole,
  useRevokeRole,
  useAdminSettings,
  useUpdateAdminSetting,
  useDraftCleanup,
  useWebhookHealth,
} from "@/lib/api/hooks/use-admin";
import { useDraftRetentionPolicy } from "@/lib/api/hooks/use-app-settings";
import type { AppRoleName } from "@/lib/api/types";

export default function AdminPage() {
  const { data: roleData, isLoading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!roleData?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-2">
          You need admin privileges to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="drafts">Draft Retention</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementTab />
        </TabsContent>
        <TabsContent value="roles">
          <RoleManagementTab />
        </TabsContent>
        <TabsContent value="rate-limits">
          <RateLimitTab />
        </TabsContent>
        <TabsContent value="drafts">
          <DraftRetentionTab />
        </TabsContent>
        <TabsContent value="workflows">
          <WorkflowSchemaTab />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhookTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── User Management Tab ────────────────────────────────────

function UserManagementTab() {
  const { data: usersData, isLoading } = useAdminUsers();
  const { data: invitesData } = useAdminInvites();
  const sendInvite = useSendInvite();
  const deleteInvite = useDeleteInvite();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <CardTitle className="text-sm">All Users</CardTitle>
          </div>
          <CardDescription>
            {usersData?.total ?? 0} registered user(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Timezone</th>
                    <th className="text-left p-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersData?.users ?? []).map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.full_name ?? "—"}</td>
                      <td className="p-2 text-muted-foreground">{u.timezone}</td>
                      <td className="p-2 text-muted-foreground">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <CardTitle className="text-sm">Invite User</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button
              size="sm"
              disabled={!inviteEmail || sendInvite.isPending}
              onClick={() => {
                sendInvite.mutate(
                  { email: inviteEmail, notes: inviteNotes || undefined },
                  {
                    onSuccess: () => {
                      toast.success(`Invite sent to ${inviteEmail}`);
                      setInviteEmail("");
                      setInviteNotes("");
                    },
                    onError: (err) =>
                      toast.error(err instanceof Error ? err.message : "Failed to invite"),
                  }
                );
              }}
            >
              {sendInvite.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Invite"
              )}
            </Button>
          </div>
          <Input
            placeholder="Optional notes..."
            value={inviteNotes}
            onChange={(e) => setInviteNotes(e.target.value)}
            className="h-8 text-sm"
          />
        </CardContent>
      </Card>

      {(invitesData?.invites?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitesData?.invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-md border p-2 text-xs"
                >
                  <div>
                    <span className="font-medium">{inv.email}</span>
                    <Badge variant="outline" className="ml-2 text-[9px]">
                      {inv.status}
                    </Badge>
                    {inv.notes && (
                      <p className="text-muted-foreground mt-0.5">{inv.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteInvite.mutate(inv.id, {
                        onSuccess: () => toast.success("Invite removed"),
                        onError: () => toast.error("Failed to remove invite"),
                      });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Role Management Tab ────────────────────────────────────

function RoleManagementTab() {
  const { data: usersData, isLoading } = useAdminUsers();
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <CardTitle className="text-sm">Role Management</CardTitle>
        </div>
        <CardDescription>Assign or revoke roles for users.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium">User</th>
                  <th className="text-left p-2 font-medium">Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {(usersData?.users ?? []).map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">
                      <span className="font-medium">{u.email}</span>
                      {u.full_name && (
                        <span className="text-muted-foreground ml-1">
                          ({u.full_name})
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <Select
                        onValueChange={(role) => {
                          assignRole.mutate(
                            { userId: u.id, role },
                            {
                              onSuccess: () => toast.success(`Role '${role}' assigned to ${u.email}`),
                              onError: (err) =>
                                toast.error(err instanceof Error ? err.message : "Failed"),
                            }
                          );
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-7 text-xs">
                          <SelectValue placeholder="Assign role..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Rate Limit Tab ─────────────────────────────────────────

function RateLimitTab() {
  const { data: settingsData, isLoading } = useAdminSettings();
  const updateSetting = useUpdateAdminSetting();
  const [requestsPerMinute, setRequestsPerMinute] = useState(60);
  const [saved, setSaved] = useState(false);

  const rateLimitSetting = settingsData?.settings?.find(
    (s) => s.key === "rate_limit_config"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <CardTitle className="text-sm">Rate Limits</CardTitle>
        </div>
        <CardDescription>
          Configure API rate limiting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="rpm" className="text-xs">
                Requests per Minute
              </Label>
              <Input
                id="rpm"
                type="number"
                value={requestsPerMinute}
                onChange={(e) => setRequestsPerMinute(Number(e.target.value))}
                className="h-8 text-sm w-[200px]"
                min={1}
                max={1000}
              />
            </div>
            <Button
              size="sm"
              disabled={updateSetting.isPending || saved}
              onClick={() => {
                updateSetting.mutate(
                  {
                    key: "rate_limit_config",
                    value: { requests_per_minute: requestsPerMinute },
                    description: "API rate limiting configuration",
                  },
                  {
                    onSuccess: () => {
                      setSaved(true);
                      toast.success("Rate limit saved");
                      setTimeout(() => setSaved(false), 2000);
                    },
                    onError: (err) =>
                      toast.error(err instanceof Error ? err.message : "Failed to save"),
                  }
                );
              }}
            >
              {updateSetting.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                <Check className="h-3.5 w-3.5" />
              ) : null}
              {saved ? "Saved" : "Save"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Draft Retention Tab ────────────────────────────────────

function DraftRetentionTab() {
  const { data: policy, isLoading } = useDraftRetentionPolicy();
  const updateSetting = useUpdateAdminSetting();
  const cleanup = useDraftCleanup();
  const [maxDrafts, setMaxDrafts] = useState(50);
  const [maxAgeDays, setMaxAgeDays] = useState(90);
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [saved, setSaved] = useState(false);

  // Sync from loaded policy
  useState(() => {
    if (policy) {
      setMaxDrafts(policy.max_drafts_per_user);
      setMaxAgeDays(policy.max_age_days);
      setAutoCleanup(policy.auto_cleanup_enabled);
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <CardTitle className="text-sm">Draft Retention Policy</CardTitle>
          </div>
          <CardDescription>
            Control how drafts are retained and cleaned up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Drafts Per User</Label>
                  <Input
                    type="number"
                    value={maxDrafts}
                    onChange={(e) => setMaxDrafts(Number(e.target.value))}
                    className="h-8 text-sm"
                    min={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Age (Days)</Label>
                  <Input
                    type="number"
                    value={maxAgeDays}
                    onChange={(e) => setMaxAgeDays(Number(e.target.value))}
                    className="h-8 text-sm"
                    min={1}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Auto Cleanup</p>
                  <p className="text-[10px] text-muted-foreground">
                    Automatically clean up old drafts
                  </p>
                </div>
                <Switch checked={autoCleanup} onCheckedChange={setAutoCleanup} />
              </div>
              <Button
                size="sm"
                className="w-full gap-2"
                disabled={updateSetting.isPending || saved}
                onClick={() => {
                  updateSetting.mutate(
                    {
                      key: "draft_retention_policy",
                      value: {
                        max_drafts_per_user: maxDrafts,
                        max_age_days: maxAgeDays,
                        auto_cleanup_enabled: autoCleanup,
                      },
                      description: "Draft retention and cleanup policy",
                    },
                    {
                      onSuccess: () => {
                        setSaved(true);
                        toast.success("Retention policy saved");
                        setTimeout(() => setSaved(false), 2000);
                      },
                      onError: (err) =>
                        toast.error(err instanceof Error ? err.message : "Failed to save"),
                    }
                  );
                }}
              >
                {updateSetting.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {saved ? "Saved" : "Save Policy"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Manual Cleanup</CardTitle>
          <CardDescription>
            Trigger a one-time cleanup of old drafts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="sm"
            disabled={cleanup.isPending}
            onClick={() => {
              cleanup.mutate(
                { max_drafts_per_user: maxDrafts, max_age_days: maxAgeDays },
                {
                  onSuccess: (data) => {
                    toast.success(
                      `Cleanup complete: ${data.result.deleted_by_age} drafts removed`
                    );
                  },
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Cleanup failed"),
                }
              );
            }}
          >
            {cleanup.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : null}
            Run Cleanup Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Workflow Schema Tab ────────────────────────────────────

function WorkflowSchemaTab() {
  const { data: settingsData, isLoading } = useAdminSettings();
  const updateSetting = useUpdateAdminSetting();
  const [schemaKey, setSchemaKey] = useState("workflow_schema_linkedin_post");
  const [schemaJson, setSchemaJson] = useState("");
  const [saved, setSaved] = useState(false);
  const [jsonError, setJsonError] = useState("");

  const workflowSettings = (settingsData?.settings ?? []).filter((s) =>
    s.key.startsWith("workflow_schema_")
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          <CardTitle className="text-sm">Workflow Schemas</CardTitle>
        </div>
        <CardDescription>
          Edit workflow pipeline configuration as JSON.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Schema Key</Label>
              <Input
                value={schemaKey}
                onChange={(e) => setSchemaKey(e.target.value)}
                placeholder="workflow_schema_linkedin_post"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Schema JSON</Label>
              <Textarea
                value={schemaJson}
                onChange={(e) => {
                  setSchemaJson(e.target.value);
                  setJsonError("");
                }}
                rows={10}
                className="font-mono text-xs"
                placeholder='{"phases": ["angles", "outline", "write"]}'
              />
              {jsonError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {jsonError}
                </p>
              )}
            </div>
            <Button
              size="sm"
              disabled={updateSetting.isPending || saved || !schemaKey}
              onClick={() => {
                try {
                  const parsed = JSON.parse(schemaJson || "{}");
                  updateSetting.mutate(
                    {
                      key: schemaKey,
                      value: parsed,
                      description: `Workflow schema: ${schemaKey}`,
                    },
                    {
                      onSuccess: () => {
                        setSaved(true);
                        toast.success("Schema saved");
                        setTimeout(() => setSaved(false), 2000);
                      },
                      onError: (err) =>
                        toast.error(err instanceof Error ? err.message : "Failed to save"),
                    }
                  );
                } catch {
                  setJsonError("Invalid JSON");
                }
              }}
            >
              {saved ? <Check className="h-3.5 w-3.5 mr-1" /> : null}
              {saved ? "Saved" : "Save Schema"}
            </Button>

            {workflowSettings.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium mb-2">
                    Existing Schemas ({workflowSettings.length})
                  </p>
                  <div className="space-y-1">
                    {workflowSettings.map((s) => (
                      <button
                        key={s.key}
                        className="block w-full text-left text-xs p-2 rounded border hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSchemaKey(s.key);
                          setSchemaJson(JSON.stringify(s.value, null, 2));
                        }}
                      >
                        <span className="font-medium">{s.key}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Webhook Tab ────────────────────────────────────────────

function WebhookTab() {
  const { data: healthData, isLoading, refetch } = useWebhookHealth();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4" />
          <CardTitle className="text-sm">Webhook Configuration</CardTitle>
        </div>
        <CardDescription>
          Monitor and manage webhook endpoint health.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button size="sm" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : null}
          Check Health
        </Button>

        {healthData?.webhooks && healthData.webhooks.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium">Name</th>
                  <th className="text-left p-2 font-medium">URL</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {healthData.webhooks.map((w) => (
                  <tr key={w.name} className="border-t">
                    <td className="p-2 font-medium">{w.name}</td>
                    <td className="p-2 text-muted-foreground truncate max-w-[200px]">
                      {w.url}
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={w.healthy ? "default" : "destructive"}
                        className="text-[9px]"
                      >
                        {w.status ?? "ERR"} {w.healthy ? "OK" : "FAIL"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : healthData ? (
          <p className="text-xs text-muted-foreground">
            {healthData.webhooks?.length === 0
              ? "No webhook endpoints configured. Add them via app_settings with key 'webhook_endpoints'."
              : "Loading..."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
