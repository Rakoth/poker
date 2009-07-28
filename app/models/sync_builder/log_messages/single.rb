class SyncBuilder::LogMessages::Single
	def initialize message
		@id = message.id
		@login = message.user.login
		@text = message.text
	end
end