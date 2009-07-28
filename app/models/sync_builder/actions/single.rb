class SyncBuilder::Actions::Single
	def initialize action, include_time = false
		@player_id  = action.player_id
		@kind = action.kind
		@value = action.value if action.has_value?
		@time_for_next_player = action.time_left if include_time
	end
end