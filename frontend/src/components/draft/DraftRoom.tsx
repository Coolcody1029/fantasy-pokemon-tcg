"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import DraftHeader from "./DraftHeader";
import AvailablePlayers from "./AvailablePlayers";
import DraftBoard from "./DraftBoard";
import DraftRosters from "./DraftRosters";

import type {
  Player,
  FantasyTeam,
  DraftPick,
  League,
} from "@/types/draft";

type DraftResponse = {
  id: number;
  leagueId: number;
  isComplete: boolean;
  createdAt: string;
  picks: DraftPick[];
};

export default function DraftRoom() {
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("leagueId");

  const [league, setLeague] = useState<League | null>(null);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingPick, setSavingPick] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDraft() {
      if (!leagueId) {
        setError("No league was selected.");
        setLoading(false);
        return;
      }

      try {
        const leagueResponse = await fetch(
          `http://localhost:5255/api/leagues/${leagueId}`
        );

        if (!leagueResponse.ok) {
          throw new Error("Could not load league.");
        }

        const leagueData: League = await leagueResponse.json();

        const leagueTeams: FantasyTeam[] = leagueData.members.map(
          (member) => ({
            id: member.id,
            name: member.teamName,
          })
        );

        setLeague(leagueData);
        setTeams(leagueTeams);

        const playersResponse = await fetch(
          "http://localhost:5255/api/players"
        );

        if (!playersResponse.ok) {
          throw new Error("Could not load players.");
        }

        const allPlayers: Player[] = await playersResponse.json();

        let draftResponse = await fetch(
          `http://localhost:5255/api/drafts/league/${leagueId}`
        );

        if (draftResponse.status === 404) {
          const createResponse = await fetch(
            `http://localhost:5255/api/drafts/league/${leagueId}`,
            {
              method: "POST",
            }
          );

          if (!createResponse.ok) {
            const message = await createResponse.text();
            throw new Error(message || "Could not create draft.");
          }

          await createResponse.json();

          draftResponse = await fetch(
            `http://localhost:5255/api/drafts/league/${leagueId}`
          );
        }

        if (!draftResponse.ok) {
          throw new Error("Could not load draft.");
        }

        const draftData: DraftResponse = await draftResponse.json();

        setDraftId(draftData.id);
        setDraftPicks(draftData.picks);

        const draftedPlayerIds = new Set(
          draftData.picks.map((pick) => pick.player.id)
        );

        const remainingPlayers = allPlayers.filter(
          (player) => !draftedPlayerIds.has(player.id)
        );

        setAvailablePlayers(remainingPlayers);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Could not load the draft.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadDraft();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
          Loading draft...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!league || !draftId || teams.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
          Draft could not be loaded.
        </div>
      </div>
    );
  }

  const pickNumber = draftPicks.length + 1;

  const round =
    Math.floor(draftPicks.length / teams.length) + 1;

  function getCurrentTeam() {
    const pickIndex = draftPicks.length;

    const currentRound =
      Math.floor(pickIndex / teams.length) + 1;

    const positionInRound =
      pickIndex % teams.length;

    if (currentRound % 2 === 1) {
      return teams[positionInRound];
    }

    return teams[
      teams.length - 1 - positionInRound
    ];
  }

  const currentTeam = getCurrentTeam();

  async function handleDraft(player: Player) {
    if (savingPick) {
      return;
    }

    setSavingPick(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5255/api/drafts/${draftId}/pick`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: player.id,
          }),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Could not save draft pick.");
      }

      const savedPick: DraftPick = await response.json();

      setDraftPicks((previous) => [
        ...previous,
        savedPick,
      ]);

      setAvailablePlayers((previous) =>
        previous.filter(
          (availablePlayer) =>
            availablePlayer.id !== player.id
        )
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not save draft pick.");
      }
    } finally {
      setSavingPick(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
          {league.name}
        </p>

        <h1 className="mt-1 text-2xl font-black">
          Live Draft
        </h1>
      </div>

      <DraftHeader
        round={round}
        pickNumber={pickNumber}
        teamName={currentTeam.name}
      />

      {error && (
        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AvailablePlayers
            players={availablePlayers}
            onDraft={handleDraft}
          />

          {savingPick && (
            <p className="mt-3 text-sm text-zinc-500">
              Saving pick...
            </p>
          )}
        </div>

        <div>
          <DraftBoard picks={draftPicks} />
        </div>
      </div>

      <DraftRosters
        teams={teams}
        picks={draftPicks}
      />
    </div>
  );
}