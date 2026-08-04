"use client";

import { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import DraftHeader from "./DraftHeader";
import AvailablePlayers from "./AvailablePlayers";
import DraftBoard from "./DraftBoard";
import DraftRosters from "./DraftRosters";

import { apiFetch } from "@/lib/api";

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

type MyLeagueTeam = {
  teamId: number;
  teamName: string;
  isCommissioner: boolean;
};

export default function DraftRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const leagueId =
    searchParams.get("leagueId");

  const [league, setLeague] =
    useState<League | null>(null);

  const [draftId, setDraftId] =
    useState<number | null>(null);

  const [isComplete, setIsComplete] =
    useState(false);

  const [
    completingDraft,
    setCompletingDraft,
  ] = useState(false);

  const [teams, setTeams] =
    useState<FantasyTeam[]>([]);

  const [
    availablePlayers,
    setAvailablePlayers,
  ] = useState<Player[]>([]);

  const [
    draftPicks,
    setDraftPicks,
  ] = useState<DraftPick[]>([]);

  const [myTeam, setMyTeam] =
    useState<MyLeagueTeam | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [savingPick, setSavingPick] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDraft() {
      if (!leagueId) {
        setError(
          "No league was selected."
        );

        setLoading(false);
        return;
      }

      try {
        /*
         * Load the league.
         */
        const leagueResponse =
          await fetch(
            `http://localhost:5255/api/leagues/${leagueId}`
          );

        if (!leagueResponse.ok) {
          throw new Error(
            "Could not load league."
          );
        }

        const leagueData: League =
          await leagueResponse.json();

        const leagueTeams: FantasyTeam[] =
          leagueData.members.map(
            (member) => ({
              id: member.id,
              name: member.teamName,
            })
          );

        setLeague(leagueData);
        setTeams(leagueTeams);

        /*
         * Load the logged-in user's team.
         */
        const myTeamResponse =
          await apiFetch(
            `/api/leagues/${leagueId}/me`
          );

        if (
          myTeamResponse.status === 401
        ) {
          router.push("/login");
          return;
        }

        if (!myTeamResponse.ok) {
          throw new Error(
            "You are not a member of this league."
          );
        }

        const myTeamData: MyLeagueTeam =
          await myTeamResponse.json();

        setMyTeam(myTeamData);

        /*
         * Load available players.
         */
        const playersResponse =
          await fetch(
            "http://localhost:5255/api/players"
          );

        if (!playersResponse.ok) {
          throw new Error(
            "Could not load players."
          );
        }

        const allPlayers: Player[] =
          await playersResponse.json();

        /*
         * Load existing draft.
         */
        let draftResponse =
          await fetch(
            `http://localhost:5255/api/drafts/league/${leagueId}`
          );

        /*
         * No draft exists yet.
         *
         * Only commissioner will be
         * allowed by the backend to
         * create one.
         */
        if (
          draftResponse.status === 404
        ) {
          const createResponse =
            await apiFetch(
              `/api/drafts/league/${leagueId}`,
              {
                method: "POST",
              }
            );

          if (
            createResponse.status === 401
          ) {
            router.push("/login");
            return;
          }

          if (
            createResponse.status === 403
          ) {
            throw new Error(
              "The commissioner has not started the draft yet."
            );
          }

          if (!createResponse.ok) {
            const message =
              await createResponse.text();

            throw new Error(
              message ||
                "Could not create draft."
            );
          }

          /*
           * Reload the newly-created draft
           * so we get picks in the normal
           * DraftResponse shape.
           */
          draftResponse =
            await fetch(
              `http://localhost:5255/api/drafts/league/${leagueId}`
            );
        }

        if (!draftResponse.ok) {
          throw new Error(
            "Could not load draft."
          );
        }

        const draftData: DraftResponse =
          await draftResponse.json();

        setDraftId(
          draftData.id
        );

        setDraftPicks(
          draftData.picks
        );

        setIsComplete(
          draftData.isComplete
        );

        /*
         * Remove already drafted players
         * from the available pool.
         */
        const draftedPlayerIds =
          new Set(
            draftData.picks.map(
              (pick) =>
                pick.player.id
            )
          );

        const remainingPlayers =
          allPlayers.filter(
            (player) =>
              !draftedPlayerIds.has(
                player.id
              )
          );

        setAvailablePlayers(
          remainingPlayers
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load the draft."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDraft();
  }, [leagueId, router]);

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
          <p>{error}</p>

          {leagueId && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/league/${leagueId}`
                )
              }
              className="mt-5 rounded-xl border border-red-800 px-5 py-2 font-bold text-white transition hover:border-red-500"
            >
              Back to League
            </button>
          )}
        </div>
      </div>
    );
  }

  if (
    !league ||
    !draftId ||
    teams.length === 0 ||
    !myTeam
  ) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
          Draft could not be loaded.
        </div>
      </div>
    );
  }

  const pickNumber =
    draftPicks.length + 1;

  const round =
    Math.floor(
      draftPicks.length /
        teams.length
    ) + 1;

  function getCurrentTeam() {
    const pickIndex =
      draftPicks.length;

    const currentRound =
      Math.floor(
        pickIndex /
          teams.length
      ) + 1;

    const positionInRound =
      pickIndex %
      teams.length;

    if (
      currentRound % 2 === 1
    ) {
      return teams[
        positionInRound
      ];
    }

    return teams[
      teams.length -
        1 -
        positionInRound
    ];
  }

  const currentTeam =
    getCurrentTeam();

  /*
   * Important:
   *
   * Current draft team must match
   * the logged-in user's fantasy team.
   */
  const isMyTurn =
    currentTeam.id ===
    myTeam.teamId;

  async function handleDraft(
    player: Player
  ) {
    if (
      savingPick ||
      isComplete ||
      !isMyTurn
    ) {
      return;
    }

    setSavingPick(true);
    setError("");

    try {
      const response =
        await apiFetch(
          `/api/drafts/${draftId}/pick`,
          {
            method: "POST",

            body: JSON.stringify({
              playerId:
                player.id,
            }),
          }
        );

      if (
        response.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (
        response.status === 403
      ) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "It is not your turn."
        );
      }

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "Could not save draft pick."
        );
      }

      const savedPick: DraftPick =
        await response.json();

      setDraftPicks(
        (previous) => [
          ...previous,
          savedPick,
        ]
      );

      setAvailablePlayers(
        (previous) =>
          previous.filter(
            (
              availablePlayer
            ) =>
              availablePlayer.id !==
              player.id
          )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save draft pick."
      );
    } finally {
      setSavingPick(false);
    }
  }

  async function handleCompleteDraft() {
    if (
      !draftId ||
      draftPicks.length === 0 ||
      !myTeam.isCommissioner
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to complete the draft? This will lock the draft and create the season rosters."
      );

    if (!confirmed) {
      return;
    }

    setCompletingDraft(true);
    setError("");

    try {
      const response =
        await apiFetch(
          `/api/drafts/${draftId}/complete`,
          {
            method: "POST",
          }
        );

      if (
        response.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (
        response.status === 403
      ) {
        throw new Error(
          "Only the league commissioner can complete the draft."
        );
      }

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "Could not complete the draft."
        );
      }

      setIsComplete(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not complete the draft."
      );
    } finally {
      setCompletingDraft(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
            {league.name}
          </p>

          <h1 className="mt-1 text-2xl font-black">
            {isComplete
              ? "Draft Complete"
              : "Live Draft"}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            You are drafting as{" "}
            <span className="font-bold text-white">
              {myTeam.teamName}
            </span>
          </p>
        </div>

        {!isComplete &&
          myTeam.isCommissioner && (
            <button
              type="button"
              onClick={
                handleCompleteDraft
              }
              disabled={
                completingDraft ||
                draftPicks.length ===
                  0
              }
              className="rounded-xl border border-yellow-400 px-5 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {completingDraft
                ? "Completing..."
                : "Complete Draft"}
            </button>
          )}
      </div>

      {/* Current Pick */}
      {!isComplete && (
        <>
          <DraftHeader
            round={round}
            pickNumber={
              pickNumber
            }
            teamName={
              currentTeam.name
            }
          />

          <div
            className={`mt-4 rounded-xl border p-4 ${
              isMyTurn
                ? "border-green-900 bg-green-950/30 text-green-400"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            }`}
          >
            {isMyTurn ? (
              <p className="font-bold">
                Your pick — select a
                player below.
              </p>
            ) : (
              <p>
                Waiting for{" "}
                <span className="font-bold text-white">
                  {
                    currentTeam.name
                  }
                </span>{" "}
                to make their pick.
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isComplete ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
              <p className="text-xl font-bold text-green-400">
                Draft Complete
              </p>

              <p className="mt-2 text-zinc-500">
                Season rosters
                have been created.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/league/${league.id}`
                  )
                }
                className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
              >
                Back to League
              </button>
            </div>
          ) : (
            <div
              className={
                !isMyTurn
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            >
              <AvailablePlayers
                players={
                  availablePlayers
                }
                onDraft={
                  handleDraft
                }
              />
            </div>
          )}

          {savingPick && (
            <p className="mt-3 text-sm text-zinc-500">
              Saving pick...
            </p>
          )}
        </div>

        <div>
          <DraftBoard
            picks={
              draftPicks
            }
          />
        </div>
      </div>

      <DraftRosters
        teams={teams}
        picks={draftPicks}
      />
    </div>
  );
}