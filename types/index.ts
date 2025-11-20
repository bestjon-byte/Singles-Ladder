import { AvailabilityData } from './availability'

export type ChallengeStatus =
  | 'pending'
  | 'accepted'
  | 'withdrawn'
  | 'forfeited'
  | 'completed'
  | 'cancelled'

export type SeasonStatus =
  | 'active'
  | 'playoffs'
  | 'completed'

export type MatchType =
  | 'challenge'
  | 'quarterfinal'
  | 'semifinal'
  | 'final'
  | 'third_place'

export type FinalSetType =
  | 'tiebreak'
  | 'full_set'

export type NotificationType =
  | 'challenge_received'
  | 'challenge_accepted'
  | 'challenge_counter_proposal'
  | 'match_reminder'
  | 'forfeit_warning'
  | 'score_submitted'
  | 'score_disputed'
  | 'season_ended'
  | 'playoff_started'
  | 'playoff_match_ready'
  | 'playoff_advanced'
  | 'playoff_eliminated'
  | 'playoff_champion'

export type PlayoffFormat = 'final' | 'semis' | 'quarters'

export type LadderChangeReason =
  | 'match_result'
  | 'player_joined'
  | 'player_withdrew'
  | 'admin_adjustment'

export interface User {
  id: string
  email: string
  name: string
  whatsapp_number?: string
  created_at: string
  updated_at: string
  is_active: boolean
  email_notifications_enabled: boolean
  whatsapp_notifications_enabled: boolean
  availability?: AvailabilityData | null
}

export interface Season {
  id: string
  name: string
  start_date: string
  end_date?: string
  is_active: boolean
  wildcards_per_player: number
  playoff_third_place_enabled: boolean
  created_at: string
  updated_at: string
  status: SeasonStatus
  playoff_format?: PlayoffFormat
  playoff_started_at?: string
  playoff_winner_id?: string
  playoff_completed_at?: string
}

export interface LadderPosition {
  id: string
  season_id: string
  user_id: string
  position: number
  joined_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  user?: User
}

export interface Challenge {
  id: string
  season_id: string
  challenger_id: string
  challenged_id: string
  is_wildcard: boolean
  status: ChallengeStatus
  proposed_date: string
  proposed_location: string
  accepted_date?: string
  accepted_location?: string
  created_at: string
  updated_at: string
  forfeited_at?: string
  completed_at?: string
  challenger?: User
  challenged?: User
}

export interface Match {
  id: string
  challenge_id?: string
  season_id: string
  player1_id: string
  player2_id: string
  match_type: MatchType
  match_date?: string
  location?: string
  set1_player1_score?: number
  set1_player2_score?: number
  set2_player1_score?: number
  set2_player2_score?: number
  set3_player1_score?: number
  set3_player2_score?: number
  final_set_type?: FinalSetType
  winner_id?: string
  submitted_by_user_id?: string
  is_disputed: boolean
  disputed_by_user_id?: string
  dispute_resolved_by_admin_id?: string
  created_at: string
  updated_at: string
  completed_at?: string
  round_number?: number
  bracket_position?: number
  player1_seed?: number
  player2_seed?: number
  player1?: User
  player2?: User
  winner?: User
}

// Playoff Bracket Types
export interface PlayoffBracketMatch {
  matchId: string
  player1Seed: number
  player2Seed: number
  player1Id?: string
  player2Id?: string
  player1Name?: string
  player2Name?: string
  winnerId?: string
  position: number
  isComplete: boolean
  scores?: {
    set1Player1?: number
    set1Player2?: number
    set2Player1?: number
    set2Player2?: number
    set3Player1?: number
    set3Player2?: number
  }
}

export interface PlayoffBracketRound {
  roundNumber: number
  roundName: string
  matches: PlayoffBracketMatch[]
  isComplete: boolean
}

export interface PlayoffBracketData {
  format: PlayoffFormat
  rounds: PlayoffBracketRound[]
  winnerId?: string
  completedAt?: string
}

export interface PlayoffBracket {
  id: string
  season_id: string
  format: PlayoffFormat
  bracket_data: PlayoffBracketData
  created_at: string
  updated_at: string
}
