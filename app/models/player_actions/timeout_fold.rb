class PlayerActions::TimeoutFold < PlayerActions::Fold
	def kind
		TIMEOUT_FOLD
	end

	protected

  def player_influence
		player.away_on_fold!
  end
end
