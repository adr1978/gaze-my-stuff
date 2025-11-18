import { useState, useEffect } from "react"; 
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequisitionCard } from "@/components/bankConnections/RequisitionCard";
import { BankSelectionModal } from "@/components/bankConnections/BankSelectionModal";
import { showToast } from "@/lib/toast-helper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { gocardlessApi, Requisition } from "@/lib/api"; // Note: Requisition type should be exported from api.ts
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, useNavigate } from 'react-router-dom'; // Required for flexible redirect handling


export default function BankConnections() {
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Hooks for URL manipulation to handle post-bank redirect status
  const location = useLocation();
  const navigate = useNavigate();

  // --- Query: Fetch Existing Requisitions (Connections) ---
  const { 
    data: requisitions, 
    isLoading: isLoadingRequisitions,
    refetch 
  } = useQuery<Requisition[]>({
    queryKey: ["requisitions"],
    queryFn: gocardlessApi.getRequisitions,
  });

  // --- Mutation: Create New Requisition (Triggers Bank Redirect) ---
  const createRequisitionMutation = useMutation({
    mutationFn: ({ institutionId, owner }: { institutionId: string; owner: string }) =>
      gocardlessApi.createRequisition(institutionId, owner),
    onSuccess: (data) => {
      showToast.success("Connection initiated. Redirecting to bank site...");
      setIsBankModalOpen(false); // Close the modal
      // This redirection opens the bank's authorization link in a new tab/window
      window.open(data.link, "_blank");
    },
    onError: () => {
      showToast.error("Failed to initiate bank connection. Please check API keys and logs.");
    },
  });

  // --- Mutation: Toggle Sync Status (Account Management) ---
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
      showToast.success(data.message || "Sync status updated");
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
    },
    onError: () => {
      showToast.error("Failed to update sync status.");
    },
  });

  // --- Mutation: Reconfirm Agreement ---
  const reconfirmMutation = useMutation({
    mutationFn: (agreementId: string) => gocardlessApi.reconfirm(agreementId),
    onSuccess: (data) => {
      if (data.reconfirm_link) {
        showToast.info("Opening reconfirmation page in a new tab...");
        window.open(data.reconfirm_link, "_blank");
      } else {
        showToast.error("Could not get reconfirmation link.");
      }
    },
    onError: () => {
      showToast.error("Failed to start reconfirmation.");
    },
  });


  // --- Logic to handle URL status after bank redirect ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const error = params.get('error');
    const details = params.get('details');

    if (status) {
      if (status === 'success') {
        showToast.success("Bank connection successfully linked! Fetching account details...");
        queryClient.invalidateQueries({ queryKey: ["requisitions"] }); // Force data refresh
      } else if (status === 'failure') {
        // Handle user cancellation specifically
        if (error === 'UserCancelledSession') {
            showToast.info("Connection process cancelled by user.");
        } else if (error === 'BackendProcessingError') {
            showToast.error("Connection failed: Error processing callback on the server.");
        } else {
            // Generic error message display
            const message = error ? `Connection Failed: ${error} (${details || 'Check API logs.'})` : "Bank connection failed.";
            showToast.error(message);
        }
      }

      // IMPORTANT: Clean up the URL query parameters to prevent the toast 
      // from reappearing on navigation or subsequent renders.
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, queryClient]); // Depend on location.search to run when URL changes

  
  // --- Handlers ---

  const handleBankSelect = (institutionId: string) => {
    // NOTE: This currently uses a hardcoded owner name. In a real app, this should come from user input.
    const ownerName = "Anthony"; 
    createRequisitionMutation.mutate({ institutionId, owner: ownerName });
  };
  
  const handleSyncToggle = (requisitionId: string, accountId: string, enabled: boolean) => {
    toggleSyncMutation.mutate({ requisitionId, accountId, enabled });
  };

  // The reconfirm handler passes the agreement ID to the mutation
  const handleReconfirm = (agreementId: string) => {
    reconfirmMutation.mutate(agreementId);
  };


  // --- Render ---

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">Bank Connections</h1>
          <p className="text-muted-foreground">Connect and manage your bank accounts via open banking</p>
          <Button 
            onClick={() => setIsBankModalOpen(true)}
            className="absolute right-0 bottom-0"
            size="sm"
            disabled={createRequisitionMutation.isPending}
          >
            {createRequisitionMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Connection
          </Button>
        </div>

        <div className="space-y-6">
          {isLoadingRequisitions && (
            <>
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </>
          )}

          {requisitions?.length === 0 && !isLoadingRequisitions && (
            <p className="text-center text-muted-foreground pt-10">
              No bank connections found. Click 'Add Connection' to get started.
            </p>
          )}

          {requisitions?.map((requisition) => (
            <RequisitionCard
              key={requisition.id}
              requisition={requisition}
              onSyncToggle={handleSyncToggle}
              onReconfirm={() => handleReconfirm(requisition.agreement)}
            />
          ))}
        </div>
      </div>

      <BankSelectionModal
        open={isBankModalOpen}
        onOpenChange={setIsBankModalOpen}
        onBankSelect={handleBankSelect}
        isCreating={createRequisitionMutation.isPending}
      />
    </div>
  );
}