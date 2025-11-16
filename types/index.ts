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
  player1?: User
  player2?: User
  winner?: User
}
