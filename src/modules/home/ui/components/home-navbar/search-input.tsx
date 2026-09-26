"use client";

import { Button } from "@/components/ui/button";
import { APP_URL } from "@/constants";
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchInput() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const url = new URL("/search", APP_URL ? `https: //${APP_URL}` : "http://localhost:3000");
    const newQuery = value.trim();

    url.searchParams.set("query", newQuery);

    if (newQuery === "") {
      url.searchParams.delete("query");
    }

    setValue(newQuery);

    router.push(url.toString());
  }

  return (
    <form className="flex w-full max-w-[600px]" onSubmit={handleSearch}>
      <div className="relative w-full">
        <input type="text" placeholder="Search..." className="w-full rounded-l-full border py-2 pl-4 pr-12 focus:border-teal-500 focus:outline-none" value={value} onChange={(e) => setValue(e.target.value)} />

        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => setValue("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full">
            <XIcon className="text-gray-500" />
          </Button>
        )}
      </div>

      <button type="submit" className="rounded-r-full border border-l-0 bg-gray-100 px-5 py-2.5 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50" disabled={!value.trim()}>
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
}
