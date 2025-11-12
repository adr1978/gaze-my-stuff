import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequisitionCard } from "@/components/gocardless/RequisitionCard";
import { BankSelectionModal } from "@/components/gocardless/BankSelectionModal";
import { toast } from "sonner";

interface Account {
  id: string;
  institutionName: string;
  last4: string;
  type: string;
  syncEnabled: boolean;
}

interface Requisition {
  id: string;
  reference: string;
  owner: string;
  created: string;
  status: string;
  expiresInDays: number;
  accounts: Account[];
}

const mockRequisitions: Requisition[] = [
  {
    id: "1",
    reference: "demo_connection",
    owner: "Unknown",
    created: "17-Aug-2025 (17:19)",
    status: "LN",
    expiresInDays: 10,
    accounts: [
      {
        id: "acc_demo1",
        institutionName: "Demo Bank",
        last4: "1234",
        type: "CACC",
        syncEnabled: false,
      },
    ],
  },
  {
    id: "2",
    reference: "Anthony - Starling",
    owner: "Anthony",
    created: "3-Nov-2025 (21:45)",
    status: "LN",
    expiresInDays: 89,
    accounts: [
      {
        id: "acc1",
        institutionName: "Starling",
        last4: "8246",
        type: "CACC",
        syncEnabled: false,
      },
      {
        id: "acc2",
        institutionName: "Starling",
        last4: "5791",
        type: "CACC",
        syncEnabled: true,
      },
    ],
  },
];

export default function GoCardless() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(mockRequisitions);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const handleSyncToggle = (requisitionId: string, accountId: string, enabled: boolean) => {
    setRequisitions((prev) =>
      prev.map((req) =>
        req.id === requisitionId
          ? {
              ...req,
              accounts: req.accounts.map((acc) =>
                acc.id === accountId ? { ...acc, syncEnabled: enabled } : acc
              ),
            }
          : req
      )
    );
    
    toast.success(`Sync ${enabled ? "enabled" : "disabled"} for account ending in ${
      requisitions
        .find(r => r.id === requisitionId)
        ?.accounts.find(a => a.id === accountId)?.last4
    }`);
  };

  const handleReconfirm = (requisitionId: string) => {
    toast.info("Reconfirming connection...");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-4">Bank Connections</h1>
        <p className="text-muted-foreground mb-8">
          Connect to financial institutions via GoCardless and manage transaction syncing
        </p>
        
        <div className="flex justify-end mb-6">
          <Button onClick={() => setIsBankModalOpen(true)} className="rounded-md">
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>

        <div className="space-y-6">
          {requisitions.map((requisition) => (
            <RequisitionCard
              key={requisition.id}
              requisition={requisition}
              onSyncToggle={handleSyncToggle}
              onReconfirm={handleReconfirm}
            />
          ))}
        </div>
      </div>

      <BankSelectionModal
        open={isBankModalOpen}
        onOpenChange={setIsBankModalOpen}
      />
    </div>
  );
}
