import { Button } from "@/components/ui/button";
import { UserCircleIcon } from "lucide-react";

export function AuthButton() {
  return (
    <Button variant="outline" className="rounded-full border-teal-500/20 px-4 py-2 text-sm font-medium text-teal-600 shadow-none hover:text-teal-500">
      <UserCircleIcon />
      Sign in
    </Button>
  );
}
