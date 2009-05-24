class PlayerActions::TimeoutCheckAction < PlayerActions::CheckAction
	include TimeoutActionGameInfluence

	protected

  def player_influence
		player.away_on_check!
  end
end
