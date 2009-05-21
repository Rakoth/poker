module TimeoutActionGameInfluence
	private
	
	def game_influence
		@game_params = {:paused => true} if game.all_away?
		super
	end
end