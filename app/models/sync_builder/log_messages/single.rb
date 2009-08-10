class SyncBuilder::LogMessages::Single
	def initialize message
		@id = message.id
		@player_id = message.player_id
		@text = message.text
	end
end