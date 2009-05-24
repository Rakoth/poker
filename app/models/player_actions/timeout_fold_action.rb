class PlayerActions::TimeoutFoldAction < PlayerActions::FoldAction
	include TimeoutActionGameInfluence

	protected

  def player_influence
		player.away_on_fold!
  end
end
