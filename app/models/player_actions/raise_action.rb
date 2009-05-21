class PlayerActions::RaiseAction < PlayerActions::BetAction
  KIND = 4

  def can_perform?
    return (value <= player.stack and game.current_bet < player.in_pot + value)
  end
end
