class PlayerActions::TimeoutFoldAction < PlayerActions::FoldAction
	include TimeoutActionGameInfluence

	protected

  def player_influence
  end
end
