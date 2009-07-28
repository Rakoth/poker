class SyncBuilder::Game::Start < SyncBuilder::Game::WaitForStart
	def data
		super.merge :data_for_start => {
			:blind_position => blind_position,
			:small_blind_position => small_blind_position,
			:next_level_time => next_level_time,
			:current_bet => current_bet,
			:active_player_id => active_player_id,
			:action_time_left => action_time_left,
			:client_hand => current_player(@for_user.id).hand.to_s,
			:status => status
		}
	end
end
