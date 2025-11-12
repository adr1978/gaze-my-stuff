import { Database, CheckCircle2, XCircle } from "lucide-react";
import type { AccountProcessed } from "./types";

interface NotionUploadRowProps {
  account: AccountProcessed;
}

export function NotionUploadRow({ account }: NotionUploadRowProps) {
  const hasError = account.fetch_status === "error" || account.notion_upload?.status === "error";

  return (
    <div className="px-8 py-3 border-l-2 ml-8 border-border">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{account.account_name}</p>
            <p className="text-xs text-muted-foreground">
              {account.transactions_pending + account.transactions_booked} transactions
            </p>
          </div>
        </div>
        {account.notion_upload && (
          <div className="flex items-center gap-2">
            {account.notion_upload.status === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600" />
            )}
            <span className="text-xs">{account.notion_upload.uploaded_count} uploaded</span>
          </div>
        )}
      </div>
    </div>
  );
}
