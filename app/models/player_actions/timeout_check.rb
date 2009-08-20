class PlayerActions::TimeoutCheck < PlayerActions::Check
	def kind
		TIMEOUT_CHECK
	end

	protected

  def player_influence
		player.away_on_check!
		super
  end
end
