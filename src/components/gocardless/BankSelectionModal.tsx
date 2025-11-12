import { useState } from "react";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";

interface BankSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockBanks = [
  { id: "1", name: "ABN AMRO Bank Commercial", logo: "🏦" },
  { id: "2", name: "Airwallex", logo: "💳" },
  { id: "3", name: "Allica Bank", logo: "🏦" },
  { id: "4", name: "Allied Irish Banks", logo: "🏦" },
  { id: "5", name: "Allied Irish Banks (NI)", logo: "🏦" },
  { id: "6", name: "Allied Irish Banks Corporate", logo: "🏦" },
  { id: "7", name: "Alpha FX", logo: "💱" },
  { id: "8", name: "Amazon card (Newday)", logo: "🛒" },
  { id: "9", name: "American Express", logo: "💳" },
];

export function BankSelectionModal({ open, onOpenChange }: BankSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");

  const filteredBanks = mockBanks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Select Your Bank
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner" className="text-sm font-medium">
              Account Owner <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedOwner} onValueChange={setSelectedOwner}>
              <SelectTrigger id="owner" className="rounded-lg">
                <SelectValue placeholder="-- Select Owner --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthony">Anthony</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search banks
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg bg-card"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="h-[400px] mt-4">
          <div className="px-6 pb-6 space-y-2">
            {filteredBanks.map((bank) => (
              <button
                key={bank.id}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl group-hover:bg-primary/20 transition-colors">
                  {bank.logo}
                </div>
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
