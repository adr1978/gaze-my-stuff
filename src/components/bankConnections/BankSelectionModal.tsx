// Replace src/components/gocardless/BankSelectionModal.tsx

import { useState } from "react";
import { Search, Loader2 } from "lucide-react"; // Import Loader2
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Import mutation
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { gocardlessApi } from "@/lib/api"; // Import API
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner"; // Import toast

interface BankSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankSelectionModal({ open, onOpenChange }: BankSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const queryClient = useQueryClient();

  const { data: institutions, isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ["institutions"],
    queryFn: gocardlessApi.getInstitutions,
    staleTime: 1000 * 60 * 60,
  });

  // --- NEW: Mutation for creating the requisition ---
  const createRequisitionMutation = useMutation({
    mutationFn: ({ institutionId, owner }: { institutionId: string, owner: string }) =>
      gocardlessApi.createRequisition(institutionId, owner),
    
    onSuccess: (data) => {
      if (data.link) {
        toast.success("Redirecting to your bank...");
        // Redirect the user to the GoCardless auth page
        window.location.href = data.link;
      } else {
        toast.error("Could not get bank authorisation link.");
      }
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Connection failed: ${error.message}`);
    },
  });

  const filteredBanks = institutions?.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankClick = (institutionId: string) => {
    if (!selectedOwner) {
      toast.error("Please select an account owner first.");
      return;
    }
    
    // Call the mutation
    createRequisitionMutation.mutate({ institutionId, owner: selectedOwner });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Select Your Bank
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose your bank to connect an account.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner" className="text-sm font-medium">
              Account Owner <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedOwner} onValueChange={setSelectedOwner} disabled={createRequisitionMutation.isPending}>
              <SelectTrigger id="owner" className="rounded-lg">
                <SelectValue placeholder="-- Select Owner --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Anthony">Anthony</SelectItem>
                <SelectItem value="Josephine">Josephine</SelectItem>
                <SelectItem value="Children">Children</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search Banks
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
                disabled={createRequisitionMutation.isPending}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="h-[400px] mt-4">
          <div className="px-6 pb-6 space-y-2">
            {/* --- NEW: Loading State --- */}
            {(isLoadingInstitutions || createRequisitionMutation.isPending) && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                {createRequisitionMutation.isPending && (
                  <div className="flex items-center justify-center p-4 text-sm text-primary">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting to bank...
                  </div>
                )}
              </div>
            )}

            {/* --- Render banks only if not loading --- */}
            {!isLoadingInstitutions && !createRequisitionMutation.isPending && filteredBanks?.map((bank) => (
              <button
                key={bank.id}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all text-left group"
                onClick={() => handleBankClick(bank.id)}
              >
                <img src={bank.logo} className="h-10 w-10 rounded-full bg-white border p-1 object-contain" alt={bank.name} />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {bank.name}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}