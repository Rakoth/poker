class PlayerActions::RaiseAction < PlayerActions::BetAction

	def kind
		RAISE
	end

  def can_perform?
    return (value <= player.stack - player.for_call and game.current_bet < player.in_pot + player.for_call + value)
  end
end
