"use client";

import { useState } from "react";
import DraftHeader from "./DraftHeader";
import DraftRosters from "./DraftRosters";
import AvailablePlayers from "./AvailablePlayers";
import DraftBoard from "./DraftBoard";
import type {
  Player,
  FantasyTeam,
  DraftPick,
} from "@/types/draft";

const initialPlayers: Player[] = [
  {
    id: 1,
    name: "Tord Reklev",
    country: "Norway",
    rank: 1,
    championshipPoints: 850,
    fantasyPoints: 412,
  },
  {
    id: 2,
    name: "Azul Garcia Griego",
    country: "United States",
    rank: 2,
    championshipPoints: 790,
    fantasyPoints: 389,
  },
  {
    id: 3,
    name: "Isaiah Bradner",
    country: "United States",
    rank: 3,
    championshipPoints: 735,
    fantasyPoints: 361,
  },
  {
    id: 4,
    name: "Rahul Reddy",
    country: "United States",
    rank: 4,
    championshipPoints: 701,
    fantasyPoints: 344,
  },
  {
    id: 5,
    name: "Pedro Torres",
    country: "Spain",
    rank: 5,
    championshipPoints: 682,
    fantasyPoints: 329,
  },
  {
    id: 6,
    name: "Caleb Gedemer",
    country: "United States",
    rank: 6,
    championshipPoints: 655,
    fantasyPoints: 310,
  },
];

const teams: FantasyTeam[] = [
  {
    id: 1,
    name: "Cody",
  },
  {
    id: 2,
    name: "Team Rocket",
  },
  {
    id: 3,
    name: "Rare Candy",
  },
  {
    id: 4,
    name: "Lost Zone",
  },
];

export default function DraftRoom() {
  const [availablePlayers, setAvailablePlayers] =
    useState<Player[]>(initialPlayers);

  const [draftPicks, setDraftPicks] =
    useState<DraftPick[]>([]);

  const pickNumber = draftPicks.length + 1;

  const round =
    Math.floor(draftPicks.length / teams.length) + 1;

  const getCurrentTeam = () => {
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
  };

  const currentTeam = getCurrentTeam();

  function handleDraft(player: Player) {
    const newPick: DraftPick = {
      pickNumber,
      round,
      team: currentTeam,
      player,
    };

    setDraftPicks((previous) => [
      ...previous,
      newPick,
    ]);

    setAvailablePlayers((previous) =>
      previous.filter(
        (availablePlayer) =>
          availablePlayer.id !== player.id
      )
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <DraftHeader
        round={round}
        pickNumber={pickNumber}
        teamName={currentTeam.name}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AvailablePlayers
            players={availablePlayers}
            onDraft={handleDraft}
          />
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