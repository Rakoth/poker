module TimeoutActionGameInfluence
	private
	
	def game_influence
		self.game_params = {:paused => Game::PAUSE_TYPE[:by_away]} if game.all_away?
		super
	end
end