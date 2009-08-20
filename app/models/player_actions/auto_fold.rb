class PlayerActions::AutoFold < PlayerActions::Fold

	def kind
		AUTO_FOLD
	end

	private
	
	def perform!
		player_influence
	end
end
