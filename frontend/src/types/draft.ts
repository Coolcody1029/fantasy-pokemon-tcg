export type Player = {
  id: number;
  name: string;
  country: string;
  seasonStartingRank: number;
  fantasyPoints: number;
  recentFinish: string;
  seasonPoolOrder: number;
};

export type FantasyTeam = {
  id: number;
  name: string;
};

export type DraftPick = {
  pickNumber: number;
  round: number;
  team: FantasyTeam;
  player: Player;
};

export type LeagueMember = {
  id: number;
  teamName: string;
  leagueId: number;
  isCommissioner: boolean;
};

export type League = {
  id: number;
  name: string;
  inviteCode: string;
  maxTeams: number;
  createdAt: string;
  members: LeagueMember[];
};