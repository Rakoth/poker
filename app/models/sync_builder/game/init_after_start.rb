class SyncBuilder::Game::InitAfterStart < SyncBuilder::Game::Init
	def data
		super.merge(
			:blind_position => blind_position,
			:small_blind_position => small_blind_position,
			:next_level_time => time_before_next_level,
			:active_player_id => active_player_id,
			:last_action_id => last_player_action_id,
			:action_time_left => action_time_left,
			:cards_to_load => {
				:flop => flop.to_s,
				:turn  => turn.to_s,
				:river => river.to_s
			},
			:players_to_load => players.map{|player| SyncBuilder::Player::InitAfterStart.new player, :for_user => @for_user},
			:paused => paused
		)
	end
end
