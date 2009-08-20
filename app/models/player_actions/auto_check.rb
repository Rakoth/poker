class PlayerActions::AutoCheck < PlayerActions::Check

	def kind
		AUTO_CHECK
	end
	
	private

	def perform!
		player_influence
	end
end
