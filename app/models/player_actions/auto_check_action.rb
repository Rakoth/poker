class PlayerActions::AutoCheckAction < PlayerActions::CheckAction

	def kind
		AUTO_CHECK
	end
	
	private

	def perform!
		player_influence
	end
end
