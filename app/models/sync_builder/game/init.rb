class SyncBuilder::Game::Init < SyncBuilder::Base
	def data
		{
			:id => @object.id,
			:status => status,
			:blind_size => blind_size,
			:ante => ante,
			:current_bet => current_bet,
			:client_sit => current_player(@for_user.id).sit,
			:time_for_action => @object.type.time_for_action,
			:max_players => @object.type.max_players,
			:start_stack => @object.type.start_stack,
			:players_to_load => players.map{|player| SyncBuilder::Player::Init.new player},
			:last_message_id => last_log_message_id
		}
	end
end
