class SyncBuilder::Game::Distribution < SyncBuilder::Base
	def data
		{
			:status => status,
			:active_player_id => active_player_id,
			:blind_position => blind_position,
			:small_blind_position => small_blind_position,
			:blind_size => blind_size,
			:ante => ante,
			:current_bet => current_bet,
			:next_level_time => next_level_time,
			:client_hand => (current_player(@for_user.id) ? current_player(@for_user.id).hand.to_s : nil),
			:action_time_left => action_time_left,
			:players_to_load => players.map{|player| SyncBuilder::Player::Distribution.new player},
			:previous_final => build_previous_final,
			:paused => paused
		}
	end

	private
	
	def build_previous_final
		if show_previous_final?
			{
				:players => previous_distribution_players.map{|player| SyncBuilder::Player::PreviousFinal.new player},
				:flop => previous_flop.to_s,
				:turn => previous_turn.to_s,
				:river => previous_river.to_s
			}
		end
	end
end