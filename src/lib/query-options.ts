import { queryOptions } from "@tanstack/react-query";
import { getLordsInfo } from "@/lib/getLordsPrice";
import { getTreasuryBalance } from "@/lib/getTreasuryBalance";
import { getHoldersMap } from "@/lib/getHoldersMap";

export const lordsInfoQueryOptions = () =>
  queryOptions({
    queryKey: ["lordsInfo"],
    queryFn: getLordsInfo,
    staleTime: 60_000,
  });

export const treasuryBalanceQueryOptions = () =>
  queryOptions({
    queryKey: ["treasuryBalance"],
    queryFn: getTreasuryBalance,
    staleTime: 60_000,
  });

export const holdersMapQueryOptions = () =>
  queryOptions({
    queryKey: ["holdersMap"],
    queryFn: getHoldersMap,
    staleTime: 5 * 60_000,
  });
