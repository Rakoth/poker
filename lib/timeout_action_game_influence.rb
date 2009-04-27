module TimeoutActionGameInfluence
	private
	
	def game_influence
		if game.all_away?
			@game_params = {:paused => true}
		end
		super
	end
end