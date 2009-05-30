class PlayerActions::AutoCheckAction < PlayerActions::CheckAction
	KIND = -4
	private

	def perform!
		player_influence
	end
end