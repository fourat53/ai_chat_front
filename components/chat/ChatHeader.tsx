import { getProviders } from "@/actions/provider.action";
import { useChatStore } from "@/store/useChatStore";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "../ui/sidebar";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

export default function ChatHeader() {
  const {
    providers,
    setProviders,
    selectedProvider,
    setSelectedProvider,
    selectedConversation,
  } = useChatStore();

  const {
    data: dataProviders,
    isLoading: loadingProviders,
    error: errorProviders,
  } = useQuery({
    queryKey: ["providers"],
    queryFn: () => getProviders(),
  });

  useEffect(() => {
    if (!dataProviders) return;
    setProviders(dataProviders);
  }, [dataProviders, setProviders]);

  useEffect(() => {
    if (providers && providers.length > 0) {
      setSelectedProvider(providers[0]);
    }
  }, [providers, setSelectedProvider]);

  return (
    <div className="pb-2 flex justify-between items-center px-4 w-full h-14">
      <div className="flex gap-2 items-center">
        <SidebarTrigger className="size-9" />
        <span className="ml-2 text-lg font-semibold">
          {selectedConversation?.title || "New Chat"}
        </span>
      </div>
      {loadingProviders ? (
        <div className="w-40 h-8 bg-muted rounded-full animate-pulse" />
      ) : errorProviders ? (
        <div className="w-40 h-8 text-xs text-foreground-muted flex items-center px-2">
          Failed to load providers
        </div>
      ) : (
        <Select
          value={selectedProvider?.id ?? ""}
          onValueChange={(val) => {
            setSelectedProvider(providers.find((p) => p.id === val) ?? null);
          }}
        >
          <SelectTrigger className="w-40 h-8 bg-transparent border-none shadow-none text-xs hover:bg-accent focus-visible:ring-0">
            <SelectValue>{selectedProvider?.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Providers</SelectLabel>
              {providers.map((p, index) => (
                <SelectItem key={index} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
