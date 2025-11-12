// In src/pages/BankConnections.tsx

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react"; // <-- Import Loader2
import { Button } from "@/components/ui/button";
import { RequisitionCard } from "@/components/bankConnections/RequisitionCard";
import { BankSelectionModal } from "@/components/bankConnections/BankSelectionModal";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // <-- Import hooks
import { gocardlessApi } from "@/lib/api"; // <-- Import our API client
import { Skeleton } from "@/components/ui/skeleton"; // <-- For loading

// --- We no longer need this! ---
// const mockRequisitions: Requisition[] = [ ... ];

export default function GoCardless() {
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // --- NEW: Fetch data using useQuery ---
  const { data: requisitions, isLoading: isLoadingRequisitions } = useQuery({
    queryKey: ["requisitions"],
    queryFn: gocardlessApi.getRequisitions,
  });

  // --- NEW: Create a "mutation" for toggling sync ---
  const toggleSyncMutation = useMutation({
    mutationFn: ({
      requisitionId,
      accountId,
      enabled,
    }: {
      requisitionId: string;
      accountId: string;
      enabled: boolean;
    }) => gocardlessApi.toggleSync(requisitionId, accountId, enabled),
    
    // When the mutation is successful, refetch the data
    onSuccess: (data: any) => {
      toast.success(data.message || "Sync status updated");
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
    },
    onError: () => {
      toast.error("Failed to update sync status.");
    },
  });

  // --- NEW: Create a "mutation" for reconfirming ---
  const reconfirmMutation = useMutation({
    mutationFn: (agreementId: string) => gocardlessApi.reconfirm(agreementId),
    onSuccess: (data) => {
      if (data.reconfirm_link) {
        toast.info("Opening reconfirmation page in a new tab...");
        window.open(data.reconfirm_link, "_blank");
      } else {
        toast.error("Could not get reconfirmation link.");
      }
    },
    onError: () => {
      toast.error("Failed to start reconfirmation.");
    },
  });

  const handleSyncToggle = (requisitionId: string, accountId: string, enabled: boolean) => {
    // We now call the mutation instead of setting local state
    toggleSyncMutation.mutate({ requisitionId, accountId, enabled });
  };

  const handleReconfirm = (agreementId: string) => {
    reconfirmMutation.mutate(agreementId);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2">Bank Connections</h1>
        <div className="flex items-end justify-between mb-6">
          <p className="text-muted-foreground">Connect and manage your bank accounts via open banking</p>
          <Button onClick={() => setIsBankModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>

        <div className="space-y-6">
          {/* --- NEW: Handle loading state --- */}
          {isLoadingRequisitions && (
            <>
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </>
          )}

          {/* --- This part is mostly the same, just uses the real data --- */}
          {requisitions?.map((requisition) => (
            <RequisitionCard
              key={requisition.id}
              requisition={requisition}
              onSyncToggle={handleSyncToggle}
              // Pass the agreement ID to the reconfirm handler
              onReconfirm={() => handleReconfirm(requisition.agreement)}
            />
          ))}
        </div>
      </div>

      <BankSelectionModal
        open={isBankModalOpen}
        onOpenChange={setIsBankModalOpen}
        // --- TODO: We will wire this up next ---
        // onBankSelect={(institutionId) => { ... }}
      />
    </div>
  );
}