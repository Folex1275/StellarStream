import fuzzysort from "fuzzysort";

export interface DirectoryEntry {
    address: string;
    name?: string;
}

export interface FuzzyMatchResult {
    address: string;
    name?: string;
    score: number;
}

/**
 * Find the best fuzzy matches for a query string against a directory of
 * known addresses + display names.
 *
 * @param query   The (potentially invalid) address or partial name typed by the user.
 * @param directory  Array of known directory entries.
 * @param limit   Maximum number of suggestions to return (default 3).
 * @param threshold  Minimum fuzzysort score to include (0–1, default 0.3).
 */
export function findFuzzyAddressMatches(
    query: string,
    directory: DirectoryEntry[],
    limit = 3,
    threshold = 0.3,
): FuzzyMatchResult[] {
    if (!query || query.trim().length < 2 || directory.length === 0) {
        return [];
    }

    const results = fuzzysort.go(query, directory, {
        key: (obj: DirectoryEntry) => `${obj.address} ${obj.name ?? ""}`,
        limit,
        threshold,
    });

    return results.map((r) => ({
        address: r.obj.address,
        name: r.obj.name,
        score: r.score,
    }));
}

/** Shorten a Stellar G-address for display: GABCD…WXYZ */
export function truncateAddress(address: string, start = 6, end = 4): string {
    if (address.length <= start + end + 3) return address;
    return `${address.slice(0, start)}…${address.slice(-end)}`;
}

