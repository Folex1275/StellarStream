"use client";

import type { ReactNode } from "react";
import { useRole, type Permission } from "@/lib/use-role";

interface CanProps {
    /** The permission required to render children. */
    permission: Permission;
    /**
     * Rendered when the user lacks the permission.
     * Omit to hide the element entirely.
     */
    fallback?: ReactNode;
    children: ReactNode;
}

/**
 * Declarative role gate.
 *
 * @example
 * // Hide entirely for VIEWER
 * <Can permission="edit_draft"><EditButton /></Can>
 *
 * // Render a disabled button for VIEWER
 * <Can permission="submit_to_ledger" fallback={<button disabled>Submit</button>}>
 *   <button onClick={submit}>Submit to Ledger</button>
 * </Can>
 */
export function Can({ permission, fallback = null, children }: CanProps) {
    const role = useRole();
    if (role.status !== "ready") return <>{fallback}</>;
    return <>{role.can(permission) ? children : fallback}</>;
}
