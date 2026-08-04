export type Player = {
  id: number;
  name: string;
  country: string;
  rank: number;
  championshipPoints: number;
  fantasyPoints: number;
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