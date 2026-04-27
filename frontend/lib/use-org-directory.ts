"use client";
import { useState, useEffect } from "react";

export interface OrgContact {
  id: string;
  name: string;
  address: string;
  tags: string[];
}

// Mock directory — replace with GET /api/v1/org/directory
const DIRECTORY: OrgContact[] = [
  { id:"1", name:"Alice Chen",       address:"GABC1234STELLARADDRESSALICE000000000000000000000000000001", tags:["Design Team"] },
  { id:"2", name:"Bob Martinez",     address:"GBOB5678STELLARADDRESSBOB0000000000000000000000000000002",  tags:["Engineering"] },
  { id:"3", name:"Carol Finance",    address:"GCAR9012STELLARADDRESSCAROL00000000000000000000000000003", tags:["Finance","Payroll"] },
  { id:"4", name:"Dev Fund Wallet",  address:"GDEV3456STELLARADDRESSDEVFUND0000000000000000000000004",  tags:["Engineering","Treasury"] },
  { id:"5", name:"Vendor: Acme Inc", address:"GVEN7890STELLARADDRESSVENDOR0000000000000000000000005",  tags:["Vendor"] },
  { id:"6", name:"Marketing Budget", address:"GMKT2345STELLARADDRESSMARKETING000000000000000000006",    tags:["Marketing"] },
];

export function useOrgDirectory(query: string): { results: OrgContact[]; isLoading: boolean } {
  const [results, setResults] = useState<OrgContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setIsLoading(true);
    const t = setTimeout(() => {
      const q = query.toLowerCase();
      setResults(DIRECTORY.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.tags.some(tag => tag.toLowerCase().includes(q))
      ).slice(0, 6));
      setIsLoading(false);
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  return { results, isLoading };
}
