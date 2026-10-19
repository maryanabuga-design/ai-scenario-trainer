"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EditProfileView } from "@/components/EditProfileView/EditProfileView";
import { renameAccount, useCurrentAccount } from "@/lib/auth";

/** How long "Saved" shows before the person is back on Profile. */
const SAVED_MS = 700;

export default function EditProfilePage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.push("/profile"), SAVED_MS);
    return () => clearTimeout(timer);
  }, [saved, router]);

  if (account === "loading" || !account) return null;
  return (
    <EditProfileView
      // the form starts from the saved name; a new key after saving would reset it
      key={account.email}
      account={account}
      saved={saved}
      onSave={(name) => {
        renameAccount(name);
        setSaved(true);
      }}
    />
  );
}
