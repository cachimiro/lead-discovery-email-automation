"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import { useToast } from "./toast-context";

interface SearchResult {
  email: string;
  email_status: string;
  fullName: string;
  title: string;
  companyName: string;
  company_domain: string;
  verified_status?: string;
}

interface SearchState {
  isSearching: boolean;
  currentDomain: string;
  progress: string;
  results: SearchResult[];
  totalDomains: number;
  completedDomains: number;
  selectedRoles: string[];
}

interface SearchContextType {
  searchState: SearchState;
  startSearch: (domains: string[], roles: string[]) => Promise<void>;
  cancelSearch: () => void;
  clearResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

function inferDomainFromEmail(email?: string) {
  if (!email) return undefined;
  const at = email.indexOf("@");
  return at > -1 ? email.slice(at + 1) : undefined;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    currentDomain: "",
    progress: "",
    results: [],
    totalDomains: 0,
    completedDomains: 0,
    selectedRoles: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSearchState((prev) => ({ ...prev, isSearching: false }));
    showInfo("Search Cancelled", "The search was cancelled.");
  }, [showInfo]);

  const clearResults = useCallback(() => {
    setSearchState({
      isSearching: false,
      currentDomain: "",
      progress: "",
      results: [],
      totalDomains: 0,
      completedDomains: 0,
      selectedRoles: [],
    });
  }, []);

  const startSearch = useCallback(
    async (domains: string[], roles: string[]) => {
      // Cancel any existing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setSearchState({
        isSearching: true,
        currentDomain: "",
        progress: "",
        results: [],
        totalDomains: domains.length,
        completedDomains: 0,
        selectedRoles: roles,
      });

      showInfo("Search Started", `Searching ${domains.length} ${domains.length === 1 ? 'company' : 'companies'} for decision makers...`);

      const allCandidates: SearchResult[] = [];

      try {
        for (let i = 0; i < domains.length; i++) {
          // Check if search was aborted
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error("Search aborted");
          }

          const domain = domains[i];
          const progressText = `${i + 1}/${domains.length}`;

          setSearchState((prev) => ({
            ...prev,
            currentDomain: domain,
            progress: progressText,
            completedDomains: i,
          }));

          try {
            const amf = await fetch("/api/discover", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode: "decision_maker",
                domain,
                decision_maker_category: roles,
              }),
              signal: abortControllerRef.current?.signal,
            }).then((r) => r.json());

            if (amf?.email) {
              allCandidates.push({
                email: amf.email,
                email_status: amf.email_status,
                fullName: amf.person_full_name || "Unknown",
                title: amf.person_job_title || "Unknown",
                companyName: domain,
                company_domain: domain,
              });
            }
          } catch (err: any) {
            if (err.name === "AbortError") {
              throw err;
            }
            console.error(`Error searching ${domain}:`, err);
            // Continue with next domain
          }

          // Rate limiting between requests
          if (i < domains.length - 1) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }

        // Verify emails
        if (allCandidates.length > 0) {
          setSearchState((prev) => ({
            ...prev,
            currentDomain: "Verifying emails...",
            progress: `${domains.length}/${domains.length}`,
          }));

          const verify = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emails: allCandidates.map((c) => c.email) }),
          }).then((r) => r.json());

          const byEmail: Record<string, string> = verify?.results ?? {};
          const withVerification = allCandidates.map((c) => ({
            ...c,
            verified_status: byEmail[c.email],
          }));

          const valid = withVerification.filter((x) => x.verified_status === "valid");

          setSearchState({
            isSearching: false,
            currentDomain: "",
            progress: "",
            results: withVerification,
            totalDomains: domains.length,
            completedDomains: domains.length,
            selectedRoles: roles,
          });

          if (valid.length > 0) {
            showSuccess(
              "Search Complete!",
              `Found ${valid.length} valid decision maker${valid.length > 1 ? "s" : ""} ready to save.`
            );
          } else {
            showWarning("No Valid Emails", "No valid emails found. Try different companies or roles.");
          }
        } else {
          setSearchState({
            isSearching: false,
            currentDomain: "",
            progress: "",
            results: [],
            totalDomains: domains.length,
            completedDomains: domains.length,
            selectedRoles: roles,
          });
          showWarning("No Results", "No decision maker emails found for the selected roles and companies.");
        }
      } catch (err: any) {
        if (err.name === "AbortError" || err.message === "Search aborted") {
          // Already handled by cancelSearch
        } else {
          console.error(err);
          showError("Search Failed", "An error occurred during the search.");
        }
        setSearchState((prev) => ({ ...prev, isSearching: false }));
      } finally {
        abortControllerRef.current = null;
      }
    },
    [showSuccess, showError, showInfo, showWarning]
  );

  return (
    <SearchContext.Provider value={{ searchState, startSearch, cancelSearch, clearResults }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
